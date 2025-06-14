import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
    const { caption, fileURL, fileType, isCarouselItem, taggedPeople } = await req.json();
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data } = await supabase.from('instagram').select('*').eq('id', user.id).single()

    if (!data) {
        return NextResponse.json({ error: 'Instagram account not linked' }, { status: 400 });
    }


    try {
        const accountCheck = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${data.access_token}`);
        const accountData = await accountCheck.json();
        data.instagram_id = accountData.id;

        let request;

        if (isCarouselItem) {
            if (fileType === 'video/mp4' || fileType === 'video/mov' || fileType === 'video/quicktime') {
                request = await fetch(`https://graph.instagram.com/v23.0/${data.instagram_id}/media`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${data.access_token}`
                    },
                    method: 'POST',
                    body: JSON.stringify({
                        "video_url": fileURL,
                        "is_carousel_item": true,
                        "user_tags": taggedPeople.map((user: { username: string, x: number, y: number}) => ({ 'username': user.username }))
                    })
                });
            } else {
                request = await fetch(`https://graph.instagram.com/v23.0/${data.instagram_id}/media`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${data.access_token}`
                    },
                    method: 'POST',
                    body: JSON.stringify({
                        "image_url": fileURL,
                        "is_carousel_item": true,
                        "user_tags": taggedPeople.map((user: { username: string, x: number, y: number}) => ({ 'username': user.username, x: user.x, y: user.y}))
                    })
                });
            }
        } else if (fileType === 'video/mp4' || fileType === 'video/mov' || fileType === 'video/quicktime') {
            request = await fetch(`https://graph.instagram.com/v23.0/${data.instagram_id}/media`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${data.access_token}`
                },
                method: 'POST',
                body: JSON.stringify({
                    "video_url": fileURL,
                    "caption": caption,
                    "media_type": "REELS",
                    // "user_tags": taggedPeople.map((user: { username: string, x: number, y: number}) => ({ 'username': user.username }))
                })
            });
        } else {
            request = await fetch(`https://graph.instagram.com/v23.0/${data.instagram_id}/media`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${data.access_token}`
                },
                method: 'POST',
                body: JSON.stringify({
                    "image_url": fileURL,
                    "caption": caption,
                    "user_tags": taggedPeople.map((user: { username: string, x: number, y: number}) => ({ 'username': user.username, x: user.x, y: user.y}))
                })
            });
        }

        
        const response = await request.json();
        console.log(response);

        console.log(taggedPeople[0])
        
        return NextResponse.json({ id: response.id }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to get container id' }, { status: 400 });
    }
}