"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { surveysApi, SurveyQuestion, SurveyQuestionType } from "@/lib/surveys";
import { showToast } from "@/lib/toast";
import { Plus, Trash2 } from "lucide-react";

const QUESTION_TYPES: SurveyQuestionType[] = ["RATING", "MULTIPLE_CHOICE", "TEXT", "YES_NO", "NPS"];

export default function NewSurveyPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [questions, setQuestions] = useState<Partial<SurveyQuestion>[]>([]);
  const [saving, setSaving] = useState(false);

  const addQuestion = () => {
    setQuestions([...questions, { text: "", type: "TEXT", options: [], required: false }]);
  };

  const removeQuestion = (i: number) => setQuestions(questions.filter((_, idx) => idx !== i));

  const updateQuestion = (i: number, key: string, val: any) => {
    setQuestions(questions.map((q, idx) => (idx === i ? { ...q, [key]: val } : q)));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showToast.error("Title is required");
      return;
    }
    if (questions.length === 0) {
      showToast.error("Add at least one question");
      return;
    }
    try {
      setSaving(true);
      const survey = await surveysApi.create({
        title,
        description,
        isAnonymous,
        questions: questions as SurveyQuestion[],
      });
      showToast.success("Survey created");
      router.push(`/surveys`);
    } catch {
      showToast.error("Failed to create survey");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Survey</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Survey title"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Optional description"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-gray-700">Anonymous responses</span>
        </label>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">Questions</label>
            <button
              onClick={addQuestion}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-3 h-3" /> Add Question
            </button>
          </div>
          {questions.map((q, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 mb-3 space-y-3">
              <div className="flex gap-3">
                <input
                  value={q.text || ""}
                  onChange={(e) => updateQuestion(i, "text", e.target.value)}
                  placeholder={`Question ${i + 1}`}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                />
                <select
                  value={q.type || "TEXT"}
                  onChange={(e) => updateQuestion(i, "type", e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                >
                  {QUESTION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => removeQuestion(i)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {q.type === "MULTIPLE_CHOICE" && (
                <div>
                  <input
                    placeholder="Options (comma-separated)"
                    onChange={(e) =>
                      updateQuestion(
                        i,
                        "options",
                        e.target.value.split(",").map((o) => o.trim())
                      )
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                  />
                </div>
              )}
              <label className="flex items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={q.required || false}
                  onChange={(e) => updateQuestion(i, "required", e.target.checked)}
                />
                Required
              </label>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={() => router.back()} className="px-4 py-2 text-sm text-gray-600">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Survey"}
          </button>
        </div>
      </div>
    </div>
  );
}
