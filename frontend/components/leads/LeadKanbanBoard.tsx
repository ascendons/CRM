import { useState, useEffect } from "react";
import { Lead, LeadStatus } from "@/types/lead";
import { useRouter } from "next/navigation";
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    useDroppable,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableLeadCard } from "./SortableLeadCard";
import { leadsService } from "@/lib/leads";
import toast from "react-hot-toast";

interface LeadKanbanBoardProps {
    leads: Lead[];
    filter?: LeadStatus[];
}

const statusColumns: { id: LeadStatus; label: string; color: string }[] = [
    { id: LeadStatus.NEW, label: "New", color: "bg-blue-50 border-blue-100 text-blue-700" },
    { id: LeadStatus.CONTACTED, label: "Contacted", color: "bg-yellow-50 border-yellow-100 text-yellow-700" },
    { id: LeadStatus.QUALIFIED, label: "Qualified", color: "bg-emerald-50 border-emerald-100 text-emerald-700" },
    { id: LeadStatus.PROPOSAL_SENT, label: "Proposal Sent", color: "bg-purple-50 border-purple-100 text-purple-700" },
    { id: LeadStatus.NEGOTIATION, label: "Negotiation", color: "bg-indigo-50 border-indigo-100 text-indigo-700" },
    { id: LeadStatus.CONVERTED, label: "Converted", color: "bg-slate-50 border-slate-100 text-slate-700" },
];

function KanbanColumn({ id, label, color, leads }: { id: LeadStatus; label: string; color: string; leads: Lead[] }) {
    const { setNodeRef } = useDroppable({
        id: id,
    });

    return (
        <div ref={setNodeRef} className="flex-shrink-0 w-80 flex flex-col bg-slate-50/50 rounded-2xl border border-slate-200/60 max-h-full">
            {/* Column Header */}
            <div className={`p-4 rounded-t-2xl border-b ${color.includes('bg-') ? color.replace('text-', 'border-').replace('50', '200') : 'border-slate-200'} bg-white sticky top-0 z-10`}>
                <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-bold text-sm uppercase tracking-wider ${color.split(' ').pop()}`}>
                        {label}
                    </h3>
                    <span className="flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                        {leads.length}
                    </span>
                </div>
                <div className={`h-1 w-full rounded-full mt-2 ${color.replace('text', 'bg').replace('50', '500').split(' ')[0]}`}></div>
            </div>

            {/* Column Content - Sortable Context */}
            <SortableContext
                id={id}
                items={leads.map(l => l.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="p-3 overflow-y-auto flex-1 space-y-3 min-h-0 custom-scrollbar">
                    {leads.length === 0 ? (
                        <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                            <span className="text-xs font-medium">No leads</span>
                        </div>
                    ) : (
                        leads.map((lead) => (
                            <SortableLeadCard key={lead.id} lead={lead} />
                        ))
                    )}
                </div>
            </SortableContext>
        </div>
    );
}

export function LeadKanbanBoard({ leads: initialLeads, filter = [] }: LeadKanbanBoardProps) {
    const router = useRouter();
    const [leads, setLeads] = useState<Lead[]>(initialLeads);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeLeadOriginalStatus, setActiveLeadOriginalStatus] = useState<LeadStatus | null>(null);

    // Update local state when prop changes
    useEffect(() => {
        setLeads(initialLeads);
    }, [initialLeads]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Require slight movement to start drag (prevents accidental drags on click)
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const getLeadsByStatus = (status: LeadStatus) => {
        return leads.filter((lead) => lead.leadStatus === status);
    };

    const visibleColumns = statusColumns.filter(column =>
        filter.length === 0 || filter.includes(column.id)
    );

    const handleDragStart = (event: DragStartEvent) => {
        const id = event.active.id as string;
        setActiveId(id);
        const lead = leads.find(l => l.id === id);
        if (lead) {
            setActiveLeadOriginalStatus(lead.leadStatus);
        }
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Find the active lead
        const activeLead = leads.find((l) => l.id === activeId);
        if (!activeLead) return;

        // Determine target status
        let targetStatus: LeadStatus | undefined;

        if (Object.values(LeadStatus).includes(overId as LeadStatus)) {
            targetStatus = overId as LeadStatus;
        } else {
            const overLead = leads.find((l) => l.id === overId);
            if (overLead) {
                targetStatus = overLead.leadStatus;
            }
        }

        if (!targetStatus || activeLead.leadStatus === targetStatus) return;

        // Optimistic update for UI smoothness during drag
        setLeads((prev) => {
            return prev.map((lead) =>
                lead.id === activeId ? { ...lead, leadStatus: targetStatus as LeadStatus } : lead
            );
        });
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        const originalStatus = activeLeadOriginalStatus;
        setActiveLeadOriginalStatus(null);

        if (!over) {
            // Revert if dropped outside
            if (originalStatus) {
                setLeads((prev) =>
                    prev.map((lead) =>
                        lead.id === active.id ? { ...lead, leadStatus: originalStatus } : lead
                    )
                );
            }
            return;
        }

        const activeId = active.id as string;
        const overId = over.id as string;

        let newStatus: LeadStatus | undefined;

        if (Object.values(LeadStatus).includes(overId as LeadStatus)) {
            newStatus = overId as LeadStatus;
        } else {
            const overLead = leads.find((l) => l.id === overId);
            if (overLead) {
                newStatus = overLead.leadStatus;
            }
        }

        // Compare newStatus with ORIGINAL status, not current (active) status
        if (newStatus && originalStatus && newStatus !== originalStatus) {
            try {
                // Determine if we need to update UI state (in case dragOver didn't reach final state)
                setLeads((prev) =>
                    prev.map((lead) =>
                        lead.id === activeId ? { ...lead, leadStatus: newStatus as LeadStatus } : lead
                    )
                );

                // Persist
                await leadsService.updateLeadStatus(activeId, newStatus);
                toast.success(`Lead moved to ${newStatus.replace(/_/g, " ").toLowerCase()}`);
            } catch (error) {
                console.error("Failed to update status", error);
                toast.error("Failed to update status");
                // Revert to original status
                setLeads((prev) =>
                    prev.map((lead) =>
                        lead.id === activeId ? { ...lead, leadStatus: originalStatus } : lead
                    )
                );
            }
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-[calc(100vh-12rem)] overflow-x-auto gap-4 pb-4">
                {visibleColumns.map((column) => {
                    const columnLeads = getLeadsByStatus(column.id);

                    return (
                        <KanbanColumn
                            key={column.id}
                            id={column.id}
                            label={column.label}
                            color={column.color}
                            leads={columnLeads}
                        />
                    );
                })}
            </div>

            {/* Drag Overlay for smooth visual */}
            <DragOverlay>
                {activeId ? (
                    (() => {
                        const lead = leads.find(l => l.id === activeId);
                        return lead ? <SortableLeadCard lead={lead} /> : null;
                    })()
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
