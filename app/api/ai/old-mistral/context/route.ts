import { NextResponse } from 'next/server';
import { Mistral } from '@mistralai/mistralai';
import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';

const Schema = z.object({
	instagram_username: z.boolean(),
	instagram_name: z.boolean(),
	instagram_profile_picture: z.boolean(),
	instagram_biography: z.boolean(),
	instagram_followers: z.boolean(),
	instagram_following: z.boolean(),
	instagram_post_count: z.boolean(),
	instagram_media: z.boolean(),
	instagram_media_data: z.object({
		media_url: z.boolean(),
		caption: z.boolean(),
		media_type: z.boolean(),
		permalink: z.boolean(),
		timestamp: z.boolean(),
		comments_count: z.boolean(),
		likes_count: z.boolean(),
		is_comment_enabled: z.boolean(),
	}),
});

export async function POST(req: Request) {
	try {
		const supabase = await createClient();
		const { data: { user } } = await supabase.auth.getUser();

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const apiKey = process.env.MISTRAL_API_KEY;

		const client = new Mistral({apiKey: apiKey});

		const { lastMessage } = await req.json();

		const chatResponse = await client.chat.complete({
			model: 'mistral-large-latest',
			messages: [
				{
					role: 'system',
					content:
						'You are a helpful assistant that determines which external information is needed for a request. You will be given a request and you will need to determine which external information is needed to fulfill the request. Return your response in the following JSON format: { "instagram_username": boolean, "instagram_name": boolean, "instagram_profile_picture": boolean, "instagram_biography": boolean, "instagram_media": boolean, "instagram_media_data": { "media_url": boolean, "caption": boolean, "media_type": boolean, "permalink": boolean, "timestamp": boolean, "comments_count": boolean, "likes_count": boolean, "is_comment_enabled": boolean }, "instagram_followers": boolean, "instagram_following": boolean, "instagram_post_count": boolean }',
				},
				{
					role: 'user',
					content:
						'Determine which external information is needed for this request: ' +
						lastMessage.content,
				},
			],
			responseFormat: { type: 'json_object' },
			temperature: 0.1,
		});

		if (!chatResponse?.choices?.[0]?.message?.content) {
			return NextResponse.json({ error: 'No response from Mistral AI' }, { status: 500 });
		}

		try {
			const content = typeof chatResponse.choices[0].message.content === 'string'
				? chatResponse.choices[0].message.content
				: JSON.stringify(chatResponse.choices[0].message.content);

			const context = Schema.parse(JSON.parse(content));

			const profileParameters: string[] = [];
			const mediaParameters: string[] = [];

			if (context.instagram_username) profileParameters.push('username');
			if (context.instagram_name) profileParameters.push('name');
			if (context.instagram_profile_picture) profileParameters.push('profile_picture_url');
			if (context.instagram_biography) profileParameters.push('biography');
			if (context.instagram_followers) profileParameters.push('followers_count');
			if (context.instagram_following) profileParameters.push('follows_count');
			if (context.instagram_post_count) profileParameters.push('media_count');

			if (context.instagram_media) {
				if (context.instagram_media_data.media_url) mediaParameters.push('media_url');
				if (context.instagram_media_data.caption) mediaParameters.push('caption');
				if (context.instagram_media_data.media_type) mediaParameters.push('media_type');
				if (context.instagram_media_data.permalink) mediaParameters.push('permalink');
				if (context.instagram_media_data.timestamp) mediaParameters.push('timestamp');
				if (context.instagram_media_data.comments_count) mediaParameters.push('comments_count');
				if (context.instagram_media_data.likes_count) mediaParameters.push('like_count');
				if (context.instagram_media_data.is_comment_enabled)
					mediaParameters.push('is_comment_enabled');
			}

			return NextResponse.json({ 
				parameters: { 
					profile: profileParameters, 
					media: mediaParameters 
				} 
			});
		} catch (error) {
			console.error('Error parsing Mistral AI response:', error);
			return NextResponse.json({ 
				parameters: { 
					profile: [], 
					media: [] 
				} 
			});
		}
	} catch (error) {
		console.error('Error processing Mistral AI response:', error);
		return NextResponse.json({ error: 'Error processing AI response' }, { status: 500 });
	}
}
