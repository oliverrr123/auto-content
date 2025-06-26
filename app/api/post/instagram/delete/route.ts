import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { Storage } from '@google-cloud/storage';

const storage = new Storage({
    projectId: process.env.PROJECT_ID,
    credentials: {
        client_email: process.env.CLIENT_EMAIL,
        private_key: (process.env.PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    },
});

const bucketName = "autocontent-file-upload";
const bucket = storage.bucket(bucketName);

export async function POST(request: NextRequest) {
    try {
        const { postData } = await request.json();

        if (!postData) {
            return NextResponse.json({ error: "No data provided" }, { status: 400 });
        }

        const supabase = await createClient();

        // First get the post data to access the file URLs
        const { data: post, error: postError } = await supabase
            .from('posts')
            .select('*')
            .eq('id', postData.id)
            .single();

        if (postError) {
            return NextResponse.json({ error: postError.message }, { status: 400 });
        }

        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        // Get the job_id for cron job deletion
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

        // Delete the cron job if it exists
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

        // Delete files from Google Cloud Storage
        const uploadedFiles = post.params;
        for (const file of uploadedFiles) {
            try {
                const urlObj = new URL(file.signedReadUrl);
                const path = decodeURIComponent(urlObj.pathname);
                const parts = path.split('/').filter(Boolean);
                parts.shift(); // Remove the first empty part
                const fileName = parts.join('/');
                
                const [exists] = await bucket.file(fileName).exists();
                if (exists) {
                    await bucket.file(fileName).delete();
                }
            } catch (error) {
                console.error('Error during file deletion:', error);
                // Continue with other files even if one fails
            }
        }

        // Finally delete the post from the database
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