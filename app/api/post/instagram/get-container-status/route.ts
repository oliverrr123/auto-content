import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
    const { containerId } = await req.json();
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
        const request = await fetch(`https://graph.instagram.com/v23.0/${containerId}?fields=status_code,status&access_token=${data.access_token}`);

        const response = await request.json();

        return NextResponse.json({ status_code: response.status_code, status: response.status }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to get container id' }, { status: 400 });
    }
}