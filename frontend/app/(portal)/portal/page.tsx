"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getPortalToken, getPortalEmail, clearPortalToken } from "@/lib/portal";
import { FileText, Wrench, ClipboardList, LogOut, Building2 } from "lucide-react";

export default function PortalHomePage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const token = getPortalToken();
    if (!token) {
      router.replace("/portal/login");
      return;
    }
    setEmail(getPortalEmail());
  }, []);

  const handleLogout = () => {
    clearPortalToken();
    router.replace("/portal/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-blue-600" />
          <span className="font-semibold text-gray-900">Customer Portal</span>
        </div>
        <div className="flex items-center gap-4">
          {email && <span className="text-sm text-gray-500">{email}</span>}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      <main className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h1>
        <p className="text-gray-500 mb-8">
          Manage your invoices, support tickets, and service requests.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/portal/invoices"
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow group"
          >
            <FileText className="w-8 h-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 mb-1">Invoices</h3>
            <p className="text-sm text-gray-500">View and download your invoices</p>
          </Link>
          <Link
            href="/portal/tickets"
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow group"
          >
            <ClipboardList className="w-8 h-8 text-orange-500 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 mb-1">Support Tickets</h3>
            <p className="text-sm text-gray-500">View and raise support requests</p>
          </Link>
          <Link
            href="/portal/tickets/new"
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow group"
          >
            <Wrench className="w-8 h-8 text-green-500 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 mb-1">Raise a Ticket</h3>
            <p className="text-sm text-gray-500">Submit a new service request</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
