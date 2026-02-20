"use client";

import { useState, useEffect } from "react";
import { Activity, ActivityType, ActivityStatus } from "@/types/activity";
import { activitiesService } from "@/lib/activities";
import { authService } from "@/lib/auth";
import { ProposalResponse } from "@/types/proposal";
import { showToast } from "@/lib/toast";
import { formatDateTimeLongIST } from "@/lib/utils/date";
import { Send, User, Clock, MessageSquare } from "lucide-react";

interface ProposalCommentsProps {
    proposal: ProposalResponse;
}

export default function ProposalComments({ proposal }: ProposalCommentsProps) {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState("");
    const [sending, setSending] = useState(false);

    // We link the discussion to the Lead if available
    const leadId = proposal.source === "LEAD" ? proposal.sourceId : undefined;
    const proposalPrefix = `Negotiation - ${proposal.proposalNumber}`;

    useEffect(() => {
        if (leadId) {
            loadActivities();
        } else {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [leadId, proposal.id]);

    const loadActivities = async () => {
        if (!leadId) return;
        try {
            setLoading(true);
            const allActivities = await activitiesService.getActivitiesByLead(leadId);
            // Filter activities related to this negotiation
            // We look for activities where subject starts with our prefix
            const relevant = allActivities.filter(a =>
                a.subject.startsWith(proposalPrefix) ||
                (a.description && a.description.includes(`[Proposal: ${proposal.proposalNumber}]`))
            );

            // Sort by date desc
            relevant.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            setActivities(relevant);
        } catch (error) {
            console.error("Failed to load activities", error);
            showToast.error("Failed to load discussion history");
        } finally {
            setLoading(false);
        }
    };

    const handleSendComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !leadId) return;

        try {
            setSending(true);
            const user = authService.getUser();

            await activitiesService.createActivity({
                type: ActivityType.NOTE,
                subject: `${proposalPrefix}: Comment`,
                description: newComment,
                status: ActivityStatus.COMPLETED,
                priority: undefined,
                leadId: leadId,
                assignedToId: user?.userId,
                scheduledDate: new Date().toISOString()
            });

            setNewComment("");
            loadActivities();
        } catch (error) {
            console.error("Failed to post comment", error);
            showToast.error("Failed to post comment");
        } finally {
            setSending(false);
        }
    };

    const formatDate = (dateString: string) => {
        return formatDateTimeLongIST(dateString);
    };

    if (!leadId) {
        return (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                Discussion is only available for proposals linked to a Lead.
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow flex flex-col h-[600px]">
            <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                    Technical Negotiation & Discussion
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                    Discuss details with the team. These comments are linked to the Lead.
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : activities.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
                        <p>No discussion yet. Start the conversation!</p>
                    </div>
                ) : (
                    activities.map((activity) => (
                        <div key={activity.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                        {activity.createdByName ? activity.createdByName.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                                    </div>
                                    <span className="font-medium text-sm text-gray-900">
                                        {activity.createdByName || "Unknown User"}
                                    </span>
                                </div>
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDate(activity.createdAt)}
                                </span>
                            </div>
                            <div className="text-sm text-gray-700 whitespace-pre-wrap pl-10">
                                {activity.description}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
                <form onSubmit={handleSendComment} className="flex gap-2">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Type your comment..."
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={sending}
                    />
                    <button
                        type="submit"
                        disabled={sending || !newComment.trim()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {sending ? "..." : <Send className="h-4 w-4" />}
                    </button>
                </form>
            </div>
        </div>
    );
}
