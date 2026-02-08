"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { meService, type CurrentUser } from "@/lib/me";
import { authService } from "@/lib/auth";
import {
    User,
    Mail,
    Shield,
    Briefcase,
    Building,
    Calendar,
    CheckCircle2,
    Clock
} from "lucide-react";
import { format } from "date-fns";

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<CurrentUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authService.isAuthenticated()) {
            router.push("/login");
            return;
        }
        loadUser();
    }, [router]);

    const loadUser = async () => {
        try {
            const userData = await meService.getCurrentUser();
            setUser(userData);
        } catch (error) {
            console.error("Failed to load profile:", error);
            authService.logout();
            router.push("/login");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) return null;

    const initials = user.firstName && user.lastName
        ? `${user.firstName[0]}${user.lastName[0]}`
        : user.fullName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();

    return (
        <div className="max-w-4xl mx-auto p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
                <p className="text-slate-500">Manage your account settings and preferences.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Header / Cover */}
                <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
                    <div className="absolute -bottom-16 left-8">
                        <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-md flex items-center justify-center overflow-hidden">
                            {user.avatar ? (
                                <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-3xl font-bold text-slate-400">
                                    {initials}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-20 px-8 pb-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">{user.fullName}</h2>
                            <p className="text-slate-500 flex items-center gap-2 mt-1">
                                <Briefcase className="w-4 h-4" />
                                {user.title || "Team Member"}
                                {user.department && <span className="text-slate-300">•</span>}
                                {user.department && <span className="flex items-center gap-1"><Building className="w-4 h-4 ml-1" /> {user.department}</span>}
                            </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${user.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-700 border border-green-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                            <CheckCircle2 className="w-3 h-3" />
                            {user.status || "ACTIVE"}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 border-t border-slate-100 pt-8">
                        {/* Contact Info */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                <User className="w-5 h-5 text-slate-400" />
                                Personal Information
                            </h3>

                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Email Address</dt>
                                    <dd className="text-sm font-medium text-slate-900 flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-slate-400" />
                                        {user.email}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">User ID</dt>
                                    <dd className="text-sm font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded inline-block">
                                        {user.userId}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {/* Role & System Info */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-slate-400" />
                                Role & Permissions
                            </h3>

                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Assigned Role</dt>
                                    <dd className="flex items-center gap-2">
                                        <span className="px-2.5 py-0.5 rounded-md text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                            {user.roleName || user.userRole}
                                        </span>
                                    </dd>
                                </div>

                                {user.managerName && (
                                    <div>
                                        <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Reporting To</dt>
                                        <dd className="text-sm text-slate-900">{user.managerName}</dd>
                                    </div>
                                )}

                                <div>
                                    <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Last Login</dt>
                                    <dd className="text-sm text-slate-600 flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-slate-400" />
                                        {user.lastLoginAt ? format(new Date(user.lastLoginAt), "PPpp") : "Never"}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
