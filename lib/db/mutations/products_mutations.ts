import { db } from "..";
import { InsertEbookSchema, ebook_schema } from "../schema/ebook_schema";
import { InsertProgram, program_schema } from "../schema/program_schema";

export const create_ebook_mutation = async (ebook: InsertEbookSchema) => db.insert(ebook_schema).values(ebook);

export const create_program_mutation = async (program: InsertProgram) => db.insert(program_schema).values(program);

