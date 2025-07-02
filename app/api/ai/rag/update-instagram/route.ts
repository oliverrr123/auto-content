import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

		const { error: error1 } = await supabase
			.from('documents')
			.delete()
			.eq('user_id', user.id)
			.in('doc_type', ['instagram_post', 'instagram_profile']);

		if (error1) {
			return NextResponse.json({ error: 'Error deleting instagram' }, { status: 500 });
		}

		try {
			const { data } = await supabase.from('instagram').select('access_token').eq('id', user.id).single();

			if (!data?.access_token) {
				return NextResponse.json({ error: 'No access token found' }, { status: 400 });
			}

			const longLivedAccessToken = data.access_token;

			const accountCheck = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${longLivedAccessToken}`);
			const accountData = await accountCheck.json();

			const instagramDataResponse = await fetch(`https://graph.instagram.com/v23.0/${accountData.id}?fields=username,name,profile_picture_url,biography,followers_count,follows_count,media_count,media&access_token=${longLivedAccessToken}`)
			const instagramData = await instagramDataResponse.json();

			const media = [];
			for (const item of instagramData.media.data) {
				const responseMediaItem = await fetch(`https://graph.instagram.com/v23.0/${item.id}?fields=caption,media_url,thumbnail_url,media_type,permalink,timestamp,like_count,comments_count&access_token=${longLivedAccessToken}`)
				const mediaItemData = await responseMediaItem.json();
				if (!mediaItemData.thumbnail_url) {
					media.push({ media_url: mediaItemData.media_url, caption: mediaItemData.caption, media_type: mediaItemData.media_type, permalink: mediaItemData.permalink, timestamp: mediaItemData.timestamp, like_count: mediaItemData.like_count, comments_count: mediaItemData.comments_count })
				} else {
					media.push({ media_url: mediaItemData.thumbnail_url, caption: mediaItemData.caption, media_type: mediaItemData.media_type, permalink: mediaItemData.permalink, timestamp: mediaItemData.timestamp, like_count: mediaItemData.like_count, comments_count: mediaItemData.comments_count })
				}
			}

			const embeddings = new OpenAIEmbeddings({
				model: 'text-embedding-ada-002'
			})
	
			const vectorStore = new SupabaseVectorStore(embeddings, {
				client: supabase,
				tableName: 'documents',
				queryName: 'match_documents',
			})
			
			const profileDoc: Document = {
				pageContent: `Instagram profile of @${instagramData.username} (${instagramData.name})
Bio: ${instagramData.biography}
Followers: ${instagramData.followers_count}
Following: ${instagramData.follows_count}
Total posts: ${instagramData.media_count}`,
				metadata: {
					user_id: user.id,
					doc_type: 'instagram_profile',
					source: `https://www.instagram.com/${instagramData.username}`,
				},
			}
	
			const mediaDocs: Document[] = media.map((post: { caption: string, timestamp: string, like_count: number, comments_count: number, media_type: string, permalink: string }, index: number) => {
				const caption = post.caption || '';
				const content = `Instagram post by @${instagramData.username} on ${new Date(post.timestamp).toLocaleDateString()}
Caption: ${caption}
Likes: ${post.like_count}
Comments: ${post.comments_count}
Media Type: ${post.media_type}
Post URL: ${post.permalink}`
				return {
					pageContent: content,
					metadata: {
						user_id: user.id,
						doc_type: 'instagram_post',
						source: post.permalink,
						chunk_index: index,
						media_type: post.media_type,
						like_count: post.like_count,
						comment_count: post.comments_count,
						timestamp: post.timestamp,
					}
				}
			});
	
			const docs = [profileDoc, ...mediaDocs];
			await vectorStore.addDocuments(docs, { ids: docs.map((d) => d.metadata.source) });
		} catch (error) {
			console.error('Error updating Instagram:', error);
			return NextResponse.json({ error: 'Error updating Instagram' }, { status: 500 });
		}

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}