'use client';
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signup } from "@/lib/auth-actions"
import { GoogleButton } from "@/components/google-signup-button"
import { useActionState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useState, useEffect } from "react"
import Link from "next/link";

export function SignupForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
  const [state, formAction] = useActionState(signup, null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (state?.success) {
      setSuccess(true)
    }
  }, [state?.success])

  return (
    <>
    {success ? (
        <div className="min-h-1/3 w-full flex items-center justify-center">
          <div className="w-full text-center space-y-8 bg-white p-8 rounded-2xl shadow-lg">
            <div className="flex flex-col items-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
                <p className="text-gray-600 text-base px-4">
                  We have sent you a verification link.
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <p className="text-sm text-gray-500">
                Didn&apos;t receive an email? Check your spam folder.
              </p>
              <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                <Link href="/login">
                  Go to Login
                </Link>
              </Button>
            </div>
          </div>
        </div>
    ) : (
      <form className={cn("flex flex-col gap-6", className)} action={formAction} {...props}>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Create an account</h1>
          <p className="text-balance text-sm text-muted-foreground">
            Enter your email below to create an account
          </p>
        </div>
        {state?.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        {state?.success && (
          <Alert>
            <AlertDescription>
              Account created successfully! Please check your email to confirm your account before logging in.
            </AlertDescription>
          </Alert>
        )}
        <div className="grid gap-6">
          <div className="flex gap-4">
            <div className="flex flex-col gap-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input id="first-name" type="text" name="first-name" placeholder="John" className="placeholder:opacity-50" required />
            </div>
            <div className="flex flex-col gap-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input id="last-name" type="text" name="last-name" placeholder="Pork" className="placeholder:opacity-50" required />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" name="email" placeholder="john@growbyte.cz" className="placeholder:opacity-50" required />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
            </div>
            <Input id="password" type="password" name="password" placeholder="••••••••" className="placeholder:opacity-50" required />
          </div>
          <Button type="submit" className="w-full hover:bg-blue-500">
            Create an account
          </Button>
          <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
            <span className="relative z-10 px-2 text-muted-foreground bg-slate-100">
              Or continue with
            </span>
          </div>
          <GoogleButton />
        </div>
        <div className="text-center text-sm">
          Already have an account?{" "}
          <a href="/login" className="underline underline-offset-4">
            Login
          </a>
        </div>
      </form>
    )}
    </>
  )
}
