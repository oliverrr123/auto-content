import { Loader2 } from "lucide-react";

export default function Loader({ text }: { text: string }) {
    return (
    <div className="flex flex-col gap-2 items-center justify-center bg-white rounded-xl p-4 w-32 h-32 flex-shrink-0">
        <div className="animate-spin">
            <Loader2 className="w-10 h-10 text-primary" />
        </div>
        <p className="text-sm font-semibold text-primary">{text}</p>
    </div>
    )
}