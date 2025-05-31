import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const files = formData.getAll('file') as File[];

        const uploadedFiles = [];

        for (const file of files) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const originalExtension = path.extname(file.name);
            const uniqueId = crypto.randomBytes(16).toString('hex');
            const filename = `${uniqueId}${originalExtension}`;

            console.log("CWD: ", process.cwd());

            const filepath = path.join(process.cwd(), 'public', 'temp_media', filename);
            await writeFile(filepath, buffer);

            uploadedFiles.push({
                filename,
                originalName: file.name,
            })
        }

        return NextResponse.json({
            success: true,
            files: uploadedFiles
        })
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { success: false, error: 'Upload failed' },
            { status: 500 }
        );
    }
}