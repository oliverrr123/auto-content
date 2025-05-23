"use client";
import { FacebookIcon, InstagramIcon, PlusIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Context() {
    const { user, isLoading } = useAuth();

    if (user) {
        return (
            <div>
                <h1 className="text-2xl font-bold">Connected social media</h1>
                <div className="flex gap-4 mt-4 overflow-x-auto w-full no-scrollbar">
                    <div className="flex flex-col gap-3 items-center justify-center bg-white rounded-xl p-4 w-40 h-40 drop-shadow-sexy flex-shrink-0">
                        <PlusIcon className="w-10 h-10 text-gray-500" />
                        <p className="text-lg font-semibold text-gray-500">Add</p>
                    </div>
                    {user.user_metadata.instagram_id && (
                        <div className="flex flex-col gap-3 items-center justify-center bg-white rounded-xl p-4 w-40 h-40 drop-shadow-sexy flex-shrink-0">
                            <InstagramIcon className="w-10 h-10" />
                            <p className="text-lg font-semibold">Instagram</p>
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