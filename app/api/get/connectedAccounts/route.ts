import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: instagram } = await supabase
        .from('instagram')
        .select('name, username, profile_picture_url')
        .eq('id', user.id)
        .single();

    console.log({instagram});

    return NextResponse.json({instagram});
}