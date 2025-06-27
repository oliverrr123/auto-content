import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
	try {
		// Check authentication
		const supabase = await createClient();
		const { data: { user } } = await supabase.auth.getUser();

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { messages, context } = await req.json();

		const openai = new OpenAI({
			apiKey: process.env.OPENAI_API_KEY,
		});

		const response = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [
				{
					role: 'system',
					content:
						'You are GrowByte, a helpful assistant that helps users create posts for their social media accounts. You are a social media expert and you are able to create engaging posts. The user can ask you to do stuff like "Create a post about ... and post it to my Instagram" or "What is my Instagram username?". Here is some information from the user\'s Instagram account: ' +
						JSON.stringify(context),
				},
				...messages
			],
		});

		if (!response.choices[0].message.content) {
			return NextResponse.json({ error: 'No response from OpenAI' }, { status: 500 });
		}
		return NextResponse.json({ content: response.choices[0].message.content });
	} catch (error) {
		console.error('Error processing OpenAI response:', error);
		return NextResponse.json({ error: 'Error processing AI response' }, { status: 500 });
	}
}
