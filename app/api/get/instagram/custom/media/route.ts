import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	const { parameters } = await req.json();

	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { data, error } = await supabase
		.from('instagram')
		.select('access_token')
		.eq('id', user.id)
		.single();

	if (error) {
		console.error(error);
		return NextResponse.json({ error: 'Instagram not connected' }, { status: 400 });
	}

	const accountCheck = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${data.access_token}`);
	const accountData = await accountCheck.json();

	const responseMedia = await fetch(`https://graph.instagram.com/v23.0/${accountData.id}?fields=media&access_token=${data.access_token}`);
	const mediaData = await responseMedia.json();

	const mediaArray = [];

	for (const item of mediaData.media.data) {
		const response = await fetch(`https://graph.instagram.com/v23.0/${item.id}?fields=${parameters}&access_token=${data.access_token}`);
		const responseData = await response.json();
		mediaArray.push(responseData);
	}

	return NextResponse.json(mediaArray);
}
