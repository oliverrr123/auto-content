"use client";
import { FacebookIcon, InstagramIcon, PlusIcon } from "lucide-react";
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

    if (!user) {
        return null;
    }

    if (user && !isLoading && connectedAccounts) {
        return (
            <div>
                <h1 className="text-2xl font-bold">Connected social media</h1>
                <div className="flex gap-4 mt-4 overflow-x-auto w-full no-scrollbar">
                    <Dialog>
                    <DialogTrigger>
                        <div className="flex flex-col gap-3 items-center justify-center bg-white rounded-xl p-4 w-40 h-40 drop-shadow-sexy flex-shrink-0">
                            <PlusIcon className="w-10 h-10 text-gray-500" />
                            <p className="text-lg font-semibold text-gray-500">Add</p>
                        </div>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                        <DialogTitle>Connect social media</DialogTitle>
                        </DialogHeader>

                        <div className="flex flex-col gap-2">
                            <Link href="https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=1436609137340002&redirect_uri=https://growbyte.cz/api/auth/instagram/callback&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights">
                                <div className="flex gap-3 items-center p-4 bg-white rounded-xl w-full">
                                    <InstagramIcon className="w-8 h-8 stroke-[1.6]" />
                                    <p className="text-2xl">Instagram</p>
                                </div>
                            </Link>
                            <Link href="https://www.facebook.com/v23.0/dialog/oauth?client_id=442224939723604&display=page&extras=%7B%22setup%22%3A%7B%22channel%22%3A%22IG_API_ONBOARDING%22%7D%7D&redirect_uri=https%3A%2F%2Fgrowbyte.cz%2Fapi%2Fauth%2Ffacebook%2Fcallback&response_type=code&scope=instagram_basic,instagram_content_publish,instagram_manage_comments,instagram_manage_insights,pages_show_list,pages_read_engagement">
                                <div className="flex gap-3 items-center p-4 bg-white rounded-xl w-full">
                                    <FacebookIcon className="w-8 h-8 stroke-[1.6]" />
                                    <p className="text-2xl">Facebook</p>
                                </div>
                            </Link>
                        </div>

                        <DialogClose asChild>
                            <Button className="text-xl font-semibold h-12 p-0 rounded-2xl hover:bg-blue-500">Done</Button>
                        </DialogClose>
                    </DialogContent>
                    </Dialog>
                    {connectedAccounts.instagram && (
                        <div className="flex flex-col gap-3 items-center justify-center bg-white rounded-xl p-4 w-40 h-40 drop-shadow-sexy flex-shrink-0">
                            <InstagramIcon className="w-10 h-10" />
                            <p className="text-lg font-semibold truncate max-w-32">@{connectedAccounts.instagram.username}</p>
                        </div>
                    )}
                    {user.user_metadata.facebook_id && (
                        <div className="flex flex-col gap-3 items-center justify-center bg-white rounded-xl p-4 w-40 h-40 drop-shadow-sexy flex-shrink-0">
                            <FacebookIcon className="w-10 h-10" />
                            <p className="text-lg font-semibold">Facebook</p>
                        </div>
                    )}
                </div>
            </div>
        )
    }
}