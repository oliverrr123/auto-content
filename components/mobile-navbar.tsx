"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileNavbar() {
    const pathname = usePathname();
    const isActive = (path: string) => pathname === path;

    return (
        <div className="fixed flex justify-between items-center w-full h-12 px-10 bottom-0 left-0 right-0 bg-white drop-shadow-sexy z-50">
            <Link href="/">
                <img src={isActive("/") ? "/icons/navbar/2/home.svg" : "/icons/navbar/home.svg"} alt="Home" width={24} height={24} />
            </Link>
            <Link href="/context">
                <img src={isActive("/context") ? "/icons/navbar/2/context.svg" : "/icons/navbar/context.svg"} alt="Context" width={24} height={24} />
            </Link>
            <Link href="/create-post">
                <img src={isActive("/create-post") ? "/icons/navbar/2/plus.svg" : "/icons/navbar/plus.svg"} alt="Create" width={24} height={24} />
            </Link>
            <Link href="/scheduling">
                <img src={isActive("/scheduling") ? "/icons/navbar/2/scheduling.svg" : "/icons/navbar/scheduling.svg"} alt="Scheduling" width={24} height={24} />
            </Link>
            <Link href="/ai">
                <img src={isActive("/ai") ? "/icons/navbar/2/ai.svg" : "/icons/navbar/ai.svg"} alt="AI" width={24} height={24} />
            </Link>
        </div>
    )

}