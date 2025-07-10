'use client';
import { redirect } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import Link from "next/link"
// import Image from "next/image"
import { CoolButton } from "@/components/cool-button";

export default function LandingPage() {
    const { user } = useAuth()

    if (user) {
        redirect("/app")
    }

    return (
        <div className="flex flex-col p-4 pb-8 gap-4 h-dvh justify-center">
            <div className="flex w-full justify-center items-center pb-2">
                <div className="w-48 h-48 bg-primary rounded-full"></div>
            </div>

            <div className="flex w-full justify-center items-center tracking-[-0.075em] pb-0.5">
                <h1 className="text-7xl font-black text-black">IG</h1>
                <h1 className="text-7xl font-black italic text-primary ml-2">byte</h1>
            </div>
            <h3 className="text-center text-black text-opacity-80 text-xl">Meet your <span className="border-b border-primary text-primary">AI social media manager</span></h3>
            {/* <div className="flex gap-4 items-center justify-center">
                <Link href="/login" className="bg-primary text-white px-4 py-2 rounded-md">Login</Link>
                <Link href="/signup" className="bg-white text-primary px-4 py-2 rounded-md">Signup</Link>
            </div> */}
            <Link href="/signup" className="mt-2 rounded-full">
                <CoolButton />
            </Link>
            <p className="text-center text-black text-opacity-50">Already have an account? <Link href="/login" className="text-primary underline">Login</Link></p>

            {/* <div>
                <Image
            </div> */}

            {/* <div className="flex flex-col gap-2 text-center mt-24 text-lg">
                <p>Tired of overpriced social media agencies?</p>
                <p>Don't have time to write content?</p>
                <p>Struggling with ChatGPT?</p>
                <p>Out of ideas?</p>
            </div>
            <div className="relative">
                <div className="relative px-32">
                    <Image src="/characters/character-1.svg" alt="Character 1" width={500} height={500} />
                    <div className="p-4 bg-white rounded-lg rounded-bl-none inline-block absolute top-0 left-[25vw] drop-shadow-sexy">
                        <p>Let me do it for you! <i className="text-primary">~Byte</i></p>
                    </div>
                </div>
                <div className="flex justify-center items-center absolute bottom-0 top-32 left-0 right-0" style={{filter: "drop-shadow(0 5px 10px rgba(9, 120, 255, 0.75))"}}>
                    <CoolButton />
                </div>
            </div> */}
        </div>
    )
}