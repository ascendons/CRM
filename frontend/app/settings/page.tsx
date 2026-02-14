"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { meService, type CurrentUser } from "@/lib/me";
import { authService } from "@/lib/auth";
import {
    User,
    Lock,
    Bell,
    Shield,
    Save,
    CheckCircle2,
    Building2,
    ArrowRight,
    Activity,
    Clock
} from "lucide-react";
import { usePermissionContext } from "@/providers/PermissionProvider";

import { ActionType, type UserActivity } from "@/types/user-activity";
import { userActivityService } from "@/lib/user-activity";
import { format } from "date-fns";

type SettingsTab = "general" | "security" | "notifications" | "activity-log";

export default function SettingsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<SettingsTab>("general");
    const [user, setUser] = useState<CurrentUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const { canAccessModule } = usePermissionContext();

    // General Form States
    const [fullName, setFullName] = useState(""); // Kept for initial load, but not used for update
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [title, setTitle] = useState("");
    const [department, setDepartment] = useState("");
    const [phone, setPhone] = useState("");
    const [mobilePhone, setMobilePhone] = useState("");

    // Security Form States
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Notification Form States
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [desktopNotifications, setDesktopNotifications] = useState(true);

    // Activity Log States
    const [activities, setActivities] = useState<UserActivity[]>([]);
    const [activitiesLoading, setActivitiesLoading] = useState(false);
    const [activitiesPage, setActivitiesPage] = useState(0);
    const [activitiesTotalPages, setActivitiesTotalPages] = useState(0);

    useEffect(() => {
        if (!authService.isAuthenticated()) {
            router.push("/login");
            return;
        }
        loadUser();
    }, [router]);

    useEffect(() => {
        if (activeTab === "activity-log") {
            fetchActivities();
        }
    }, [activeTab, activitiesPage]);

    const fetchActivities = async () => {
        setActivitiesLoading(true);
        try {
            const data = await userActivityService.getMyActivities({
                page: activitiesPage,
                size: 10,
            });
            setActivities(data.content);
            setActivitiesTotalPages(data.totalPages);
        } catch (error) {
            console.error("Failed to load activities:", error);
        } finally {
            setActivitiesLoading(false);
        }
    };

    const loadUser = async () => {
        try {
            const userData = await meService.getCurrentUser();
            setUser(userData);

            // Populate General form
            setFullName(userData.fullName); // For display if needed, but update uses first/last
            setFirstName(userData.firstName || "");
            setLastName(userData.lastName || "");
            setTitle(userData.title || "");
            setDepartment(userData.department || "");
            setPhone(userData.phone || "");
            setMobilePhone(userData.mobilePhone || "");

            // Populate Notifications form (if available in user object, otherwise defaults)
            if (userData.settings) {
                setEmailNotifications(userData.settings.emailNotifications ?? true);
                setDesktopNotifications(userData.settings.desktopNotifications ?? true);
            } else {
                // Assuming defaults if settings are not present
                setEmailNotifications(true);
                setDesktopNotifications(true);
            }
        } catch (error) {
            console.error("Failed to load settings:", error);
            authService.logout();
            router.push("/login");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            if (activeTab === "general") {
                // Split full name if firstName/lastName are empty (user might have edited full name)
                let fName = firstName;
                let lName = lastName;

                if (!firstName && !lastName && fullName) {
                    const parts = fullName.split(" ");
                    fName = parts[0];
                    lName = parts.slice(1).join(" ");
                }

                const updatedUser = await meService.updateProfile({
                    firstName: fName,
                    lastName: lName,
                    title,
                    department,
                    phone,
                    mobilePhone
                });
                setUser(updatedUser);
                setMessage({ type: 'success', text: "Profile updated successfully." });
            } else if (activeTab === "security") {
                if (newPassword !== confirmPassword) {
                    setMessage({ type: 'error', text: "New passwords do not match." });
                    setSaving(false);
                    return;
                }
                if (!currentPassword) {
                    setMessage({ type: 'error', text: "Current password is required." });
                    setSaving(false);
                    return;
                }

                await meService.changePassword({
                    currentPassword,
                    newPassword
                });

                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setMessage({ type: 'success', text: "Password changed successfully." });
            } else if (activeTab === "notifications") {
                const updatedUser = await meService.updateSettings({
                    emailNotifications,
                    desktopNotifications
                });
                // Update local user state
                setUser(updatedUser);
                setMessage({ type: 'success', text: "Notification preferences saved." });
            }
        } catch (error: any) {
            console.error("Failed to save settings:", error);
            setMessage({ type: 'error', text: error.response?.data?.message || "Failed to save changes." });
        } finally {
            setSaving(false);
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

    return (
        <div className="max-w-6xl mx-auto p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
                <p className="text-slate-500">Manage your account preferences and security.</p>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                    {message.text}
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Navigation */}
                <div className="w-full lg:w-64 flex-shrink-0">
                    <nav className="space-y-1">
                        <button
                            onClick={() => { setActiveTab("general"); setMessage(null); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${activeTab === "general"
                                ? "bg-blue-50 text-blue-700"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                        >
                            <User className="w-5 h-5" />
                            General Profile
                        </button>
                        <button
                            onClick={() => { setActiveTab("security"); setMessage(null); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${activeTab === "security"
                                ? "bg-blue-50 text-blue-700"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                        >
                            <Lock className="w-5 h-5" />
                            Security
                        </button>
                        <button
                            onClick={() => { setActiveTab("notifications"); setMessage(null); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${activeTab === "notifications"
                                ? "bg-blue-50 text-blue-700"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                        >
                            <Bell className="w-5 h-5" />
                            Notifications
                        </button>
                        <button
                            onClick={() => { setActiveTab("activity-log"); setMessage(null); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${activeTab === "activity-log"
                                ? "bg-blue-50 text-blue-700"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                        >
                            <Activity className="w-5 h-5" />
                            Activity Log
                        </button>
                    </nav>

                    {/* Organization Settings Link (Admin Only) */}
                    {canAccessModule("ADMINISTRATION") && (
                        <div className="mt-8 pt-8 border-t border-slate-200">
                            <h3 className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                                Organization
                            </h3>
                            <button
                                onClick={() => router.push("/settings/organization")}
                                className="w-full flex items-center justify-between group px-4 py-3 text-sm font-medium rounded-xl text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-all border border-transparent hover:border-blue-100"
                            >
                                <div className="flex items-center gap-3">
                                    <Building2 className="w-5 h-5" />
                                    Organization Settings
                                </div>
                                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">

                        {/* GENERAL TAB */}
                        {activeTab === "general" && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">Profile Information</h2>
                                    <p className="text-sm text-slate-500">Update your personal details and public profile.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">First Name</label>
                                            <input
                                                type="text"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">Last Name</label>
                                            <input
                                                type="text"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Email Address</label>
                                        <input
                                            type="email"
                                            value={user.email}
                                            disabled
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">Job Title</label>
                                            <input
                                                type="text"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                placeholder="e.g. Senior Sales Manager"
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">Department</label>
                                            <input
                                                type="text"
                                                value={department}
                                                onChange={(e) => setDepartment(e.target.value)}
                                                placeholder="e.g. Sales"
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">Phone</label>
                                            <input
                                                type="text"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                placeholder="e.g. +1 555 123 4567"
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">Mobile Phone</label>
                                            <input
                                                type="text"
                                                value={mobilePhone}
                                                onChange={(e) => setMobilePhone(e.target.value)}
                                                placeholder="e.g. +1 555 987 6543"
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Role</label>
                                        <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 w-full">
                                            <Shield className="w-4 h-4 text-slate-400" />
                                            <span className="text-sm text-slate-600">{user.roleName || user.userRole}</span>
                                        </div>
                                        <p className="text-xs text-slate-400">Role permissions are managed by administrators.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SECURITY TAB */}
                        {activeTab === "security" && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">Security Settings</h2>
                                    <p className="text-sm text-slate-500">Manage your password and account security.</p>
                                </div>

                                <div className="space-y-4 max-w-md">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Current Password</label>
                                        <input
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">New Password</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Confirm New Password</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100">
                                    <h3 className="text-sm font-medium text-slate-900 mb-2">Two-Factor Authentication</h3>
                                    <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded-md border border-slate-200">
                                                <Shield className="w-5 h-5 text-slate-400" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-slate-900">Authenticator App</div>
                                                <div className="text-xs text-slate-500">Secure your account with 2FA</div>
                                            </div>
                                        </div>
                                        <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                                            Setup
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* NOTIFICATIONS TAB */}
                        {activeTab === "notifications" && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">Notification Preferences</h2>
                                    <p className="text-sm text-slate-500">Choose how and when you want to be notified.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setEmailNotifications(!emailNotifications)}>
                                        <div className="mt-1">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                                checked={emailNotifications}
                                                onChange={(e) => setEmailNotifications(e.target.checked)}
                                            />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-slate-900">Email Notifications</div>
                                            <div className="text-sm text-slate-500">Receive daily summaries and important alerts via email.</div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setDesktopNotifications(!desktopNotifications)}>
                                        <div className="mt-1">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                                checked={desktopNotifications}
                                                onChange={(e) => setDesktopNotifications(e.target.checked)}
                                            />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-slate-900">Browser Push Notifications</div>
                                            <div className="text-sm text-slate-500">Get real-time updates on your desktop.</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ACTIVITY LOG TAB */}
                        {activeTab === "activity-log" && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">Your Activity Log</h2>
                                    <p className="text-sm text-slate-500">Track your recent actions and system events.</p>
                                </div>

                                <div className="space-y-4">
                                    {activitiesLoading ? (
                                        <div className="text-center py-10 text-slate-500 flex flex-col items-center gap-2">
                                            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                            <span>Loading activities...</span>
                                        </div>
                                    ) : activities.length === 0 ? (
                                        <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500">
                                            No recent activities found.
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-100 overflow-hidden border border-slate-200 rounded-xl">
                                            {activities.map((activity) => (
                                                <div key={activity.id} className="p-4 hover:bg-slate-50 transition-colors">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-semibold text-slate-900 text-sm">
                                                                    {activity.actionType.replace(/_/g, " ")}
                                                                </span>
                                                                {activity.entityType && (
                                                                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200 uppercase font-bold tracking-wider">
                                                                        {activity.entityType}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-slate-600 text-sm leading-relaxed">{activity.description}</p>

                                                            {/* Transitions */}
                                                            {(activity.oldValue || activity.newValue) && (
                                                                <div className="mt-2 text-[11px] flex items-center gap-2 text-slate-600 bg-blue-50/50 p-1.5 rounded border border-blue-100/50 w-fit">
                                                                    <span className="font-medium text-slate-400 line-through">
                                                                        {activity.oldValue || "None"}
                                                                    </span>
                                                                    <span className="text-slate-300">→</span>
                                                                    <span className="font-medium text-blue-700">
                                                                        {activity.newValue || "None"}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                                                                <div className="flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    {format(new Date(activity.timestamp), "MMM d, h:mm a")}
                                                                </div>
                                                                {activity.ipAddress && <span>{activity.ipAddress}</span>}
                                                            </div>
                                                        </div>
                                                        <div className="flex-shrink-0">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${activity.actionType === ActionType.CREATE ? "bg-green-50 text-green-600 border-green-100" :
                                                                activity.actionType === ActionType.UPDATE ? "bg-blue-50 text-blue-600 border-blue-100" :
                                                                    activity.actionType === ActionType.DELETE ? "bg-red-50 text-red-600 border-red-100" :
                                                                        "bg-slate-50 text-slate-500 border-slate-100"
                                                                }`}>
                                                                <Activity className="w-4 h-4" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {activitiesTotalPages > 1 && (
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                            <button
                                                disabled={activitiesPage === 0}
                                                onClick={() => setActivitiesPage(p => p - 1)}
                                                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium disabled:opacity-50 hover:bg-slate-50 transition-all"
                                            >
                                                Previous
                                            </button>
                                            <span className="text-xs text-slate-500">
                                                Page {activitiesPage + 1} of {activitiesTotalPages}
                                            </span>
                                            <button
                                                disabled={activitiesPage >= activitiesTotalPages - 1}
                                                onClick={() => setActivitiesPage(p => p + 1)}
                                                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium disabled:opacity-50 hover:bg-slate-50 transition-all"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Save Button */}
                        {activeTab !== "activity-log" && (
                            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-medium rounded-xl transition-all shadow-lg shadow-primary/25 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {saving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
