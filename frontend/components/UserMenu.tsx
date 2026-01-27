"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { meService, type CurrentUser } from "@/lib/me";
import { authService } from "@/lib/auth";
import { User, LogOut, Settings, Shield, ChevronDown } from "lucide-react";

/**
 * User menu component for displaying current user info and actions.
 * Shows user name, role, and provides logout functionality.
 */
export function UserMenu() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Only load if authenticated
    if (authService.isAuthenticated()) {
      loadCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await meService.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error("Failed to load current user:", error);
      // If /me fails, token might be invalid - logout
      authService.logout();
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  // Get initials for avatar
  const initials = currentUser.firstName && currentUser.lastName
    ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`
    : currentUser.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();

  return (
    <div className="relative">
      {/* User Button */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        aria-label="User menu"
      >
        {/* Avatar */}
        {currentUser.avatar ? (
          <img
            src={currentUser.avatar}
            alt={currentUser.fullName}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
            {initials}
          </div>
        )}

        {/* User Info */}
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-gray-900">
            {currentUser.fullName}
          </div>
          {currentUser.roleName && (
            <div className="text-xs text-gray-500">{currentUser.roleName}</div>
          )}
        </div>

        {/* Dropdown indicator */}
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform ${
            menuOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenuOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="font-medium text-gray-900">
                {currentUser.fullName}
              </div>
              <div className="text-sm text-gray-500">{currentUser.email}</div>
              {currentUser.userId && (
                <div className="text-xs text-gray-400 mt-1">
                  ID: {currentUser.userId}
                </div>
              )}
            </div>

            {/* Role & Profile Info */}
            {(currentUser.roleName || currentUser.profileName) && (
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                {currentUser.roleName && (
                  <div className="flex items-center text-xs text-gray-600 mb-1">
                    <Shield className="h-3 w-3 mr-1" />
                    Role: {currentUser.roleName}
                  </div>
                )}
                {currentUser.profileName && (
                  <div className="flex items-center text-xs text-gray-600">
                    <User className="h-3 w-3 mr-1" />
                    Profile: {currentUser.profileName}
                  </div>
                )}
              </div>
            )}

            {/* Menu Items */}
            <div className="py-1">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  router.push("/profile");
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <User className="h-4 w-4 mr-2" />
                My Profile
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  router.push("/settings");
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </button>
            </div>

            {/* Logout */}
            <div className="border-t border-gray-200 py-1">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
