# Subtitles, translations and AI descriptions

A lesson video uploaded to Mux gets subtitles in its spoken language for free,
optional AI translations into the other offered languages, and a description
written from the resulting transcript. Ported from the Convex implementation in
`next-course-ultimate`; the differences are all consequences of this project
having Postgres and Next.js where that one has Convex.

## TL;DR

1. The browser asks a server action for a Mux *direct upload URL*, declaring the
   spoken language and any translation targets.
2. The browser PUTs the file straight to Mux — the server never touches the bytes.
3. Mux's Whisper ASR runs *after* ingest, so the generated text track is still
   `preparing` when the asset flips to `ready`.
4. Once that track is ready, its plain-text transcript fans out two ways: to
   Gemini for the description, and to Mux Robots for one `translate-captions`
   job per requested language.
5. Each translation is watched in two phases — first the Robots job, then the
   Mux text track it attaches — because the job reports "completed" before the
   track is playable.
6. Every one of those steps happens inside `advanceCaptions()`, which anything
   may call at any time.

## The one real design difference from the Convex version

Convex drove each phase with `ctx.scheduler`: an action re-scheduled itself
every few seconds, carrying its attempt number in its own arguments. There is no
durable scheduler here, so the shape is inverted.

`lib/mux/caption_pipeline.ts` exposes **one idempotent step**:

```ts
advanceCaptions(moduleItemId): Promise<boolean>  // true while work remains
```

It reads whatever state the lesson is in, moves it as far forward as it can
right now, and returns. Two things call it:

| Caller | Cadence | Why |
| --- | --- | --- |
| `advanceCaptionsAction` from `<CaptionStatus>` | every 5 s while the panel is on screen | fast, visible progress for the person who just uploaded |
| `GET /api/cron/captions` | every minute | **durability** — the tab is usually closed long before a translation finishes |

The cron sweep is not an optimisation; without it, closing the tab strands
every unfinished translation. The browser poll only exists to make it *feel*
immediate while someone is watching.

Because both drive the same function, three properties are load-bearing:

- **State only moves forward.** Every write is a transition to a later state, so
  repeating a step is a no-op rather than a regression.
- **Budgets live on the rows, not in call arguments.** `video_tracks.attempts`
  and `modules_items.description_attempts` persist what the scheduler chain used
  to carry. Timeouts are wall-clock deadlines measured from `created_at`, not
  attempt counts — an advance can arrive 5 seconds or 60 seconds after the last
  one, so "how many times have we looked" says nothing about how long we waited.
- **The unique index is the concurrency primitive.** The Neon HTTP driver has no
  transactions. `video_tracks_item_language_idx` plus the compare-and-set in
  `startTranslations` (`UPDATE ... WHERE status = 'pending' RETURNING id`) is
  what stops a browser poll and a cron tick from opening — and paying for — the
  same Robots job twice.

## Files

### Shared
- `lib/mux/caption_languages.ts` — the offered language list, the guards, the
  unit→USD helper, `languageDisplayName()`. Pure, no server imports, so the
  React picker and the server validator can't drift apart.
- `lib/mux/robots.ts` — the `translate-captions` wrapper.

### Server
- `lib/mux/caption_pipeline.ts` — the whole state machine. `seedCaptionTracks`,
  `requestCaptionBackfill`, `advanceCaptions`, `sweepPendingCaptions`.
- `lib/db/actions/mux/caption_actions.ts` — the authenticated edge:
  `createCaptionedMuxUpload`, `attachCaptionedVideo`, `advanceCaptionsAction`,
  `getCaptionState`, `backfillCaptions`.
- `lib/db/actions/mux/ai_actions.ts` — `generateDescriptionFromVideo`, the
  on-demand button, now delegating to the same pipeline.
- `app/api/cron/captions/route.ts` — the sweep.

### Client
- `components/mux/CaptionLanguagePicker.tsx` — spoken-language select + target
  toggles. Used by the upload card, the create-lesson modal and the backfill panel.
- `components/mux/CaptionStatus.tsx` — per-language chips, failure lines, the
  "add or retry languages" panel, and the poll that drives the pipeline.
- `components/mux/MuxPlayer.tsx` — `defaultSubtitlesLang` prop.

### Schema

```
modules_items
  caption_source_language        what the uploader declared: a code, or "auto"
  caption_detected_language      what ASR actually found
  caption_detected_confidence    Mux's 0-1, only when auto-detect ran
  caption_targets                text[] of translation targets
  description_attempts           retry budget for Gemini
  description_attempted_at       for the exponential backoff
  transcription                  the ASR transcript (already existed)

video_tracks                     one row per subtitle track
  module_item_id, kind, language_code, status
  mux_track_id, robots_job_id, units_consumed, attempts, error_message
```

The transcript stays on `modules_items` rather than getting its own table.
Convex needed the split because `listMyVideos` takes 50 rows and a two-hour
transcript is ~120 KB, which would blow the per-transaction read limit; Postgres
has no such limit, and the column already existed.

Nothing in the schema gates the player. A lesson is playable the whole time its
subtitles are cooking — caption progress is a separate axis, rolled up from the
track rows on read.

## How captions work

`createCaptionedMuxUpload` asks for free ASR up front, on the direct upload's
`new_asset_settings`:

```ts
inputs: [{ generated_subtitles: [{ language_code: source, name, passthrough: "source" }] }]
```

There is no `url` on that input — the file arrives via the upload URL. Three
things about this are easy to get wrong:

- **ASR is decoupled from encoding.** The generated text track is still
  `preparing` when `asset.status` flips to `ready`. A ready asset does not mean
  ready captions.
- **`language_code: "auto"` is not resolved immediately.** The track can report
  `ready` while its `language_code` is still `"auto"`. The pipeline keeps
  waiting for a real code; if the deadline passes while it's still `auto`, it
  presses on anyway — the transcript URL is keyed on the *track id*, so the
  description is unaffected. Only the source-collision filter degrades, and
  Mux's own rejection is the backstop.
- **A track's `name` can never be updated.** Mux offers create and delete on
  tracks, no update. So a video uploaded with auto-detect shows "Original" in
  the player's CC menu forever, while one with a declared spoken language shows
  "Español". That, plus better ASR accuracy, is why the picker offers a spoken
  language at all.

Once the source track is ready, the pipeline records the detected language,
downloads `https://stream.mux.com/{playbackId}/text/{trackId}.txt` (playback is
public, so no signing token), saves it to `transcription`, and lets the
description and the translations proceed independently.

### Translations

One Mux Robots `translate-captions` job per language, with `upload_to_mux: true`
so Robots attaches the resulting WebVTT itself — we never handle the file.
Before spending anything, two guards:

1. **Duration cap.** Over `MAX_TRANSLATION_DURATION_S` (30 min) every target is
   marked `skipped`. This is the guard that matters: a long upload times several
   languages is the only way this gets expensive.
2. **Source-collision filter.** A target equal to the detected spoken language is
   marked `skipped` rather than sent. Mux rejects those outright ("the asset must
   not already have a text track for this language"), so filtering beats paying
   for a 4xx round trip.

A per-language failure marks only that track `errored` and moves on — one bad
language never aborts the others.

The two-phase wait is not optional: Robots reports `completed` as soon as it has
uploaded the VTT, but the Mux text track it created is still `preparing` at that
moment and won't play. Phase one polls Robots; phase two polls the asset until
the track itself is `ready`. The phases are distinguished by whether the row has
a `mux_track_id` yet.

### Robots over `fetch`, not the SDK

`@mux/mux-node` only exposes `robotsPreview` from **v14**; this project is on
v12 for the rest of the Video API. Two REST calls against
`https://api.mux.com/robots/v0/jobs/translate-captions` are a much smaller thing
to own than a major SDK bump across every existing Mux call site. If the SDK is
ever upgraded, `lib/mux/robots.ts` is the only file that changes — and Robots is
a preview API whose shape Mux says may change anyway, which is the same reason
the Convex version isolated it.

### Backfilling an existing video

Subtitles are requested at *upload* time, so a lesson uploaded before this
feature exists on Mux with no ASR ever having run. `backfillCaptions` covers
that, in one of two shapes:

- **No usable source captions** — retrieve the asset, find
  `tracks.find(t => t.type === "audio")`, and call `generateSubtitles`. Note the
  endpoint is keyed on the **audio track**, not the asset alone.
- **Source captions already ready** — skip ASR entirely and go straight to the
  Robots jobs. This is the retry path for translations that failed for a fixable
  reason, a token without the `robots:*` scope being the common one.

Tracks already `ready` are left alone: re-translating a working language spends
money for nothing, and Mux rejects a second text track in a language the asset
already has. A retry does leave the old errored track on the Mux asset, which is
why the source poll prefers a `ready` candidate, then a `preparing` one, rather
than taking the first match — otherwise it would keep rediscovering the previous
failure.

## How the description works

It runs off the transcript, not the audio. The previous implementation flipped
the asset to `mp4_support: "audio-only"`, polled for the static rendition,
downloaded the audio and sent the bytes to Gemini. That is all gone: ASR and the
transcript download are free on VOD, and a text prompt costs a fraction of an
audio one. No audio rendition is created at all.

Best-effort, and it never surfaces a hard error:

- **Empty-speech guard.** A transcript under 40 characters means silence or a
  stray word. The budget is spent immediately without calling Gemini — a silent
  screencast would otherwise burn eight retries on a model inventing content.
- **Exponential backoff** capped at 60 s, up to 8 attempts, then it settles
  quietly with no description. The video stays playable and the "Generar
  descripcion" button reopens the budget on demand.

The prompt tells the model the transcript comes from speech recognition, may
contain errors, and must never be mentioned. That last instruction is
load-bearing — without it the model narrates its source ("según la
transcripción…") or apologises for garbled ASR.

## Error text: two audiences

Provider failures carry detail a course creator cannot act on — HTTP statuses,
dashboard links, scope hints — and naming Mux to them leaks an implementation
detail they have no account for. So every failure path splits:

- **`console.warn` gets the truth.** `describeRobotsError` returns Mux's own
  `error.messages[]` verbatim, prefixed with the status. That is what tells an
  operator whether the terms need accepting, a scope is missing, or the plan is
  wrong.
- **The row stores a neutral sentence** from the `USER_ERROR` table in
  `caption_pipeline.ts`.

Keep both halves in sync when adding a failure mode.

## Env vars

| Var | Purpose |
| --- | --- |
| `MUX_TOKEN_ID` | Mux access token id — needs Video **full access** *and* the `robots:*` scope |
| `MUX_TOKEN_SECRET` | Mux access token secret |
| `GEMINI_API_KEY` | Gemini key from aistudio.google.com |
| `CRON_SECRET` | Checked by `/api/cron/captions` as `Authorization: Bearer …`. Vercel sets this header on its own cron invocations. Unset means the route is open — set it in production. |

Translation runs on Mux Robots, which has **three** prerequisites, not two:

1. The `robots:*` scope on the access token. Mux tokens have fixed permissions
   at creation, so adding it means creating a *new* token.
2. A paid plan — Robots is unavailable on the Mux free plan.
3. **Someone accepting the Robots terms, once per environment**, on the Robots
   page in the Mux dashboard.

The third is easy to miss and produces a 403 identical in status to a scope
problem. Mux's response body says exactly which it is, which is why
`describeRobotsError` passes it through verbatim.

When Robots is unavailable for any of these reasons, only the translation tracks
fail: ASR, playback, the transcript and the description all still work.

## Deploying

1. Apply the migration: `npm run db:apply drizzle/0004_caption_tracks.sql`
2. `vercel.json` registers the cron. On any other host, hit
   `GET /api/cron/captions` every minute with the bearer token.

## What this costs

Whisper ASR on VOD and the transcript download are **free**. Translation is the
only paid part, billed at 100 AI units per job plus 500 units per minute, at
US$0.01 per 1,000 units:

| Scenario | Units | Cost |
| --- | --- | --- |
| 10-min video, 1 language | 5,100 | ~$0.05 |
| 10-min video, 2 languages | 10,200 | ~$0.10 |
| Worst case (30 min × 3 languages) | 45,300 | ~$0.45 |

Spend is recorded in two operator-only places: `video_tracks.units_consumed` per
language, and a `console.log` line per completed job with the language, the
lesson id, the units and the dollar estimate. **None of it appears in the
creator's UI** — what a translation costs us is not their business.

The default target selection is empty, so the zero-cost path is the one you get
by doing nothing.

## Known limitations

- **Only Spanish, English and Portuguese are offered.** Mux transcribes 22
  languages and translates more. Widening it is one array in
  `caption_languages.ts` — every code added must be one Mux can transcribe.
- **Cost caps are per-lesson, not per-account.** If this ever opens beyond
  trusted course creators, add a rolling per-user unit budget in
  `startTranslations`.
- **No webhook.** Mux has `video.asset.track.ready`, and a Next.js deployment has
  a stable URL, so this is a real option here in a way it wasn't on Convex. The
  sweep was chosen because it needs no out-of-repo Mux configuration and covers
  Robots job completion too. Every transition already goes through
  `advanceCaptions`, so a webhook route would just be a third caller.
- **The Gemini model is hard-coded** (`gemini-2.5-flash`, in
  `DESCRIPTION_MODEL`). Named rather than line-numbered on purpose.
- **Deleting a lesson** cascades its track rows, but the Mux asset and its N
  subtitle tracks are only cleaned up where `mux.video.assets.delete` is already
  called. (Robots jobs self-clean; Mux deletes them after 30 days.)

## Testing it

1. Apply the migration and set the env vars.
2. `npm run dev`, open a course, add a video lesson.
3. **Leave the translation languages unselected the first time.** That path is
   entirely free and still exercises ASR, the transcript and the description.
4. Expect: *Subiendo → Procesando*, then the subtitle chip going *Transcribiendo
   → Listo*, then the description appearing.

Then upload a ~2-minute clip with one target language (~$0.02). Watch the chip
go *En cola → Traduciendo → Listo*, then open the player's CC menu and confirm
both languages are listed and render.

Failure paths worth checking, none of which should produce a red banner:

| What to break | How | Expected |
| --- | --- | --- |
| Gemini | Set `GEMINI_API_KEY` to garbage | Subtitles still complete, no description, no error banner |
| Robots scope | Use a token without `robots:*` | ASR + description fine; only translation tracks go `errored` with a readable message |
| Source collision | Spanish clip, `es` as a target | That track `skipped` ("Ya es el idioma hablado"), **no Robots job created** — confirm no charge in the Mux dashboard |
| Duration cap | Temporarily set `MAX_TRANSLATION_DURATION_S = 30`, upload a 1-min clip | All targets `skipped`, no jobs |
| Closed tab | Upload with a target language, close the tab immediately | The cron sweep finishes the translation within a few minutes |

Also confirm a lesson uploaded *before* this feature still renders: no crash, no
subtitle chips, description intact, and the "Generar subtitulos" button offering
the backfill.
