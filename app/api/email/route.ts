import { NextRequest, NextResponse } from "next/server";
import z from 'zod';
import { sendMail } from "./send_email";


const emailSchema = z.object({
    to: z.union([z.string(), z.array(z.string())]),
    subject: z.string(),
    text: z.string(),
})


async function handler (req: NextRequest) {
    const body = await req.json();
    const data = emailSchema.safeParse(body);
    
    if (data.success) {
      await  sendMail({
            sendTo: data.data.to,
            subject: data.data.subject,
            text: data.data.text,
        })
        return NextResponse.json({ message: "Email sent" }, { status: 200 });
    }

    return NextResponse.json({ message: "Invalid data" }, { status: 400 });
 

}

export { handler as GET, handler as POST };
