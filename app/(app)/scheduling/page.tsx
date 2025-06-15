"use client";
import InDevelopment from "@/components/in-development";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ChevronLeftIcon, ChevronRightIcon, Clock2Icon } from "lucide-react";

export default function Scheduling() {
    const { user, isLoading } = useAuth();

    const router = useRouter();

    useEffect(() => {
        if (!user && !isLoading) {
            router.push('/login');
        }
    }, [user, isLoading, router]);


    if (!user) {
        return null;
    }

    return (
        <>
            <Card className="w-fit pt-4 mx-auto">
            <CardContent className="px-4">
                <Calendar
                mode="single"
                // selected={date}
                // onSelect={setDate}
                className="bg-transparent p-0"
                style={{'--cell-size': '40px'} as React.CSSProperties}
                />
            </CardContent>
            <CardFooter className="flex flex-col gap-6 border-t px-4 !pt-4">
                <div className="flex w-full flex-col gap-3">
                    <Label htmlFor="time-from">Time</Label>
                    <div className="relative flex w-full items-center gap-2">
                        <Clock2Icon className="text-muted-foreground pointer-events-none absolute left-2.5 size-4 select-none" />
                        <Input
                            id="time-from"
                            type="time"
                            step="1"
                            // defaultValue={time || '10:30:00'}
                            className="appearance-none pl-8 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                            // onChange={(e) => setTime(e.target.value)}
                        />
                    </div>
                </div>
            </CardFooter>
            </Card>

            <br />

            <div className="w-full bg-white rounded-xl overflow-hidden">
                <div className="flex items-center justify-between py-2 border-b border-slate-200">
                    <Button size="icon" variant="ghost"><ChevronLeftIcon /></Button>
                    <p>This week</p>
                    <Button size="icon" variant="ghost"><ChevronRightIcon /></Button>
                </div>

                <div className="grid grid-rows-7 grid-cols-[auto_1fr] divide-x divide-y divide-dashed divide-slate-200 -m-[1px]">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                        <div key={index} className={`p-2 col-start-1 col-end-2 flex items-center text-slate-500`} style={{gridRow: `${index + 1} / ${index + 2}`}}>
                            <p>{day}</p>
                        </div>
                    ))}
                    {[
                        [{ title: 'Best times to post on IG', time: '10:00' }, { title: 'Social media tips this is a long text', time: '10:00' }],
                        [{ title: 'Social media tips', time: '10:00' }],
                        [{ title: 'How to achieve greatness?', time: '10:00' }],
                        [{ title: 'Social media tips', time: '10:00' }],
                        [{ title: 'Social media tips', time: '10:00' }],
                        [{ title: 'Social media tips', time: '10:00' }],
                        [{ title: 'Social media tips', time: '10:00' }],
                    ].map((day, index) => (
                        <div key={index} className={`col-start-2 col-end-3 p-1 overflow-x-auto no-scrollbar`} style={{gridRow: `${index + 1} / ${index + 2}`}}>
                            <div className="flex gap-2">
                                {day.map((post, index2) => (
                                    <div key={index2} className='px-3 py-2 bg-primary text-white rounded-xl whitespace-nowrap'>
                                        <p>{post.title}</p>
                                        <p className="text-sm opacity-70">{post.time}</p>
                                    </div>
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