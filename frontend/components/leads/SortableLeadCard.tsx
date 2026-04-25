"use client";

import { useState, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Lead, formatLeadName } from "@/types/lead";
import { Building2, Calendar, Mail, Phone, DollarSign, MoreVertical, ExternalLink, Edit3, StickyNote } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

interface SortableLeadCardProps {
  lead: Lead;
}

export function SortableLeadCard({ lead }: SortableLeadCardProps) {
  const router = useRouter();
  const [showActions, setShowActions] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    data: { ...lead },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleActionClick = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    setShowActions(false);
    if (action === "view") {
      router.push(`/leads/${lead.id}`);
    } else if (action === "edit") {
      router.push(`/leads/${lead.id}/edit`);
    } else if (action === "log") {
      // TODO: Open log activity modal directly
      router.push(`/leads/${lead.id}`);
    }
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
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-slate-900 leading-tight group-hover:text-primary transition-colors flex-1">
            {formatLeadName(lead)}
          </h4>
          {/* Quick Actions Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              className="p-1 rounded hover:bg-slate-100 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {showActions && (
              <div className="absolute right-0 top-8 z-20 bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-[140px]">
                <button
                  onClick={(e) => handleActionClick(e, "view")}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Details
                </button>
                <button
                  onClick={(e) => handleActionClick(e, "edit")}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit Lead
                </button>
                <button
                  onClick={(e) => handleActionClick(e, "log")}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <StickyNote className="h-4 w-4" />
                  Log Activity
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center text-xs text-slate-500 gap-1.5">
          <Building2 className="h-3 w-3" />
          <span className="truncate max-w-[150px]">{lead.companyName}</span>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Mail className="h-3 w-3" />
          <span className="truncate">{lead.email}</span>
        </div>
        {lead.phone && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Phone className="h-3 w-3" />
            <span>{lead.phone}</span>
          </div>
        )}
      </div>

      {/* Source & Revenue */}
      <div className="flex items-center justify-between mb-3">
        {lead.leadSource && (
          <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
            {lead.leadSource.replace("_", " ")}
          </span>
        )}
        {lead.expectedRevenue && (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
            <DollarSign className="h-3 w-3" />
            {lead.expectedRevenue.toLocaleString()}
          </span>
        )}
      </div>

      {/* Card Footer: Assignee & Date */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
        {lead.assignedUserName ? (
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-5 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-purple-700 font-bold text-[10px]">
              {lead.assignedUserName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-slate-500">{lead.assignedUserName}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400">Unassigned</span>
        )}
        <div
          className="text-xs text-slate-400 flex items-center gap-1"
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
