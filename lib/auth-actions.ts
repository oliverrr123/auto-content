"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

type LoginState = {
    error?: 'Email not confirmed' | 'Invalid credentials' | string;
} | null;

type SignupState = {
    error?: 'Email already exists' | string;
    redirect?: string;
} | null;

export async function login(prevState: LoginState, formData: FormData): Promise<LoginState> {
    try {
		const supabase = await createClient();

		const data = {
			email: formData.get("email") as string,
			password: formData.get("password") as string,
		};

		const { error } = await supabase.auth.signInWithPassword(data);

		if (error) {
			if (error.message.includes('Email not confirmed')) {
				return { error: 'Email not confirmed' };
			}
			if (error.message.includes('Invalid login credentials')) {
				return { error: 'Invalid credentials' };
			}
			return { error: error.message };
		}

		revalidatePath("/", "layout");
		redirect("/");
	} catch (error) {
		return { error: error instanceof Error ? error.message : 'An error occurred' };
	}
}

export async function signup(prevState: SignupState, formData: FormData): Promise<SignupState> {
	try {
		const supabase = await createClient();

		const firstName = formData.get("first-name") as string;
		const lastName = formData.get("last-name") as string;
		const email = formData.get("email") as string;

		// Check if email already exists
		const { data: existingUser } = await supabase
			.from('users')
			.select()
			.eq('email', email)
			.single();

		if (existingUser) {
			return { error: 'Email already exists' };
		}

		const data = {
			email,
			password: formData.get("password") as string,
			options: {
				data: {
					full_name: `${firstName} ${lastName}`,
					email,
				},
			},
		};

		const { error } = await supabase.auth.signUp(data);

		if (error) {
			return { error: error.message };
		}

		return { redirect: '/signup/success' };
	} catch (error) {
		return { error: error instanceof Error ? error.message : 'An error occurred' };
	}
}

export async function signout() {
	const supabase = await createClient();
	const { error } = await supabase.auth.signOut();
	if (error) {
		console.error(error);
		redirect("/error");
	}

	redirect("/logout");
}

export async function signInWithGoogle() {
	const supabase = await createClient();
	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: "google",
		options: {
			queryParams: {
			access_type: "offline",
			prompt: "consent",
			},
		},
	});

	if (error) {
		console.error(error);
		redirect("/error");
	}

	redirect(data.url);
}