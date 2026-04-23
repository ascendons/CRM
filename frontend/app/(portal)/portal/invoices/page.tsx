"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { portalApi, getPortalToken } from "@/lib/portal";
import { FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PortalInvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getPortalToken()) {
      router.replace("/portal/login");
      return;
    }
    portalApi
      .getInvoices()
      .then(setInvoices)
      .catch(() => setError("Failed to load invoices"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <Link href="/portal" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-semibold text-gray-900">Your Invoices</h1>
      </div>
      <div className="p-6 max-w-3xl mx-auto">
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {invoices.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>No invoices found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((inv, i) => (
              <div
                key={inv.proposalId || i}
                className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">{inv.title || inv.proposalId}</p>
                  <p className="text-sm text-gray-500">
                    {inv.status} ·{" "}
                    {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : ""}
                  </p>
                </div>
                <span
                  className={`text-sm px-3 py-1 rounded-full ${inv.status === "APPROVED" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                >
                  {inv.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
