"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPortalToken, getPortalEmail } from "@/lib/portal";
import { ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function NewTicketPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getPortalToken()) router.replace("/portal/login");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    try {
      setSubmitting(true);
      const token = getPortalToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"}/portal/service-requests`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title, description, priority }),
        }
      );
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
    } catch {
      setError("Failed to submit ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 text-center max-w-md">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Ticket Submitted</h2>
          <p className="text-gray-500 mb-4">Our team will get back to you shortly.</p>
          <Link
            href="/portal/tickets"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
          >
            View Tickets
          </Link>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <Link href="/portal/tickets" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-semibold text-gray-900">Raise a Support Ticket</h1>
      </div>
      <div className="p-6 max-w-xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-gray-200 p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Brief description of your issue"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Please describe your issue in detail"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
