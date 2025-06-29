import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';

export async function POST(req: NextRequest) {
    try {
		const { profile, media } = await req.json();

		if (!profile || !media) {
			return NextResponse.json({ error: 'Profile and media are required' }, { status: 400 });
		}

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
			pageContent: `Instagram profile of @${profile.username} (${profile.name})
Bio: ${profile.biography}
Followers: ${profile.followersCount}
Following: ${profile.followsCount}
Total posts: ${profile.mediaCount}`,
			metadata: {
				user_id: user.id,
				doc_type: 'instagram_profile',
				source: `https://www.instagram.com/${profile.username}`,
			},
		}

		const mediaDocs: Document[] = media.mediaArray.map((post: { caption: string, timestamp: string, like_count: number, comments_count: number, media_type: string, permalink: string }, index: number) => {
			const caption = post.caption || '';
			const content = `Instagram post by @${profile.username} on ${new Date(post.timestamp).toLocaleDateString()}
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

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}