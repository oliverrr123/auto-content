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
        .update(postData)
        .eq('id', postData.id)

    if (!data || error) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post: data });
}