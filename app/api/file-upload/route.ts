import { NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import crypto from 'crypto';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
    try {
        // Check authentication
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const fileData = formData.getAll('file');
        const files = fileData.map(data => JSON.parse(data.toString()) as { filename: string, filetype: string });

        const credentials = {
            type: process.env.TYPE,
            project_id: process.env.PROJECT_ID,
            private_key_id: process.env.PRIVATE_KEY_ID,
            private_key: process.env.PRIVATE_KEY,
            client_email: process.env.CLIENT_EMAIL,
            client_id: process.env.CLIENT_ID,
            auth_uri: process.env.AUTH_URI,
            token_uri: process.env.TOKEN_URI,
            auth_provider_x509_cert_url: process.env.AUTH_PROVIdER_X509_CERT_URL,
            client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
            universe_domain: process.env.UNIVERSE_DOMAIN,
        };

        const storage = new Storage({ credentials });
        const bucketName = process.env.BUCKET_NAME || "";

        const signedWriteUrls: { signedWriteUrl: string, filetype: string }[] = [];
        const signedReadUrls: { signedReadUrl: string, filetype: string }[] = [];

        const folderName = crypto.randomBytes(16).toString('hex');

        for (const file of files) {
            const bucketFile = storage.bucket(bucketName).file(`${folderName}/${file.filename}`)

            const [signedWriteUrl] = await bucketFile.getSignedUrl({
                action: 'write',
                expires: Date.now() + 1000 * 60,
                contentType: file.filetype
            })

            const [signedReadUrl] = await bucketFile.getSignedUrl({
                action: 'read',
                expires: Date.now() + 1000 * 60 * 60 * 24 * 30
            })

            signedWriteUrls.push({ signedWriteUrl, filetype: file.filetype });
            signedReadUrls.push({ signedReadUrl, filetype: file.filetype });
        }

        return NextResponse.json({
            success: true,
            signedWriteUrls,
            signedReadUrls
        })
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { success: false, error: 'Upload failed' },
            { status: 500 }
        );
    }
}