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

        console.log(post);

        if (error) {
            throw error;
        }

        // Ensure scheduledDate is a proper Date object
        const scheduleDateTime = new Date(scheduledDate);

        const response = await fetch('https://api.cron-job.org/jobs', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.CRONJOB_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                job: {
                    url: 'https://growbyte.cz/api/post/instagram/schedule-action',
                    enabled: true,
                    saveResponses: true,
                    requestMethod: 1,
                    headers: [
                        { 'Content-Type': 'application/json' }
                    ],
                    body: JSON.stringify({ post_id: post.id }),
                    schedule: {
                        timezone: 'UTC',
                        minutes: [scheduleDateTime.getUTCMinutes()],
                        hours: [scheduleDateTime.getUTCHours()],
                        mdays: [scheduleDateTime.getUTCDate()],
                        months: [scheduleDateTime.getUTCMonth() + 1],
                        weekdays: [-1],
                        expiresAt: scheduleDateTime.getTime() + 60000
                    }
                }
            })
        })

        // Check if the response is ok before trying to parse JSON
        if (!response.ok) {
            console.error('Cron job API error:', await response.text());
            throw new Error(`Failed to schedule cron job: ${response.status} ${response.statusText}`);
        }

        // Only try to parse JSON if we have a response
        const responseData = await response.json().catch(err => {
            console.error('Failed to parse cron job response:', err);
            return null;
        });

        if (!responseData) {
            throw new Error('Invalid response from cron job API');
        }

        // const response = await fetch('https://api.cron-job.org/jobs', {
        //     method: 'POST',
        //     headers: {
        //         'Authorization': `Bearer ${process.env.CRONJOB_API_KEY}`,
        //         'Content-Type': 'application/json'
        //     },
        //     body: JSON.stringify({
        //         job: {
        //             url: 'https://api.github.com/repos/oliverrr123/auto-content/actions/workflows/post-instagram.yml/dispatches',
        //             // requestMethod: 4,
        //             headers: [
        //                 { name: 'Authorization', value: `Bearer ${process.env.GITHUB_PAT}` },
        //                 { name: 'Accept', value: 'application/vnd.github.v3+json' },
        //                 { name: 'Content-Type', value: 'application/json' }
        //             ],
        //             body: JSON.stringify({ ref: 'main', inputs: { post_id: post.id } }),
        //             enabled: true,
        //             // saveResponses: false, !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        //             schedule: {
        //                 timezone: 'UTC',
        //                 // minutes: [parseInt(scheduleDate.getUTCMinutes().toString())],
        //                 // hours: [parseInt(scheduleDate.getUTCHours().toString())],
        //                 // mdays: [parseInt(scheduleDate.getUTCDate().toString())],
        //                 // months: [parseInt((scheduleDate.getUTCMonth() + 1).toString())],
        //                 minutes: [35],
        //                 hours: [20],
        //                 mdays: [6],
        //                 months: [6],
        //                 expiresAt: 20250620204000
        //             }
        //         }
        //     })
        // });

        // console.log(response)

        // const cronData = await response.json();

        // console.log(cronData)

        // if (!cronData.jobId) {
        //     return NextResponse.json({ success: false, error: 'Failed to create cron job' }, { status: 400 });
        // }

        console.log(responseData);
        
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: 'Failed to schedule post' }, { status: 400 });
    }
}