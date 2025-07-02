import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
    try {
		const { url } = await req.json();

		if (!url) {
			return NextResponse.json({ error: 'URL is required' }, { status: 400 });
		}

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

		const { error } = await supabase
			.from('documents')
			.delete()
			.eq('user_id', user.id)
			.eq('doc_type', 'webpage')
			.ilike('id', `${url}%`);

		if (error) {
			return NextResponse.json({ error: 'Error deleting website' }, { status: 500 });
		}

		return NextResponse.json({ message: 'Website deleted successfully' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}