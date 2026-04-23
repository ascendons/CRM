"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { surveysApi, Survey } from "@/lib/surveys";
import { showToast } from "@/lib/toast";
import { PlusCircle, ClipboardList, Trash2 } from "lucide-react";

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setSurveys(await surveysApi.getAll());
    } catch {
      showToast.error("Failed to load surveys");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this survey?")) return;
    try {
      await surveysApi.delete(id);
      showToast.success("Deleted");
      load();
    } catch {
      showToast.error("Failed to delete");
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Surveys</h1>
        <Link
          href="/surveys/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <PlusCircle className="w-4 h-4" /> New Survey
        </Link>
      </div>

      {surveys.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No surveys yet. Create your first survey.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {surveys.map((s) => (
            <div key={s.surveyId} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-2">
                <Link
                  href={`/surveys/${s.surveyId}/results`}
                  className="font-semibold text-gray-900 hover:text-blue-600"
                >
                  {s.title}
                </Link>
                <button
                  onClick={() => handleDelete(s.surveyId)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {s.description && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{s.description}</p>
              )}
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{s.questions?.length || 0} questions</span>
                <span
                  className={`px-2 py-0.5 rounded-full ${s.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                >
                  {s.status}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <Link
                  href={`/surveys/${s.surveyId}/respond`}
                  className="flex-1 text-center text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg"
                >
                  Respond
                </Link>
                <Link
                  href={`/surveys/${s.surveyId}/results`}
                  className="flex-1 text-center text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg"
                >
                  Results
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
