import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

		const { error: error1 } = await supabase
			.from('documents')
			.delete()
			.eq('user_id', user.id)
			.in('doc_type', ['instagram_post', 'instagram_profile']);

		if (error1) {
			return NextResponse.json({ error: 'Error deleting instagram' }, { status: 500 });
		}

		const { error: error2 } = await supabase
			.from('instagram')
			.delete()
			.eq('id', user.id)

		if (error2) {
			return NextResponse.json({ error: 'Error deleting instagram' }, { status: 500 });
		}

		return NextResponse.json({ message: 'Instagram deleted successfully' });
    } catch (error) {
        console.error('Error in delete-instagram route:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}