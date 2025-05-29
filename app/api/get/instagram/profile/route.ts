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

    
    const responseGetUserInfo = await fetch(`https://graph.instagram.com/v22.0/me?fields=username,name,profile_picture_url&access_token=${data.access_token}`)
    
    const userInfo = await responseGetUserInfo.json();
    
    const username = userInfo.username;
    const name = userInfo.name;
    const profilePictureUrl = userInfo.profile_picture_url;
    
    return NextResponse.json({ username, name, profilePictureUrl });
}