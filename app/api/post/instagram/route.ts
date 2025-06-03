import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const FETCH_TIMEOUT = 30000; // 30 seconds timeout

async function fetchWithTimeout(url: string, options: RequestInit = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

export async function POST(req: NextRequest) {
    const { caption, files } = await req.json();
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data } = await supabase.from('instagram').select('*').eq('id', user.id).single()

    if (!data) {
        return NextResponse.json({ error: 'Instagram account not linked' }, { status: 400 });
    }

    try {
        const containerIds = [];

        // Check account and get Instagram ID
        const accountCheck = await fetchWithTimeout(
            `https://graph.instagram.com/me?fields=id,username&access_token=${data.access_token}`
        );
        const accountData = await accountCheck.json();
        data.instagram_id = accountData.id;

        // Create media containers for each file
        for (const fileURL of files) {
            try {
                const request = await fetchWithTimeout(
                    `https://graph.instagram.com/v23.0/${data.instagram_id}/media`,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${data.access_token}`
                        },
                        method: 'POST',
                        body: JSON.stringify({
                            "image_url": fileURL,
                            "is_carousel_item": true
                        })
                    }
                );

                const response = await request.json();
                
                if (!response.id) {
                    throw new Error('Failed to create media container: ' + JSON.stringify(response));
                }

                containerIds.push(response.id);
            } catch (error) {
                console.error('Error creating media container:', error);
                throw new Error('Failed to create media container');
            }
        }

        // Create carousel container
        const carouselRequest = await fetchWithTimeout(
            `https://graph.instagram.com/v23.0/${data.instagram_id}/media`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${data.access_token}`
                },
                method: 'POST',
                body: JSON.stringify({
                    "caption": caption,
                    "media_type": "CAROUSEL",
                    "children": containerIds.join(',')
                })
            }
        );

        const carouselResponse = await carouselRequest.json();
        
        if (!carouselResponse.id) {
            throw new Error('Failed to create carousel: ' + JSON.stringify(carouselResponse));
        }

        // Publish the carousel
        const publishRequest = await fetchWithTimeout(
            `https://graph.instagram.com/v23.0/${data.instagram_id}/media_publish`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${data.access_token}`
                },
                method: 'POST',
                body: JSON.stringify({
                    "creation_id": carouselResponse.id
                })
            }
        );

        const publishResponse = await publishRequest.json();

        if (publishResponse.id) {
            return NextResponse.json({ success: true }, { status: 200 });
        }

        console.error('Failed to publish:', publishResponse);
        return NextResponse.json({ 
            error: 'Failed to publish post',
            details: publishResponse 
        }, { status: 400 });

    } catch (error) {
        console.error('Instagram posting error:', error);
        return NextResponse.json({ 
            error: 'Failed to publish post',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 400 });
    }
}