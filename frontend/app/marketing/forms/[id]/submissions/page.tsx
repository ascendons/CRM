"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formsService, WebFormSubmission, WebForm } from "@/lib/forms";
import { showToast } from "@/lib/toast";
import { ArrowLeft, Inbox } from "lucide-react";

export default function SubmissionsPage() {
  const { id } = useParams<{ id: string }>();
  const [submissions, setSubmissions] = useState<WebFormSubmission[]>([]);
  const [form, setForm] = useState<WebForm | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      Promise.all([
        formsService.getFormById(id as string),
        formsService.getSubmissions(id as string),
      ])
        .then(([f, s]) => {
          setForm(f);
          setSubmissions(s);
        })
        .catch(() => showToast.error("Failed to load submissions"))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const fieldLabels =
    form?.fields?.reduce(
      (acc, f) => {
        if (f.fieldId) acc[f.fieldId] = f.label;
        return acc;
      },
      {} as Record<string, string>
    ) || {};

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/marketing/forms" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{form?.name || "Form"} — Submissions</h1>
          <p className="text-gray-500 text-sm">{submissions.length} submissions</p>
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-16">
          <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No submissions yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left p-4 font-medium text-gray-600">Date</th>
                <th className="text-left p-4 font-medium text-gray-600">IP Address</th>
                {Object.values(fieldLabels).map((label) => (
                  <th key={label} className="text-left p-4 font-medium text-gray-600">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
                <tr key={sub.submissionId} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4 text-gray-600">
                    {new Date(sub.submittedAt).toLocaleString("en-IN")}
                  </td>
                  <td className="p-4 text-gray-500">{sub.ipAddress || "-"}</td>
                  {Object.keys(fieldLabels).map((fieldId) => (
                    <td key={fieldId} className="p-4 text-gray-700">
                      {sub.responses?.[fieldId] || "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
