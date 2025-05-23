"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LogoutPage() {
    const router = useRouter();
    useEffect(() => {
        setTimeout(() => router.push("/login"), 2000);
    }, []);
    return <div>You have been logged out. Redirecting to login page...</div>
}