const { createClient } = require('@supabase/supabase-js');
const { Storage } = require('@google-cloud/storage');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const storage = new Storage({
    projectId: process.env.PROJECT_ID,
    credentials: {
        client_email: process.env.CLIENT_EMAIL,
        private_key: (process.env.PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    },
});

const bucketName = "autocontent-file-upload";
const bucket = storage.bucket(bucketName);

async function run() {
    const postId = process.env.POST_ID;

    const { data, error } = await supabase.from('posts').select('*').eq('id', postId).single();

    if (error) {
        console.error('Error fetching post:', error);
        process.exit(1);
    }

    if (!data) {
        console.error('No post found with ID:', postId);
        process.exit(1);
    }

    const userId = data.user_id;
    const caption = data.caption;
    const uploadedFiles = data.params;
    const scheduleParams = data.schedule_params;

    const { data: instagramData, error: instagramError } = await supabase
        .from('instagram')
        .select('access_token, instagram_id')
        .eq('id', userId)
        .single();

    if (instagramError) {
        console.error('Error fetching Instagram credentials:', instagramError);
        process.exit(1);
    }

    if (!instagramData) {
        console.error('No Instagram credentials found for user:', userId);
        process.exit(1);
    }

    const { access_token, instagram_id } = instagramData;

    if (!access_token || !instagram_id) {
        console.error('Missing required Instagram credentials. Access token or ID not found.');
        process.exit(1);
    }

    const accountCheck = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${access_token}`);
    const accountData = await accountCheck.json();

    const new_instagram_id = accountData.id;

    if (scheduleParams.status !== 'scheduled' || new Date(scheduleParams.scheduled_date).toISOString().split('T')[0] !== new Date().toISOString().split('T')[0]) {
        console.error(`Post is not scheduled or scheduled for a different day: ${scheduleParams.status} ${scheduleParams.scheduled_date} ${new Date().toISOString().split('T')[0]}`);
        process.exit(1);
    }

    try {
        let containerId;
        if (uploadedFiles.length > 1) {
            const containerIds = [];
            for (const file of uploadedFiles) {
                let response;
                if (file.filetype === 'video/mp4' || file.filetype === 'video/mov' || file.filetype === 'video/quicktime') {
                    response = await fetch(`https://graph.instagram.com/v23.0/${new_instagram_id}/media`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${access_token}`
                        },
                        method: 'POST',
                        body: JSON.stringify({
                            "video_url": file.signedReadUrl,
                            "is_carousel_item": true,
                            "user_tags": file.taggedPeople.map((user) => ({ 'username': user.username }))
                        })
                    });
                } else {
                    response = await fetch(`https://graph.instagram.com/v23.0/${new_instagram_id}/media`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${access_token}`
                        },
                        method: 'POST',
                        body: JSON.stringify({
                            "image_url": file.signedReadUrl,
                            "is_carousel_item": true,
                            "user_tags": file.taggedPeople.map((user) => ({ 'username': user.username, x: user.x, y: user.y}))
                        })
                    });
                }

                if (!response.ok) {
                    console.error(`Instagram API error 1: ${response.status} ${response.statusText}`);
                    process.exit(1);
                }

                const data = await response.json();
                containerIds.push(data.id);
            }

            const response = await fetch(`https://graph.instagram.com/v23.0/${new_instagram_id}/media`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${access_token}`
                },
                method: 'POST',
                body: JSON.stringify({
                    "caption": caption,
                    "media_type": "CAROUSEL",
                    "children": containerIds.join(',')
                })
            });

            if (!response.ok) {
                console.error(`Instagram API error 2: ${response.status} ${response.statusText}`);
                process.exit(1);
            }
    
            const containerIdData = await response.json();
            containerId = containerIdData.id;
        } else {
            let response;
            if (uploadedFiles[0].filetype === 'video/mp4' || uploadedFiles[0].filetype === 'video/mov' || uploadedFiles[0].filetype === 'video/quicktime') {
                response = await fetch(`https://graph.instagram.com/v23.0/${new_instagram_id}/media`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${access_token}`
                    },
                    method: 'POST',
                    body: JSON.stringify({
                        "video_url": uploadedFiles[0].signedReadUrl,
                        "caption": caption,
                        "media_type": "REELS",
                        "user_tags": uploadedFiles[0].taggedPeople.map((user) => ({ 'username': user.username }))
                    })
                });
            } else {
                response = await fetch(`https://graph.instagram.com/v23.0/${new_instagram_id}/media`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${access_token}`
                    },
                    method: 'POST',
                    body: JSON.stringify({
                        "image_url": uploadedFiles[0].signedReadUrl,
                        "caption": caption,
                        "user_tags": uploadedFiles[0].taggedPeople.map((user) => ({ 'username': user.username, x: user.x, y: user.y}))
                    })
                });
            }

            if (!response.ok) {
                console.error(`Instagram API error 3: ${response.status} ${response.statusText}`);
                process.exit(1);
            }

            const containerIdData = await response.json();
            containerId = containerIdData.id;
        }
    
        for (const file of uploadedFiles) {
            if (file.filetype === 'video/mp4' || file.filetype === 'video/mov' || file.filetype === 'video/quicktime') {
                let status = 'IN_PROGRESS';
    
                while (status === 'IN_PROGRESS') {
                    const statusResponse = await fetch(`https://graph.instagram.com/v23.0/${containerId}?fields=status_code,status&access_token=${access_token}`);
                    
                    if (!statusResponse.ok) {
                        console.error(`Instagram API error 4: ${statusResponse.status} ${statusResponse.statusText}`);
                        process.exit(1);
                    }

                    const statusData = await statusResponse.json();
                    status = statusData.status_code;
    
                    if (status === 'ERROR') {
                        console.error('Error processing video:', statusData);
                        process.exit(1);
                    }

                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        }
    
        const publishContainerResponse = await fetch(`https://graph.instagram.com/v23.0/${new_instagram_id}/media_publish`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${access_token}`
            },
            method: 'POST',
            body: JSON.stringify({
                "creation_id": containerId
            })
        });

        if (!publishContainerResponse.ok) {
            console.error(`Instagram API error 5: ${publishContainerResponse.status} ${publishContainerResponse.statusText}`);
            process.exit(1);
        }
    
        const publishContainerData = await publishContainerResponse.json();
    
        if (publishContainerData.id) {
            for (const file of uploadedFiles) {
                try {
                    const urlObj = new URL(file.signedReadUrl);
                    const path = decodeURIComponent(urlObj.pathname);
                    const parts = path.split('/').filter(Boolean);
                    parts.shift();
                    const fileName = parts.join('/');
                    const [exists] = await bucket.file(fileName).exists();
                    
                    if (!exists) {
                        continue;
                    }

                    await bucket.file(fileName).delete();
                } catch (error) {
                    console.error('Error during file deletion:', error);
                    process.exit(1);
                }
            }
        } else {
            console.error('Error publishing container:', publishContainerData);
            process.exit(1);
        }

        const response = await fetch(`https://api.cron-job.org/jobs/${data.job_id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${process.env.CRONJOB_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('Error deleting cron job:', response.statusText);
            process.exit(1);
        }
    
    } catch (error) {
        console.error('Error during publish:', error);
        process.exit(1);
    }

    scheduleParams.status = 'posted';
    await supabase.from('posts').update({ schedule_params: scheduleParams }).eq('id', postId);
}

run().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
});