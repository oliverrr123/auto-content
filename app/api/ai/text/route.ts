import { NextResponse } from "next/server";
import { OpenAI } from "openai";

export async function POST(req: Request) {
    const { messages } = await req.json();

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages,
    });

    if (!response.choices[0].message.content) {
        return NextResponse.json({ error: "No response from OpenAI" }, { status: 500 });
    }

    return NextResponse.json({ content: response.choices[0].message.content });
}