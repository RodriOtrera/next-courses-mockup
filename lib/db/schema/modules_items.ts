import { relations } from "drizzle-orm";
import { courses } from "./course";
import z from 'zod';
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { modules } from "./modules";
import { ExtractModified } from "@/lib/types/extract_modified";
import { questionary } from "./questionary_or_exam";
import { video_tracks } from "./video_tracks";
import { integer, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";

export const moduleValues = ['questionario', 'pdf', 'video'] as const;
const moduleType = z.enum(moduleValues);
export type ModuleEnums = z.infer<typeof moduleType>;

export const modules_items = pgTable('modules_items', {
    id: text('id').primaryKey(),
    position: integer('position').notNull(),
    title: text('title').notNull(),
    type: text('type', { enum: moduleValues }).notNull().$type<ModuleEnums>(),
    module_id: text(' module_id').notNull(),
    pdf_url: text('pdf_url'),
    video_url: text('video_url'),
    mux_asset_id: text('mux_asset_id'),
    mux_playback_id: text('mux_playback_id'),
    questionary_id: text('questionary_id'),
    description: text('description'),
    transcription: text('transcription'),

    // -- Subtitles --
    // Per-language progress lives in `video_tracks`; these are the parent
    // facts that never change once the upload is created, plus what ASR found.
    // Nothing here gates the player: a lesson stays playable the whole time its
    // subtitles are being transcribed and translated.

    /** What the uploader declared the audio to be: a language code or "auto". */
    caption_source_language: text('caption_source_language'),
    /** What Mux ASR actually detected. Null until the source track is ready. */
    caption_detected_language: text('caption_detected_language'),
    /** Mux's 0-1 confidence. Only present when auto-detection was used. */
    caption_detected_confidence: real('caption_detected_confidence'),
    /** Translation targets chosen at upload. Capped at MAX_TARGET_LANGUAGES. */
    caption_targets: text('caption_targets').array(),
    /**
     * Retry budget for the AI description, persisted for the same reason
     * `video_tracks.attempts` is: there is no scheduler chain to carry it.
     */
    description_attempts: integer('description_attempts').notNull().default(0),
    /** When the last description attempt ran, for the exponential backoff. */
    description_attempted_at: timestamp('description_attempted_at'),

})


export const modules_items_relations = relations(modules_items, ({ one, many }) => ({
    module: one(modules, {
        fields: [modules_items.module_id],
        references: [modules.id]
    }),
    questionary: one(questionary, {
        fields: [modules_items.questionary_id],
        references: [questionary.id]
    }),
    tracks: many(video_tracks)

}))

const moduleInsert = createInsertSchema(modules_items);
const moduleZod = createSelectSchema(modules_items)

export type ModuleItemInsert = z.infer<typeof moduleInsert>;
export type ModuleItemSelect = z.infer<typeof moduleZod>;

const module_properties = moduleZod.pick({ position: true, module_id: true, title: true, });

const module_pdf = moduleZod
    .pick({ pdf_url: true, })
    .merge(z.object({ type: z.literal(moduleType.enum.pdf) }))

const module_video = moduleZod.pick({ video_url: true, mux_asset_id: true, mux_playback_id: true, description: true, transcription: true, caption_source_language: true, caption_detected_language: true }).merge(z.object({ type: z.literal(moduleType.enum.video) }))
const module_questionary = moduleZod.pick({ questionary_id: true })
    .merge(z.object({ type: z.literal(moduleType.enum.questionario) }))


const module_discriminated_union = z.discriminatedUnion('type', [module_pdf, module_video, module_questionary]);
export const moduleZodIntersecttion = z.intersection(module_discriminated_union, module_properties);

export type ModuleZod = z.infer<typeof moduleZodIntersecttion>;
export type ModuleVideoType = ExtractModified<ModuleZod, 'type', 'video'>
export type ModulePDFType = ExtractModified<ModuleZod, 'type', 'pdf'>


// const newModule: ModuleInsert = { course_id: '', id: '', position: 1, title: 'Curso', type: 'pdf' };


// const parsedModule = moduleZodIntersecttion.parse(newModule);

// if (parsedModule.type == 'pdf') {

// }

