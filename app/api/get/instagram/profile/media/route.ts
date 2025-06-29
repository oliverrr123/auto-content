import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
        .from('instagram')
        .select('access_token, instagram_id')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error(error);
        return NextResponse.json({ error: "Instagram not connected" }, { status: 400 });
    }

    const accountCheck = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${data.access_token}`);
    const accountData = await accountCheck.json();

    const responseMedia = await fetch(`https://graph.instagram.com/v23.0/${accountData.id}?fields=media&access_token=${data.access_token}`)
    const mediaData = await responseMedia.json();

    const mediaArray = [];

    for (const item of mediaData.media.data) {
        const responseMediaItem = await fetch(`https://graph.instagram.com/v23.0/${item.id}?fields=id,caption,media_url,thumbnail_url,media_type,permalink,timestamp,like_count,comments_count,is_comment_enabled&access_token=${data.access_token}`)
        const mediaItemData = await responseMediaItem.json();
        if (!mediaItemData.thumbnail_url) {
            mediaArray.push({ media_url: mediaItemData.media_url, caption: mediaItemData.caption, media_type: mediaItemData.media_type, permalink: mediaItemData.permalink, timestamp: mediaItemData.timestamp, like_count: mediaItemData.like_count, comments_count: mediaItemData.comments_count })
        } else {
            mediaArray.push({ media_url: mediaItemData.thumbnail_url, caption: mediaItemData.caption, media_type: mediaItemData.media_type, permalink: mediaItemData.permalink, timestamp: mediaItemData.timestamp, like_count: mediaItemData.like_count, comments_count: mediaItemData.comments_count })
        }
    }

    return NextResponse.json({ mediaArray });
}