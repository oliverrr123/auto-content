'use client';
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signup } from "@/lib/auth-actions"
import { GoogleButton } from "@/components/google-signup-button"
import { useActionState } from 'react'
import { Alert, AlertDescription } from "./ui/alert"
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function SignupForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
  const [state, formAction] = useActionState(signup, null)
  const router = useRouter()

  useEffect(() => {
    if (state?.redirect) {
      router.push(state.redirect)
    }
  }, [state, router])

  return (
    <form className={cn("flex flex-col gap-6", className)} action={formAction} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold"> Create an account</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Enter your email below to create an account
        </p>
      </div>
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>
            {state.error === 'Email already exists' 
              ? 'An account with this email already exists. Please log in instead.'
              : state.error}
          </AlertDescription>
        </Alert>
      )}
      <div className="grid gap-6">
        <div className="flex gap-4">
            <div className="flex flex-col gap-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input id="first-name" type="text" name="first-name" placeholder="John" required />
            </div>
            <div className="flex flex-col gap-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input id="last-name" type="text" name="last-name" placeholder="Pork" required />
            </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" name="email" placeholder="john@growbyte.cz" required />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
          </div>
          <Input id="password" type="password" name="password" placeholder="••••••••" required />
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
  )
}
