import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";

export default function ErrorDialog({ error, open, onOpenChange }: { error: string, open: boolean, onOpenChange: (open: boolean) => void }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Error</DialogTitle>
                <DialogDescription>{error}</DialogDescription>
            </DialogHeader>
            <DialogClose className="text-xl font-semibold h-12 p-0 rounded-2xl bg-primary text-white hover:bg-blue-500">Done</DialogClose>
        </DialogContent>
        </Dialog>
    )
}