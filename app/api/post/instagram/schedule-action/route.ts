import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const { post_id } = await req.json();

    const response = await fetch('https://api.github.com/repos/oliverrr123/auto-content/actions/workflows/post-instagram.yml/dispatches', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.GITHUB_PAT}`,
            'Accept': 'applicataion/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            ref: 'main',
            inputs: { post_id: post_id }
        })
    })

    const responseData = await response.json()

    if (!responseData) {
        return NextResponse.json({ success: false, error: 'Failed to schedule post' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: responseData }, { status: 200 });

}