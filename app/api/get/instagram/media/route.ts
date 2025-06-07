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
        .select('access_token')
        .eq('id', user.id)
        .single();

    if (error) {
        console.log(error);
        return NextResponse.json({ error: "Instagram not connected" }, { status: 400 });
    }

    const responseMedia = await fetch(`https://graph.instagram.com/v23.0/9742630855805665?fields=media&access_token=${data.access_token}`)
    const mediaData = await responseMedia.json();

    let mediaArray = [];

    for (const item of mediaData.media.data) {
        const responseMediaItem = await fetch(`https://graph.instagram.com/v23.0/${item.id}?fields=caption,media_url,thumbnail_url,media_type&access_token=${data.access_token}`)
        const mediaItemData = await responseMediaItem.json();
        if (!mediaItemData.thumbnail_url) {
            mediaArray.push({ media_url: mediaItemData.media_url, caption: mediaItemData.caption, media_type: mediaItemData.media_type })
        } else {
            mediaArray.push({ media_url: mediaItemData.thumbnail_url, caption: mediaItemData.caption, media_type: mediaItemData.media_type })
        }
    }

    console.log("--------------------------------");
    console.log(mediaArray);
    console.log("--------------------------------");

    return NextResponse.json({ mediaArray });
}