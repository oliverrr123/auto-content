import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        // Log the raw request body for debugging
        const rawBody = await req.text();
        console.log('Raw request body:', rawBody);

        // Try to parse the JSON
        let data;
        try {
            data = JSON.parse(rawBody);
        } catch (error) {
            const parseError = error as Error;
            console.error('JSON parse error:', parseError);
            return NextResponse.json({ 
                success: false, 
                error: `Invalid JSON in request body: ${parseError.message}`,
                receivedBody: rawBody
            }, { status: 400 });
        }

        const post_id = data.post_id;
        
        if (!post_id) {
            return NextResponse.json({ 
                success: false, 
                error: 'No post_id provided in request' 
            }, { status: 400 });
        }

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
            error: 'Failed to process request: ' + (error instanceof Error ? error.message : 'Unknown error') 
        }, { status: 500 });
    }
}