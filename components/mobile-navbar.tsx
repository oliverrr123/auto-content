import Link from "next/link";
import Image from "next/image";

export default function MobileNavbar() {
    return (
        <div className="fixed flex justify-between items-center w-full h-20 px-10 bottom-0 left-0 right-0 bg-white drop-shadow-sexy z-50">
            <Link href="/">
                <Image src="/icons/navbar/home.svg" alt="Home" width={24} height={24} />
            </Link>
            <Link href="/scheduling">
                <Image src="/icons/navbar/scheduling.svg" alt="Scheduling" width={24} height={24} />
            </Link>
            <Link href="/ai" className="p-0 bg-primary text-white rounded-xl w-12 h-12 flex items-center justify-center">
                <Image src="/icons/navbar/ai.svg" alt="AI" width={24} height={24} />
            </Link>
            <Link href="/context">
                <Image src="/icons/navbar/context.svg" alt="Context" width={24} height={24} />
            </Link>
            <Link href="/create-post">
                <Image src="/icons/navbar/plus.svg" alt="Create" width={24} height={24} />
            </Link>
        </div>
    )
}