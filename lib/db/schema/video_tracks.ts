import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";
import { modules_items } from "./modules_items";

export const trackKindValues = ['source', 'translation'] as const;
export type TrackKind = (typeof trackKindValues)[number];

export const trackStatusValues = [
    'pending',      // queued, nothing started
    'generating',   // source: Mux ASR running
    'translating',  // translation: Robots job in flight
    'ready',        // the Mux text track is playable
    'errored',
    'skipped',      // deliberately not attempted; see error_message
] as const;
export type TrackStatus = (typeof trackStatusValues)[number];

/** A track nobody needs to poll again. The cron sweep filters on these. */
export const TERMINAL_TRACK_STATUSES: readonly TrackStatus[] = ['ready', 'errored', 'skipped'];

/**
 * One row per subtitle track on a lesson video: the ASR-generated source track
 * plus one per requested translation.
 *
 * A child table rather than columns on `modules_items` because each track
 * advances on its own clock — Mux transcribes the source while N Robots jobs
 * translate in parallel, each finishing whenever it finishes. One row per track
 * means an advance step writes exactly the rows that moved.
 */
export const video_tracks = sqliteTable("video_tracks", {
    id: text('id').primaryKey(),
    module_item_id: text('module_item_id')
        .notNull()
        .references(() => modules_items.id, { onDelete: "cascade" }),
    kind: text('kind', { enum: trackKindValues }).notNull().$type<TrackKind>(),
    /** BCP-47 code. "auto" on the source row until detection resolves it. */
    language_code: text('language_code').notNull(),
    status: text('status', { enum: trackStatusValues }).notNull().$type<TrackStatus>(),
    mux_track_id: text('mux_track_id'),
    robots_job_id: text('robots_job_id'),
    /** Mux AI units actually billed. Only set on completed translations. */
    units_consumed: integer('units_consumed'),
    /**
     * How many times the pipeline has looked at this track without it moving.
     *
     * Convex passed the attempt number down the scheduler chain; here there is
     * no chain, so the budget has to live on the row for the next advance —
     * from a browser poll or the cron sweep — to know when to give up.
     */
    attempts: integer('attempts').notNull().default(0),
    /** Failure text, or the reason a `skipped` row was skipped. */
    error_message: text('error_message'),
    created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
    updated_at: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (t) => ({
    // One track per language per lesson. Without this, a double-fired advance
    // could open a second Robots job for a language already in flight — and
    // pay for it. The libSQL remote client has no interactive transactions, so
    // a unique index is the only concurrency primitive available.
    perLanguage: uniqueIndex('video_tracks_item_language_idx').on(t.module_item_id, t.kind, t.language_code),
    byItem: index('video_tracks_item_idx').on(t.module_item_id),
    byStatus: index('video_tracks_status_idx').on(t.status),
}))

export const video_tracks_relations = relations(video_tracks, ({ one }) => ({
    moduleItem: one(modules_items, {
        fields: [video_tracks.module_item_id],
        references: [modules_items.id]
    })
}))

const trackInsert = createInsertSchema(video_tracks);
const trackSelect = createSelectSchema(video_tracks);

export type VideoTrackInsert = z.infer<typeof trackInsert>;
export type VideoTrackSelect = z.infer<typeof trackSelect>;

/** What the UI needs about one subtitle track. No transcript, no job ids. */
export type CaptionTrackSummary = {
    id: string;
    kind: TrackKind;
    languageCode: string;
    status: TrackStatus;
    errorMessage: string | null;
};

export function toCaptionTrackSummary(track: VideoTrackSelect): CaptionTrackSummary {
    return {
        id: track.id,
        kind: track.kind,
        languageCode: track.language_code,
        status: track.status,
        errorMessage: track.error_message,
    };
}
