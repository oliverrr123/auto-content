import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
    const postId = request.nextUrl.searchParams.get('postId');

    const supabase = await createClient();

    const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();

    if (!data) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (error) {
        console.error(error);
        return NextResponse.json({ error: "Instagram not connected" }, { status: 400 });
    }

    return NextResponse.json({ post: data });
}