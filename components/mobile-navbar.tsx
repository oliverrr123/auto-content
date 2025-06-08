import Link from "next/link";

export default function MobileNavbar() {
    return (
        <div className="fixed flex justify-between items-center w-full h-20 px-10 bottom-0 left-0 right-0 bg-white drop-shadow-sexy z-50">
            <Link href="/">
                <img src="/icons/navbar/home.svg" alt="Home" width={24} height={24} />
            </Link>
            <Link href="/scheduling">
                <img src="/icons/navbar/scheduling.svg" alt="Scheduling" width={24} height={24} />
            </Link>
            <Link href="/ai" className="p-0 bg-primary text-white rounded-xl w-12 h-12 flex items-center justify-center">
                <img src="/icons/navbar/ai.svg" alt="AI" width={24} height={24} />
            </Link>
            <Link href="/context">
                <img src="/icons/navbar/context.svg" alt="Context" width={24} height={24} />
            </Link>
            <Link href="/create-post">
                <img src="/icons/navbar/plus.svg" alt="Create" width={24} height={24} />
            </Link>
        </div>
    )
}