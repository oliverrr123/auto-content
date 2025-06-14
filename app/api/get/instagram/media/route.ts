import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { mediaId } = await req.json();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
        .from('instagram')
        .select('access_token')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error(error);
        return NextResponse.json({ error: "Instagram not connected" }, { status: 400 });
    }

    const response = await fetch(`https://graph.instagram.com/v23.0/${mediaId}?fields=caption,media_url,thumbnail_url,media_type,permalink&access_token=${data.access_token}`)
    const responseData = await response.json();

    if (!responseData.thumbnail_url) {
        return NextResponse.json({ media_url: responseData.media_url, caption: responseData.caption, media_type: responseData.media_type, permalink: responseData.permalink });
    } else {
        return NextResponse.json({ media_url: responseData.thumbnail_url, caption: responseData.caption, media_type: responseData.media_type, permalink: responseData.permalink });
    }
}