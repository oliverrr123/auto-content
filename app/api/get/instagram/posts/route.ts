import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)

    if (error) {
        console.error(error);
        return NextResponse.json({ error: "Instagram not connected" }, { status: 400 });
    }

    return NextResponse.json({ posts: data });
}