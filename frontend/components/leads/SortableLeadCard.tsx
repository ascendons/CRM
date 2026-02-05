"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Lead, formatLeadName } from "@/types/lead";
import { Building2, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

interface SortableLeadCardProps {
    lead: Lead;
}

export function SortableLeadCard({ lead }: SortableLeadCardProps) {
    const router = useRouter();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: lead.id, data: { ...lead } });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => router.push(`/leads/${lead.id}`)}
            className={`bg-white p-4 rounded-xl shadow-sm border border-slate-100 cursor-grab active:cursor-grabbing hover:shadow-md hover:-translate-y-0.5 transition-all group relative ${isDragging ? "ring-2 ring-primary/20 rotate-2" : ""}`}
        >
            {/* Card Header: Name & Company */}
            <div className="mb-3">
                <h4 className="font-semibold text-slate-900 leading-tight mb-1 group-hover:text-primary transition-colors">
                    {formatLeadName(lead)}
                </h4>
                <div className="flex items-center text-xs text-slate-500 gap-1.5">
                    <Building2 className="h-3 w-3" />
                    <span className="truncate max-w-[150px]">{lead.companyName}</span>
                </div>
            </div>

            {/* Card Stats/Info */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                {lead.leadScore !== undefined && (
                    <div
                        className={`text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1
            ${lead.leadScore > 70
                                ? "bg-emerald-50 text-emerald-700"
                                : lead.leadScore > 40
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-red-50 text-red-700"
                            }`}
                    >
                        <span>Score: {lead.leadScore}</span>
                    </div>
                )}

                <div
                    className="text-xs text-slate-400 flex items-center gap-1 ml-auto"
                    title={`Created ${new Date(lead.createdAt).toLocaleDateString()}`}
                >
                    <Calendar className="h-3 w-3" />
                    {formatDistanceToNow(new Date(lead.createdAt), {
                        addSuffix: true,
                    }).replace("about ", "")}
                </div>
            </div>
        </div>
    );
}
