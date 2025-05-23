"use client";
import Image from "next/image";
import LoginLogoutButton from "@/components/login-logout-button";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex gap-4 items-center">
        <Skeleton className="rounded-full w-[100px] h-[100px]" />
        <div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32 mt-2" />
        </div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="flex gap-4 items-center">
        <div>
          <Image src={user.user_metadata.avatar_url} alt="User Avatar" width={100} height={100} className="rounded-full absolute z-10" />
          <div className="w-[100px] h-[100px] bg-slate-200 rounded-full relative" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Forbes</h1>
          <h3 className="text-sm text-gray-500">News & media website</h3>
        </div>
      </div>
    );
  }
  return (
    <LoginLogoutButton />
  );
}
