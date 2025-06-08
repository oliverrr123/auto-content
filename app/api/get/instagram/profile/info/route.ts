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

    const accountCheck = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${data.access_token}`);
    const accountData = await accountCheck.json();
    
    const response = await fetch(`https://graph.instagram.com/v23.0/${accountData.id}?fields=username,name,profile_picture_url,biography&access_token=${data.access_token}`)
    const userData = await response.json();
    
    const username = userData.username;
    const name = userData.name;
    const profilePictureUrl = userData.profile_picture_url;
    const biography = userData.biography;
    
    return NextResponse.json({ username, name, profilePictureUrl, biography });
}