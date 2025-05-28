import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        // TODO
    }

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

        try {
            const response = await fetch(`https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${accessToken}`);
        
            const data = await response.json();

            if (!response.ok || data.error_type) {
                // TODO
            }

            console.log(data);

            const longLivedAccessToken = data.access_token;
            const expiryDate = Math.floor(Date.now() / 1000) + data.expires_in;

            console.log(`${instagramUserId} has a long lived access token: ${longLivedAccessToken}`);
            console.log(`${instagramUserId} has a expiry date: ${expiryDate}`);

            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                // return NextResponse.redirect(new URL('/login', request.url));
                console.log("No user found");
            }

            const { error: instagramError } = await supabase
                .from('instagram')
                .insert({
                    id: instagramUserId,
                    access_token: longLivedAccessToken,
                    token_expiry_date: expiryDate,
                });

            if (instagramError) {
                // TODO
            }

            const { error: userError } = await supabase
                .from('profiles')
                .update({
                    instagram_id: instagramUserId,
                })
                .eq('id', user?.id)

            if (userError) {
                // TODO
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