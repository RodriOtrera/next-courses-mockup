"use server";

import { and, eq } from "drizzle-orm";
import { currentUser } from "@/lib/auth/server";
import { db } from "../..";
import { subscription } from "../../schema/subscrition_schema";
import { coachings } from "../../schema/coachings";


export async function userHasSubscribed() {
    const user = await currentUser();
    if (!user) return undefined;
    const subscribed = await db.query.subscription.findFirst({ where: and(eq(subscription.userId, user.id), eq(subscription.active, true)) })
    return subscribed;
}

export async function userSuscribedToCoaching(): Promise<string | null> {

    const testUserId = "user_2aYNwDadYhtig1ibh8kVTxBFff2";
    const user = await currentUser();
    if (!user) return null;
    const subscribed = await db.query.subscription.findFirst({
        where: and(eq(subscription.userId, user.id), eq(subscription.active, true))
    })

    return subscribed ? (subscribed.coaching_id ? subscribed.coaching_id : null) : null;
}

export type CoachingView = AwaitedReturn<typeof getCoachingBySubscription>;

export const getCoachingBySubscription = async (coachingId: string) => {
    const coaching = await db.query.coachings.findFirst(
        {
            where: eq(coachings.id, coachingId),
            with: {
                salas: true,

            }
        }
    )

    if (!coaching) {
        throw new Error('Coaching not found');
    }
    return coaching;
}

export async function getCoachings() {
    const userHasAlreadySubscribed = await userSuscribedToCoaching();
    if (!userHasAlreadySubscribed) {
        return null;
    } else {
        const coaching = await getCoachingBySubscription(userHasAlreadySubscribed);
        return coaching;
    }

}



export type UserWithSubscription = AwaitedReturn<typeof getUsersSubscriptions>[number]
export type SubscriptionsSelect = AwaitedReturn<typeof getUsersSubscriptions>;
export async function getUsersSubscriptions() {
    return await db.query.users.findMany({
        with: {
            subscriptions: true
        }
    })
}