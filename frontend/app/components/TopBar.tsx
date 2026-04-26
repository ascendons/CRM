"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { UserMenu } from "@/components/UserMenu";
import ChatPanel from "./ChatPanel";
import NotificationPanel from "./NotificationPanel";
import { useWebSocket } from "@/providers/WebSocketProvider";

// Top-level routes where a back button doesn't make sense
const TOP_LEVEL_ROUTES = new Set([
  "/",
  "/dashboard",
  "/calendar",
  "/leads",
  "/contacts",
  "/accounts",
  "/opportunities",
  "/activities",
  "/projects",
  "/proposals",
  "/invoices",
  "/products",
  "/catalog",
  "/inventory",
  "/dispatch",
  "/hr",
  "/marketing",
  "/reports",
  "/settings",
  "/feed",
  "/drive",
  "/attendance",
  "/knowledge-base",
  "/notifications",
]);

interface TopBarProps {
  onMobileMenuClick: () => void;
  pageTitle?: string;
}

export default function TopBar({ onMobileMenuClick, pageTitle }: TopBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { unreadNotificationCount, unreadMessageCount, clearUnreadMessages, refreshNotifications } = useWebSocket();

  const showBack = !TOP_LEVEL_ROUTES.has(pathname);

  const handleNotificationsClick = () => {
    refreshNotifications();
    setIsNotificationsOpen(true);
  };

  return (
    <>
      <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            type="button"
            className="lg:hidden -ml-2 p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            onClick={onMobileMenuClick}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>

          {/* Back Button */}
          {showBack && (
            <button
              type="button"
              onClick={() => router.back()}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              title="Go back"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          )}

          {/* Page Title */}
          {pageTitle && (
            <div>
              <h1 className="text-xl font-bold text-slate-900">{pageTitle}</h1>
            </div>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search Button (Optional - can be expanded later) */}
          <button
            className="hidden sm:flex p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            title="Search (Coming soon)"
          >
            <span className="material-symbols-outlined">search</span>
          </button>

          {/* Calendar Button */}
          <Link
            href="/calendar"
            className={`p-2 rounded-lg transition-colors ${pathname === "/calendar" ? "text-blue-600 bg-blue-50" : "text-slate-500 hover:bg-slate-100"}`}
            title="Calendar"
          >
            <span className="material-symbols-outlined">calendar_month</span>
          </Link>

          {/* Chat Button */}
          <button
            onClick={() => {
              setIsChatOpen(true);
              clearUnreadMessages();
            }}
            className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg relative transition-colors"
            title="Messages"
          >
            <span className="material-symbols-outlined">chat</span>
            {unreadMessageCount > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-red-500 rounded-full border-2 border-white transform translate-x-1/4 -translate-y-1/4 min-w-[18px] min-h-[18px]">
                {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
              </span>
            )}
          </button>

          {/* Notifications Button */}
          <button
            onClick={handleNotificationsClick}
            className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg relative transition-colors"
            title="Notifications"
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-red-500 rounded-full min-w-[18px] min-h-[18px]">
                {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
              </span>
            )}
          </button>

          {/* Divider */}
          <div className="h-8 w-px bg-slate-200 mx-1"></div>

          {/* User Menu */}
          <UserMenu />
        </div>
      </header>

      {/* Panels */}
      <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <NotificationPanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </>
  );
}
