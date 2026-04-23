"use client";
import { useEffect, useState } from "react";
import { onboardingApi } from "@/lib/onboarding";
import { showToast } from "@/lib/toast";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const res = await onboardingApi.getTemplates();
      setTemplates(res.data || []);
    } catch {
      showToast.error("Failed to load");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete template?")) return;
    try {
      await onboardingApi.deleteTemplate(id);
      showToast.success("Deleted");
      load();
    } catch {
      showToast.error("Failed");
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Onboarding Templates</h1>
        <a
          href="/hr/onboarding/templates/new"
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm"
        >
          New Template
        </a>
      </div>
      <div className="space-y-3">
        {templates.map((t: any) => (
          <div
            key={t.templateId}
            className="bg-white border rounded-xl p-4 flex items-center justify-between"
          >
            <div>
              <p className="font-semibold">{t.name}</p>
              <p className="text-sm text-slate-500">
                {t.type} · {(t.tasks || []).length} tasks
              </p>
            </div>
            <div className="flex gap-2">
              <a
                href={`/hr/onboarding/templates/${t.templateId}`}
                className="text-primary text-sm underline"
              >
                Edit
              </a>
              <button onClick={() => handleDelete(t.templateId)} className="text-red-500 text-sm">
                Delete
              </button>
            </div>
          </div>
        ))}
        {templates.length === 0 && (
          <p className="text-slate-500 text-center py-8">No templates yet.</p>
        )}
      </div>
    </div>
  );
}
