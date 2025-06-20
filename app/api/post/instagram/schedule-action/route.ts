import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const { post_id } = await req.json();

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
}