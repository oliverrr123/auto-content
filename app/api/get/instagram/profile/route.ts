import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    
    const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('instagram_id')
    .eq('id', user.id)
    .single();

    if (profileError || !profile?.instagram_id) {
        return NextResponse.json({ error: "Instagram not connected" }, { status: 400 });
    }

    console.log(profile.instagram_id);

    // Then get instagram data using the bigint ID
    const { data: instagram, error: instagramError } = await supabase
        .from('instagram')
        .select('*')

    if (instagramError) {
        console.log(instagramError);
        return NextResponse.json({ error: "Error fetching instagram data" }, { status: 500 });
    }

    console.log('Query result:', instagram);
    console.log('Query error:', instagramError);

    return NextResponse.json(instagram);

    // const responseGetUserInfo = await fetch(`https://graph.instagram.com/v22.0/me?fields=username,name,profile_picture_url&access_token=${longLivedAccessToken}`)

    // const userInfo = await responseGetUserInfo.json();

    // const username = userInfo.username;
    // const name = userInfo.name;
    // const profilePictureUrl = userInfo.profile_picture_url;

}