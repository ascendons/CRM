"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  notificationsApi,
  NotificationResponse,
} from "@/lib/api/notifications";
import { useWebSocket } from "@/providers/WebSocketProvider";
import { toast } from "react-hot-toast";
import {
  Notifications,
  NotificationsOff,
  Done,
  DoneAll,
  OpenInNew,
  Circle,
  CheckCircle,
  Warning,
  Info,
  Error,
  ArrowBack,
} from "@mui/icons-material";

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
  const iconClass = "text-lg";
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
      return <Circle className={`${iconClass} text-slate-400 text-sm`} />;
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const { refreshNotifications } = useWebSocket();
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const PAGE_SIZE = 20;

  const loadNotifications = useCallback(async (pageNum = 0, append = false) => {
    try {
      if (pageNum === 0) setLoading(true);
      else setLoadingMore(true);

      const data = await notificationsApi.getNotifications(pageNum, PAGE_SIZE);

      setNotifications((prev) => {
        if (append) {
          // Deduplicate
          const existingIds = new Set(prev.map((n) => n.id));
          const newNotifs = data.content.filter((n) => !existingIds.has(n.id));
          return [...prev, ...newNotifs];
        }
        return data.content;
      });

      setHasMore(!data.last);
      setPage(pageNum);
    } catch (error) {
      console.error("Failed to load notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications(0, false);
  }, [loadNotifications]);

  const handleNotificationClick = async (notification: NotificationResponse) => {
    if (!notification.isRead) {
      try {
        await notificationsApi.markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );
        // Also update WebSocketProvider's state
        refreshNotifications();
      } catch (error) {
        console.error("Failed to mark as read:", error);
      }
    }

    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAllRead(true);
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      // Also update WebSocketProvider's state
      refreshNotifications();
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      toast.error("Failed to mark all as read");
    } finally {
      setMarkingAllRead(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadNotifications(page + 1, true);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-200" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-slate-200 rounded w-3/4" />
                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Mark all read button */}
        {unreadCount > 0 && (
          <div className="flex justify-end mb-4">
            <button
              onClick={handleMarkAllRead}
              disabled={markingAllRead}
              className="flex items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
            >
              <DoneAll className="text-lg" />
              <span className="font-medium">Mark all read</span>
            </button>
          </div>
        )}

        {/* Unread count banner */}
        {unreadCount > 0 && (
          <div className="mb-4 text-sm text-slate-500">
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </div>
        )}

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <NotificationsOff className="text-5xl text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-1">No notifications yet</h3>
            <p className="text-sm text-slate-500">
              You&apos;ll see notifications here when you receive them
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 sm:p-5 transition-all duration-200 cursor-pointer hover:bg-slate-50/50 ${
                    !notification.isRead ? "bg-primary/5 border-l-2 border-l-primary" : ""
                  }`}
                >
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className="mt-0.5 shrink-0">{getNotificationIcon(notification.type)}</div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-sm font-medium leading-tight ${
                              notification.isRead ? "text-slate-600" : "text-slate-900"
                            }`}
                          >
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-primary rounded-full shrink-0" />
                          )}
                        </div>
                        <span className="text-xs text-slate-400 shrink-0">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </div>
                      <p
                        className={`text-sm mt-1 leading-snug ${
                          notification.isRead ? "text-slate-400" : "text-slate-600"
                        }`}
                      >
                        {notification.message}
                      </p>
                      {notification.actionUrl && (
                        <span className="inline-flex items-center gap-1 text-xs text-primary mt-2 font-medium">
                          View details
                          <OpenInNew className="text-xs" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="p-4 text-center border-t border-slate-100">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-6 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loadingMore ? "Loading..." : "Load more notifications"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
