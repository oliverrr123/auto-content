import { NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import { createClient } from '@/utils/supabase/server';

const storage = new Storage({
    projectId: process.env.PROJECT_ID,
    credentials: {
        client_email: process.env.CLIENT_EMAIL,
        private_key: process.env.PRIVATE_KEY,
    },
});

const bucket = storage.bucket(process.env.BUCKET_NAME || "");

export async function POST(req: Request) {
    try {
        // Check authentication
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { fileUrl } = await req.json();

        let fileName;
        try {
            const urlObj = new URL(fileUrl);
            const path = urlObj.pathname;
            
            const parts = path.split('/').filter(Boolean);
            parts.shift();
            fileName = parts.join('/');
        } catch (error) {
            return NextResponse.json({ success: false, error: 'Invalid file URL format ' + error }, { status: 400 });
        }

        if (!fileName) {
            return NextResponse.json({ success: false, error: 'Invalid file URL' }, { status: 400 });
        }

        await bucket.file(fileName).delete();

        return NextResponse.json({ success: true });
    } catch (error) {   
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Delete failed' }, { status: 500 });
    }
}