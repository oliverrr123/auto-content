'use client';
// import { useAuth } from '@/context/AuthContext';
import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Paperclip, Send } from 'lucide-react';
import { Markdown } from '@/components/markdown';

export default function AI() {
	// const { user } = useAuth();
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

	// if (!user) {
	// 	return null;
	// }

	function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	}

	async function handleSend() {
		if (prompt.length === 0) {
			return;
		}

		let newMessages = [
			...messages,
			{ role: 'human', content: prompt },
			{ role: 'assistant', content: 'Thinking...' },
		];

		setMessages(newMessages);
		setPrompt('');

		const response = await fetch('/api/ai/text', {
			method: 'POST',
			body: JSON.stringify({ messages: newMessages.slice(0, -1) }),
		});

		if (!response.ok) {
			console.error('Failed to get AI response');
			setMessages([
				...newMessages.slice(0, -1),
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
			<div className="flex flex-col gap-4 pb-48 overflow-y-auto">
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
					<div className="flex flex-col bg-white rounded-xl">
						<textarea
							className="w-full p-4 rounded-xl focus:outline-none resize-none"
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
									>
										<Mic />
									</Button>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
