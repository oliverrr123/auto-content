"use client";
import { Button } from "@/components/ui/button";
import { MapPin, Music4, User, X } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DroppableProps } from 'react-beautiful-dnd';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
    const [uploadedFiles, setUploadedFiles] = useState<{ signedReadUrl: string, filetype: string, taggedPeople: { x: number, y: number, username: string }[] }[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [caption, setCaption] = useState('');
    const [isPublishing, setIsPublishing] = useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [showErrorDialog, setShowErrorDialog] = useState(false);
    const [mediaData, setMediaData] = useState<{ media_url: string, caption: string, media_type: string, permalink: string } | null>(null);
    const [showTagDialog, setShowTagDialog] = useState(false);

    const router = useRouter();

    useEffect(() => {
        if (!user && !isLoading) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

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

        Array.from(e.target.files).forEach((file) => {
            formData.append('file', JSON.stringify({ filename: file.name, filetype: file.type }));
        })

        try {
            const response = await fetch('/api/file-upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json()

            if (data.success) {
                const signedWriteUrls = data.signedWriteUrls;
                const signedReadUrls = data.signedReadUrls;

                for (let i=0; i < e.target.files.length; i++) {
                    await uploadToGoogleCloud(signedWriteUrls[i].signedWriteUrl, e.target.files[i])
                }

                setUploadedFiles(prev => [...prev, ...signedReadUrls.map((url: { signedReadUrl: string, filetype: string, taggedPeople: { x: number, y: number, username: string }[] }) => ({
                    signedReadUrl: url.signedReadUrl,
                    filetype: url.filetype,
                    taggedPeople: []
                }))])
            } else {
                console.error('Upload failed:', data.error);
                alert('Failed to upload files. Please try again.');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload files. Please try again.');
        } finally {
            setIsUploading(false);
        }
    }

    async function uploadToGoogleCloud(signedWriteUrl: string, file: File) {
        return new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', signedWriteUrl, true);
            xhr.setRequestHeader('Content-Type', file.type);

            console.log(signedWriteUrl)

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
                        return;
                    }
                }
            }

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

                setUploadedFiles([]);
                setCaption('');
            } else {
                setShowErrorDialog(true);
            }

            setIsPublishing(false);


        } catch (error) {
            console.error('Error during publish:', error);
            setIsPublishing(false);
            setShowErrorDialog(true);
        }
    }

    const addTag = (e: React.MouseEvent<HTMLImageElement | HTMLVideoElement>, index: number) => {
        e.preventDefault();
        e.stopPropagation();

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        console.log('--------------------------------');
        console.log(`Relative position: x=${x}px, y=${y}px`);
        console.log(`Image dimensions: ${rect.width}px x ${rect.height}px`);
        console.log(x / rect.width);
        console.log(y / rect.height);
        console.log('--------------------------------');

        
        setUploadedFiles(prev => prev.map((file, i) => i === index ? { ...file, taggedPeople: [...file.taggedPeople, { x: x / rect.width, y: y / rect.height, username: '' }] } : file));
        
        // Focus will happen in the next render when the new input is created
        // setTimeout(() => {
        //     lastInputRef.current?.focus();
        // }, 0);
    }

    const closeTagDialog = () => {
        setUploadedFiles(prev => prev.map(file => ({ ...file, taggedPeople: file.taggedPeople.filter(tag => tag.username.trim() !== '') })));
    }

    const removeFile = async(fileToRemove: string) => {
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
            
            if (response.ok && data.success) {
                setUploadedFiles(prev => prev.filter(file => file.signedReadUrl !== fileToRemove));
            } else {
                const errorMessage = data.error || 'Unknown error occurred';
                console.error('Failed to delete file:', errorMessage);
                alert(`Failed to delete file: ${errorMessage}`);
            }
        } catch (error) {
            console.error('Network error while deleting file:', error);
            alert('Network error while trying to delete file. Please try again.');
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
                                                            <video src={file.signedReadUrl} className="w-full object-cover rounded-xl" controls />
                                                        ) : ( 
                                                            <Image
                                                                src={file.signedReadUrl}
                                                                alt={file.signedReadUrl}
                                                                width={256}
                                                                height={256}
                                                                className="w-full object-cover rounded-xl"
                                                                unoptimized
                                                            />
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
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-gray-400 transition-colors cursor-pointer flex-shrink-0 w-64">
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
                                <div className="text-gray-500">
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
                                    <p className="text-sm">
                                        {isUploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                                    </p>
                                    <p className="text-xs mt-1">PNG, JPG, GIF up to 10MB</p>
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
                        <div className="flex gap-2 items-center p-4 bg-white w-full">
                            <User className="w-6 h-6 stroke-[1.6]" />
                            <p className="text-xl">Tag people</p>
                        </div>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                        <DialogTitle>Tag people</DialogTitle>
                        </DialogHeader>

                        {/* <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 p-4 bg-white rounded-xl w-full">
                                <User className="w-6 h-6 stroke-[1.6] text-slate-400" />
                                <input type="url" className="w-full outline-none focus:outline-none" placeholder="username" value={tagValue} onChange={(e) => setTagValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        if (tagValue.length > 0) {
                                            addTag();
                                        } else {
                                            setShowTagDialog(false);
                                        }
                                    }
                                }} />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {taggedPeople.map((person, index) => (
                                    <div key={index} className="flex items-center gap-2 p-2 bg-white rounded-xl">
                                        <User className="w-6 h-6 stroke-[1.6] text-slate-400" />
                                        <p className="text-sm">{person}</p>
                                        <X className="w-4 h-4" onClick={() => setTaggedPeople(prev => prev.filter(p => p !== person))} />
                                    </div>
                                ))}
                            </div>
                        </div> */}

                        <div>
                            <div className="mt-4 flex gap-4 overflow-x-auto w-full no-scrollbar">
                                {uploadedFiles.length > 0 && (
                                    uploadedFiles.map((file, index) => (
                                        <div key={file.signedReadUrl} className="relative flex-shrink-0 w-[80%] first:ml-[10%] h-auto">
                                            {file.filetype === 'video/mp4' || file.filetype === 'video/mov' || file.filetype === 'video/quicktime' ? (
                                                <div className="relative">
                                                    <video src={file.signedReadUrl} className="w-full object-cover rounded-xl" controls onClick={(e) => addTag(e, index)} />
                                                    {file.taggedPeople.map((tag, index2) => (
                                                        <div key={index} className="absolute flex flex-col items-center top-0 left-0 bg-opacity-50 rounded-xl" style={{ left: `calc(${tag.x * 100}% - 50px)`, top: `calc(${tag.y * 100}% - 9px)` }}>
                                                            <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[12px] border-l-transparent border-r-transparent border-b-black/50"></div>
                                                            <input 
                                                                // ref={tags.length - 1 === index ? lastInputRef : undefined}
                                                                className="text-white bg-black/50 rounded-xl py-1 px-4 w-[100px] text-center" 
                                                                value={tag.username} 
                                                                onChange={(e) => {
                                                                    const newTags = [...file.taggedPeople];
                                                                    newTags[index2].username = e.target.value;
                                                                    setUploadedFiles(prev => prev.map(file => ({ ...file, taggedPeople: newTags })));
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
                                                                // ref={tags.length - 1 === index ? lastInputRef : undefined}
                                                                className="text-white bg-black/50 rounded-xl py-1 px-4 w-[100px] text-center" 
                                                                value={person.username} 
                                                                onChange={(e) => {
                                                                    const newTags = [...file.taggedPeople];
                                                                    newTags[index2].username = e.target.value;
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
                    <div className="flex gap-2 items-center p-4 bg-white w-full">
                        <MapPin className="w-6 h-6 stroke-[1.6]" />
                        <p className="text-xl">Add location</p>
                    </div>
                    <hr className="border-slate-200" />
                    <div className="flex gap-2 items-center p-4 bg-white w-full">
                        <Music4 className="w-6 h-6 stroke-[1.6]" />
                        <p className="text-xl">Add music</p>
                    </div>
                </div>
                <Dialog>
                <DialogTrigger asChild>
                    <Button className="rounded-2xl font-semibold text-xl p-6 mt-4 w-full hover:bg-blue-500" disabled={isUploading || uploadedFiles.length === 0 || isPublishing}>
                        {isPublishing ? 'Publishing...' : 'Publish'}
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
                        <DialogClose onClick={handlePublish} disabled={isUploading || uploadedFiles.length === 0 || isPublishing} className="rounded-2xl font-semibold text-xl p-3 w-full drop-shadow-sexy bg-primary text-white hover:bg-blue-500">
                            {isPublishing ? 'Publishing...' : 'Publish'}
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
                            <Image src={mediaData.media_url} alt={mediaData.caption} width={256} height={256} className="w-full rounded-t-xl" />
                            <div className="p-4 border-t border-slate-200 w-full">
                                <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{mediaData.caption}</p>
                                <a href={mediaData.permalink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500">View on Instagram</a>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <DialogClose className="rounded-2xl font-semibold text-xl p-2 drop-shadow-sexy w-full bg-primary text-white hover:bg-blue-500" onClick={() => { router.push('/') }}>Done</DialogClose>
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
           </div>
        )
    }
}