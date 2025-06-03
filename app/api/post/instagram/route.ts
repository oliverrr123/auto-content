import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Step 1: Create media containers
async function createMediaContainers(instagramId: string, accessToken: string, files: string[]) {
    const containerIds = [];
    
    for (const fileURL of files) {
        const request = await fetch(`https://graph.instagram.com/v23.0/${instagramId}/media`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            method: 'POST',
            body: JSON.stringify({
                "image_url": fileURL,
                "is_carousel_item": true
            })
        });

        const response = await request.json();
        if (!response.id) {
            throw new Error('Failed to create media container');
        }
        containerIds.push(response.id);
    }
    
    return containerIds;
}

// Step 2: Create carousel
async function createCarousel(instagramId: string, accessToken: string, containerIds: string[], caption: string) {
    const request = await fetch(`https://graph.instagram.com/v23.0/${instagramId}/media`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        method: 'POST',
        body: JSON.stringify({
            "caption": caption,
            "media_type": "CAROUSEL",
            "children": containerIds.join(',')
        })
    });

    const response = await request.json();
    if (!response.id) {
        throw new Error('Failed to create carousel');
    }
    return response.id;
}

// Step 3: Publish carousel
async function publishCarousel(instagramId: string, accessToken: string, creationId: string) {
    const request = await fetch(`https://graph.instagram.com/v23.0/${instagramId}/media_publish`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        method: 'POST',
        body: JSON.stringify({
            "creation_id": creationId
        })
    });

    const response = await request.json();
    if (!response.id) {
        throw new Error('Failed to publish carousel');
    }
    return response.id;
}

export async function POST(req: NextRequest) {
    try {
        const { caption, files, step = 1, containerIds = [], carouselId = '' } = await req.json();
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data } = await supabase.from('instagram').select('*').eq('id', user.id).single();
        if (!data) {
            return NextResponse.json({ error: 'Instagram account not linked' }, { status: 400 });
        }

        // Get Instagram ID if not provided
        if (!data.instagram_id) {
            const accountCheck = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${data.access_token}`);
            const accountData = await accountCheck.json();
            data.instagram_id = accountData.id;
        }

        switch (step) {
            case 1: // Create media containers
                const newContainerIds = await createMediaContainers(data.instagram_id, data.access_token, files);
                return NextResponse.json({ 
                    success: true, 
                    nextStep: 2,
                    containerIds: newContainerIds
                });

            case 2: // Create carousel
                const newCarouselId = await createCarousel(data.instagram_id, data.access_token, containerIds, caption);
                return NextResponse.json({ 
                    success: true, 
                    nextStep: 3,
                    carouselId: newCarouselId
                });

            case 3: // Publish carousel
                const publishedId = await publishCarousel(data.instagram_id, data.access_token, carouselId);
                return NextResponse.json({ 
                    success: true, 
                    complete: true,
                    publishedId
                });

            default:
                return NextResponse.json({ error: 'Invalid step' }, { status: 400 });
        }
    } catch (error) {
        console.error('Instagram posting error:', error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Failed to publish post'
        }, { status: 400 });
    }
}