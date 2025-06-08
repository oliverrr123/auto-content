"use client";
import { Button } from "@/components/ui/button";
import { MapPin, Music4, User, X } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CreatePost() {
    const { user, isLoading } = useAuth();
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [caption, setCaption] = useState('');

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
                    await uploadToGoogleCloud(signedWriteUrls[i], e.target.files[i])
                }


                setUploadedFiles(prev => [...prev, ...signedReadUrls])
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
        try {
            let containerIdData;

            if (uploadedFiles.length > 1) {
                const containerIds = [];
                for (const fileURL of uploadedFiles) {
                    const response = await fetch('/api/post/instagram/get-container-id', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            caption,
                            fileURL,
                            isCarouselItem: true
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
                        fileURL: uploadedFiles[0],
                        isCarouselItem: false
                    })
                })

                containerIdData = await response.json();
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
                alert('Post published successfully');
            } else {
                alert('Failed to publish post');
            }

            for (const fileUrl of uploadedFiles) {
                await fetch('/api/file-delete', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ fileUrl }),
                });
            }

        } catch (error) {
            console.error('Error during publish:', error);
        }
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
                setUploadedFiles(prev => prev.filter(file => file !== fileToRemove));
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

    if (user) {
        return (
            <div className="pb-24">
                <div className="mt-4 flex gap-4 overflow-x-auto w-full no-scrollbar">
                    {uploadedFiles.length > 0 &&
                        uploadedFiles.map((fileURL) => (
                            <div key={fileURL} className="relative flex-shrink-0 w-64 h-auto">
                                <Image
                                    src={fileURL}
                                    alt={fileURL}
                                    width={256}
                                    height={256}
                                    className="w-full object-cover rounded-xl"
                                />
                                <button onClick={() => removeFile(fileURL)} className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    }
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-gray-400 transition-colors cursor-pointer flex-shrink-0 w-64">
                        <input 
                            type="file" 
                            className="hidden" 
                            accept="image/jpg, image/jpeg, image/png, image/gif"
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
    
                <div className="mt-4">
                    <textarea
                        className="w-full p-4 rounded-xl focus:outline-none"
                        placeholder="Write a caption..."
                        rows={4}
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                    />
                </div>
                <div className="flex flex-col mt-4 rounded-xl overflow-hidden">
                    <div className="flex gap-3 items-center p-4 bg-white w-full">
                        <User className="w-8 h-8 stroke-[1.6]" />
                        <p className="text-2xl">Tag people</p>
                    </div>
                    <hr className="border-slate-200" />
                    <div className="flex gap-3 items-center p-4 bg-white w-full">
                        <MapPin className="w-8 h-8 stroke-[1.6]" />
                        <p className="text-2xl">Add location</p>
                    </div>
                    <hr className="border-slate-200" />
                    <div className="flex gap-3 items-center p-4 bg-white w-full">
                        <Music4 className="w-8 h-8 stroke-[1.6]" />
                        <p className="text-2xl">Add music</p>
                    </div>
                </div>
                <Button className="rounded-2xl font-semibold text-xl p-6 mt-4 w-full hover:bg-blue-500" onClick={handlePublish} disabled={isUploading || uploadedFiles.length === 0}>Publish</Button>
           </div>
        )
    }
}