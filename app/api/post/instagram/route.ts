import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const FETCH_TIMEOUT = 30000; // 30 seconds timeout

async function fetchWithTimeout(url: string, options: RequestInit = {}, stage: string) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    const startTime = Date.now();
    
    try {
        console.log(`[${stage}] Starting request to: ${url}`);
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        const endTime = Date.now();
        console.log(`[${stage}] Request completed in ${endTime - startTime}ms`);
        
        if (!response.ok) {
            const text = await response.text();
            console.error(`[${stage}] HTTP error! status: ${response.status}, body:`, text);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        const endTime = Date.now();
        console.error(`[${stage}] Request failed after ${endTime - startTime}ms:`, error);
        throw error;
    }
}

export async function POST(req: NextRequest) {
    console.log('Starting Instagram post request');
    const startTime = Date.now();
    
    try {
        const { caption, files } = await req.json();
        console.log(`Received request with ${files.length} files`);
        
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data } = await supabase.from('instagram').select('*').eq('id', user.id).single();

        if (!data) {
            return NextResponse.json({ error: 'Instagram account not linked' }, { status: 400 });
        }

        const containerIds = [];

        // Check account and get Instagram ID
        console.log('Verifying Instagram account...');
        const accountCheck = await fetchWithTimeout(
            `https://graph.instagram.com/me?fields=id,username&access_token=${data.access_token}`,
            {},
            'Account Check'
        );
        const accountData = await accountCheck.json();
        data.instagram_id = accountData.id;
        console.log('Instagram account verified');

        // Create media containers for each file
        console.log('Creating media containers...');
        for (const [index, fileURL] of files.entries()) {
            try {
                console.log(`Processing file ${index + 1}/${files.length}`);
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
                    },
                    `Media Container ${index + 1}`
                );

                const response = await request.json();
                
                if (!response.id) {
                    console.error('Failed to create media container:', response);
                    throw new Error('Failed to create media container: ' + JSON.stringify(response));
                }

                containerIds.push(response.id);
                console.log(`Created media container ${index + 1}/${files.length}`);
            } catch (error) {
                console.error('Error creating media container:', error);
                throw new Error('Failed to create media container');
            }
        }

        // Create carousel container
        console.log('Creating carousel container...');
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
            },
            'Carousel Creation'
        );

        const carouselResponse = await carouselRequest.json();
        
        if (!carouselResponse.id) {
            console.error('Failed to create carousel:', carouselResponse);
            throw new Error('Failed to create carousel: ' + JSON.stringify(carouselResponse));
        }
        console.log('Carousel container created');

        // Publish the carousel
        console.log('Publishing carousel...');
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
            },
            'Publishing'
        );

        const publishResponse = await publishRequest.json();

        if (publishResponse.id) {
            const endTime = Date.now();
            console.log(`Post published successfully in ${endTime - startTime}ms`);
            return NextResponse.json({ success: true }, { status: 200 });
        }

        console.error('Failed to publish:', publishResponse);
        return NextResponse.json({ 
            error: 'Failed to publish post',
            details: publishResponse 
        }, { status: 400 });

    } catch (error) {
        const endTime = Date.now();
        console.error(`Instagram posting error after ${endTime - startTime}ms:`, error);
        return NextResponse.json({ 
            error: 'Failed to publish post',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 400 });
    }
}