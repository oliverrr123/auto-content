import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
    const { uploadedFiles, caption, scheduledDate, scheduledTime } = await req.json();
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
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: post, error } = await supabase
            .from('posts')
            .insert({
                user_id: user.id,
                platform: 'instagram',
                params: uploadedFiles,
                caption: caption,
                schedule_params: {
                    scheduled_date: scheduledDate,
                    scheduled_time: scheduledTime,
                    status: 'scheduled'
                }

            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        const response = { id: post.id };

        
        return NextResponse.json({ id: response.id }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to get container id' }, { status: 400 });
    }
}