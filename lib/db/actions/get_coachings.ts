import { db } from "..";
import { coachings } from "../schema/coachings";



export type CoachingTypeSelect = AwaitedReturn<typeof get_coachings>[number];
export async function get_coachings() {
    const coachingsData = await db.query.coachings.findMany({
        with: {
            items: true,
        }
    });
    
    
    return coachingsData;
    
}