"use client";
import Image from "next/image";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, PlusIcon, ChevronDown, ChevronUp } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const formatDate = (timestamp: string | number) => {
    const date = new Date(typeof timestamp === 'string' ? timestamp : timestamp * 1000);
    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
};

export default function Home() {
  const { user, isLoading } = useAuth();

  const [profile, setProfile] = useState<{ username: string, name: string, profilePictureUrl: string, biography: string } | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const [media, setMedia] = useState<{ media_url: string, media_type: string, caption: string, permalink: string, timestamp: number, like_count: number, comments_count: number }[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);

  // const router = useRouter();

  const [expandedCaptions, setExpandedCaptions] = useState<{ [key: string]: boolean }>({});

  const toggleCaption = (mediaUrl: string) => {
    setExpandedCaptions(prev => ({
      ...prev,
      [mediaUrl]: !prev[mediaUrl]
    }));
  };

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

  // useEffect(() => {
  //   if (!isLoading && !user) {
  //     router.replace('/login');
  //   }
  // }, [user, isLoading, router]);

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
        <div className="grid grid-cols-3 w-dvw -translate-x-4 gap-[1px] pb-16">
          <Skeleton className="aspect-[4/5] w-full rounded-none" />
          <Skeleton className="aspect-[4/5] w-full rounded-none" />
          <Skeleton className="aspect-[4/5] w-full rounded-none" />
          <Skeleton className="aspect-[4/5] w-full rounded-none" />
        </div>
      </div>
    )
  }

  if (user && profile && !isLoadingProfile && media) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex gap-4 items-center">
          <div>
              {profile.profilePictureUrl ? (
                <>
                  <Image src={profile.profilePictureUrl} alt="User Avatar" width={100} height={100} unoptimized className="rounded-full absolute z-10" />
                  <div className="w-[100px] h-[100px] bg-slate-200 rounded-full relative" />
                </>
              ) : (
                <Skeleton className="rounded-full w-[100px] h-[100px]" />
              )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{profile.name}</h1>
            <h3 className="text-sm text-gray-500">@{profile.username}</h3>
          </div>
        </div>
        <div>
          <p style={{ whiteSpace: 'pre-wrap' }}>{profile.biography}</p>
        </div>
        <Link href='/app/create-post'>
          <Button className="w-full font-semibold text-md hover:bg-blue-500 flex gap-1 items-center justify-center [&_svg]:!size-5">
            <PlusIcon />
            New Post
          </Button>
        </Link>
        {media && !isLoadingMedia && media.length > 0 ? (
          <div className="grid grid-cols-3 w-dvw -translate-x-4 gap-[1px] pb-16">
            {media.map((mediaItem) => (
              <Dialog key={mediaItem.media_url}>
              <DialogTrigger>
                <div key={mediaItem.media_url} className="aspect-[4/5] w-full relative bg-black border-white">
                  {mediaItem.media_type === 'VIDEO' ? (
                  <>
                    <Image 
                    src={mediaItem.media_url} 
                    fill
                    className="object-cover aspect-[4/5]"
                    alt="Media" 
                    unoptimized
                    />
                    <svg aria-label="Clip" fill="white" height="20" role="img" viewBox="0 0 24 24" width="20" className="absolute top-2 right-2">
                    <title>Clip</title>
                    <path d="m12.823 1 2.974 5.002h-5.58l-2.65-4.971c.206-.013.419-.022.642-.027L8.55 1Zm2.327 0h.298c3.06 0 4.468.754 5.64 1.887a6.007 6.007 0 0 1 1.596 2.82l.07.295h-4.629L15.15 1Zm-9.667.377L7.95 6.002H1.244a6.01 6.01 0 0 1 3.942-4.53Zm9.735 12.834-4.545-2.624a.909.909 0 0 0-1.356.668l-.008.12v5.248a.91.91 0 0 0 1.255.84l.109-.053 4.545-2.624a.909.909 0 0 0 .1-1.507l-.1-.068-4.545-2.624Zm-14.2-6.209h21.964l.015.36.003.189v6.899c0 3.061-.755 4.469-1.888 5.64-1.151 1.114-2.5 1.856-5.33 1.909l-.334.003H8.551c-3.06 0-4.467-.755-5.64-1.889-1.114-1.15-1.854-2.498-1.908-5.33L1 15.45V8.551l.003-.189Z" fillRule="evenodd"></path>
                    </svg>
                  </>
                  ) : (
                  <>
                    <Image 
                    src={mediaItem.media_url} 
                    fill
                    className="object-contain"
                    alt="Media" 
                    unoptimized
                    />
                    <svg aria-label="Carousel" fill="white" height="20" role="img" viewBox="0 0 48 48" width="20" className="absolute top-2 right-2">
                    <title>Carousel</title>
                    <path d="M34.8 29.7V11c0-2.9-2.3-5.2-5.2-5.2H11c-2.9 0-5.2 2.3-5.2 5.2v18.7c0 2.9 2.3 5.2 5.2 5.2h18.7c2.8-.1 5.1-2.4 5.1-5.2zM39.2 15v16.1c0 4.5-3.7 8.2-8.2 8.2H14.9c-.6 0-.9.7-.5 1.1 1 1.1 2.4 1.8 4.1 1.8h13.4c5.7 0 10.3-4.6 10.3-10.3V18.5c0-1.6-.7-3.1-1.8-4.1-.5-.4-1.2 0-1.2.6z"></path>
                    </svg>
                  </>
                  )}
                </div>
              </DialogTrigger>
              <DialogContent className="bg-slate-100 [&>button]:hidden max-h-[90vh] overflow-y-auto">
                <DialogHeader className="hidden">
                <DialogTitle>Instagram post</DialogTitle>
                </DialogHeader>
                {media && media.length > 0 && ( 
                  <div className="flex flex-col items-center justify-center bg-white rounded-xl drop-shadow-sexy border-b border-slate-200">
                    <Image src={mediaItem.media_url} unoptimized alt={mediaItem.caption} width={256} height={256} className="w-full rounded-t-xl" />
                    <div className="flex justify-between w-full p-4">
                    <div className="flex gap-3">
                      <div className="flex gap-1.5 items-center">
                      <Heart className="w-5 h-5" />
                      <p className="text-sm">{mediaItem.like_count}</p>
                      </div>
                      <div className="flex gap-1.5 items-center">
                      <MessageCircle className="w-5 h-5" />
                      <p className="text-sm">{mediaItem.comments_count}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500">{formatDate(mediaItem.timestamp)}</p>
                    </div>
                    <div className="pb-4 px-4 w-full">
                      <div className="relative">
                        <p 
                          className={`text-sm ${!expandedCaptions[mediaItem.media_url] ? 'line-clamp-3' : ''}`} 
                          style={{ whiteSpace: 'pre-wrap' }}
                        >
                          {mediaItem.caption}
                        </p>
                        {mediaItem.caption && mediaItem.caption.length > 150 && (
                          <button
                            onClick={() => toggleCaption(mediaItem.media_url)}
                            className="text-sm text-blue-500 mt-1 flex items-center gap-1"
                          >
                            {expandedCaptions[mediaItem.media_url] ? (
                              <>
                                Show less <ChevronUp className="w-4 h-4" />
                              </>
                            ) : (
                              <>
                                Show more <ChevronDown className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <DialogFooter className="flex gap-3">
                  <DialogClose className="rounded-2xl font-medium text-xl p-2 drop-shadow-sexy w-full bg-white text-slate-700">Close</DialogClose>
                  <Link href={mediaItem.permalink} target="_blank" rel="noopener noreferrer" className="w-full">
                      <DialogClose className="rounded-2xl font-medium text-xl p-2 drop-shadow-sexy w-full bg-primary text-white hover:bg-blue-500">View on Instagram</DialogClose>
                  </Link>
                </DialogFooter>
              </DialogContent>
              </Dialog>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 w-dvw -translate-x-4 gap-[1px] pb-16">
            <Skeleton className="aspect-[4/5] w-full rounded-none" />
            <Skeleton className="aspect-[4/5] w-full rounded-none" />
            <Skeleton className="aspect-[4/5] w-full rounded-none" />
            <Skeleton className="aspect-[4/5] w-full rounded-none" />
          </div>
        ) }
      </div>
    );
  }

  if (user && profile && !isLoadingProfile && !media) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Start by linking your Instagram account <span className="text-blue-500" onClick={() => window.location.href = '/app/context'}>here</span></h1>
      </div>
    )
  }

  if (!isLoading && !user) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">This is a landing page <span className="text-blue-500" onClick={() => window.location.href = '/app/context'}>here</span></h1>
      </div>
    )
  }


  return (
    <div>nevim</div>
  )
}
