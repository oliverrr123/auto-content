import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        console.error('No code found in request');
        return NextResponse.redirect(new URL('/error?message=No code found in request', request.url));
    }

    // exchange code for short lived access token
    
    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
        console.error('Missing Instagram client credentials');
        return
    }

    const tokenUrl = 'https://api.instagram.com/oauth/access_token';
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('grant_type', 'authorization_code');
    params.append('redirect_uri', redirectUri);
    params.append('code', code!);

    try {
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params,
        });

        const data = await response.json();

        if (!response.ok || data.error_type) {
            console.error('Failed to exchange code for access token:', data);
            return NextResponse.redirect(new URL('/error?message=Failed to exchange code for access token', request.url));
        }

        const accessToken = data.access_token;
        const instagramUserId = data.user_id;

        // exchange short lived access token for long lived access token

        try {
            const response = await fetch(`https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${accessToken}`);
        
            const data = await response.json();

            if (!response.ok || data.error_type) {
                console.error('Failed to exchange short lived access token for long lived access token:', data);
                console.error(response.status)
                console.error(response.statusText)
                console.error(response.headers)
                console.error(response.body)
                console.error(clientSecret)
                console.error(accessToken)
                return NextResponse.redirect(new URL('/error?message=Failed to exchange short lived access token for long lived access token', request.url));
            }

            const longLivedAccessToken = data.access_token;
            const expiryDate = Math.floor(Date.now() / 1000) + data.expires_in;

            
            const responseGetUserInfo = await fetch(`https://graph.instagram.com/v22.0/me?fields=username,name,profile_picture_url&access_token=${longLivedAccessToken}`)

            const userInfo = await responseGetUserInfo.json();

            console.log(`User info: ${userInfo}`)

            if (!responseGetUserInfo.ok || userInfo.error) {
                console.error('Failed to fetch user info:', userInfo);
                return NextResponse.redirect(new URL('/error?message=Failed to fetch Instagram user info', request.url));
            }

            if (!userInfo.username) {
                console.error('Username not found in Instagram response:', userInfo);
                return NextResponse.redirect(new URL('/error?message=Instagram username not available', request.url));
            }

            const username = userInfo.username;
            const name = userInfo.name || username; // Fallback to username if name is not provided
            const profilePictureUrl = userInfo.profile_picture_url;

            // save to supabase

            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                return NextResponse.redirect(new URL('/login', request.url));
            }

            const { error: instagramError } = await supabase
                .from('instagram')
                .insert({
                    id: user.id,
                    instagram_id: instagramUserId,
                    access_token: longLivedAccessToken,
                    token_expiry_date: expiryDate,
                    username: username,
                    name: name,
                    profile_picture_url: profilePictureUrl,
                });

            if (instagramError) {
                console.error('Failed to save Instagram data:', instagramError);
                return NextResponse.redirect(new URL('/error?message=Failed to save Instagram connection', request.url));
            }

            // TODO: MAKE REFRESHING LOGIC BEFORE PRODUCTION!!!!!!!!!!

            try {
                const accountCheck = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${longLivedAccessToken}`);
                const accountData = await accountCheck.json();

                const instagramDataResponse = await fetch(`https://graph.instagram.com/v23.0/${accountData.id}?fields=username,name,profile_picture_url,biography,followers_count,follows_count,media_count,media&access_token=${longLivedAccessToken}`)
                const instagramData = await instagramDataResponse.json();

                console.log(`Instagram data: ${JSON.stringify(instagramData)}`)
                console.log(`Instagram data data: ${JSON.stringify(instagramData.media.data)}`)
                console.log(`Instagram data not json: ${instagramData.media.data}`)

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
Followers: ${instagramData.followersCount}
Following: ${instagramData.followsCount}
Total posts: ${instagramData.mediaCount}`,
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
                console.error('Error saving Instagram:', error);
                // Continue with the flow even if saving fails
            }
        } catch (error) {
            console.error('Failed to exchange code for access token in route:', error);
            console.error(error);
            return NextResponse.redirect(new URL('/error?message=Failed to exchange code for access token in route', request.url));
        }

        return NextResponse.redirect(new URL('/app/context', request.url));

        
    } catch (error) {
        console.error('Failed to exchange code for access token in route:', error);
        console.error(error);
        return NextResponse.redirect(new URL('/error?message=Failed to exchange code for access token in route', request.url));
    }
}