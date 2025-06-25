import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
    try {
        const { postData } = await request.json();

        if (!postData) {
            return NextResponse.json({ error: "No data provided" }, { status: 400 });
        }

        const supabase = await createClient();

        const { data, error } = await supabase
            .from('posts')
            .select('job_id')
            .eq('id', postData.id)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        if (!data) {
            return NextResponse.json({ error: "Job id not found" }, { status: 404 });
        }

        const response = await fetch(`https://api.cron-job.org/jobs/${data.job_id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${process.env.CRONJOB_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            return NextResponse.json({ error: "Failed to delete cron job" }, { status: 400 });
        }

        const { error: deleteError } = await supabase
            .from('posts')
            .delete()
            .eq('id', postData.id)

        if (deleteError) {
            return NextResponse.json({ error: deleteError.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting post:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}