'use server';

import { and, eq } from "drizzle-orm";
import { salas } from "../../schema/coachings";
import { db } from "../..";
import { userSuscribedToCoaching } from "../subscription/subscriptions";



export async function getSala(sala_id: string, coaching_id: string) {
   
    const userHasCoaching = await checkIfUserHasCoaching(coaching_id);
    if (!userHasCoaching) return null;
    
    const sala = await db.query.salas.findFirst({
        where: and(eq(salas.id, sala_id), eq(salas.coaching_id, coaching_id)),
        with: {
            temas: {
                with: {
                    items: true
                }
            }
            
        }
    })

    if (!sala) {
    throw new Error('Sala not found');
    }
    return sala ;
}


export async function checkIfUserHasCoaching(coaching_id: string): Promise<boolean> {

    const coaching = await userSuscribedToCoaching();
    if (!coaching) return false;

    return coaching === coaching_id

}

