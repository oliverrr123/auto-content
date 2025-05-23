import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signup } from "@/lib/auth-actions"
import { GoogleButton } from "@/components/google-signup-button"

export function SignupForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold"> Create an account</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Enter your email below to create an account
        </p>
      </div>
      <div className="grid gap-6">
        <div className="flex gap-4">
            <div className="flex flex-col gap-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input id="first-name" type="text" name="first-name" placeholder="John" required />
            </div>
            <div className="flex flex-col gap-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input id="last-name" type="text" name="last-name" placeholder="Doe" required />
            </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" name="email" placeholder="m@example.com" required />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
          </div>
          <Input id="password" type="password" name="password" required />
        </div>
        <Button type="submit" formAction={signup} className="w-full">
          Create an account
        </Button>
        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 bg-background px-2 text-muted-foreground">
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
