"use client";

import { useState } from "react";
import { invitationApi } from "@/lib/api/invitation";
import { ApiError } from "@/lib/api-client";
import {
    X,
    Mail,
    UserPlus,
    Loader2,
    CheckCircle,
    AlertCircle,
} from "lucide-react";

interface InviteUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function InviteUserModal({
    isOpen,
    onClose,
    onSuccess,
}: InviteUserModalProps) {
    const [formData, setFormData] = useState({
        email: "",
        roleName: "USER",
        personalMessage: "",
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setIsLoading(true);

        try {
            await invitationApi.send({
                email: formData.email,
                roleName: formData.roleName,
                personalMessage: formData.personalMessage || undefined,
            });

            setSuccess("Invitation sent successfully!");

            setFormData({
                email: "",
                roleName: "USER",
                personalMessage: "",
            });

            onSuccess?.();

            setTimeout(() => {
                onClose();
                setSuccess("");
            }, 2000);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError("Failed to send invitation");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
    ) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div
                    className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                    onClick={onClose}
                />

                {/* Modal panel */}
                <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                                    <UserPlus className="h-5 w-5 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-white">
                                    Invite Team Member
                                </h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-white hover:text-gray-200 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <form onSubmit={handleSubmit} className="px-6 py-6">
                        {/* Messages */}
                        {success && (
                            <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-4">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <p className="text-sm font-medium text-green-800">{success}</p>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="h-5 w-5 text-red-600" />
                                    <p className="text-sm font-medium text-red-800">{error}</p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Email Address *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                        placeholder="user@example.com"
                                    />
                                </div>
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Role *
                                </label>
                                <select
                                    name="roleName"
                                    value={formData.roleName}
                                    onChange={handleChange}
                                    className="block w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900"
                                    required
                                >
                                    <option value="USER">User</option>
                                    <option value="SALES_REP">Sales Representative</option>
                                    <option value="MANAGER">Manager</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                                <p className="mt-1 text-xs text-gray-500">
                                    Choose the role this user will have in your organization
                                </p>
                            </div>

                            {/* Personal Message */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Personal Message (Optional)
                                </label>
                                <textarea
                                    name="personalMessage"
                                    value={formData.personalMessage}
                                    onChange={handleChange}
                                    rows={3}
                                    className="block w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900"
                                    placeholder="Add a personal welcome message..."
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center gap-3 mt-6 pt-6 border-t">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin h-5 w-5" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="h-5 w-5" />
                                        Send Invitation
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isLoading}
                                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
