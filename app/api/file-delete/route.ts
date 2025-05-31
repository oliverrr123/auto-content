import { NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
    try {
        const { files } = await req.json();

        if (!Array.isArray(files)) {
            return NextResponse.json(
                { success: false, error: 'Invalid request format' },
                { status: 400 }
            );
        }

        for (const filename of files) {
            const filepath = path.join(process.cwd(), 'public', 'temp_media', filename)
            try {
                await unlink(filepath);
            } catch (error) {
                console.error(`Failed to delete ${filepath}:`, error);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json(
            { success: false, error: 'Delete failed' },
            { status: 500 }
        )
    }
}