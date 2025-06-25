'use client';
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from "@/components/ui/dialog";
import Image from "next/image";

interface Post {
    id: string;
    user_id: string;
    platform: string;
    params: Array<{
        filetype: string;
        isUploading: boolean;
        taggedPeople: Array<{
            x: number;
            y: number;
            username: string;
        }>;
        signedReadUrl: string;
    }>;
    schedule_params: {
        status: string;
        scheduled_date: string;
    };
    caption: string;
}

const formatDate = (timestamp: string | number) => {
    const date = new Date(typeof timestamp === 'string' ? timestamp : timestamp * 1000);
    return `
        ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        at ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
    `;
};
export default function Scheduling() {
    const { user, isLoading } = useAuth();

    const router = useRouter();

    const [posts, setPosts] = useState<Post[]>([]);
    const [currentPosts, setCurrentPosts] = useState<Post[][]>([]);
    const [currentWeekDay, setCurrentWeekDay] = useState<Date>(new Date());
    
    useEffect(() => {
        if (!user && !isLoading) {
            router.push('/login');
        } else if (user) {
            fetch('/api/get/instagram/posts')
                .then(res => res.json())
                .then(data => {
                    setPosts(data.posts);
                })
                .catch(err => {
                    console.error(err);
                })
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        const monday = new Date(currentWeekDay);
        
        const currentDay = currentWeekDay.getDay() || 7;
        monday.setDate(currentWeekDay.getDate() - currentDay + 1);

        const week = Array.from({ length: 7 }, (_, i) => {
            const day = new Date(monday);
            day.setDate(monday.getDate() + i);
            return day;
        });

        const tempCurrentPosts: Post[][] = [];
        for (const day of week) {
            const currentDay: Post[] = [];
            for (const post of posts) {
                const postDate = new Date(post.schedule_params.scheduled_date);
                if (
                    postDate.getDate() === day.getDate() &&
                    postDate.getMonth() === day.getMonth() &&
                    postDate.getFullYear() === day.getFullYear()
                ) {
                    currentDay.push(post);
                }
            }
            tempCurrentPosts.push(currentDay);
        }

        setCurrentPosts(tempCurrentPosts);

    }, [posts, currentWeekDay]);

    const [expandedCaptions, setExpandedCaptions] = useState<{ [key: string]: boolean }>({});

    const toggleCaption = (postId: string) => {
        setExpandedCaptions(prev => ({
        ...prev,
        [postId]: !prev[postId]
        }));
    };

    if (!user) {
        return null;
    }

    return (
        <>
            <div className='w-full bg-white rounded-xl overflow-hidden drop-shadow-sexy'>
                <div className='flex items-center justify-between py-2 px-4 pt-3 border-b border-slate-200'>
                    <Button size='icon' variant='ghost' onClick={() => setCurrentWeekDay(new Date(currentWeekDay.setDate(currentWeekDay.getDate() - 7)))}><ChevronLeft /></Button>
                    <p className='font-medium'>
                        {currentWeekDay.toDateString() === new Date().toDateString() ? (
                            'This week'
                        ) : currentWeekDay.toDateString() === new Date(new Date().setDate(new Date().getDate() - 7)).toDateString() ? (
                            'Last week'
                        ) : currentWeekDay.toDateString() === new Date(new Date().setDate(new Date().getDate() + 7)).toDateString() ? (
                            'Next week'
                        ) : (
                            (() => {
                                const monday = new Date(currentWeekDay);
                                const currentDay = currentWeekDay.getDay() || 7;
                                monday.setDate(currentWeekDay.getDate() - currentDay + 1);
                                
                                const sunday = new Date(monday);
                                sunday.setDate(monday.getDate() + 6);

                                const formatDate = (date: Date) => {
                                    return `${date.getDate()}.${date.getMonth() + 1}`;
                                };

                                return `${formatDate(monday)} - ${formatDate(sunday)}`;
                            })()
                        )}
                    </p>
                    <Button size='icon' variant='ghost' onClick={() => setCurrentWeekDay(new Date(currentWeekDay.setDate(currentWeekDay.getDate() + 7)))}><ChevronRight /></Button>
                </div>

                <div className='grid grid-rows-7 grid-cols-[auto_1fr] divide-x divide-y divide-dashed divide-slate-200 -m-[1px]'>
                    {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day, index) => (
                        <div key={index} className={
                            currentWeekDay.toDateString() === new Date().toDateString() && index === ((new Date().getDay() || 7) - 1) ?
                            'p-4 py-6 col-start-1 col-end-2 flex items-center justify-center text-slate-500 bg-slate-50' :
                            'p-4 py-6 col-start-1 col-end-2 flex items-center justify-center text-slate-500'} style={{gridRow: `${index + 1} / ${index + 2}`}}>
                            <p>
                                {currentWeekDay.toDateString() === new Date().toDateString() && index === ((new Date().getDay() || 7) - 1) ? (
                                    <span className='text-primary font-bold'>{day}</span>
                                ) : (
                                    day
                                )}
                            </p>
                        </div>
                    ))}
                    {currentPosts.map((day, index) => (
                        <div key={index} className={`col-start-2 col-end-3 p-2 overflow-x-auto no-scrollbar`} style={{gridRow: `${index + 1} / ${index + 2}`}}>
                            <div className='flex gap-2'>
                                {day.sort((a, b) => {
                                    const timeA = new Date(a.schedule_params.scheduled_date);
                                    const timeB = new Date(b.schedule_params.scheduled_date);
                                    return timeA.getTime() - timeB.getTime();
                                }).map((post, index2) => (
                                    post.schedule_params.status === 'scheduled' ? (
                                        <Dialog key={post.id}>
                                        <DialogTrigger>
                                            <div className='flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-xl whitespace-nowrap'>
                                                <div className="flex flex-col items-start">
                                                    <p className="text-sm">{post.caption}</p>
                                                    <p className="text-xs opacity-70">{new Date(post.schedule_params.scheduled_date).getHours()}:{new Date(post.schedule_params.scheduled_date).getMinutes().toString().padStart(2, '0')}</p>
                                                </div>
                                            </div>
                                        </DialogTrigger>
                                        <DialogContent className="bg-slate-100 [&>button]:hidden max-h-[90vh] overflow-y-auto">
                                            <DialogHeader className="hidden">
                                                <DialogTitle>Instagram post</DialogTitle>
                                            </DialogHeader>
                                            {post && ( 
                                                <div className="flex flex-col items-center justify-center bg-white rounded-xl drop-shadow-sexy border-b border-slate-200">
                                                <Image src={post.params[0].signedReadUrl} unoptimized alt={post.caption} width={256} height={256} className="w-full rounded-t-xl" />
                                                <div className="flex items-center justify-between w-full p-4">
                                                    <div></div>
                                                    <p className="text-sm text-slate-500">{formatDate(post.schedule_params.scheduled_date)}</p>
                                                </div>
                                                <div className="pb-4 px-4 w-full">
                                                    <div className="relative">
                                                    <p 
                                                        className={`text-sm ${!expandedCaptions[post.id] ? 'line-clamp-3' : ''}`} 
                                                        style={{ whiteSpace: 'pre-wrap' }}
                                                    >
                                                        {post.caption}
                                                    </p>
                                                    {post.caption && post.caption.length > 150 && (
                                                        <button
                                                        onClick={() => toggleCaption(post.id)}
                                                        className="text-sm text-blue-500 mt-1 flex items-center gap-1"
                                                        >
                                                        {expandedCaptions[post.id] ? (
                                                            <>
                                                            Show less <ChevronUp className="w-4 h-4" />
                                                            </>
                                                        ) : (
                                                            <>
                                                            Show more <ChevronDown className="w-4 h-4" />
                                                            </>
                                                        )}
                                                        </button>
                                                    )}
                                                    </div>
                                                </div>
                                                </div>
                                            )}
                                            <DialogFooter className="flex gap-3">
                                                <DialogClose className="rounded-2xl font-medium text-xl p-2 drop-shadow-sexy w-full bg-white text-slate-700">Close</DialogClose>
                                                <Button className="rounded-2xl font-medium text-xl p-2 drop-shadow-sexy w-full bg-primary text-white hover:bg-blue-500">Edit</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                        </Dialog>
                                    ) : (
                                        <Dialog key={post.id}>
                                        <DialogTrigger>
                                            <div className='flex items-center gap-2 px-3 py-2 bg-blue-400 text-white rounded-xl whitespace-nowrap'>
                                                <CheckCircle className='w-4 h-4' />
                                                <div className="flex flex-col items-start">
                                                    <p className="text-sm">{post.caption}</p>
                                                    <p className="text-xs opacity-70">{new Date(post.schedule_params.scheduled_date).getHours()}:{new Date(post.schedule_params.scheduled_date).getMinutes().toString().padStart(2, '0')}</p>
                                                </div>
                                            </div>
                                        </DialogTrigger>
                                        <DialogContent className="bg-slate-100 [&>button]:hidden max-h-[90vh] overflow-y-auto">
                                            <DialogHeader className="hidden">
                                                <DialogTitle>Instagram post</DialogTitle>
                                            </DialogHeader>
                                            {post && ( 
                                                <div className="flex flex-col items-center justify-center bg-white rounded-xl drop-shadow-sexy border-b border-slate-200">
                                                <Image src={post.params[0].signedReadUrl} unoptimized alt={post.caption} width={256} height={256} className="w-full rounded-t-xl" />
                                                <div className="flex items-center justify-between w-full p-4">
                                                    <div></div>
                                                    <p className="text-sm text-slate-500">{formatDate(post.schedule_params.scheduled_date)}</p>
                                                </div>
                                                <div className="pb-4 px-4 w-full">
                                                    <div className="relative">
                                                    <p 
                                                        className={`text-sm ${!expandedCaptions[post.id] ? 'line-clamp-3' : ''}`} 
                                                        style={{ whiteSpace: 'pre-wrap' }}
                                                    >
                                                        {post.caption}
                                                    </p>
                                                    {post.caption && post.caption.length > 150 && (
                                                        <button
                                                        onClick={() => toggleCaption(post.id)}
                                                        className="text-sm text-blue-500 mt-1 flex items-center gap-1"
                                                        >
                                                        {expandedCaptions[post.id] ? (
                                                            <>
                                                            Show less <ChevronUp className="w-4 h-4" />
                                                            </>
                                                        ) : (
                                                            <>
                                                            Show more <ChevronDown className="w-4 h-4" />
                                                            </>
                                                        )}
                                                        </button>
                                                    )}
                                                    </div>
                                                </div>
                                                </div>
                                            )}
                                            <DialogFooter className="flex gap-3">
                                                <DialogClose className="rounded-2xl font-medium text-xl p-2 drop-shadow-sexy w-full bg-white text-slate-700">Close</DialogClose>
                                            </DialogFooter>
                                        </DialogContent>
                                        </Dialog>
                                    )
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}