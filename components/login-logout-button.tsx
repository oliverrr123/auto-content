"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { signout } from "@/lib/auth-actions";
import { useAuth } from "@/context/AuthContext";

export default function LoginLogoutButton() {
    const { user } = useAuth();
    const router = useRouter();

    if (user) {
        return (
            <Button onClick={() => { signout(); }}>Log out</Button>
        )
    }
    return (
        <Button variant="outline" onClick={() => router.push("/login")}>Login</Button>
    )
}