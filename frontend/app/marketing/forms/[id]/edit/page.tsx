"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formsService, WebForm, FormField, FormFieldType } from "@/lib/forms";
import { showToast } from "@/lib/toast";
import { ArrowLeft, Save, Plus, Trash2, GripVertical, Copy } from "lucide-react";

export default function EditFormPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"builder" | "preview" | "embed">("builder");
  const [form, setForm] = useState<Partial<WebForm>>({});
  const [embedCode, setEmbedCode] = useState("");

  useEffect(() => {
    if (id) {
      formsService
        .getFormById(id as string)
        .then((data) => {
          setForm(data);
        })
        .catch(() => showToast.error("Failed to load form"));
      formsService
        .getEmbedCode(id as string)
        .then(setEmbedCode)
        .catch(() => {});
    }
  }, [id]);

  const addField = () => {
    const newField: FormField = {
      fieldId: `field-${Date.now()}`,
      label: "New Field",
      type: "TEXT",
      required: false,
    };
    setForm((f) => ({ ...f, fields: [...(f.fields || []), newField] }));
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    setForm((f) => ({
      ...f,
      fields: f.fields?.map((field, i) => (i === index ? { ...field, ...updates } : field)),
    }));
  };

  const removeField = (index: number) => {
    setForm((f) => ({ ...f, fields: f.fields?.filter((_, i) => i !== index) }));
  };

  const handleSave = async () => {
    if (!form.name?.trim()) {
      showToast.error("Form name is required");
      return;
    }
    try {
      setSaving(true);
      await formsService.updateForm(id as string, {
        name: form.name,
        fields: form.fields,
        submitAction: form.submitAction,
        redirectUrl: form.redirectUrl,
        thankYouMessage: form.thankYouMessage,
        themeColor: form.themeColor,
      });
      showToast.success("Form updated");
    } catch {
      showToast.error("Failed to update form");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/marketing/forms" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Form</h1>
      </div>

      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {["builder", "preview", "embed"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 capitalize transition-colors ${activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "builder" && (
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-3 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">Form Name</label>
              <input
                type="text"
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Fields</h3>
                <button
                  type="button"
                  onClick={addField}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-4 h-4" /> Add Field
                </button>
              </div>
              <div className="space-y-3">
                {form.fields?.map((field, i) => (
                  <div
                    key={field.fieldId || i}
                    className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg"
                  >
                    <GripVertical className="w-4 h-4 text-gray-300 mt-2" />
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateField(i, { label: e.target.value })}
                        className="col-span-2 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none"
                        placeholder="Field label"
                      />
                      <select
                        value={field.type}
                        onChange={(e) => updateField(i, { type: e.target.value as FormFieldType })}
                        className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none"
                      >
                        {[
                          "TEXT",
                          "EMAIL",
                          "PHONE",
                          "NUMBER",
                          "DROPDOWN",
                          "CHECKBOX",
                          "TEXTAREA",
                          "DATE",
                        ].map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <label className="flex items-center gap-1 text-xs text-gray-600 col-span-2">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(i, { required: e.target.checked })}
                        />{" "}
                        Required
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeField(i)}
                      className="text-gray-400 hover:text-red-500 mt-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {(form.fields?.length || 0) === 0 && (
                  <p className="text-gray-400 text-sm text-center py-4">No fields yet.</p>
                )}
              </div>
            </div>
          </div>
          <div className="col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h3 className="font-semibold text-gray-800">Settings</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Theme Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={form.themeColor || "#2563EB"}
                    onChange={(e) => setForm({ ...form, themeColor: e.target.value })}
                    className="w-10 h-10 rounded"
                  />
                  <input
                    type="text"
                    value={form.themeColor || ""}
                    onChange={(e) => setForm({ ...form, themeColor: e.target.value })}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thank You Message
                </label>
                <textarea
                  rows={2}
                  value={form.thankYouMessage || ""}
                  onChange={(e) => setForm({ ...form, thankYouMessage: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "preview" && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md mx-auto">
          <h2 className="text-xl font-bold mb-6" style={{ color: form.themeColor || "#2563EB" }}>
            {form.name || "Form Preview"}
          </h2>
          <div className="space-y-4">
            {form.fields?.map((field) => (
              <div key={field.fieldId}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.type === "TEXTAREA" ? (
                  <textarea
                    rows={3}
                    disabled
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50"
                  />
                ) : (
                  <input
                    type="text"
                    disabled
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50"
                  />
                )}
              </div>
            ))}
            <button
              disabled
              className="w-full py-2 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: form.themeColor || "#2563EB" }}
            >
              Submit
            </button>
          </div>
        </div>
      )}

      {activeTab === "embed" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Embed Code</h3>
            <button
              onClick={() => {
                navigator.clipboard.writeText(embedCode);
                showToast.success("Copied!");
              }}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <Copy className="w-4 h-4" /> Copy
            </button>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            <pre className="text-green-400 text-xs overflow-x-auto whitespace-pre-wrap">
              {embedCode || "Save form to generate embed code"}
            </pre>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 mt-6">
        <Link
          href="/marketing/forms"
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
        >
          Back
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
