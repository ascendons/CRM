"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { surveysApi, Survey, SurveyAnswer } from "@/lib/surveys";
import { showToast } from "@/lib/toast";
import { CheckCircle } from "lucide-react";

export default function SurveyRespondPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    try {
      setSurvey(await surveysApi.getById(id));
    } catch {
      showToast.error("Failed to load survey");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!survey) return;
    const required = survey.questions.filter((q) => q.required);
    for (const q of required) {
      if (!answers[q.questionId]) {
        showToast.error(`Please answer: ${q.text}`);
        return;
      }
    }
    try {
      setSubmitting(true);
      const payload: SurveyAnswer[] = Object.entries(answers).map(([questionId, value]) => ({
        questionId,
        value,
      }));
      await surveysApi.respond(id, payload, survey.isAnonymous);
      setSubmitted(true);
    } catch {
      showToast.error("Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!survey) return <div className="p-8 text-center text-red-500">Survey not found</div>;

  if (submitted)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 text-center max-w-md">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Response Submitted</h2>
          <p className="text-gray-500 mb-4">Thank you for completing the survey!</p>
          <button
            onClick={() => router.push("/surveys")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
          >
            Back to Surveys
          </button>
        </div>
      </div>
    );

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{survey.title}</h1>
        {survey.description && <p className="text-gray-500 mt-1">{survey.description}</p>}
        {survey.isAnonymous && (
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full mt-2 inline-block">
            Anonymous
          </span>
        )}
      </div>

      <div className="space-y-5">
        {survey.questions.map((q, i) => (
          <div key={q.questionId} className="bg-white rounded-xl border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-800 mb-3">
              {i + 1}. {q.text} {q.required && <span className="text-red-500">*</span>}
            </label>
            {q.type === "TEXT" && (
              <textarea
                rows={3}
                value={answers[q.questionId] || ""}
                onChange={(e) => setAnswers({ ...answers, [q.questionId]: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
            {q.type === "RATING" && (
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setAnswers({ ...answers, [q.questionId]: String(n) })}
                    className={`w-10 h-10 rounded-lg text-sm font-medium border ${answers[q.questionId] === String(n) ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 hover:border-blue-400"}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
            {q.type === "YES_NO" && (
              <div className="flex gap-3">
                {["Yes", "No"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setAnswers({ ...answers, [q.questionId]: opt })}
                    className={`px-6 py-2 rounded-lg text-sm font-medium border ${answers[q.questionId] === opt ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 hover:border-blue-400"}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
            {q.type === "NPS" && (
              <div className="flex flex-wrap gap-1">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <button
                    key={n}
                    onClick={() => setAnswers({ ...answers, [q.questionId]: String(n) })}
                    className={`w-9 h-9 rounded text-xs font-medium border ${answers[q.questionId] === String(n) ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 hover:border-blue-400"}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
            {q.type === "MULTIPLE_CHOICE" &&
              q.options?.map((opt) => (
                <label key={opt} className="flex items-center gap-2 mb-2 cursor-pointer">
                  <input
                    type="radio"
                    name={q.questionId}
                    value={opt}
                    checked={answers[q.questionId] === opt}
                    onChange={() => setAnswers({ ...answers, [q.questionId]: opt })}
                  />
                  <span className="text-sm text-gray-700">{opt}</span>
                </label>
              ))}
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-8 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit Response"}
        </button>
      </div>
    </div>
  );
}
