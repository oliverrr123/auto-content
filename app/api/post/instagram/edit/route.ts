import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

interface Post {
    id: string;
    user_id: string;
    platform: string;
    params: Array<{
        filetype: string;
        isUploading: boolean;
        taggedPeople: Array<{
            x: number;
            y: number;
            username: string;
        }>;
        signedReadUrl: string;
    }>;
    schedule_params: {
        status: string;
        scheduled_date: string;
    };
    caption: string;
}

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