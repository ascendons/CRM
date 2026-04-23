"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { portalApi, getPortalToken } from "@/lib/portal";
import { ClipboardList, ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";

export default function PortalTicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getPortalToken()) {
      router.replace("/portal/login");
      return;
    }
    portalApi
      .getServiceRequests()
      .then(setTickets)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/portal" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">Support Tickets</h1>
        </div>
        <Link
          href="/portal/tickets/new"
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> New Ticket
        </Link>
      </div>
      <div className="p-6 max-w-3xl mx-auto">
        {tickets.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>No tickets yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t, i) => (
              <div
                key={t.serviceRequestId || i}
                className="bg-white rounded-xl border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{t.title || t.serviceRequestId}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{t.description}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${t.status === "RESOLVED" ? "bg-green-100 text-green-700" : t.status === "OPEN" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}
                  >
                    {t.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
