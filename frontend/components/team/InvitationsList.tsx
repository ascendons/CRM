"use client";

import { useState, useEffect } from "react";
import { invitationApi } from "@/lib/api/invitation";
import type { Invitation } from "@/types/organization";
import {
    Mail,
    Clock,
    CheckCircle,
    XCircle,
    Trash2,
    Loader2,
    Users,
} from "lucide-react";

interface InvitationsListProps {
    refreshKey?: number;
}

export default function InvitationsList({ refreshKey }: InvitationsListProps) {
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "pending" | "accepted">("all");

    useEffect(() => {
        loadInvitations();
    }, [refreshKey]);

    const loadInvitations = async () => {
        try {
            setIsLoading(true);
            const data = await invitationApi.getAll();
            setInvitations(data);
        } catch (err) {
            console.error("Failed to load invitations:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRevoke = async (invitationId: string) => {
        if (!confirm("Are you sure you want to revoke this invitation?")) {
            return;
        }

        try {
            await invitationApi.revoke(invitationId);
            loadInvitations();
        } catch (err: any) {
            alert(err.message || "Failed to revoke invitation");
        }
    };

    const getStatusBadge = (invitation: Invitation) => {
        const { status, isExpired } = invitation;

        if (isExpired) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                    <Clock className="h-3 w-3" />
                    Expired
                </span>
            );
        }

        switch (status) {
            case "PENDING":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        <Clock className="h-3 w-3" />
                        Pending
                    </span>
                );
            case "ACCEPTED":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3" />
                        Accepted
                    </span>
                );
            case "REVOKED":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                        <XCircle className="h-3 w-3" />
                        Revoked
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                        {status}
                    </span>
                );
        }
    };

    const filteredInvitations = invitations.filter((inv) => {
        if (filter === "all") return true;
        if (filter === "pending") return inv.status === "PENDING" && !inv.isExpired;
        if (filter === "accepted") return inv.status === "ACCEPTED";
        return true;
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-gray-200">
                <button
                    onClick={() => setFilter("all")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${filter === "all"
                            ? "border-blue-500 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                >
                    All ({invitations.length})
                </button>
                <button
                    onClick={() => setFilter("pending")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${filter === "pending"
                            ? "border-blue-500 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                >
                    Pending (
                    {invitations.filter((inv) => inv.status === "PENDING" && !inv.isExpired).length})
                </button>
                <button
                    onClick={() => setFilter("accepted")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${filter === "accepted"
                            ? "border-blue-500 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                >
                    Accepted ({invitations.filter((inv) => inv.status === "ACCEPTED").length})
                </button>
            </div>

            {/* Invitations List */}
            {filteredInvitations.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No invitations found</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredInvitations.map((invitation) => (
                        <div
                            key={invitation.invitationId}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    {/* Email */}
                                    <div className="flex items-center gap-2 mb-2">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                        <span className="font-medium text-gray-900">
                                            {invitation.email}
                                        </span>
                                        {getStatusBadge(invitation)}
                                    </div>

                                    {/* Details */}
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <p>
                                            Role: <span className="font-medium">{invitation.roleName}</span>
                                        </p>
                                        {invitation.profileName && (
                                            <p>
                                                Profile: <span className="font-medium">{invitation.profileName}</span>
                                            </p>
                                        )}
                                        <p>
                                            Invited by: <span className="font-medium">{invitation.invitedByName}</span>
                                        </p>
                                        <p>
                                            Sent: {new Date(invitation.sentAt).toLocaleDateString()}
                                        </p>
                                        <p>
                                            Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                                        </p>
                                    </div>

                                    {/* Personal Message */}
                                    {invitation.personalMessage && (
                                        <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-gray-700 italic">
                                            &ldquo;{invitation.personalMessage}&rdquo;
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                {invitation.status === "PENDING" && !invitation.isExpired && (
                                    <button
                                        onClick={() => handleRevoke(invitation.invitationId)}
                                        className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Revoke invitation"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
