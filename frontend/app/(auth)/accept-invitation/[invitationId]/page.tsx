"use client";

import { useState, useEffect, use } from "react";
import { invitationApi } from "@/lib/api/invitation";
import { authService } from "@/lib/auth";
import type { Invitation } from "@/types/organization";
import { ApiError } from "@/lib/api-client";
import {
    Building2,
    Mail,
    User,
    Lock,
    Loader2,
    CheckCircle,
    AlertCircle,
    Clock,
} from "lucide-react";

export default function AcceptInvitationPage({
    params,
}: {
    params: Promise<{ invitationId: string }>;
}) {
    const resolvedParams = use(params);
    const [invitation, setInvitation] = useState<Invitation | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        fullName: "",
        password: "",
        confirmPassword: "",
    });

    useEffect(() => {
        loadInvitation();
    }, [resolvedParams.invitationId]);

    const loadInvitation = async () => {
        try {
            setIsLoading(true);
            const data = await invitationApi.getById(resolvedParams.invitationId);
            setInvitation(data);
        } catch (err: any) {
            setError(err.message || "Invitation not found");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await invitationApi.accept(resolvedParams.invitationId, {
                fullName: formData.fullName,
                password: formData.password,
            });

            authService.setAuth({
                userId: response.userId,
                email: invitation!.email,
                fullName: formData.fullName,
                role: invitation!.roleName as any,
                token: response.token,
            });

            window.location.href = "/dashboard";
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError("Failed to accept invitation");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error && !invitation) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
                        <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Invalid Invitation
                        </h2>
                        <p className="text-gray-600">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!invitation) return null;

    if (invitation.isExpired || invitation.status !== "PENDING") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
                        <Clock className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Invitation {invitation.status.toLowerCase()}
                        </h2>
                        <p className="text-gray-600">
                            {invitation.isExpired
                                ? "This invitation has expired. Please contact your organization admin for a new invitation."
                                : `This invitation has been ${invitation.status.toLowerCase()}.`}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg mb-4">
                        <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
                        Join {invitation.organizationName}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        You&apos;ve been invited by {invitation.invitedByName}
                    </p>
                </div>

                <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-gray-100">
                    {/* Invitation Details */}
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-gray-700">
                                <Mail className="h-4 w-4" />
                                <span>{invitation.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                                <User className="h-4 w-4" />
                                <span>Role: {invitation.roleName}</span>
                            </div>
                        </div>
                        {invitation.personalMessage && (
                            <div className="mt-3 pt-3 border-t border-blue-200 text-sm text-gray-700 italic">
                                &ldquo;{invitation.personalMessage}&rdquo;
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="h-5 w-5 text-red-600" />
                                    <p className="text-sm font-medium text-red-800">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Full Name *
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    name="fullName"
                                    required
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Password *
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    minLength={8}
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                    placeholder="••••••••"
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Confirm Password *
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg transition-colors"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="animate-spin h-5 w-5" />
                                    Creating Account...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-5 w-5" />
                                    Accept Invitation & Join
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
