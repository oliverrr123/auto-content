import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
    const { caption, containerIds } = await req.json();
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

        return NextResponse.json({ id: response.id }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to get carousel container id' }, { status: 400 });
    }
}