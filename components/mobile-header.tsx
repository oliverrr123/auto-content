import Link from "next/link";
// import { ExampleCombobox } from "./social-switcher";

export default function MobileNavbar() {
    return (
        <div className="fixed flex justify-between items-center w-full h-12 px-4 top-0 left-0 right-0 bg-white drop-shadow-sexy z-50">
            <Link href="/" className="font-medium"><span className="text-primary">Grow</span><span className="text-slate-700">Byte</span></Link>
            {/* <ExampleCombobox /> */}
            {/* <Link href="/ai" className="p-0 bg-primary text-white rounded-xl w-12 h-12 flex items-center justify-center">
                <img src="/icons/instagram.svg" alt="Instagram" width={24} height={24} />
            </Link> */}
        </div>
    )
}