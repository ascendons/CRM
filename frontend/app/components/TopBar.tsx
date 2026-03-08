"use client";

import { useState } from "react";
import { UserMenu } from "@/components/UserMenu";
import ChatPanel from "./ChatPanel";
import NotificationPanel from "./NotificationPanel";
import { useWebSocket } from "@/providers/WebSocketProvider";

interface TopBarProps {
  onMobileMenuClick: () => void;
  pageTitle?: string;
}

export default function TopBar({ onMobileMenuClick, pageTitle }: TopBarProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { unreadNotificationCount, unreadMessageCount, clearUnreadMessages } = useWebSocket();

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
            onClick={() => setIsNotificationsOpen(true)}
            className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg relative transition-colors"
            title="Notifications"
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
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
