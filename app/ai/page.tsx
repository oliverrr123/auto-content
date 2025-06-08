'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Paperclip, Send } from 'lucide-react';
// import Image from 'next/image';
import { Markdown } from '@/components/markdown';

export default function Scheduling() {
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
		scrollToBottom();
	}, [messages]);

	useEffect(() => {
		if (!user && !isLoading) {
			router.push('/login');
		}
	}, [user, isLoading, router]);

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
		<div className="">
			<div className="flex flex-col gap-4 pb-16 overflow-y-auto">
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
			<div className="fixed w-[calc(100%-2rem)] bottom-14">
				<div className="mt-4 relative">
					<div className="bg-slate-100 w-full h-16 absolute -bottom-10 -z-10"></div>
					<textarea
						className="w-full p-4 rounded-xl focus:outline-none resize-none"
						placeholder="Create a post about ..."
						rows={4}
						value={prompt}
						onChange={e => setPrompt(e.target.value)}
						onKeyDown={handleKeyDown}
					/>
					<div className="flex gap-2 p-2 absolute bottom-2 right-1">
						<Button
							variant="secondary"
							className="w-12 h-12 border border-slate-200 bg-white [&_svg]:!size-6"
						>
							<Paperclip className="text-slate-500" />
						</Button>
						{prompt.length > 0 ? (
							<Button
								className="w-12 h-12 [&_svg]:!size-6 hover:bg-blue-500"
								onClick={handleSend}
							>
								<Send />
							</Button>
						) : (
							<Button className="w-12 h-12 [&_svg]:!size-6 hover:bg-blue-500">
								<Mic />
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
