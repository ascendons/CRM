"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { authService } from "@/lib/auth";
import { User } from "@/types/auth";
import { useEffect, useState } from "react";

export default function Navigation() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  // Hide navigation on login and register pages
  const hideNavigation = pathname === "/login" || pathname === "/register";

  useEffect(() => {
    if (authService.isAuthenticated()) {
      const currentUser = authService.getUser();
      setUser(currentUser);
    }
  }, []);

  if (hideNavigation) {
    return null;
  }

  const handleLogout = () => {
    authService.logout();
  };

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(path);
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 lg:px-8 sticky top-0 z-10">
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="size-10 bg-primary rounded-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined">rocket_launch</span>
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none tracking-tight text-slate-900">
              CRM Pro
            </h1>
            <p className="text-xs text-slate-700 font-medium">Enterprise Edition</p>
          </div>
        </Link>
        <div className="h-8 w-px bg-slate-200 mx-2"></div>
        <nav className="hidden lg:flex items-center gap-6">
          <Link
            href="/dashboard"
            className={`text-sm font-medium transition-colors ${
              isActive("/dashboard")
                ? "text-primary border-b-2 border-primary pb-1 font-semibold"
                : "text-slate-700 hover:text-primary"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/leads"
            className={`text-sm font-medium transition-colors ${
              isActive("/leads")
                ? "text-primary border-b-2 border-primary pb-1 font-semibold"
                : "text-slate-700 hover:text-primary"
            }`}
          >
            Leads
          </Link>
          <Link
            href="/opportunities"
            className={`text-sm font-medium transition-colors ${
              isActive("/opportunities")
                ? "text-primary border-b-2 border-primary pb-1 font-semibold"
                : "text-slate-700 hover:text-primary"
            }`}
          >
            Deals
          </Link>
          <Link
            href="/contacts"
            className={`text-sm font-medium transition-colors ${
              isActive("/contacts")
                ? "text-primary border-b-2 border-primary pb-1 font-semibold"
                : "text-slate-700 hover:text-primary"
            }`}
          >
            Contacts
          </Link>
          <Link
            href="/accounts"
            className={`text-sm font-medium transition-colors ${
              isActive("/accounts")
                ? "text-primary border-b-2 border-primary pb-1 font-semibold"
                : "text-slate-700 hover:text-primary"
            }`}
          >
            Accounts
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg relative transition-colors">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
        </button>
        <button className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
          <span className="material-symbols-outlined">settings</span>
        </button>
        <div className="h-8 w-px bg-slate-200 mx-2"></div>
        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold leading-none text-slate-900">{user.fullName}</p>
              <p className="text-xs text-slate-700 font-medium">{user.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
