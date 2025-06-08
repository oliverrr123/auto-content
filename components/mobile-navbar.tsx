"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function MobileNavbar() {

    const pathname = usePathname();
    const [active, setActive] = useState(pathname.split("/")[1]);

    return (
        <div className="fixed flex justify-between items-center w-full h-12 px-10 bottom-0 left-0 right-0 bg-white drop-shadow-sexy z-50">
            <Link href="/">
                <img src={active === "home" ? "/icons/navbar/2/home.svg" : "/icons/navbar/home.svg"} onClick={() => setActive("home")} alt="Home" width={24} height={24} />
            </Link>
            <Link href="/context">
                <img src={active === "context" ? "/icons/navbar/2/context.svg" : "/icons/navbar/context.svg"} onClick={() => setActive("context")} alt="Context" width={24} height={24} />
            </Link>
            <Link href="/create-post">
                <img src={active === "create-post" ? "/icons/navbar/2/plus.svg" : "/icons/navbar/plus.svg"} onClick={() => setActive("create-post")} alt="Create" width={24} height={24} />
            </Link>
            <Link href="/scheduling">
                <img src={active === "scheduling" ? "/icons/navbar/2/scheduling.svg" : "/icons/navbar/scheduling.svg"} onClick={() => setActive("scheduling")} alt="Scheduling" width={24} height={24} />
            </Link>
            <Link href="/ai">
                <img src={active === "ai" ? "/icons/navbar/2/ai.svg" : "/icons/navbar/ai.svg"} onClick={() => setActive("ai")} alt="AI" width={20} height={20} />
            </Link>
        </div>
    )
}