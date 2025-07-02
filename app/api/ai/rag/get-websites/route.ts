import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

		const { data: websiteData, error } = await supabase.from('documents').select('id').eq('user_id', user.id).eq('doc_type', 'webpage');

		if (error) {
			return NextResponse.json({ error: 'Error fetching websites' }, { status: 500 });
		}

		if (!websiteData) {
			return NextResponse.json({ error: 'No websites found' }, { status: 404 });
		}

		const websites = [...new Set(websiteData.map((website) => website.id.split(' ||| ')[0]))];

		// websites = websites.map((website) => (website.startsWith('http://') || website.startsWith('https://')) ? website.split('://')[1] : website);
		// websites = websites.map((website) => website.endsWith('/') ? website.slice(0, -1) : website);

		if (websites.length === 0) {
			return NextResponse.json({ websites: [] });
		}

		return NextResponse.json({ websites });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}