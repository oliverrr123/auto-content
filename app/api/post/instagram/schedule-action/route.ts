import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        // Try to parse the body, handling both string and JSON input
        const body = await req.text();
        const { post_id } = body.startsWith('{') ? JSON.parse(body) : JSON.parse(body.toString());

        const response = await fetch('https://api.github.com/repos/oliverrr123/auto-content/actions/workflows/post-instagram.yml/dispatches', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GITHUB_PAT}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ref: 'main',
                inputs: { post_id: post_id }
            })
        });

        // GitHub returns 204 No Content for successful workflow dispatch
        if (!response.ok) {
            return NextResponse.json({ 
                success: false, 
                error: `Failed to trigger workflow: ${response.status} ${response.statusText}` 
            }, { status: 500 });
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Error processing request:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Failed to process request' 
        }, { status: 400 });
    }
}