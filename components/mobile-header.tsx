import Link from "next/link";
import Image from "next/image";

export default function MobileNavbar() {
    return (
        <div className="fixed flex justify-between items-center w-full h-20 px-4 top-0 left-0 right-0 bg-white drop-shadow-sexy">
            <Link href="/ai" className="p-0 bg-primary text-white rounded-xl w-12 h-12 flex items-center justify-center">
                <Image src="/icons/instagram.svg" alt="Instagram" width={24} height={24} />
            </Link>
        </div>
    )
}