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
                    schedule: {
                        timezone: 'UTC',
                        minutes: [scheduledDate.getUTCMinutes()],
                        hours: [scheduledDate.getUTCHours()],
                        mdays: [scheduledDate.getUTCDate()],
                        months: [scheduledDate.getUTCMonth() + 1],
                        expiresAt: scheduledDate.getTime() + 60000
                    }
                }
            })
        })

        const responseData = await response.json();

        console.log(responseData)

        // const scheduleDate = new Date(scheduledDate);
        // // Format expiration date as YYYYMMDDhhmmss (1 minute after scheduled time)
        // const expirationDate = new Date(scheduleDate.getTime() + 60000);
        // const formattedExpiration = Number(
        //     expirationDate.getUTCFullYear().toString() +
        //     String(expirationDate.getUTCMonth() + 1).padStart(2, '0') +
        //     String(expirationDate.getUTCDate()).padStart(2, '0') +
        //     String(expirationDate.getUTCHours()).padStart(2, '0') +
        //     String(expirationDate.getUTCMinutes()).padStart(2, '0') +
        //     String(expirationDate.getUTCSeconds()).padStart(2, '0')
        //   )

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
        
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: 'Failed to schedule post' }, { status: 400 });
    }
}