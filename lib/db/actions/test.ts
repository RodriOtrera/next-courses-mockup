"use server";

import axios from "axios";
import { db } from "..";
import { subscription } from "../schema/subscrition_schema";
import { card_schema } from "../schema/card_price";
import { users } from "../schema/auth_schema";
import { ebook_schema, payment_schema_ebook, payments_on_users_ebooks } from '../schema/ebook_schema';
import { payment_schema_program, payments_on_users_program, program_schema } from "../schema/program_schema";
import { semanas } from "../schema/semanas";
import { videos } from "../schema/videos";
import { meeting_schema } from "../schema/meeting";

// export default async function createSubscriptions() {
//     const subscriptions = await db.select().from(subscription);

//     const trueSubs = subscriptions.map((e) => ({
//         ...e,
//         createdAt: e.createdAt.toISOString().slice(0, 19).replace('T', ' '),
//         updatedAt: e.updatedAt.toISOString().slice(0, 19).replace('T', ' ')
//     }));
//     try {
//         const response = await axios.post("https://bun-first.onrender.com/subscriptions", {
//             data: trueSubs,
//         }, {
//             headers: {
//                 "Content-Type": "application/json"
//             }
//         });
//         console.log(response.data)
//     } catch (error) {
//         console.log(error)
//     }


// }
export async function createCard() {
    const card = (await db.select().from(card_schema))[0];


    try {
        const response = await axios.post("https://bun-first.onrender.com/card", {
            data: card,
        }, {
            headers: {
                "Content-Type": "application/json"
            }
        });
        console.log(response.data)
    } catch (error) {
        console.log(error)
    }


}

export async function createUsers() {
    const userstable = await db.select().from(users);


    try {
        const response = await axios.post("https://bun-first.onrender.com/users", {
            data: userstable,
        }, {
            headers: {
                "Content-Type": "application/json"
            }
        });
        console.log(response.data)
    } catch (error) {
        console.log(error)
    }


}


export async function createProgramsSchemas() {
    const data = await db.select().from(program_schema);


    try {
        const response = await axios.post("https://bun-first.onrender.com/programs", {
            data: data,
        }, {
            headers: {
                "Content-Type": "application/json"
            }
        });
        console.log(response.data)
    } catch (error) {
        console.log(error)
    }


}

export async function createProgramsPayments() {
    const data = await db.select().from(payment_schema_program);


    try {
        const response = await axios.post("https://bun-first.onrender.com/paymentPrograms", {
            data: data,
        }, {
            headers: {
                "Content-Type": "application/json"
            }
        });
        console.log(response.data)
    } catch (error) {
        console.log(error)
    }


}

export async function createPaymentsOnPrograms() {
    const data = await db.select().from(payments_on_users_program);


    try {
        const response = await axios.post("https://bun-first.onrender.com/paymentOnPrograms", {
            data: data,
        }, {
            headers: {
                "Content-Type": "application/json"
            }
        });
        console.log(response.data)
    } catch (error) {
        console.log(error)
    }


}

export async function createEbooksSchemas() {
    const data = await db.select().from(ebook_schema);


    try {
        const response = await axios.post("https://bun-first.onrender.com/ebooks", {
            data: data,
        }, {
            headers: {
                "Content-Type": "application/json"
            }
        });
        console.log(response.data)
    } catch (error) {
        console.log(error)
    }


}

export async function createEbooksPayments() {
    const data = await db.select().from(payment_schema_ebook);


    try {
        const response = await axios.post("https://bun-first.onrender.com/paymentEbooks", {
            data: data,
        }, {
            headers: {
                "Content-Type": "application/json"
            }
        });
        console.log(response.data)
    } catch (error) {
        console.log(error)
    }


}

export async function createPaymentsOnEbooks() {
    const data = await db.select().from(payments_on_users_ebooks);


    try {
        const response = await axios.post("https://bun-first.onrender.com/paymentOnEbooks", {
            data: data,
        }, {
            headers: {
                "Content-Type": "application/json"
            }
        });
        console.log(response.data)
    } catch (error) {
        console.log(error)
    }


}

export async function createSemanas() {
    const data = await db.select().from(semanas);


    try {
        const response = await axios.post("https://bun-first.onrender.com/semanas", {
            data: data,
        }, {
            headers: {
                "Content-Type": "application/json"
            }
        });
        console.log(response.data)
    } catch (error) {
        console.log(error)
    }


}



export async function createMeeting() {
    const data = await db.select().from(meeting_schema);


    try {
        const response = await axios.post("https://bun-first.onrender.com/meeting", {
            data: data,
        }, {
            headers: {
                "Content-Type": "application/json"
            }
        });
        console.log(response.data)
    } catch (error) {
        console.log(error)
    }


}