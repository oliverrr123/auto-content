import { NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

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