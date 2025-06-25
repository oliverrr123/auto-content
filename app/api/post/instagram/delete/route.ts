import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
    const { postData } = await request.json();

    if (!postData) {
        return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postData.id)
        .select()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data || data.length === 0) {
        return NextResponse.json({ error: "Post not found or no changes were made" }, { status: 404 });
    }

    return NextResponse.json({ post: data[0] });
}