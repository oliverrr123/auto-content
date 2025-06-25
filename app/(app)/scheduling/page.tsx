'use client';
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, X, User } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DroppableProps } from 'react-beautiful-dnd';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter, DialogDescription } from "@/components/ui/dialog";
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

const StrictModeDroppable = ({ children, ...props }: DroppableProps) => {
    const [enabled, setEnabled] = useState(false);
    useEffect(() => {
        const animation = requestAnimationFrame(() => setEnabled(true));
        return () => {
            cancelAnimationFrame(animation);
            setEnabled(false);
        }
    }, []);
    if (!enabled) {
        return null;
    }
    return <Droppable {...props}>{children}</Droppable>;
}


export default function Scheduling() {
    const { user, isLoading } = useAuth();

    const router = useRouter();

    const [posts, setPosts] = useState<Post[]>([]);
    const [currentPosts, setCurrentPosts] = useState<Post[][]>([]);
    const [currentWeekDay, setCurrentWeekDay] = useState<Date>(new Date());
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [editPostId, setEditPostId] = useState<string | null>(null);
    const [editedPost, setEditedPost] = useState<Post | null>(null);
    const [showTagDialog, setShowTagDialog] = useState(false);
    const [tagText, setTagText] = useState('');

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;
    
        const items = Array.from(editedPost?.params ?? []);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
    
        setEditedPost(prev => {
            if (!prev) return null;
            return {
                ...prev,
                params: items
            };
        });
    }

    const removeFile = async(fileToRemove: string) => {
        setEditedPost(prev => {
            if (!prev) return null;
            return {
                ...prev,
                params: prev.params.filter(file => file.signedReadUrl !== fileToRemove)
            };
        });
        try {
            const response = await fetch('/api/file-delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fileUrl: fileToRemove
                }),
            });

            const data = await response.json();
            
            if (!response.ok || !data.success) {
                const errorMessage = data.error || 'Unknown error occurred';
                console.error('Failed to delete file:', errorMessage);
                alert(`Failed to delete file: ${errorMessage}`);
            }
        } catch (error) {
            console.error('Network error while deleting file:', error);
            alert('Network error while trying to delete file. Please try again.');
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;

        const totalFiles = editedPost?.params.length ?? 0 + e.target.files.length;
        if (totalFiles > 10) {
            alert('You can only upload up to 10 images');
            return;
        }

        setIsUploading(true);

        const formData = new FormData();
        const newFilesStartIndex = editedPost?.params.length ?? 0;

        const newFiles: { signedReadUrl: string, filetype: string, taggedPeople: { x: number, y: number, username: string }[], isUploading: boolean }[] = [];

        for (const file of e.target.files) {
            if (file.type.startsWith('video/')) {
                const duration: number = await new Promise((resolve) => {
                    const video = document.createElement('video');
                    video.preload = 'metadata';
                    video.onloadedmetadata = () => {
                        resolve(video.duration);
                    }
                    video.src = URL.createObjectURL(file);
                })
                if (duration < 3) {
                    alert('Video duration must be at least 3 seconds');
                    setIsUploading(false);
                    return;
                } else if (duration > 180) {
                    alert('Video duration must be less than 3 minutes');
                    setIsUploading(false);
                    return;
                }
            }

            newFiles.push({
                signedReadUrl: URL.createObjectURL(file),
                filetype: file.type,
                taggedPeople: [],
                isUploading: true
            });

            formData.append('file', JSON.stringify({ filename: file.name, filetype: file.type }));
        }

        setEditedPost(prev => {
            if (!prev) return null;
            return {
                ...prev,
                params: [...prev.params, ...newFiles]
            };
        });

        try {
            const response = await fetch('/api/file-upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json()

            if (data.success) {
                const signedWriteUrls = data.signedWriteUrls;
                const signedReadUrls = data.signedReadUrls;

                for (let i = 0; i < e.target.files.length; i++) {
                    await uploadToGoogleCloud(signedWriteUrls[i].signedWriteUrl, e.target.files[i])
                }

                setEditedPost(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        params: prev.params.map((file, index) => {
                            if (file.isUploading) {
                                const signedUrlIndex = index - newFilesStartIndex;
                                return {
                                    signedReadUrl: signedReadUrls[signedUrlIndex].signedReadUrl,
                                    filetype: signedReadUrls[signedUrlIndex].filetype,
                                    taggedPeople: [],
                                    isUploading: false
                                };
                            }
                            return file;
                        })
                    }
                });
            } else {
                console.error('Upload failed:', data.error);
                alert('Failed to upload files. Please try again.');
                setEditedPost(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        params: prev.params.filter(file => !file.isUploading)
                    };
                });
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload files. Please try again.');
            setEditedPost(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    params: prev.params.filter(file => !file.isUploading)
                };
            });
        } finally {
            setIsUploading(false);
        }
    }

    const addTag = (e: React.MouseEvent<HTMLImageElement | HTMLVideoElement>, index: number) => {
        e.preventDefault();
        e.stopPropagation();

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        setEditedPost(prev => {
            if (!prev) return null;
            return {
                ...prev,
                params: prev.params.map((file, i) => i === index ? { ...file, taggedPeople: [...file.taggedPeople, { x: x / rect.width, y: y / rect.height, username: '' }] } : file)
            };
        });
    }

    const closeTagDialog = () => {
        setEditedPost(prev => {
            if (!prev) return null;
            return {
                ...prev,
                params: prev.params.map(file => ({ ...file, taggedPeople: file.taggedPeople.filter(tag => tag.username.trim() !== '') }))
            };
        });
    }

    async function uploadToGoogleCloud(signedWriteUrl: string, file: File) {
        return new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', signedWriteUrl, true);
            xhr.setRequestHeader('Content-Type', file.type);

            // xhr.upload.onprogress = (event) => {
            //     if (event.lengthComputable) {
            //         uploadProgress[index] = Math.round((event.loaded / event.total) * 100);
            //         // console.log(`Upload progress (${file.name}): ${uploadProgress[index]}%`)
            //     }
            // };

            xhr.onload = () => {
                if (xhr.status === 200) {
                    // console.log("File uploaded successfully");
                    resolve();
                } else {
                    console.error("Failed to upload file");
                    reject(new Error("Upload failed"));
                }
            };

            xhr.onerror = () => reject(new Error("Upload error"));
            xhr.send(file);
        });
    }
    
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

    useEffect(() => {
        if (editPostId) {
            const post = posts.find(post => post.id === editPostId);
            if (post) {
                setEditedPost(post);
            }
        }
    }, [editPostId]);

    const [expandedCaptions, setExpandedCaptions] = useState<{ [key: string]: boolean }>({});

    const toggleCaption = (postId: string) => {
        setExpandedCaptions(prev => ({
        ...prev,
        [postId]: !prev[postId]
        }));
    };

    const saveEdits = () => {
        setPosts(prev => prev.map(post => post.id === editedPost?.id ? editedPost : post));
        setShowEditDialog(false);
    }

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
                                                <DialogClose className="rounded-2xl font-medium text-xl p-2 drop-shadow-sexy w-full bg-primary text-white hover:bg-blue-500" onClick={() => {setShowEditDialog(true); setEditPostId(post.id)}}>Edit</DialogClose>
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
                    <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                    <DialogContent className="bg-slate-100 [&>button]:hidden max-h-[90vh] overflow-y-auto">
                        <DialogHeader className="hidden">
                            <DialogTitle>Instagram post</DialogTitle>
                        </DialogHeader>
                        <DragDropContext onDragEnd={handleDragEnd}>
                            <div className="mt-4 flex gap-4 overflow-x-auto w-full no-scrollbar">
                                <StrictModeDroppable
                                    droppableId="files"
                                    direction="horizontal"
                                    isDropDisabled={false}
                                    isCombineEnabled={false}
                                    ignoreContainerClipping={false}
                                >
                                    {(provided: DroppableProvided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className="flex gap-4"
                                        >
                                            {editedPost && editedPost.params.length > 0 &&
                                                editedPost.params.map((file, index) => (
                                                    <Draggable key={file.signedReadUrl} draggableId={file.signedReadUrl} index={index}>
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                className="relative flex-shrink-0 w-64 h-auto"
                                                                style={{
                                                                    ...provided.draggableProps.style,
                                                                    opacity: snapshot.isDragging ? 0.5 : 1
                                                                }}
                                                            >
                                                                {file.filetype === 'video/mp4' || file.filetype === 'video/mov' || file.filetype === 'video/quicktime' ? (
                                                                    <div className="relative">
                                                                        <video 
                                                                            src={file.signedReadUrl} 
                                                                            className="w-full object-cover rounded-xl" 
                                                                            poster={file.signedReadUrl}
                                                                            controls
                                                                        />
                                                                        {file.isUploading && (
                                                                            <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                                                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : ( 
                                                                    <div className="relative">
                                                                        <Image
                                                                            src={file.signedReadUrl}
                                                                            alt={file.signedReadUrl}
                                                                            width={256}
                                                                            height={256}
                                                                            className="w-full object-cover rounded-xl"
                                                                            unoptimized
                                                                        />
                                                                        {file.isUploading && (
                                                                            <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                                                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                <button onClick={() => removeFile(file.signedReadUrl)} className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70">
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))
                                            }
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </StrictModeDroppable>
                                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-slate-400 transition-colors cursor-pointer flex-shrink-0 w-64">
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/jpg, image/jpeg, image/png, image/gif, image/webp, video/mp4, video/mov, video/quicktime"
                                        id="file-upload"
                                        multiple
                                        onChange={handleFileUpload}
                                        disabled={isUploading || (editedPost?.params.length ?? 0) >= 10}
                                    />
                                    <label htmlFor="file-upload" className="cursor-pointer flex items-center justify-center h-full">
                                        <div className="text-slate-500">
                                            <svg 
                                                className="mx-auto h-12 w-12 mb-4" 
                                                stroke="currentColor" 
                                                fill="none" 
                                                viewBox="0 0 48 48" 
                                                aria-hidden="true"
                                            >
                                                <path 
                                                    strokeLinecap="round" 
                                                    strokeLinejoin="round" 
                                                    strokeWidth={2} 
                                                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" 
                                                />
                                            </svg>
                                            <p className="text-sm">{isUploading ? 'Uploading...' : 'Click to upload or drag and drop'}</p>
                                            <p className="text-xs mt-1 text-slate-400">PNG, JPG, GIF, MP4, MOV</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </DragDropContext>
            
                        <div className="relative">
                            <textarea
                                className="w-full p-4 rounded-xl focus:outline-none relative"
                                placeholder="Write a caption..."
                                rows={4}
                                value={editedPost?.caption ?? ''}
                                onChange={(e) => setEditedPost(prev => {
                                    if (!prev) return null;
                                    return {
                                        ...prev,
                                        caption: e.target.value
                                    };
                                })}
                            />
                            <img src="/icons/ai-2.svg" className="absolute right-4 top-4 w-6 h-6"></img>
                        </div>
                        <div className="flex flex-col rounded-xl overflow-hidden">
                            <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
                            <DialogTrigger className="outline-none">
                                <div className="flex justify-between gap-2 items-center p-4 bg-white w-full">
                                    <div className="flex gap-2 items-center">
                                        <User className="w-6 h-6 stroke-[1.6]" />
                                        <p className="text-xl">Tag people</p>
                                    </div>
                                    <p className="max-w-[200px] truncate text-sm text-slate-500 overflow-hidden text-ellipsis">
                                        {[...new Set(editedPost?.params.flatMap(file => file.taggedPeople.map(person => person.username.length > 0 && ` @${person.username}`)))].join(', ')}
                                    </p>
                                </div>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                <DialogTitle>Tag people</DialogTitle>
                                </DialogHeader>

                                <div>
                                    <div className="mt-4 flex gap-4 overflow-x-auto w-full no-scrollbar">
                                        {(editedPost?.params.length ?? 0) > 0 && (
                                            editedPost?.params.map((file, index) => (
                                                <div key={file.signedReadUrl} className="relative flex-shrink-0 w-[80%] first:ml-[10%] h-auto">
                                                    {file.filetype === 'video/mp4' || file.filetype === 'video/mov' || file.filetype === 'video/quicktime' ? (
                                                        <div className="relative">
                                                            <video 
                                                                src={file.signedReadUrl} 
                                                                className="w-full object-cover rounded-xl" 
                                                                onClick={(e) => addTag(e, index)}
                                                                poster={file.signedReadUrl}
                                                            />
                                                            {file.taggedPeople.map((tag, index2) => (
                                                                <div key={index} className="absolute flex flex-col items-center top-0 left-0 bg-opacity-50 rounded-xl" style={{ left: `calc(${tag.x * 100}% - 50px)`, top: `calc(${tag.y * 100}% - 9px)` }}>
                                                                    <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[12px] border-l-transparent border-r-transparent border-b-black/50"></div>
                                                                    <input 
                                                                        className="text-white bg-black/50 rounded-xl py-1 px-4 w-[100px] text-center" 
                                                                        value={tag.username} 
                                                                        onChange={(e) => {
                                                                            const newTags = [...file.taggedPeople];
                                                                            newTags[index2].username = e.target.value;
                                                                            setTagText([...tagText.split(', '), newTags.map(person => `@${person.username}`)].join(', '));
                                                                            setEditedPost(prev => {
                                                                                if (!prev) return null;
                                                                                return {
                                                                                    ...prev,
                                                                                    params: prev.params.map((file, i) => i === index ? { ...file, taggedPeople: newTags } : file)
                                                                                };
                                                                            });
                                                                        }}
                                                                        onKeyDown={(e) => { if (e.key === 'Enter') { closeTagDialog(); setShowTagDialog(false); }}}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : ( 
                                                        <div className="relative">
                                                            <Image
                                                                src={file.signedReadUrl}
                                                                alt={file.signedReadUrl}
                                                                width={256}
                                                                height={256}
                                                                className="w-full object-cover rounded-xl"
                                                                unoptimized
                                                                onClick={(e) => addTag(e, index)}
                                                            />
                                                            {file.taggedPeople.map((person, index2) => (
                                                                <div key={index2} className="absolute flex flex-col items-center top-0 left-0 bg-opacity-50 rounded-xl" style={{ left: `calc(${person.x * 100}% - 50px)`, top: `calc(${person.y * 100}% - 9px)` }}>
                                                                    <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[12px] border-l-transparent border-r-transparent border-b-black/50"></div>
                                                                    <input 
                                                                        className="text-white bg-black/50 rounded-xl py-1 px-4 w-[100px] text-center" 
                                                                        value={person.username} 
                                                                        onChange={(e) => {
                                                                            const newTags = [...file.taggedPeople];
                                                                            newTags[index2].username = e.target.value;
                                                                            setTagText([...tagText.split(', '), newTags.map(person => `@${person.username}`)].join(', '));
                                                                            setEditedPost(prev => {
                                                                                if (!prev) return null;
                                                                                return {
                                                                                    ...prev,
                                                                                    params: prev.params.map((file, i) => i === index ? { ...file, taggedPeople: newTags } : file)
                                                                                };
                                                                            });
                                                                        }}
                                                                        onKeyDown={(e) => { if (e.key === 'Enter') { closeTagDialog(); setShowTagDialog(false); }}}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500 mb-3 mt-6">Tap the image to tag people</p>
                                </div>

                                <DialogClose asChild>
                                    <Button className="text-xl font-semibold h-12 p-0 rounded-2xl hover:bg-blue-500" onClick={closeTagDialog}>Done</Button>
                                </DialogClose>
                            </DialogContent>
                            </Dialog>
                        </div>
                        <DialogFooter className="flex gap-3">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="rounded-2xl font-medium text-xl p-2 drop-shadow-sexy w-full bg-white text-slate-700">Cancel</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Cancel editing post?</DialogTitle>
                                    </DialogHeader>
                                    <DialogFooter className="flex gap-3">
                                        <DialogClose className="rounded-2xl font-medium text-xl p-2 drop-shadow-sexy w-full bg-white text-slate-700">Go back</DialogClose>
                                        <DialogClose onClick={() => setShowEditDialog(false)} className="rounded-2xl font-medium text-xl p-2 drop-shadow-sexy w-full bg-primary text-white hover:bg-blue-500">Cancel editing</DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="rounded-2xl font-medium text-xl p-2 drop-shadow-sexy w-full bg-primary text-white hover:bg-blue-500">Save</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Save edits?</DialogTitle>
                                    </DialogHeader>
                                    <DialogFooter className="flex gap-3">
                                        <DialogClose className="rounded-2xl font-medium text-xl p-2 drop-shadow-sexy w-full bg-white text-slate-700">Cancel</DialogClose>
                                        <DialogClose onClick={saveEdits} className="rounded-2xl font-medium text-xl p-2 drop-shadow-sexy w-full bg-primary text-white hover:bg-blue-500">Save</DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </DialogFooter>
                    </DialogContent>
                    </Dialog>
                </div>
            </div>
        </>
    )
}