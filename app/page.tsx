"use client";
import Image from "next/image";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, isLoading } = useAuth();

  const [profile, setProfile] = useState<{ username: string, name: string, profilePictureUrl: string } | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  
  const router = useRouter();

  // something

  useEffect(() => {
    if (user) {
      setIsLoadingProfile(true);

      fetch('/api/get/instagram/profile')
        .then(res => res.json())
        .then(data => {
          setProfile(data);
          setIsLoadingProfile(false);
        })
        .catch(err => {
          console.error(err);
          setIsLoadingProfile(false);
        })
    }
  }, [user])

  useEffect(() => {
    if (!user && !isLoading) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || isLoadingProfile) {
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

  if (user && profile) {
    return (
      <div className="flex gap-4 items-center">
        <div>
            <Image src={profile.profilePictureUrl} alt="User Avatar" width={100} height={100} className="rounded-full absolute z-10" />
            <div className="w-[100px] h-[100px] bg-slate-200 rounded-full relative" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{profile.name}</h1>
          <h3 className="text-sm text-gray-500">@{profile.username}</h3>
        </div>
      </div>
    );
  }

  return null
}
