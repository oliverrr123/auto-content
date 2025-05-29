import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        // TODO
    }

    // exchange code for short lived access token
    
    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
        // TODO
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
            // TODO
        }

        const accessToken = data.access_token;
        const instagramUserId = data.user_id;

        // exchange short lived access token for long lived access token

        try {
            const response = await fetch(`https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${accessToken}`);
        
            const data = await response.json();

            if (!response.ok || data.error_type) {
                // TODO
            }

            const longLivedAccessToken = data.access_token;
            const expiryDate = Math.floor(Date.now() / 1000) + data.expires_in;

            
            const responseGetUserInfo = await fetch(`https://graph.instagram.com/v22.0/me?fields=username,name,profile_picture_url&access_token=${longLivedAccessToken}`)

            const userInfo = await responseGetUserInfo.json();

            const username = userInfo.username;
            const name = userInfo.name;
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
                // TODO
                console.error(instagramError);
                console.log(user.id);
                console.log(instagramUserId);
            }

            // TODO: MAKE REFRESHING LOGIC BEFORE PRODUCTION!!!!!!!!!!

        } catch (error) {
            // TODO
            console.error(error);
        }

        return NextResponse.redirect(new URL('/context', request.url));

        
    } catch (error) {
        // TODO

        console.error(error);
    }
}