import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (!user || userError) {
        return NextResponse.json({ error: userError?.message }, { status: 500 })
    }

    const { data, error } = await supabase.from('profiles').select('instagram_access').eq('id', user.id).single()

    if (error || !data) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ instagram_access: data.instagram_access })
}