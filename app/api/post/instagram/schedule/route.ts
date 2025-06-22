import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
    const { uploadedFiles, caption, scheduledDate } = await req.json();
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data } = await supabase.from('instagram').select('*').eq('id', user.id).single();

    if (!data) {
        return NextResponse.json({ success: false, error: 'Instagram account not linked' }, { status: 400 });
    }

    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
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
                    status: 'scheduled'
                }
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        // Ensure scheduledDate is a proper Date object
        const scheduleDateTime = new Date(scheduledDate);

        const response = await fetch('https://api.cron-job.org/jobs', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${process.env.CRONJOB_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                job: {
                    url: `https://growbyte.cz/api/post/instagram/schedule-action?post_id=${post.id}`,
                    headers: [
                        { name: 'Content-Type', value: 'application/json' }
                    ],
                    requestMethod: 1,
                    enabled: true,
                    saveResponses: true,
                    schedule: {
                        timezone: 'Europe/Berlin',
                        expiresAt: 0,
                        hours: [scheduleDateTime.getHours()],
                        mdays: [scheduleDateTime.getDate()],
                        minutes: [scheduleDateTime.getMinutes()],
                        months: [scheduleDateTime.getMonth() + 1],
                        wdays: [-1]
                    }
                }
            })
        });

        // Check if the response is ok before trying to parse JSON
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Cron job API error:', errorText);
            throw new Error(`Failed to schedule cron job: ${response.status} ${response.statusText}`);
        }

        const responseData = await response.json();
        console.log('Cron job created:', responseData);
        
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Failed to schedule post'
        }, { status: 400 });
    }
}