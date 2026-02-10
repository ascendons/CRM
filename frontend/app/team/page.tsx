"use client";

import { useState } from "react";
import InviteUserModal from "@/components/team/InviteUserModal";
import InvitationsList from "@/components/team/InvitationsList";
import { UserPlus, Users, Mail } from "lucide-react";

export default function TeamPage() {
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [activeTab, setActiveTab] = useState<"invitations" | "members">("invitations");

    const handleInviteSuccess = () => {
        setRefreshKey((prev) => prev + 1);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Users className="h-8 w-8 text-blue-600" />
                            Team Management
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Invite and manage your team members
                        </p>
                    </div>
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg transition-colors"
                    >
                        <UserPlus className="h-5 w-5" />
                        Invite User
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab("invitations")}
                        className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "invitations"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                    >
                        <Mail className="h-5 w-5" />
                        Invitations
                    </button>
                    <button
                        onClick={() => setActiveTab("members")}
                        className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "members"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                    >
                        <Users className="h-5 w-5" />
                        Team Members
                    </button>
                </nav>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {activeTab === "invitations" && (
                    <InvitationsList refreshKey={refreshKey} />
                )}
                {activeTab === "members" && (
                    <div className="text-center py-12 text-gray-500">
                        <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p>Team members list coming soon</p>
                    </div>
                )}
            </div>

            {/* Invite Modal */}
            <InviteUserModal
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                onSuccess={handleInviteSuccess}
            />
        </div>
    );
}
