'use client';
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

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
        scheduled_time: string;
    };
    caption: string;
}

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

    if (!user) {
        return null;
    }

    return (
        <>
            <div className='w-full bg-white rounded-xl overflow-hidden drop-shadow-sexy'>
                <div className='flex items-center justify-between py-2 px-4 pt-3 border-b border-slate-200'>
                    <Button size='icon' variant='ghost' onClick={() => setCurrentWeekDay(new Date(currentWeekDay.setDate(currentWeekDay.getDate() - 7)))}><ChevronLeftIcon /></Button>
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
                    <Button size='icon' variant='ghost' onClick={() => setCurrentWeekDay(new Date(currentWeekDay.setDate(currentWeekDay.getDate() + 7)))}><ChevronRightIcon /></Button>
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
                    {/* {[
                        [{ title: 'Best times to post on IG', time: '10:00' }, { title: 'Social media tips this is a long text', time: '10:00' }],
                        [{ title: 'Social media tips', time: '10:00' }],
                        [{ title: 'How to achieve greatness?', time: '10:00' }],
                        [{ title: 'Social media tips', time: '10:00' }],
                        [{ title: 'Social media tips', time: '10:00' }],
                        [{ title: 'Social media tips', time: '10:00' }],
                        [{ title: 'Social media tips', time: '10:00' }],
                    ].map((day, index) => (
                        <div key={index} className={`col-start-2 col-end-3 p-2 overflow-x-auto no-scrollbar`} style={{gridRow: `${index + 1} / ${index + 2}`}}>
                            <div className='flex gap-2'>
                                {day.map((post, index2) => (
                                    <div key={index2} className='px-3 py-2 bg-primary text-white rounded-xl whitespace-nowrap'>
                                        <p className="text-sm">{post.title}</p>
                                        <p className="text-xs opacity-70">{post.time}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))} */}
                    {currentPosts.map((day, index) => (
                        <div key={index} className={`col-start-2 col-end-3 p-2 overflow-x-auto no-scrollbar`} style={{gridRow: `${index + 1} / ${index + 2}`}}>
                            <div className='flex gap-2'>
                                {day.map((post, index2) => (
                                    post.schedule_params.status === 'scheduled' ? (
                                        <div key={index2} className='flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-xl whitespace-nowrap'>
                                            <div>
                                                <p className="text-sm">{post.caption}</p>
                                                <p className="text-xs opacity-70">{new Date(post.schedule_params.scheduled_date).getHours()}:{new Date(post.schedule_params.scheduled_date).getMinutes().toString().padStart(2, '0')}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div key={index2} className='flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-xl whitespace-nowrap'>
                                            <CheckCircle className='w-4 h-4' />
                                            <div>
                                                <p className="text-sm">{post.caption}</p>
                                                <p className="text-xs opacity-70">{new Date(post.schedule_params.scheduled_date).getHours()}:{new Date(post.schedule_params.scheduled_date).getMinutes().toString().padStart(2, '0')}</p>
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    ))}
                    
                </div>
            </div>
            <br />
            <br />
            <br />
        </>
    )
}