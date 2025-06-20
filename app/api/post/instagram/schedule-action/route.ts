import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        console.log('Request headers:', Object.fromEntries(req.headers.entries()));
        console.log('Request method:', req.method);
        
        // Try to parse the body, handling both string and JSON input
        const body = await req.text();
        console.log('Received raw body:', body);
        
        if (!body) {
            return NextResponse.json({ 
                success: false, 
                error: 'Empty request body' 
            }, { status: 400 });
        }
        
        let data;
        try {
            data = JSON.parse(body);
        } catch (e) {
            console.log('Failed to parse as JSON, error:', e);
            console.log('Raw body:', body);
            return NextResponse.json({ 
                success: false, 
                error: 'Invalid JSON in request body' 
            }, { status: 400 });
        }
        
        console.log('Parsed data:', data);
        const post_id = data.post_id;
        
        if (!post_id) {
            console.error('No post_id found in request data:', data);
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
            error: 'Failed to process request: ' + (error instanceof Error ? error.message : 'Unknown error') 
        }, { status: 400 });
    }
}