"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

type AuthState = {
  error?: string
  success?: boolean
}

export async function login(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  const email = formData.get('email') as string // fix typecasting
  const password = formData.get('password') as string // fix typecasting
  const supabase = await createClient();

  const { error, data } = await supabase.auth.signInWithPassword({email, password});

  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    await supabase.auth.getSession();
    return { success: true }
  }

  return { error: 'Something went wrong. Please try again.' }
}

export async function signup(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  const email = formData.get('email') as string // fix typecasting
  const password = formData.get('password') as string // fix typecasting
  const firstName = formData.get('first-name') as string // fix typecasting
  const lastName = formData.get('last-name') as string // fix typecasting
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
    }
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
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