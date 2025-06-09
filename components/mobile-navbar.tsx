"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
// import {
//     Drawer,
//     DrawerClose,
//     DrawerContent,
//     DrawerDescription,
//     DrawerFooter,
//     DrawerHeader,
//     DrawerTitle,
//     DrawerTrigger,
//   } from "@/components/ui/drawer"
// import { Drawer } from 'vaul';
// import { Button } from "@/components/ui/button"
// import AI from "@/components/ai"
// import { clsx } from 'clsx';
// import { Paperclip, Send, Mic } from "lucide-react";
// import { Markdown } from '@/components/markdown';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

const snapPoints = [0.5, 0.9];

export default function MobileNavbar() {

    const pathname = usePathname();
    const [active, setActive] = useState(pathname);
    const [activeAI, setActiveAI] = useState(false);
    const [snap, setSnap] = useState<number | string | null>(snapPoints[0]);

    const { user, isLoading } = useAuth();
	const router = useRouter();
	const [prompt, setPrompt] = useState('');
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const [messages, setMessages] = useState<{ role: string; content: string }[]>([
		{
			role: 'assistant',
			content: 'Hey, how can I help you today?',
		},
	]);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(() => {
		if (!user && !isLoading) {
			router.push('/login');
		}
	}, [user, isLoading, router]);

	useEffect(() => {
		console.log('Drawer position changed:', {
			snap,
			percentage: typeof snap === 'number' ? `${snap * 100}%` : snap,
			isFull: snap === 0.9,
			isHalf: snap === 0.5
		});
	}, [snap]);

    useEffect(() => {
		scrollToBottom();
	}, [messages, snap]);

	if (!user) {
		return null;
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	}

	async function handleSend() {
		let newMessages = [
			...messages,
			{ role: 'user', content: prompt },
			{ role: 'assistant', content: 'Thinking...' },
		];

		setMessages(newMessages);
		setPrompt('');

		const contextResponse = await fetch('/api/ai/context', {
			method: 'POST',
			body: JSON.stringify({ lastMessage: newMessages[newMessages.length - 2] }),
		});
		const contextData = await contextResponse.json();

        const context = {
            profile: null,
            media: null,
        }

        if (contextData && contextData.parameters.profile.length > 0) {
            const profileData = await fetch('/api/get/instagram/custom/profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ parameters: contextData.parameters.profile.join(',') }),
            });
            const profileDataJson = await profileData.json();
            context.profile = profileDataJson;
        }
    
        if (contextData && contextData.parameters.media.length > 0) {
            const mediaData = await fetch('/api/get/instagram/custom/media', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ parameters: contextData.parameters.media.join(',') }),
            });
            const mediaDataJson = await mediaData.json();
            context.media = mediaDataJson;
        }

		const response = await fetch('/api/ai/text', {
			method: 'POST',
			body: JSON.stringify({ messages: newMessages.slice(0, -1), context: context }),
		});

		if (!response.ok) {
			console.error('Failed to get AI response');
			setMessages([
				...messages,
				{
					role: 'assistant',
					content: 'Sorry, there was an error processing your request. Please try again.',
				},
			]);
			return;
		}

		const data = await response.json();
		newMessages = [...newMessages.slice(0, -1), { role: 'assistant', content: data.content }];
		setMessages(newMessages);
	}

    return (
        <div className="fixed flex justify-between items-center w-full h-12 px-10 bottom-0 left-0 right-0 bg-white drop-shadow-sexy z-50">
            <Link href="/">
                <img src={active === "/" ? "/icons/navbar/2/home.svg" : "/icons/navbar/home.svg"} onClick={() => setActive("/")} alt="Home" width={24} height={24} />
            </Link>
            <Link href="/context">
                <img src={active === "/context" ? "/icons/navbar/2/context.svg" : "/icons/navbar/context.svg"} onClick={() => setActive("/context")} alt="Context" width={24} height={24} />
            </Link>
            <Link href="/create-post">
                <img src={active === "/create-post" ? "/icons/navbar/2/plus.svg" : "/icons/navbar/plus.svg"} onClick={() => setActive("/create-post")} alt="Create" width={24} height={24} />
            </Link>
            <Link href="/scheduling">
                <img src={active === "/scheduling" ? "/icons/navbar/2/scheduling.svg" : "/icons/navbar/scheduling.svg"} onClick={() => setActive("/scheduling")} alt="Scheduling" width={24} height={24} />
            </Link>
            <Link href="/ai">
                <img src={active === "/ai" ? "/icons/navbar/2/ai.svg" : "/icons/navbar/ai.svg"} onClick={() => setActive("/ai")} alt="AI" width={20} height={20} />
            </Link>
            
        {/* <Drawer.Root open={activeAI} onOpenChange={setActiveAI} snapPoints={snapPoints} activeSnapPoint={snap} setActiveSnapPoint={setSnap} modal={false} handleOnly={true}>
            <Drawer.Trigger onClick={() => setActiveAI(!activeAI)}>
                <img src={activeAI ? "/icons/navbar/2/ai.svg" : "/icons/navbar/ai.svg"} alt="AI" width={20} height={20} />
            </Drawer.Trigger>
            <Drawer.Overlay className="fixed inset-0 bg-black/40" />
            <Drawer.Portal>
                <Drawer.Content
                    className='fixed bg-white border border-gray-200 border-b-none rounded-t-[10px] bottom-0 left-0 right-0 h-full z-20'
                >

                    <Drawer.Title className="hidden">Title</Drawer.Title>

                    <Drawer.Handle className="mx-auto w-12 h-1.5 m-4 rounded-full bg-slate-300 mb-8" />
                    
                    <div aria-hidden className="mx-auto w-12 h-1.5 m-4 rounded-full bg-slate-300 mb-8" />

                    <div className="flex flex-col gap-4 px-3 pb-8 overflow-y-auto" style={{ height: snap === 0.9 ? '38rem' : '15rem' }}>
                        {messages.map((message, index) =>
                            message.role === 'assistant' ? (
                                <div key={index} className="flex gap-2">
                                    <img
                                        src="/icons/ai-2.svg"
                                        className="w-6 h-6"
                                        alt="AI"
                                        width={22}
                                        height={22}
                                    />
                                    <Markdown content={message.content} />
                                </div>
                            ) : (
                                <div key={index} className="flex justify-end">
                                    <div className="bg-primary px-4 py-3 rounded-xl rounded-br-none ml-10 mr-[1px] text-white">
                                        <p>{message.content}</p>
                                    </div>
                                </div>
                            )
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="fixed w-full" style={{ bottom: snap === 0.9 ? '6dvh' : '46dvh', transition: 'all 300ms' }}>
                        <div className="mt-4 relative">
                            <div className="flex flex-col bg-slate-100 rounded-xl">
                                <textarea
                                    className="w-full p-4 rounded-xl focus:outline-none resize-none bg-transparent"
                                    placeholder="Create a post about ..."
                                    rows={1}
                                    value={prompt}
                                    onChange={e => setPrompt(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                                <div className="flex justify-end">
                                    <div className="flex gap-2 p-2 pt-0">
                                        <Button
                                            variant="secondary"
                                            className="border border-slate-200 bg-white"
                                            size="icon"
                                        >
                                            <Paperclip className="text-slate-500" />
                                        </Button>
                                        {prompt.length > 0 ? (
                                            <Button
                                                className="hover:bg-blue-500"
                                                size="icon"
                                                onClick={handleSend}
                                            >
                                                <Send />
                                            </Button>
                                        ) : (
                                            <Button
                                                className="hover:bg-blue-500"
                                                size="icon"
                                                // onClick={handleSend}
                                            >
                                                <Mic />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </Drawer.Content>
                <div className="fixed w-full bottom-12 z-50 transition-all duration-500">
                        <div className="mt-4 relative">
                            <div className="flex flex-col bg-slate-100 rounded-xl">
                                <textarea
                                    className="w-full p-4 rounded-xl focus:outline-none resize-none bg-transparent"
                                    placeholder="Create a post about ..."
                                    rows={1}
                                    value={prompt}
                                    onChange={e => setPrompt(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                                <div className="flex justify-end">
                                    <div className="flex gap-2 p-2 pt-0">
                                        <Button
                                            variant="secondary"
                                            className="border border-slate-200 bg-white"
                                            size="icon"
                                        >
                                            <Paperclip className="text-slate-500" />
                                        </Button>
                                        {prompt.length > 0 ? (
                                            <Button
                                                className="hover:bg-blue-500"
                                                size="icon"
                                                onClick={handleSend}
                                            >
                                                <Send />
                                            </Button>
                                        ) : (
                                            <Button
                                                className="hover:bg-blue-500"
                                                size="icon"
                                                // onClick={handleSend}
                                            >
                                                <Mic />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
            </Drawer.Portal>
        </Drawer.Root> */}

        </div>
    )
}