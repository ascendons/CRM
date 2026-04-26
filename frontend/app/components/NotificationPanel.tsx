"use client";

import React, { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useRouter } from "next/navigation";
import { useWebSocket } from "@/providers/WebSocketProvider";
import {
  Notifications,
  NotificationsOff,
  Done,
  Settings,
  OpenInNew,
  Circle,
  CheckCircle,
  Warning,
  Info,
  Error,
} from "@mui/icons-material";

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Relative time formatting
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Get icon based on notification type
function getNotificationIcon(type: string) {
  const iconClass = "text-base";
  switch (type?.toUpperCase()) {
    case "SUCCESS":
    case "APPROVED":
      return <CheckCircle className={`${iconClass} text-emerald-500`} />;
    case "WARNING":
      return <Warning className={`${iconClass} text-amber-500`} />;
    case "ERROR":
    case "REJECTED":
      return <Error className={`${iconClass} text-red-500`} />;
    case "INFO":
      return <Info className={`${iconClass} text-blue-500`} />;
    default:
      return <Circle className={`${iconClass} text-slate-400 text-xs`} />;
  }
}

export default function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const router = useRouter();
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    unreadNotificationCount,
    loadingNotifications,
    setLoadingNotifications,
    notificationSettings,
    updateNotificationSettings,
    fetchMoreNotifications,
    hasMoreNotifications,
    loadingMoreNotifications,
  } = useWebSocket();

  const [showSettings, setShowSettings] = useState(false);

  const handleNotificationClick = (id: string, actionUrl?: string) => {
    markNotificationAsRead(id);
    if (actionUrl) {
      router.push(actionUrl);
      onClose();
    }
  };

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead();
  };

  const handleViewAll = () => {
    router.push("/notifications");
    onClose();
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 transition-opacity backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300 sm:duration-500"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300 sm:duration-500"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-hidden bg-white shadow-xl">
                    {/* Header */}
                    <div className="px-4 py-5 sm:px-6 border-b border-slate-100 bg-slate-50/50">
                      <div className="flex items-center justify-between">
                        <Dialog.Title className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                          <Notifications className="text-primary" />
                          Notifications
                          {unreadNotificationCount > 0 && (
                            <span className="ml-1 px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                              {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                            </span>
                          )}
                        </Dialog.Title>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setShowSettings(!showSettings)}
                            className={`p-2 rounded-lg transition-colors ${showSettings ? "bg-primary/10 text-primary" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"}`}
                            title="Notification Settings"
                          >
                            <Settings className="text-lg" />
                          </button>
                          <button
                            type="button"
                            className="rounded-md text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 p-2"
                            onClick={onClose}
                          >
                            <span className="sr-only">Close panel</span>
                            <span className="material-symbols-outlined">close</span>
                          </button>
                        </div>
                      </div>

                      {/* Action buttons */}
                      {notifications.length > 0 && (
                        <div className="mt-3 flex items-center gap-2">
                          {unreadNotificationCount > 0 && (
                            <button
                              onClick={handleMarkAllRead}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            >
                              <Done className="text-base" />
                              Mark all read
                            </button>
                          )}
                          <button
                            onClick={handleViewAll}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <OpenInNew className="text-base" />
                            View all
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Settings Panel */}
                    {showSettings && (
                      <div className="px-4 py-4 bg-blue-50/50 border-b border-blue-100">
                        <h4 className="text-sm font-medium text-slate-900 mb-3 flex items-center gap-2">
                          <Settings className="text-primary text-base" />
                          Notification Preferences
                        </h4>
                        <div className="space-y-3">
                          {[
                            { key: "leaveApproved", label: "Leave approvals/rejections" },
                            { key: "attendanceAlerts", label: "Attendance alerts" },
                            { key: "taskReminders", label: "Task reminders" },
                            { key: "systemAnnouncements", label: "System announcements" },
                            { key: "chatMessages", label: "Chat messages" },
                          ].map((item) => (
                            <label
                              key={item.key}
                              className="flex items-center justify-between cursor-pointer"
                            >
                              <span className="text-sm text-slate-700">{item.label}</span>
                              <input
                                type="checkbox"
                                checked={notificationSettings[item.key as keyof typeof notificationSettings] !== false}
                                onChange={(e) =>
                                  updateNotificationSettings(item.key as keyof typeof notificationSettings, e.target.checked)
                                }
                                className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary"
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notification List */}
                    <div className="flex-1 overflow-y-auto">
                      {loadingNotifications ? (
                        // Loading skeleton
                        <div className="p-4 space-y-3">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className="p-4 rounded-xl bg-slate-100 animate-pulse"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-200" />
                                <div className="flex-1 space-y-2">
                                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : notifications.length === 0 ? (
                        // Empty state
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 p-6">
                          <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                            <NotificationsOff className="text-5xl text-slate-300" />
                          </div>
                          <p className="text-base font-medium text-slate-700 mb-1">No notifications yet</p>
                          <p className="text-sm text-slate-400 text-center">
                            You&apos;ll see notifications here when you receive them
                          </p>
                        </div>
                      ) : (
                        <>
                          <ul className="divide-y divide-slate-100">
                            {notifications.map((notification) => (
                              <li
                                key={notification.id}
                                className={`p-4 transition-all duration-200 cursor-pointer hover:bg-slate-50/50 ${
                                  notification.isRead
                                    ? "bg-white"
                                    : "bg-primary/5 border-l-2 border-l-primary"
                                }`}
                                onClick={() =>
                                  handleNotificationClick(notification.id, notification.actionUrl)
                                }
                              >
                                <div className="flex gap-3">
                                  {/* Icon */}
                                  <div className="mt-0.5">
                                    {getNotificationIcon(notification.type)}
                                  </div>

                                  {/* Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <h4
                                        className={`text-sm font-medium leading-tight ${
                                          notification.isRead ? "text-slate-600" : "text-slate-900"
                                        }`}
                                      >
                                        {notification.title}
                                        {!notification.isRead && (
                                          <span className="ml-2 w-2 h-2 bg-primary rounded-full inline-block" />
                                        )}
                                      </h4>
                                      <span className="text-xs text-slate-400 shrink-0">
                                        {formatRelativeTime(notification.createdAt)}
                                      </span>
                                    </div>
                                    <p
                                      className={`text-sm mt-0.5 leading-snug ${
                                        notification.isRead ? "text-slate-400" : "text-slate-600"
                                      }`}
                                    >
                                      {notification.message}
                                    </p>
                                    {notification.actionUrl && (
                                      <span className="inline-flex items-center gap-0.5 text-xs text-primary mt-1 font-medium">
                                        View details
                                        <OpenInNew className="text-xs" />
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>

                          {/* Load More */}
                          {hasMoreNotifications && (
                            <div className="p-4 text-center border-t border-slate-100">
                              <button
                                onClick={fetchMoreNotifications}
                                disabled={loadingMoreNotifications}
                                className="px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {loadingMoreNotifications ? "Loading..." : "Load more notifications"}
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50">
                      <button
                        onClick={handleViewAll}
                        className="w-full text-center text-sm font-medium text-primary hover:text-primary-hover transition-colors"
                      >
                        View all notifications
                      </button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
