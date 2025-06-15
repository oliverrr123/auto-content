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

		const { lastMessage } = await req.json();

		const openai = new OpenAI({
			apiKey: process.env.OPENAI_API_KEY,
		});

		const schema = {
			name: 'instagram_context',
			strict: true,
			schema: {
				type: 'object',
				properties: {
					instagram_username: { type: 'boolean' },
					instagram_name: { type: 'boolean' },
					instagram_profile_picture: { type: 'boolean' },
					instagram_biography: { type: 'boolean' },
					instagram_followers: { type: 'boolean' },
					instagram_following: { type: 'boolean' },
					instagram_post_count: { type: 'boolean' },
					instagram_media: { type: 'boolean' },
					instagram_media_data: {
						type: 'object',
						properties: {
							media_url: { type: 'boolean' },
							caption: { type: 'boolean' },
							media_type: { type: 'boolean' },
							permalink: { type: 'boolean' },
							timestamp: { type: 'boolean' },
							comments_count: { type: 'boolean' },
							likes_count: { type: 'boolean' },
							is_comment_enabled: { type: 'boolean' },
						},
						additionalProperties: false,
						required: [
							'media_url',
							'caption',
							'media_type',
							'permalink',
							'timestamp',
							'comments_count',
							'likes_count',
							'is_comment_enabled',
						],
					},
				},
				additionalProperties: false,
				required: [
					'instagram_username',
					'instagram_name',
					'instagram_profile_picture',
					'instagram_biography',
					'instagram_followers',
					'instagram_following',
					'instagram_post_count',
					'instagram_media',
					'instagram_media_data',
				],
			},
		};

		const responseIGContext = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [
				{
					role: 'system',
					content:
						'You are a helpful assistant that determines which external information is needed for a request. You will be given a request and you will need to determine which external information is needed to fulfill the request. You will then return a JSON object with the following format: { instagram_username: Boolean, instagram_name: Boolean, instagram_profile_picture: Boolean, instagram_biography: Boolean, instagram_media: Boolean, instagram_media_data: { media_url: Boolean, caption: Boolean, media_type: Boolean, permalink: Boolean, timestamp: Boolean, comments_count: Boolean, likes_count: Boolean, is_comment_enabled: Boolean, }, instagram_followers: Boolean, instagram_following: Boolean, instagram_posts: Boolean }',
				},
				{
					role: 'user',
					content:
						'Determine which external information is needed for this request: ' +
						lastMessage.content,
				},
			],
			response_format: {
				type: 'json_schema',
				json_schema: schema,
			},
		});

		if (!responseIGContext.choices[0].message.content) {
			return NextResponse.json({ error: 'No response from OpenAI' }, { status: 500 });
		}

		const context = JSON.parse(responseIGContext.choices[0].message.content);

		const profileParameters = [];
		const mediaParameters = [];

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
	
		return NextResponse.json({ parameters: { profile: profileParameters, media: mediaParameters } });
	} catch (error) {
		console.error('Error processing OpenAI response:', error);
		return NextResponse.json({ error: 'Error processing AI response' }, { status: 500 });
	}
}
