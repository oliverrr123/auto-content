"use client";
import { FacebookIcon, InstagramIcon, LinkIcon, PlusIcon, UploadIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

export default function Context() {
    const { user, isLoading } = useAuth();

    const [connectedAccounts, setConnectedAccounts] = useState<{ instagram: { name: string, username: string, profile_picture_url: string } } | null>(null);

    const router = useRouter();

    useEffect(() => {
        fetch('/api/get/connectedAccounts')
            .then(res => res.json())
            .then(data => setConnectedAccounts(data));
    }, [isLoading]);

    useEffect(() => {
        if (!user && !isLoading) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    if (!user || isLoading) {
        return (
            <div className="flex flex-col gap-4">
                <Skeleton className="h-8 w-3/4" />
                <div className="flex gap-4">
                    <Skeleton className="h-32 w-32 rounded-xl" />
                    <Skeleton className="h-32 w-32 rounded-xl" />
                </div>
            </div>
        )
    }

    if (user && !isLoading) {
        return (
            <div>
                <h2 className="text-2xl font-bold">Connected social media</h2>
                <div className="flex gap-4 mt-4 pr-4 w-[calc(100%+1rem)] no-scrollbar overflow-x-scroll">
                    <Dialog>
                    <DialogTrigger>
                        <div className="flex flex-col gap-2 items-center justify-center bg-white rounded-xl p-4 w-32 h-32 flex-shrink-0">
                            <PlusIcon className="w-10 h-10 text-slate-400" />
                            <p className="text-sm font-semibold text-slate-400">Add</p>
                        </div>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                        <DialogTitle>Connect social media</DialogTitle>
                        </DialogHeader>

                        <div className="flex flex-col gap-2">
                            <Link href="https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=1436609137340002&redirect_uri=https://growbyte.cz/api/auth/instagram/callback&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights">
                                <div className="flex gap-2 items-center p-4 bg-white rounded-xl w-full">
                                    <InstagramIcon className="w-6 h-6 stroke-[1.6]" />
                                    <p className="text-xl">Instagram</p>
                                </div>
                            </Link>
                            <Link href="https://www.facebook.com/v23.0/dialog/oauth?client_id=442224939723604&display=page&extras=%7B%22setup%22%3A%7B%22channel%22%3A%22IG_API_ONBOARDING%22%7D%7D&redirect_uri=https%3A%2F%2Fgrowbyte.cz%2Fapi%2Fauth%2Ffacebook%2Fcallback&response_type=code&scope=instagram_basic,instagram_content_publish,instagram_manage_comments,instagram_manage_insights,pages_show_list,pages_read_engagement">
                                <div className="flex gap-2 items-center p-4 bg-white rounded-xl w-full">
                                    <FacebookIcon className="w-6 h-6 stroke-[1.6]" />
                                    <p className="text-xl">Facebook</p>
                                </div>
                            </Link>
                        </div>

                        <DialogClose asChild>
                            <Button className="text-xl font-semibold h-12 p-0 rounded-2xl hover:bg-blue-500">Done</Button>
                        </DialogClose>
                    </DialogContent>
                    </Dialog>
                    {connectedAccounts && connectedAccounts.instagram ? (
                        <div className="flex flex-col gap-2 items-center justify-center bg-white rounded-xl p-4 w-32 h-32 flex-shrink-0">
                            <InstagramIcon className="w-10 h-10" />
                            <p className="text-sm font-semibold truncate max-w-28">@{connectedAccounts.instagram.username}</p>
                        </div>
                    ) : (
                        <Skeleton className="h-32 w-32 rounded-xl" />
                    )}
                    {user.user_metadata.facebook_id && (
                        <div className="flex flex-col gap-2 items-center justify-center bg-white rounded-xl p-4 w-32 h-32 flex-shrink-0">
                            <FacebookIcon className="w-10 h-10" />
                            <p className="text-sm font-semibold truncate max-w-28">Facebook</p>
                        </div>
                    )}
                </div>
                <h2 className="text-2xl font-bold mt-4">Connected websites</h2>
                <div className="flex gap-4 mt-4 pr-4 w-[calc(100%+1rem)] no-scrollbar overflow-x-scroll">
                    <Dialog>
                    <DialogTrigger>
                        <div className="flex flex-col gap-2 items-center justify-center bg-white rounded-xl p-4 w-32 h-32 flex-shrink-0">
                            <PlusIcon className="w-10 h-10 text-slate-400" />
                            <p className="text-sm font-semibold text-slate-400">Add</p>
                        </div>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                        <DialogTitle>Connect website</DialogTitle>
                        </DialogHeader>

                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 p-4 bg-white rounded-xl w-full">
                                <LinkIcon className="w-6 h-6 stroke-[1.6] text-slate-400" />
                                <input type="url" className="w-full outline-none focus:outline-none" placeholder="https://your-awesome-website.com/" />
                            </div>
                        </div>

                        <DialogClose asChild>
                            <Button className="text-xl font-semibold h-12 p-0 rounded-2xl hover:bg-blue-500">Done</Button>
                        </DialogClose>
                    </DialogContent>
                    </Dialog>
                    {/* {connectedAccounts && connectedAccounts.instagram ? (
                        <div className="flex flex-col gap-2 items-center justify-center bg-white rounded-xl p-4 w-32 h-32 flex-shrink-0">
                            <InstagramIcon className="w-10 h-10" />
                            <p className="text-sm font-semibold truncate max-w-28">@{connectedAccounts.instagram.username}</p>
                        </div>
                    ) : (
                        <Skeleton className="h-32 w-32 rounded-xl" />
                    )} */}
                </div>
                <h2 className="text-2xl font-bold mt-4">Connected documents</h2>
                <div className="flex gap-4 mt-4 pr-4 w-[calc(100%+1rem)] no-scrollbar overflow-x-scroll">
                    <Dialog>
                    <DialogTrigger>
                        <div className="flex flex-col gap-2 items-center justify-center bg-white rounded-xl p-4 w-32 h-32 flex-shrink-0">
                            <PlusIcon className="w-10 h-10 text-slate-400" />
                            <p className="text-sm font-semibold text-slate-400">Add</p>
                        </div>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                        <DialogTitle>Connect documents</DialogTitle>
                        </DialogHeader>

                        <div className="flex flex-col gap-2">
                            <div className="rounded-xl bg-white w-full p-4 cursor-pointer">
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    accept=".pdf,.doc,.docx,.txt"
                                    id="file-upload"
                                />
                                <label htmlFor="file-upload" className="flex items-center gap-3 bg-white rounded-xl w-full">
                                    <UploadIcon className="w-6 h-6 stroke-[1.6] text-slate-600" />
                                    <p className="text-sm font-medium text-slate-600">
                                        Click to upload or drag and drop
                                    </p>
                                </label>
                            </div>
                        </div>

                        <DialogClose asChild>
                            <Button className="text-xl font-semibold h-12 p-0 rounded-2xl hover:bg-blue-500">Done</Button>
                        </DialogClose>
                    </DialogContent>
                    </Dialog>
                    {/* {connectedAccounts && connectedAccounts.instagram ? (
                        <div className="flex flex-col gap-2 items-center justify-center bg-white rounded-xl p-4 w-32 h-32 flex-shrink-0">
                            <InstagramIcon className="w-10 h-10" />
                            <p className="text-sm font-semibold truncate max-w-28">@{connectedAccounts.instagram.username}</p>
                        </div>
                    ) : (
                        <Skeleton className="h-32 w-32 rounded-xl" />
                    )} */}
                </div>
            </div>
        )
    }
}