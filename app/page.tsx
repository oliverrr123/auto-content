"use client";
import Image from "next/image";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

export default function Home() {
  const { user, isLoading } = useAuth();

  const [profile, setProfile] = useState<{ username: string, name: string, profilePictureUrl: string, biography: string } | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const [media, setMedia] = useState<{ media_url: string, media_type: string, caption: string }[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);

  const router = useRouter();

  // something

  useEffect(() => {
    if (user) {
      setIsLoadingProfile(true);

      fetch('/api/get/instagram/profile/info')
        .then(res => res.json())
        .then(data => {
          setProfile(data);
          setIsLoadingProfile(false);
        })
        .catch(err => {
          console.error(err);
          setIsLoadingProfile(false);
        })

      fetch('/api/get/instagram/profile/media')
        .then(res => res.json())
        .then(data => {
          setMedia(data.mediaArray);
          setIsLoadingMedia(false);
        })
        .catch(err => {
          console.error(err);
          setIsLoadingMedia(false);
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
      <div className="flex flex-col gap-4">
        <div className="flex gap-4 items-center">
          <Skeleton className="rounded-full w-[100px] h-[100px]" />
          <div>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-3 w-32 mt-2" />
          </div>
        </div>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-8 w-full" />
        <div className="grid grid-cols-3 w-dvw -translate-x-4 gap-[1px] pb-20">
          <Skeleton className="aspect-[4/5] w-full rounded-none" />
          <Skeleton className="aspect-[4/5] w-full rounded-none" />
          <Skeleton className="aspect-[4/5] w-full rounded-none" />
          <Skeleton className="aspect-[4/5] w-full rounded-none" />
        </div>
      </div>
    )
  }

  if (user && profile && !isLoadingProfile) {
    return (
      <div className="flex flex-col gap-4">
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
        <div>
          <p style={{ whiteSpace: 'pre-wrap' }}>{profile.biography}</p>
        </div>
        <Link href='/create-post'>
          <Button className="w-full font-semibold text-md hover:bg-blue-500 flex gap-1 items-center justify-center [&_svg]:!size-5">
            <PlusIcon />
            New Post
          </Button>
        </Link>
        {media && !isLoadingMedia && media.length > 0 ? (
          <div className="grid grid-cols-3 w-dvw -translate-x-4 gap-[1px] pb-20">
            {media.map((mediaItem) => (
              <div key={mediaItem.media_url} className="aspect-[4/5] w-full relative bg-black border-white">
                {mediaItem.media_type === 'VIDEO' ? (
                  <Image 
                    src={mediaItem.media_url} 
                    fill
                    className="object-cover"
                    alt="Media" 
                  />
                ) : (
                  <Image 
                    src={mediaItem.media_url} 
                    fill
                    className="object-contain"
                    alt="Media" 
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 w-dvw -translate-x-4 gap-[1px] pb-20">
            <Skeleton className="aspect-[4/5] w-full rounded-none" />
            <Skeleton className="aspect-[4/5] w-full rounded-none" />
            <Skeleton className="aspect-[4/5] w-full rounded-none" />
            <Skeleton className="aspect-[4/5] w-full rounded-none" />
          </div>
        ) }
      </div>
    );
  }

  return null
}
