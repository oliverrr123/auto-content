"use client";
import { AtSign, CircleCheck, Clock, Globe, InstagramIcon, LinkIcon, PlusIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorDialog from "@/components/error-dialog";
import Loader from "@/components/loader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function Context() {
    const { user, isLoading } = useAuth();

    // const [connectedAccounts, setConnectedAccounts] = useState<{ instagram: { name: string, username: string, profile_picture_url: string } } | null>(null);
    const [instagramUsername, setInstagramUsername] = useState<string>("");
    const [instagramAccess, setInstagramAccess] = useState<string>("");
    const [instagramAccessSuccess, setInstagramAccessSuccess] = useState<boolean>(false);
    const [instagramAccessError, setInstagramAccessError] = useState<string | null>(null);
    const [instagramAccessLoading, setInstagramAccessLoading] = useState<boolean>(false);
    const [connectedWebsites, setConnectedWebsites] = useState<string[]>([]);
    const [websiteUrl, setWebsiteUrl] = useState<string>("");
    const [websiteSaving, setWebsiteSaving] = useState<boolean>(false);
    const [websiteSavingError, setWebsiteSavingError] = useState<string | null>(null);
    const [websiteDeleting, setWebsiteDeleting] = useState<string | null>("");
    const [websiteDeletingError, setWebsiteDeletingError] = useState<string | null>(null);
    // const [instagramDeleting, setInstagramDeleting] = useState<boolean>(false);
    const [instagramDeletingError, setInstagramDeletingError] = useState<string | null>(null);
    const [instagramUpdating, setInstagramUpdating] = useState<boolean>(false);
    const [instagramUpdatingError, setInstagramUpdatingError] = useState<string | null>(null);
    const [websiteUpdating, setWebsiteUpdating] = useState<string | null>("");
    const [websiteUpdatingError, setWebsiteUpdatingError] = useState<string | null>(null);
    // const [websiteSavingSuccess, setWebsiteSavingSuccess] = useState<boolean>(false);
    // const [documentSaving, setDocumentSaving] = useState<boolean>(false);
    // const [documentSavingError, setDocumentSavingError] = useState<string | null>(null);
    // const [documentSavingSuccess, setDocumentSavingSuccess] = useState<boolean>(false);
    // const [documentDialogOpen, setDocumentDialogOpen] = useState<boolean>(false);

    const queryClient = useQueryClient();

    async function fetchConnectedAccounts() {
        const res = await fetch('/api/get/connected-accounts');
        if (!res.ok) throw new Error('Failed to fetch connected accounts');
        return res.json();
    }

    const { data: connectedAccounts = [], isFetching, error: connectedAccountsError } = useQuery({
        queryKey: ['connected-accounts'],
        queryFn: fetchConnectedAccounts,
        enabled: !isLoading,
        staleTime: 5 * 60_000,
    })

    // useEffect(() => {
    //     fetch('/api/get/connected-accounts')
    //         .then(res => res.json())
    //         .then(data => setConnectedAccounts(data));
    // }, [isLoading, instagramDeleting]);

    useEffect(() => {
        if (user) {
            fetch('/api/instagram-access/get')
                .then(res => res.json())
                .then(data => {
                    setInstagramAccess(data.instagram_access);
                });
        }
    }, [user]);

    useEffect(() => {
        fetch('/api/ai/rag/get-websites')
            .then(res => res.json())
            .then(data => setConnectedWebsites(data.websites));
    }, [isLoading, websiteSaving, websiteDeleting]);

    if (!user || isLoading) {
        return (
            <div className="flex flex-col gap-4">
                <Skeleton className="h-8 w-3/4" />
                <div className="flex gap-4">
                    <Skeleton className="h-32 w-32 rounded-xl" />
                    <Skeleton className="h-32 w-32 rounded-xl" />
                </div>
            </div>
        )
    }

    const requestInstagramAccess = async () => {
        setInstagramAccessLoading(true);

        try {
            const response = await fetch('/api/instagram-access/request', {
                method: 'POST',
                body: JSON.stringify({ username: instagramUsername })
            });

            if (!response.ok) {
                setInstagramAccessError('Failed to request Instagram access');
                throw new Error('Failed to request Instagram access');
            }

            setInstagramAccess('pending');
            setInstagramAccessSuccess(true);
        } catch (error) {
            console.error('Error sending request:', error);
            setInstagramAccessError('Failed to send request. Please try again later.');
        } finally {
            setInstagramAccessLoading(false);
        }
    }

    const saveWebsite = async () => {
        setWebsiteSaving(true);
        try {
            const response = await fetch('/api/ai/rag/save-website', {
                method: 'POST',
                body: JSON.stringify({ url: websiteUrl })
            });
            
            if (!response.ok) {
                throw new Error('Failed to save website');
            }
        } catch (error) {
            console.error('Error saving website:', error);
            setWebsiteSavingError('Failed to save website. Please try again later.');
        } finally {
            setWebsiteUrl("");
            setWebsiteSaving(false);
        }
    }

    const deleteWebsite = async (url: string) => {
        setWebsiteDeleting(url);
        try {
            const response = await fetch('/api/ai/rag/delete-website', {
                method: 'POST',
                body: JSON.stringify({ url: url })
            });

            if (!response.ok) {
                throw new Error('Failed to delete website');
            }
        } catch (error) {
            console.error('Error deleting website:', error);
            setWebsiteDeletingError('Failed to delete website. Please try again later.');
        } finally {
            setWebsiteDeleting(null);
        }
    }

    const updateWebsite = async (url: string) => {
        setWebsiteUpdating(url);
        try {
            const response = await fetch('/api/ai/rag/update-website', {
                method: 'POST',
                body: JSON.stringify({ url: url })
            });

            if (!response.ok) {
                throw new Error('Failed to update website');
            }
        } catch (error) {
            console.error('Error updating website:', error);
            setWebsiteUpdatingError('Failed to update website. Please try again later.');
        } finally {
            setWebsiteUpdating(null);
        }
    }

    const { mutate: deleteInstagram, isPending: instagramDeleting, isError, error: deleteInstagramError } = useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/ai/rag/delete-instagram');
            if (!res.ok) throw new Error('Failed to delete instagram');
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['connected-accounts'] })
    })

    const updateInstagram = async () => {
        console.log('updateInstagram');
        setInstagramUpdating(true);
        try {
            const response = await fetch('/api/ai/rag/update-instagram');

            if (!response.ok) {
                throw new Error('Failed to update instagram');
            }
        } catch (error) {
            console.error('Error updating instagram:', error);
            setInstagramUpdatingError('Failed to update instagram. Please try again later.');
        } finally {
            setInstagramUpdating(false);
        }
    }

    // const saveDocument = async () => {
    //     setDocumentSaving(true);
    //     try {
    //         const response = await fetch('/api/ai/rag/save-document', {
    //             method: 'POST',
    //             body: JSON.stringify({ document: document })
    //         })

    //         if (!response.ok) {
    //             throw new Error('Failed to save document');
    //         }
    //     } catch (error) {
    //         console.error('Error saving document:', error);
    //         setDocumentSavingError('Failed to save document. Please try again later.');
    //     } finally {
    //         setDocumentSaving(false);
    //     }
    // }

    // const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    //     setDocumentSaving(true);
    //     setDocumentDialogOpen(false);
        
    //     if (!e.target.files) {
    //         return;
    //     }
        
    //     for (const file of e.target.files || []) {
    //         const formData = new FormData();
    //         formData.append('document', file);
    //         const response = await fetch('/api/ai/rag/save-document', {
    //             method: 'POST',
    //             body: formData
    //         })

    //         if (!response.ok) {
    //             throw new Error('Failed to save document');
    //         }
    //     }
        
    //     e.target.value = '';
        
    //     setDocumentSaving(false);
    // }
    if (user && !isLoading) {
        return (
            <div>
                <h2 className="text-2xl font-bold">Instagram</h2>
                <div className="flex gap-4 mt-4 pr-4 w-[calc(100%+1rem)] no-scrollbar overflow-x-scroll">
                    {connectedAccounts && !connectedAccounts.instagram ? (
                        instagramAccess === 'true' && !instagramAccessLoading ? (
                            <Link href="https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=1436609137340002&redirect_uri=https://growbyte.cz/api/auth/instagram/callback&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights" className="flex flex-col gap-2 items-center justify-center bg-white border-primary border-2 rounded-xl p-4 w-32 h-32 flex-shrink-0">
                                <PlusIcon className="w-10 h-10 text-primary" />
                                <p className="text-sm font-semibold text-primary">Add</p>
                            </Link>
                        ) : instagramAccess === 'pending' && !instagramAccessLoading ? (
                            <div className="flex flex-col gap-2 items-center justify-center bg-white border-primary border-2 rounded-xl p-4 w-32 h-32 flex-shrink-0">
                                <Clock className="w-10 h-10 text-primary" />
                                <p className="text-sm font-semibold text-primary">Pending</p>
                            </div>
                        ) : instagramAccess === 'false' && !instagramAccessLoading ? (
                            <Dialog>
                            <DialogTrigger className="flex flex-col gap-2 items-center justify-center bg-white border-primary border-2 rounded-xl p-4 w-32 h-32 flex-shrink-0">
                                <PlusIcon className="w-10 h-10 text-primary" />
                                <p className="text-sm font-semibold text-primary">Add</p>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                <DialogTitle>Connect Instagram</DialogTitle>
                                <DialogDescription>Enter your Instagram username</DialogDescription>
                                </DialogHeader>

                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2 p-4 bg-white rounded-xl w-full">
                                        <AtSign className="w-6 h-6 stroke-[1.6] text-slate-400" />
                                        <input type="url" value={instagramUsername} onChange={(e) => setInstagramUsername(e.target.value)} className="w-full outline-none focus:outline-none" placeholder="your-username" />
                                    </div>
                                </div>

                                <DialogClose onClick={requestInstagramAccess} className="text-xl font-semibold h-12 p-0 rounded-2xl bg-primary text-white hover:bg-blue-500">Done</DialogClose>
                            </DialogContent>
                            </Dialog>
                        ) : instagramAccess === 'accepted' && !instagramAccessLoading ? (
                            <Dialog>
                                <DialogTrigger className="flex flex-col gap-2 items-center justify-center bg-white border-primary border-2 rounded-xl p-4 w-32 h-32 flex-shrink-0">
                                    <CircleCheck className="w-10 h-10 text-primary" />
                                    <p className="text-sm font-semibold text-primary">Click here!</p>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Access accepted</DialogTitle>
                                    </DialogHeader>
                                    <p className="font-semibold">Congratulations! Your access has been approved. Follow these instructions to complete the setup.</p>
                                    <p className="">1. <span className="font-semibold">Go to the <a href="https://www.instagram.com/accounts/manage_access/" target="_blank" className="text-primary">Apps and Websites</a></span> section in your Instagram profile</p>
                                    <p className="">2. <span className="font-semibold">Click the Tester Invites tab</span> and accept the invitation from GrowByte</p>
                                    <p>3. <span className="font-semibold">Click <a href="https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=1436609137340002&redirect_uri=https://growbyte.cz/api/auth/instagram/callback&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights" target="_blank" className="text-primary">this link</a></span> to authorize your Instagram account.</p>
                                    <p>4. <span className="font-semibold">You&apos;re all done!</span> Enjoy the app!</p>
                                    <DialogClose className="text-xl font-semibold h-12 p-0 rounded-2xl bg-primary text-white hover:bg-blue-500">Done</DialogClose>
                                </DialogContent>
                            </Dialog>
                        ) : instagramAccessLoading ? (
                            <Loader text="Loading..." />
                        ) : (
                            <Skeleton className="h-32 w-32 rounded-xl" />
                        )
                    ) : connectedAccounts && connectedAccounts.instagram ? (
                        instagramDeleting ? (
                            <Loader text="Deleting..." />
                        ) : instagramUpdating ? (
                            <Loader text="Updating..." />
                        ) : (
                            <Dialog>
                            <DialogTrigger>
                                <div className="flex flex-col gap-2 items-center justify-center bg-white rounded-xl p-4 w-32 h-32 flex-shrink-0">
                                    <InstagramIcon className="w-10 h-10" />
                                    <p className="text-xs font-semibold truncate max-w-28">@{connectedAccounts.instagram.username}</p>
                                </div>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-100 [&>button]:hidden max-h-[90vh] overflow-y-auto overflow-x-hidden">
                                <DialogHeader>
                                    <DialogTitle>{connectedAccounts.instagram.name}</DialogTitle>
                                    <DialogDescription>@{connectedAccounts.instagram.username}</DialogDescription>
                                </DialogHeader>
                                <DialogFooter className="flex gap-3 mt-8">
                                    <DialogClose className="rounded-2xl font-medium text-xl p-2 drop-shadow-sexy w-full bg-white text-slate-700">Close</DialogClose>
                                    <DialogClose onClick={() => deleteInstagram()} className="rounded-2xl font-medium text-xl p-2 drop-shadow-sexy w-full bg-primary text-white bg-red-500 hover:bg-red-600">Delete</DialogClose>
                                    <DialogClose onClick={updateInstagram} className="rounded-2xl font-medium text-xl p-2 drop-shadow-sexy w-full bg-primary text-white hover:bg-blue-500">Update</DialogClose>
                                </DialogFooter>
                            </DialogContent>
                            </Dialog>
                        )
                    ) : (
                        <Skeleton className="h-32 w-32 rounded-xl" />
                    )}
                    <Dialog open={instagramAccessSuccess} onOpenChange={setInstagramAccessSuccess}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Request sent</DialogTitle>
                            <DialogDescription>Check back in 24 hours, we will approve your request.</DialogDescription>
                        </DialogHeader>
                        <DialogClose className="text-xl font-semibold h-12 p-0 rounded-2xl bg-primary text-white hover:bg-blue-500">Done</DialogClose>
                    </DialogContent>
                    </Dialog>
                </div>
                <h2 className="text-2xl font-bold mt-4">Websites</h2>
                <div className="flex gap-4 mt-4 pr-4 w-[calc(100%+1rem)] no-scrollbar overflow-x-scroll">
                    <Dialog>
                    <DialogTrigger>
                        {websiteSaving ? (
                            <Loader text="Loading..." />
                        ) : (
                            <div className="flex flex-col gap-2 items-center justify-center bg-white rounded-xl p-4 w-32 h-32 flex-shrink-0">
                                <PlusIcon className="w-10 h-10 text-slate-400" />
                                <p className="text-sm font-semibold text-slate-400">Add</p>
                            </div>
                        )}
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                        <DialogTitle>Connect website</DialogTitle>
                        </DialogHeader>

                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 p-4 bg-white rounded-xl w-full">
                                <LinkIcon className="w-6 h-6 stroke-[1.6] text-slate-400" />
                                <input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className="w-full outline-none focus:outline-none" placeholder="https://your-awesome-website.com/" />
                            </div>
                        </div>

                        <DialogClose asChild>
                            <Button onClick={saveWebsite} className="text-xl font-semibold h-12 p-0 rounded-2xl hover:bg-blue-500">Connect</Button>
                        </DialogClose>
                    </DialogContent>
                    </Dialog>
                    {connectedWebsites && connectedWebsites.map((website) => {
                        if (websiteDeleting === website) {
                            return (
                                <div key={website} className="flex flex-col gap-2 items-center justify-center bg-white rounded-xl p-4 w-32 h-32 flex-shrink-0">
                                    <Loader text="Deleting..." />
                                </div>
                            )
                        } else if (websiteUpdating === website) {
                            return (
                                <div key={website} className="flex flex-col gap-2 items-center justify-center bg-white rounded-xl p-4 w-32 h-32 flex-shrink-0">
                                    <Loader text="Updating..." />
                                </div>
                            )
                        }
                        return (
                            <Dialog key={website}>
                            <DialogTrigger>
                                <div key={website} className="flex flex-col gap-2 items-center justify-center bg-white rounded-xl p-4 w-32 h-32 flex-shrink-0">
                                    <Globe className="w-10 h-10" />
                                    <p className="text-xs font-semibold truncate max-w-28">{website}</p>
                                </div>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-100 [&>button]:hidden max-h-[90vh] overflow-y-auto overflow-x-hidden">
                                <DialogHeader>
                                    <DialogTitle>{website}</DialogTitle>
                                </DialogHeader>
                                <DialogFooter className="flex gap-3 mt-8">
                                    <DialogClose className="rounded-2xl font-medium text-xl p-2 drop-shadow-sexy w-full bg-white text-slate-700">Close</DialogClose>
                                    <DialogClose onClick={() => deleteWebsite(website)} className="rounded-2xl font-medium text-xl p-2 drop-shadow-sexy w-full bg-primary text-white bg-red-500 hover:bg-red-600">Delete</DialogClose>
                                    <DialogClose onClick={() => updateWebsite(website)} className="rounded-2xl font-medium text-xl p-2 drop-shadow-sexy w-full bg-primary text-white hover:bg-blue-500">Update</DialogClose>
                                </DialogFooter>
                            </DialogContent>
                            </Dialog>
                        )
                    })}
                    <ErrorDialog
                        error={instagramAccessError || instagramDeletingError || instagramUpdatingError || websiteSavingError || websiteDeletingError || websiteUpdatingError || ""}
                        open={instagramAccessError !== null || instagramDeletingError !== null || instagramUpdatingError !== null || websiteSavingError !== null || websiteDeletingError !== null || websiteUpdatingError !== null}
                        onOpenChange={() => {
                            if (instagramAccessError !== null) setInstagramAccessError(null);
                            if (instagramDeletingError !== null) setInstagramDeletingError(null);
                            if (instagramUpdatingError !== null) setInstagramUpdatingError(null);
                            if (websiteSavingError !== null) setWebsiteSavingError(null);
                            if (websiteDeletingError !== null) setWebsiteDeletingError(null);
                            if (websiteUpdatingError !== null) setWebsiteUpdatingError(null);
                        }}
                    />
                </div>
                {/* <h2 className="text-2xl font-bold mt-4">Documents</h2>
                <div className="flex gap-4 mt-4 pr-4 w-[calc(100%+1rem)] no-scrollbar overflow-x-scroll">
                    {documentSaving ? (
                        <div className="flex flex-col gap-2 items-center justify-center bg-white rounded-xl p-4 w-32 h-32 flex-shrink-0">
                            <div className="animate-spin">
                                <Loader2 className="w-10 h-10 text-primary" />
                            </div>
                            <p className="text-sm font-semibold text-primary">Loading</p>
                        </div>
                    ) : (
                        <Dialog>
                        <DialogTrigger disabled className="pointer-events-none cursor-not-allowed">
                            <div className="flex flex-col gap-2 items-center justify-center bg-white rounded-xl p-4 w-32 h-32 flex-shrink-0">
                                <PlusIcon className="w-10 h-10 text-slate-400" />
                                <p className="text-sm font-semibold text-slate-400">Add</p>
                            </div>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                            <DialogTitle>Connect documents</DialogTitle>
                            </DialogHeader>

                            <div className="flex flex-col gap-2">
                                <div className="rounded-xl bg-white w-full p-4 cursor-pointer">
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        accept=".pdf,.doc,.docx,.txt"
                                        id="file-upload"
                                        multiple
                                        // onChange={handleFileUpload}
                                    />
                                    <label htmlFor="file-upload" className="flex items-center gap-3 bg-white rounded-xl w-full">
                                        <UploadIcon className="w-6 h-6 stroke-[1.6] text-slate-600" />
                                        <p className="text-sm font-medium text-slate-600">
                                            Click to upload or drag and drop
                                        </p>
                                    </label>
                                </div>
                            </div>

                            <DialogClose asChild>
                                <Button className="text-xl font-semibold h-12 p-0 rounded-2xl hover:bg-blue-500">Done</Button>
                            </DialogClose>
                        </DialogContent>
                        </Dialog>
                    )}
                    {connectedAccounts && connectedAccounts.instagram ? (
                        <div className="flex flex-col gap-2 items-center justify-center bg-white rounded-xl p-4 w-32 h-32 flex-shrink-0">
                            <InstagramIcon className="w-10 h-10" />
                            <p className="text-sm font-semibold truncate max-w-28">@{connectedAccounts.instagram.username}</p>
                        </div>
                    ) : (
                        <Skeleton className="h-32 w-32 rounded-xl" />
                    )}
                </div> */}
            </div>
        )
    }
}