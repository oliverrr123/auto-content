import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
    const { caption, files } = await req.json();
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
        const containerIds = [];

        const accountCheck = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${data.access_token}`);
        const accountData = await accountCheck.json();
        data.instagram_id = accountData.id;

        for (const fileURL of files) {
            const request = await fetch(`https://graph.instagram.com/v23.0/${data.instagram_id}/media`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${data.access_token}`
                },
                method: 'POST',
                body: JSON.stringify({
                    "image_url": fileURL,
                    "is_carousel_item": true
                })
            });

            const response = await request.json();

            containerIds.push(response.id);
        }

        const request = await fetch(`https://graph.instagram.com/v23.0/${data.instagram_id}/media`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${data.access_token}`
            },
            method: 'POST',
            body: JSON.stringify({
                "caption": caption,
                "media_type": "CAROUSEL",
                "children": containerIds.join(',')
            })
        })

        const response = await request.json();

        const request2 = await fetch(`https://graph.instagram.com/v23.0/${data.instagram_id}/media_publish`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${data.access_token}`
            },
            method: 'POST',
            body: JSON.stringify({
                "creation_id": response.id
            })
        });

        const response2 = await request2.json();

        if (response2.id) {
            return NextResponse.json({ success: true }, { status: 200 });
        }

        console.error('Failed to publish:', response2);
        return NextResponse.json({ error: 'Failed to publish post' }, { status: 400 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to publish post' }, { status: 400 });
    }
}