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
if (!bucketName) {
    console.error('BUCKET_NAME environment variable is not set');
    process.exit(1);
}
console.log('Initializing with bucket name:', bucketName);
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
            console.log('Starting file cleanup process...');
            console.log('Number of files to process:', uploadedFiles.length);
            
            for (const file of uploadedFiles) {
                try {
                    console.log('\n--- Processing file ---');
                    console.log('Original signed URL:', file.signedReadUrl);
                    
                    const urlObj = new URL(file.signedReadUrl);
                    console.log('Parsed URL object:', {
                        protocol: urlObj.protocol,
                        hostname: urlObj.hostname,
                        pathname: urlObj.pathname
                    });
                    
                    const path = decodeURIComponent(urlObj.pathname);
                    console.log('Decoded pathname:', path);
                    
                    const parts = path.split('/').filter(Boolean);
                    console.log('Path parts before shift:', parts);
                    
                    parts.shift();
                    console.log('Path parts after shift:', parts);
                    
                    const fileName = parts.join('/');
                    console.log('Constructed final fileName:', fileName);
                    console.log('Bucket name being used:', bucketName);

                    // List files with prefix to debug
                    console.log('Listing files with same prefix...');
                    const [files] = await bucket.getFiles({ prefix: parts[0] });
                    console.log('Found files with same prefix:', files.map(f => f.name));

                    console.log('Attempting to delete file:', fileName);
                    
                    // Check if file exists before trying to delete
                    console.log('Checking if file exists...');
                    const [exists] = await bucket.file(fileName).exists();
                    console.log('File exists check result:', exists);
                    
                    if (!exists) {
                        console.log(`File ${fileName} does not exist in bucket, skipping deletion`);
                        continue;
                    }
                    
                    console.log('File exists, proceeding with deletion...');
                    await bucket.file(fileName).delete();
                    console.log(`Successfully deleted file: ${fileName}`);
                } catch (error) {
                    console.error('Error details:', {
                        message: error.message,
                        code: error.code,
                        stack: error.stack
                    });
                    console.error('Error deleting file:', file.signedReadUrl);
                    // Continue with other files even if one fails
                    continue;
                }
            }
            console.log('\nFile cleanup process completed.');
        } else {
            console.error('Error publishing container:', publishContainerData);
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