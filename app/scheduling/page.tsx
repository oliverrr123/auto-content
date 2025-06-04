"use client";
import InDevelopment from "@/components/in-development";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Scheduling() {
    const { user, isLoading } = useAuth();

    const router = useRouter();

    useEffect(() => {
        if (!user && !isLoading) {
            router.push('/login');
        }
    }, [user, isLoading, router]);


    if (!user) {
        return null;
    }

    return (
        <InDevelopment />
    )
}