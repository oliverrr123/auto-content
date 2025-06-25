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
                        timezone: 'UTC',
                        expiresAt: parseInt(scheduleDateTime.getFullYear() +
                            (scheduleDateTime.getMonth() + 1).toString().padStart(2, '0') +
                            scheduleDateTime.getDate().toString().padStart(2, '0') +
                            scheduleDateTime.getHours().toString().padStart(2, '0') +
                            (scheduleDateTime.getMinutes() + 1).toString().padStart(2, '0') +
                            '00'),
                        hours: [scheduleDateTime.getHours()],
                        mdays: [scheduleDateTime.getDate()],
                        minutes: [scheduleDateTime.getMinutes()],
                        months: [scheduleDateTime.getMonth() + 1],
                        wdays: [-1]
                    }
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Cron job API error:', errorText);
            throw new Error(`Failed to schedule cron job: ${response.status} ${response.statusText}`);
        }

        const responseData = await response.json();
        
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: 'Failed to schedule post' }, { status: 400 });
    }
}