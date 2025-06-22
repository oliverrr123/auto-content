'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SignupSuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="max-w-md space-y-6">
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="text-muted-foreground">
          We&apos;ve sent you a confirmation email. Please check your inbox and click the verification link to activate your account.
        </p>
        <div className="flex flex-col gap-4">
          <Button asChild variant="outline" className="w-full">
            <Link href="https://gmail.com" target="_blank">
              Open Gmail
            </Link>
          </Button>
          <Button asChild variant="secondary" className="w-full">
            <Link href="/login">
              Go to Login
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 