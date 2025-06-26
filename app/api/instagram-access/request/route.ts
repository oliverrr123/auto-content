import { NextRequest, NextResponse } from "next/server";
import nodemailer from 'nodemailer';
import { createClient } from '@/utils/supabase/server';

const transporter = nodemailer.createTransport({
    host: 'smtp.seznam.cz',
    port: 465,
    secure: true,
    auth: {
        user: process.env.GROWBYTE_EMAIL_CLIENT,
        pass: process.env.GROWBYTE_EMAIL_PASSWORD
    }
});


export async function POST(request: NextRequest) {
    try {
        const { username } = await request.json();
    
        if (!username) {
            return NextResponse.json({ error: 'Username is required' }, { status: 400 });
        }

        const supabase = await createClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (!user || userError) {
            return NextResponse.json({ error: userError?.message }, { status: 500 })
        }

        const { error } = await supabase.from('profiles').update({
            instagram_access: 'pending'
        }).eq('id', user.id);

        if (error) {
            return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
        }
    
        const mailOptions = {
            from: process.env.GROWBYTE_EMAIL_CLIENT,
            to: process.env.ADMIN_EMAIL,
            subject: 'Instagram Access Request',
            html: `
                <p>User @${username} has requested access to Instagram.</p>
                <p>Please review and approve or deny the request.</p>
            `
        }
    
        await transporter.sendMail(mailOptions);
    
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error sending email:', error);
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
}