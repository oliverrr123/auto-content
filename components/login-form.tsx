'use client';
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login } from "@/lib/auth-actions"
import { GoogleButton } from "@/components/google-login-button"
import { useActionState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useEffect } from "react"

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
  const [state, formAction] = useActionState(login, null)

  useEffect(() => {
    if (state?.success) {
      window.location.href = '/app'
    }
  }, [state?.success])

  return (
    <form className={cn("flex flex-col gap-6", className)} action={formAction} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Login to your account</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Enter your email below to login to your account
        </p>
      </div>
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>
            {state.error === 'Email not confirmed' ? 'Email not confirmed. Please check your email for a verification link.' : state.error}
          </AlertDescription>
        </Alert>
      )}
      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" name="email" placeholder="john@growbyte.cz" required className="placeholder:opacity-50" />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </a>
          </div>
          <Input id="password" type="password" name="password" required placeholder="••••••••" className="placeholder:opacity-50" />
        </div>
        <Button type="submit" className="w-full hover:bg-blue-500">
          Login
        </Button>
        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 px-2 text-muted-foreground bg-slate-100">
            Or continue with
          </span>
        </div>
        <GoogleButton />
      </div>
      <div className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <a href="/signup" className="underline underline-offset-4">
          Sign up
        </a>
      </div>
    </form>
  )
}
