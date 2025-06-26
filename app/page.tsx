'use client';
import { redirect } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import Link from "next/link"

export default function LandingPage() {
    const { user } = useAuth()

    if (user) {
        redirect("/app")
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen p-4 gap-4">
            <h1 className="text-4xl font-bold">Grow<span className="text-primary font-bold">Byte</span></h1>
            <p className="text-lg text-gray-500 text-center">Automatically create content for your social media!</p>
            <div className="flex gap-4 items-center justify-center">
                <Link href="/login" className="bg-primary text-white px-4 py-2 rounded-md">Login</Link>
                <Link href="/signup" className="bg-white text-primary px-4 py-2 rounded-md">Signup</Link>
            </div>
        </div>
    )
}