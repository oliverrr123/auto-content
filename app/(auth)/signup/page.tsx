'use client';

import Image from "next/image"
import { SignupForm } from "@/components/signup-form"
import { useAuth } from "@/context/AuthContext"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SignupPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !isLoading) {
      router.replace('/app');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <div className="min-h-svh flex items-center justify-center">Loading...</div>;
  }

  if (user) {
    return null; // Will be redirected by the useEffect
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <p className="font-medium">
            Grow<span className="text-primary font-bold">Byte</span>
          </p>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <SignupForm />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <Image
          src="/gradient2.jpg"
          alt="Image"
          fill
          className="object-cover dark:brightness-[0.2] dark:grayscale"
          unoptimized
        />
      </div>
    </div>
  )
}
