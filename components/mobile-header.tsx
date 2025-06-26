'use client';
import Link from "next/link";
// import { ExampleCombobox } from "./social-switcher";
import { useAuth } from '@/context/AuthContext';
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LogOut, User } from "lucide-react";
import { logout } from "@/lib/auth-actions";
import { Skeleton } from "./ui/skeleton";

export default function MobileNavbar() {
    const { user } = useAuth();
    
    return (
        <div className="fixed flex justify-between items-center w-full h-12 px-4 top-0 left-0 right-0 bg-white drop-shadow-sexy z-50">
            <Link href="/app" className="font-medium">Grow<span className="text-primary font-bold">Byte</span></Link>
            
            {/* <ExampleCombobox /> */}
            {/* <Link href="/ai" className="p-0 bg-primary text-white rounded-xl w-12 h-12 flex items-center justify-center">
                <img src="/icons/instagram.svg" alt="Instagram" width={24} height={24} />
            </Link> */}
            <div>
                {user ? (
                    <Popover>
                        <PopoverTrigger className="text-sm text-slate-600 sm:inline flex items-center gap-2">
                            <div className="bg-slate-100 p-2 rounded-full">
                                <User className="w-4 h-4 text-slate-400" />
                            </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 flex flex-col gap-2" onClick={() => logout()}>
                            <div className="flex items-center gap-2">
                                {user.user_metadata.avatar_url && (
                                    <Image src={user.user_metadata.avatar_url} alt="User" width={24} height={24} unoptimized priority className="rounded-full" />
                                )}
                                <p>{user.user_metadata.full_name || user.email}</p>
                            </div>
                            <hr className="my-2 w-full" /> 
                            <div className="flex items-center gap-2">
                                <LogOut className="w-4 h-4" />
                                <p className="text-sm text-slate-600">Logout</p>
                            </div>
                        </PopoverContent>
                    </Popover>
                ) : (
                    <div className="flex items-center gap-2">
                        <Skeleton className="w-6 h-6 rounded-full" />
                        <Skeleton className="w-20 h-3" />
                    </div>
                )}
            </div>
        </div>
    )
}