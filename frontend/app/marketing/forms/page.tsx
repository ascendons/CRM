"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formsService, WebForm } from "@/lib/forms";
import { showToast } from "@/lib/toast";
import { PlusCircle, FileText, Trash2, Eye, Edit, Code } from "lucide-react";

export default function FormsPage() {
  const [forms, setForms] = useState<WebForm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      setLoading(true);
      const data = await formsService.getForms();
      setForms(data);
    } catch {
      showToast.error("Failed to load forms");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (formId: string) => {
    if (!confirm("Delete this form?")) return;
    try {
      await formsService.deleteForm(formId);
      showToast.success("Form deleted");
      loadForms();
    } catch {
      showToast.error("Failed to delete form");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Web Forms</h1>
          <p className="text-gray-500 text-sm">{forms.length} forms</p>
        </div>
        <Link
          href="/marketing/forms/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
        >
          <PlusCircle className="w-4 h-4" /> New Form
        </Link>
      </div>

      {forms.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No forms yet</p>
          <Link href="/marketing/forms/new" className="text-blue-600 text-sm mt-2 inline-block">
            Create your first form
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forms.map((form) => (
            <div key={form.formId} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{form.name}</h3>
                <div className="flex gap-1">
                  <Link
                    href={`/marketing/forms/${form.formId}/edit`}
                    className="p-1 text-gray-400 hover:text-blue-600"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(form.formId)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-3">{form.fields?.length || 0} fields</p>
              {form.themeColor && (
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-4 h-4 rounded-full border border-gray-200"
                    style={{ backgroundColor: form.themeColor }}
                  />
                  <span className="text-xs text-gray-400">{form.themeColor}</span>
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <Link
                  href={`/marketing/forms/${form.formId}/submissions`}
                  className="flex items-center gap-1 text-xs text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50"
                >
                  <Eye className="w-3 h-3" /> Submissions
                </Link>
                <Link
                  href={`/marketing/forms/${form.formId}/edit`}
                  className="flex items-center gap-1 text-xs text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50"
                >
                  <Code className="w-3 h-3" /> Embed
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
