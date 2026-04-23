"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { surveysApi } from "@/lib/surveys";
import { showToast } from "@/lib/toast";
import { BarChart2, Users } from "lucide-react";

export default function SurveyResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    try {
      setResults(await surveysApi.getResults(id));
    } catch {
      showToast.error("Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!results) return <div className="p-8 text-center text-red-500">Failed to load</div>;

  const survey = results.survey;
  const tallies: Record<string, Record<string, number>> = results.tallies || {};

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{survey?.title}</h1>
        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
          <Users className="w-4 h-4" />
          <span>{results.totalResponses} responses</span>
        </div>
      </div>

      {survey?.questions?.map((q: any) => {
        const tally = tallies[q.questionId] || {};
        const total = Object.values(tally).reduce((a: number, b: any) => a + b, 0);
        const maxCount = Math.max(...Object.values(tally).map((v: any) => v as number), 1);

        return (
          <div key={q.questionId} className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
            <h3 className="font-medium text-gray-900 mb-4">{q.text}</h3>
            {total === 0 ? (
              <p className="text-sm text-gray-400">No responses yet</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(tally).map(([value, count]) => {
                  const pct = total > 0 ? Math.round(((count as number) / total) * 100) : 0;
                  return (
                    <div key={value}>
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>{value}</span>
                        <span>
                          {count as number} ({pct}%)
                        </span>
                      </div>
                      <div className="bg-gray-100 rounded-full h-4">
                        <div
                          className="bg-blue-500 h-4 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
