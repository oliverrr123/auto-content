"use client";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Music4, User, X } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DroppableProps } from 'react-beautiful-dnd';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";

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

export default function CreatePost() {
    const { user, isLoading } = useAuth();
    const [uploadedFiles, setUploadedFiles] = useState<{ signedReadUrl: string, filetype: string, taggedPeople: { x: number, y: number, username: string }[], isUploading?: boolean }[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isScheduling, setIsScheduling] = useState(false);
    const [caption, setCaption] = useState('');
    const [isPublishing, setIsPublishing] = useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [showErrorDialog, setShowErrorDialog] = useState(false);
    const [showScheduleSuccessDialog, setShowScheduleSuccessDialog] = useState(false);
    const [showScheduleErrorDialog, setShowScheduleErrorDialog] = useState(false);
    const [mediaData, setMediaData] = useState<{ media_url: string, caption: string, media_type: string, permalink: string } | null>(null);
    const [showTagDialog, setShowTagDialog] = useState(false);
    const [tagText, setTagText] = useState('');
    const [publishState, setPublishState] = useState('Publish');
    const [date, setDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1));
    const [time, setTime] = useState<string>('10:00');
    const [invalidTime, setInvalidTime] = useState(false);

    const router = useRouter();

    useEffect(() => {
        if (!user && !isLoading) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (date.getDate() === new Date().getDate()) {
            const [hours, minutes] = time.split(':').map(Number);
            const now = new Date();
            const currentHours = now.getHours();
            const currentMinutes = now.getMinutes();
            
            setInvalidTime(hours < currentHours || (hours === currentHours && minutes < currentMinutes));

            console.log(hours, currentHours, minutes, currentMinutes);
            console.log(hours < currentHours || (hours === currentHours && minutes < currentMinutes));
            console.log(invalidTime);
        } else {
            setInvalidTime(false);
        }
    }, [time, date]);

    if (!user) {
        return null;
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;

        const totalFiles = uploadedFiles.length + e.target.files.length;
        if (totalFiles > 10) {
            alert('You can only upload up to 10 images');
            return;
        }

        setIsUploading(true);

        const formData = new FormData();
        const newFilesStartIndex = uploadedFiles.length;

        const newFiles: { signedReadUrl: string, filetype: string, taggedPeople: { x: number, y: number, username: string }[], isUploading?: boolean }[] = [];

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

        setUploadedFiles(prev => [...prev, ...newFiles]);

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

                // setUploadedFiles(prev => [...prev, ...signedReadUrls.map((url: { signedReadUrl: string, filetype: string, taggedPeople: { x: number, y: number, username: string }[] }) => ({
                //     signedReadUrl: url.signedReadUrl,
                //     filetype: url.filetype,
                //     taggedPeople: [],
                //     isUploading: false
                // }))])

                // const offsetLength = uploadedFiles.length + (e.target.files?.length || 0);

                setUploadedFiles(prev => {
                    return prev.map((file, index) => {
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
                    });
                });
            } else {
                console.error('Upload failed:', data.error);
                alert('Failed to upload files. Please try again.');
                setUploadedFiles(prev => prev.filter(file => !file.isUploading));
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload files. Please try again.');
            setUploadedFiles(prev => prev.filter(file => !file.isUploading));
        } finally {
            setIsUploading(false);
        }
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

    const handlePublish = async () => {
        setIsPublishing(true);
        setPublishState('Publishing...');
        try {
            let containerIdData;

            if (uploadedFiles.length > 1) {
                const containerIds = [];
                for (const file of uploadedFiles) {
                    const response = await fetch('/api/post/instagram/get-container-id', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            caption,
                            fileURL: file.signedReadUrl,
                            isCarouselItem: true,
                            taggedPeople: file.taggedPeople
                        })
                    })
                    const data = await response.json();
                    containerIds.push(data.id);
                }

                setPublishState('Creating carousel...');

                const response = await fetch('/api/post/instagram/get-carousel-container-id', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        caption,
                        containerIds
                    })
                })

                containerIdData = await response.json();
            } else {
                const response = await fetch('/api/post/instagram/get-container-id', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        caption,
                        fileURL: uploadedFiles[0].signedReadUrl,
                        fileType: uploadedFiles[0].filetype,
                        isCarouselItem: false,
                        taggedPeople: uploadedFiles[0].taggedPeople
                    })
                })

                containerIdData = await response.json();
            }

            for (const file of uploadedFiles) {
                if (file.filetype === 'video/mp4' || file.filetype === 'video/mov' || file.filetype === 'video/quicktime') {
                    let status = 'IN_PROGRESS';

                    setPublishState('Processing video...');

                    while (status === 'IN_PROGRESS') {
                        const statusResponse = await fetch('/api/post/instagram/get-container-status', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                containerId: containerIdData.id,
                                taggedPeople: file.taggedPeople
                            })
                        })

                        const statusData = await statusResponse.json();

                        status = statusData.status_code;

                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                    
                    if (status === 'ERROR') {
                        setShowErrorDialog(true);
                        setIsPublishing(false);
                        setPublishState('Publish');
                        return;
                    }
                }
            }

            setPublishState('Posting...');

            const publishContainerResponse = await fetch('/api/post/instagram/publish-container', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    containerId: containerIdData.id
                })
            })

            const publishContainerData = await publishContainerResponse.json();

            if (publishContainerData.success) {
                const mediaDataResponse = await fetch('/api/get/instagram/media', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ mediaId: publishContainerData.id })
                })

                const mediaData = await mediaDataResponse.json();
                setMediaData(mediaData);
                
                setShowSuccessDialog(true);

                for (const file of uploadedFiles) {
                    await fetch('/api/file-delete', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ fileUrl: file.signedReadUrl }),
                    });
                }

                setPublishState('Published');
                setUploadedFiles([]);
                setCaption('');
            } else {
                setShowErrorDialog(true);
            }

            setIsPublishing(false);
            setPublishState('Publish');

        } catch (error) {
            console.error('Error during publish:', error);
            setIsPublishing(false);
            setPublishState('Publish');
            setShowErrorDialog(true);
        }
    }

    const addTag = (e: React.MouseEvent<HTMLImageElement | HTMLVideoElement>, index: number) => {
        e.preventDefault();
        e.stopPropagation();

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        setUploadedFiles(prev => prev.map((file, i) => i === index ? { ...file, taggedPeople: [...file.taggedPeople, { x: x / rect.width, y: y / rect.height, username: '' }] } : file));
    }

    const closeTagDialog = () => {
        setUploadedFiles(prev => prev.map(file => ({ ...file, taggedPeople: file.taggedPeople.filter(tag => tag.username.trim() !== '') })));
    }

    const removeFile = async(fileToRemove: string) => {
        setUploadedFiles(prev => prev.filter(file => file.signedReadUrl !== fileToRemove));
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

    const handleSchedule = async () => {
        setIsScheduling(true);
        try {
            const [hours, minutes] = time.split(':').map(Number);
            const scheduledDateTime = new Date(date);
            scheduledDateTime.setHours(hours, minutes);

            // Convert to UTC
            const scheduledDateTimeUTC = new Date(
                scheduledDateTime.getUTCFullYear(),
                scheduledDateTime.getUTCMonth(),
                scheduledDateTime.getUTCDate(),
                scheduledDateTime.getUTCHours(),
                scheduledDateTime.getUTCMinutes()
            );

            // Check if trying to schedule in the past
            if (scheduledDateTime <= new Date()) {
                setShowScheduleErrorDialog(true);
                return;
            }

            const response = await fetch('/api/post/instagram/schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    uploadedFiles: uploadedFiles,
                    caption: caption,
                    scheduledDate: scheduledDateTimeUTC
                })
            })

            const data = await response.json();

            if (data.error) {
                setShowScheduleErrorDialog(true);
            }

            setShowScheduleSuccessDialog(true);
        } catch (error) {
            console.error('Error scheduling post:', error);
            setShowScheduleErrorDialog(true);
        } finally {
            setIsScheduling(false);
        }
    }

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const items = Array.from(uploadedFiles);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setUploadedFiles(items);
    }

    if (user) {
        return (
            <div className="pb-16">
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
                                    {uploadedFiles.length > 0 &&
                                        uploadedFiles.map((file, index) => (
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
                                disabled={isUploading || uploadedFiles.length >= 10}
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
    
                <div className="mt-4 relative">
                    <textarea
                        className="w-full p-4 rounded-xl focus:outline-none relative"
                        placeholder="Write a caption..."
                        rows={4}
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                    />
                    <img src="/icons/ai-2.svg" className="absolute right-4 top-4 w-6 h-6"></img>
                </div>
                <div className="flex flex-col mt-4 rounded-xl overflow-hidden">
                    <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
                    <DialogTrigger className="outline-none">
                        <div className="flex justify-between gap-2 items-center p-4 bg-white w-full">
                            <div className="flex gap-2 items-center">
                                <User className="w-6 h-6 stroke-[1.6]" />
                                <p className="text-xl">Tag people</p>
                            </div>
                            <p className="max-w-[200px] truncate text-sm text-slate-500 overflow-hidden text-ellipsis">
                                {[...new Set(uploadedFiles.flatMap(file => file.taggedPeople.map(person => person.username.length > 0 && ` @${person.username}`)))].join(', ')}
                            </p>
                        </div>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                        <DialogTitle>Tag people</DialogTitle>
                        </DialogHeader>

                        <div>
                            <div className="mt-4 flex gap-4 overflow-x-auto w-full no-scrollbar">
                                {uploadedFiles.length > 0 && (
                                    uploadedFiles.map((file, index) => (
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
                                                                    setUploadedFiles(prev => prev.map((file, i) => i === index ? { ...file, taggedPeople: newTags } : file));
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
                                                                    setUploadedFiles(prev => prev.map((file, i) => i === index ? { ...file, taggedPeople: newTags } : file));
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
                    <hr className="border-slate-200" />
                    <button className="flex gap-2 items-center p-4 bg-white w-full disabled:text-slate-400 disabled:cursor-not-allowed" disabled>
                        <MapPin className="w-6 h-6 stroke-[1.6]" />
                        <p className="text-xl">Add location</p>
                    </button>
                    <hr className="border-slate-200" />
                    <button className="flex gap-2 items-center p-4 bg-white w-full disabled:text-slate-400 disabled:cursor-not-allowed" disabled>
                        <Music4 className="w-6 h-6 stroke-[1.6]" />
                        <p className="text-xl">Add music</p>
                    </button>
                </div>
                <Dialog>
                <DialogTrigger asChild>
                    <Button className="rounded-2xl font-semibold text-xl p-6 mt-4 w-full hover:bg-blue-500" disabled={isUploading || uploadedFiles.length === 0 || isPublishing}>
                        {publishState}
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-2xl">Are sure you want post?</DialogTitle>
                        <DialogDescription>
                            This will create a new post on your Instagram account.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="w-full flex gap-3">
                        <DialogClose className="rounded-2xl text-xl p-3 w-full text-slate-500 bg-white drop-shadow-sexy">
                            Cancel
                        </DialogClose>
                        <DialogClose onClick={handlePublish} disabled={isUploading || uploadedFiles.length === 0 || isPublishing || isScheduling} className="rounded-2xl font-semibold text-xl p-3 w-full drop-shadow-sexy bg-primary text-white hover:bg-blue-500">
                            {isPublishing ? 'Publishing...' : 'Publish'}
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
                </Dialog>

                <Dialog>
                <DialogTrigger asChild>
                    <Button className="rounded-2xl font-semibold text-xl p-6 mt-2 w-full bg-white text-slate-500" disabled={isUploading || uploadedFiles.length === 0 || isPublishing}>
                        Schedule
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-2xl">Schedule post</DialogTitle>
                        <DialogDescription>
                            Schedule a post to be published at a later date.
                        </DialogDescription>
                    </DialogHeader>
                    <Card className="w-fit pt-4 mx-auto">
                    <CardContent className="px-4">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={(newDate) => newDate && setDate(newDate)}
                            className="bg-transparent p-0"
                            style={{'--cell-size': '40px'} as React.CSSProperties}
                            disabled={(date) => date < new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()) || date > new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate())}
                            required
                        />
                    </CardContent>
                    <CardFooter className="flex flex-col gap-6 border-t px-4 !pt-4">
                        <div className="flex w-full flex-col gap-3">
                            <Label htmlFor="time-from">Time</Label>
                            <div className="relative flex w-full items-center gap-2">
                                <Clock className="text-muted-foreground pointer-events-none absolute left-2.5 size-4 select-none" />
                                <Input
                                    id="time-from"
                                    type="time"
                                    step="60"
                                    value={time}
                                    className={`appearance-none pl-8 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none ${invalidTime ? 'border-red-500' : ''}`}
                                    onChange={(e) => setTime(e.target.value)}
                                    onBlur={() => console.log(time)}
                                />
                            </div>
                            {invalidTime && (
                                <p className="text-sm text-red-500">
                                    This time is in the past
                                </p>
                            )}
                        </div>
                    </CardFooter>
                    </Card>
                    <DialogFooter className="w-full flex gap-3">
                        <DialogClose className="rounded-2xl text-xl p-3 w-full text-slate-500 bg-white drop-shadow-sexy">
                            Cancel
                        </DialogClose>
                        <DialogClose onClick={handleSchedule} disabled={isUploading || uploadedFiles.length === 0 || isPublishing || invalidTime || isScheduling} className="rounded-2xl font-semibold text-xl p-3 w-full drop-shadow-sexy bg-primary disabled:opacity-50 disabled:cursor-not-allowed text-white hover:bg-blue-500">
                            {isScheduling ? 'Scheduling...' : 'Schedule'}
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
                </Dialog>

                <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                <DialogContent className="bg-slate-100">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">Post published!</DialogTitle>
                        <DialogDescription>
                            Your post has been successfully published to Instagram.
                        </DialogDescription>
                    </DialogHeader>
                    {mediaData && (
                        <div className="flex flex-col items-center justify-center bg-white rounded-xl drop-shadow-sexy">
                            <Image src={mediaData.media_url} unoptimized alt={caption.length > 0 ? caption : 'Post'} width={256} height={256} className="w-full rounded-t-xl" />
                            <div className="p-4 border-t border-slate-200 w-full">
                                <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{mediaData.caption}</p>
                                <a href={mediaData.permalink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500">View on Instagram</a>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <DialogClose className="rounded-2xl font-semibold text-xl p-2 drop-shadow-sexy w-full bg-primary text-white hover:bg-blue-500" onClick={() => { window.location.href = '/' }}>Done</DialogClose>
                    </DialogFooter>
                </DialogContent>
                </Dialog>

                <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="text-2xl">Error publishing post</DialogTitle>
                            <DialogDescription>
                                Failed to publish post. Please try again.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <DialogClose className="rounded-2xl font-medium text-xl p-2 mt-4 w-full drop-shadow-sexy bg-primary text-white hover:bg-blue-500">OK</DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={showScheduleSuccessDialog} onOpenChange={setShowScheduleSuccessDialog}>
                <DialogContent className="bg-slate-100">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">Post scheduled!</DialogTitle>
                        <DialogDescription>
                            Your post has been successfully scheduled to be published at {time} on {new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose className="rounded-2xl font-semibold text-xl p-2 drop-shadow-sexy w-full bg-primary text-white hover:bg-blue-500" onClick={() => { window.location.href = '/scheduling' }}>Done</DialogClose>
                    </DialogFooter>
                </DialogContent>
                </Dialog>

                <Dialog open={showScheduleErrorDialog} onOpenChange={setShowScheduleErrorDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="text-2xl">Error scheduling post</DialogTitle>
                            <DialogDescription>
                                Failed to schedule post. Please try again.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <DialogClose className="rounded-2xl font-medium text-xl p-2 mt-4 w-full drop-shadow-sexy bg-primary text-white hover:bg-blue-500">OK</DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
           </div>
        )
    }
}