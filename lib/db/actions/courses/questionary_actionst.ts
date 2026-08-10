"use server";
import { currentUser } from '@/lib/auth/server';
import { eq } from 'drizzle-orm';
import { db } from '../..';
import { exams, options, questionary, questions } from '../../schema/questionary_or_exam';
import { modules_items } from '../../schema/modules_items';
import { courses } from '../../schema/course';
import { redirect } from 'next/navigation';


export type Option = QuestionaryGet['questions'][number]['options'][number];

export type Options = QuestionaryGet['questions'][number]['options'];

export type QuestionGet = QuestionaryGet['questions'][number];
export type Questions = QuestionaryGet['questions'];

export type QuestionaryGet = AwaitedReturn<typeof getQuestionary>;



export async function getQuestionary(questionary_id: string) {
    const user = await currentUser();
    if (user == null) {
        throw Error("User not logged in")
    }
    const questionaryDb = await db.query.questionary.findFirst({
        where: eq(questionary.id, questionary_id), with: {
            questions: {
                with: {
                    options: true
                }
            }
        }
    })
    if (questionaryDb == undefined) {
        throw Error("Questionary not found")
    }

    return questionaryDb;

}

export async function createQuestionary(module_id: string, questionsValues: Questions) {

    const questionaryDB = await db.insert(questionary).values({
        id: crypto.randomUUID(),
        module_item_id: module_id
    }).returning();
    for (const question of questionsValues) {
        const questionDB = await db.insert(questions).values({
            id: crypto.randomUUID(),
            title: question.title, questionary_id: questionaryDB[0]!.id
        }).returning();
        if (question.options.length > 0) {
            await db.insert(options).values(question.options);
        }
    }

    await db.update(modules_items).set({ questionary_id: questionaryDB[0]!.id }).where(eq(modules_items.id, module_id));

}

export async function saveQuestionary(module_id: string, questionsValues: Questions) {
    const user = await currentUser();
    if (!user) throw Error("User not logged in");

    // Find existing questionary for this module item
    const moduleItem = await db.query.modules_items.findFirst({
        where: eq(modules_items.id, module_id),
    });

    // Delete old questionary data if it exists
    if (moduleItem?.questionary_id) {
        const oldQuestionary = await db.query.questionary.findFirst({
            where: eq(questionary.id, moduleItem.questionary_id),
            with: { questions: { with: { options: true } } },
        });
        if (oldQuestionary) {
            for (const q of oldQuestionary.questions) {
                if (q.options.length > 0) {
                    for (const opt of q.options) {
                        await db.delete(options).where(eq(options.id, opt.id));
                    }
                }
                await db.delete(questions).where(eq(questions.id, q.id));
            }
            await db.delete(questionary).where(eq(questionary.id, oldQuestionary.id));
        }
    }

    // Create new questionary
    const newId = crypto.randomUUID();
    await db.insert(questionary).values({
        id: newId,
        module_item_id: module_id,
    });

    for (const question of questionsValues) {
        const qId = crypto.randomUUID();
        await db.insert(questions).values({
            id: qId,
            title: question.title,
            questionary_id: newId,
        });
        if (question.options.length > 0) {
            await db.insert(options).values(
                question.options.map((opt) => ({
                    ...opt,
                    id: crypto.randomUUID(),
                    question_id: qId,
                }))
            );
        }
    }

    await db.update(modules_items)
        .set({ questionary_id: newId })
        .where(eq(modules_items.id, module_id));
}



export async function createExam(course_id: string, questionsValues: Questions) {

    const newExam = await db.insert(exams).values({
        id: crypto.randomUUID(),
        course_id: course_id
    }).returning();

    const questionsWithExamId = questionsValues.map((e) => ({ ...e, exam_id: newExam[0]?.id }));

    await db.insert(questions).values(questionsWithExamId);

    const allOptions = questionsValues.map((e) => e.options).flat();
    await db.insert(options).values(allOptions);

    await db.update(courses).set({ exam_id: newExam[0]?.id }).where(eq(courses.id, course_id));

    console.log('Created Questionary')
}

export async function saveExam(exam_id: string, course_id: string, questionsValues: Questions) {
    const user = await currentUser();
    if (!user) throw Error("User not logged in");

    // Delete old exam data
    const oldExam = await db.query.exams.findFirst({
        where: eq(exams.id, exam_id),
        with: { questions: { with: { options: true } } },
    });
    if (oldExam) {
        for (const q of oldExam.questions) {
            if (q.options.length > 0) {
                for (const opt of q.options) {
                    await db.delete(options).where(eq(options.id, opt.id));
                }
            }
            await db.delete(questions).where(eq(questions.id, q.id));
        }
        await db.delete(exams).where(eq(exams.id, oldExam.id));
    }

    // Create new exam
    const newId = crypto.randomUUID();
    await db.insert(exams).values({
        id: newId,
        course_id,
    });

    for (const question of questionsValues) {
        const qId = crypto.randomUUID();
        await db.insert(questions).values({
            id: qId,
            title: question.title,
            exam_id: newId,
        });
        if (question.options.length > 0) {
            await db.insert(options).values(
                question.options.map((opt) => ({
                    ...opt,
                    id: crypto.randomUUID(),
                    question_id: qId,
                }))
            );
        }
    }

    await db.update(courses).set({ exam_id: newId }).where(eq(courses.id, course_id));
}

export async function getExam(exam_id: string) {
    const user = await currentUser();
    if (!user) throw Error("User not logged in");

    const exam = await db.query.exams.findFirst({
        where: eq(exams.id, exam_id),
        with: {
            questions: {
                with: {
                    options: true,
                },
            },
        },
    });
    if (!exam) throw Error("Exam not found");
    return exam;
}

export async function getExamByCourse(course_id: string) {
    const user = await currentUser();
    if (!user) throw Error("User not logged in");

    const exam = await db.query.exams.findFirst({
        where: eq(exams.course_id, course_id),
        with: {
            questions: {
                with: {
                    options: true,
                },
            },
        },
    });
    if (!exam) throw Error("Exam not found");
    return exam;
}


