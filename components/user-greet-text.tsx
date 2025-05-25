"use client";
import React from "react";
import { useAuth } from "@/context/AuthContext";

export default function UserGreetText() {
    const { user } = useAuth();

    if (user !== null) {
        return (
            <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
                Hello&nbsp;&nbsp;<code className="font-mono font-bold">{user.user_metadata.full_name ?? "user"}!</code>
            </p>
        );
    }
    return (
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
            You&apos;re logged out. Log in to get started.
        </p>
    )
}