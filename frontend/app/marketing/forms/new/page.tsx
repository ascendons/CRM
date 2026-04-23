"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formsService, FormField, FormFieldType, CreateWebFormRequest } from "@/lib/forms";
import { showToast } from "@/lib/toast";
import { ArrowLeft, Save, Plus, Trash2, GripVertical } from "lucide-react";

const FIELD_TYPES: FormFieldType[] = [
  "TEXT",
  "EMAIL",
  "PHONE",
  "NUMBER",
  "DROPDOWN",
  "CHECKBOX",
  "TEXTAREA",
  "DATE",
];

export default function NewFormPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"builder" | "preview" | "embed">("builder");
  const [form, setForm] = useState<CreateWebFormRequest>({
    name: "",
    fields: [],
    submitAction: { createLead: true, createContact: false },
    redirectUrl: "",
    thankYouMessage: "Thank you for your submission!",
    themeColor: "#2563EB",
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast.error("Form name is required");
      return;
    }
    try {
      setSaving(true);
      const created = await formsService.createForm(form);
      showToast.success("Form created successfully");
      router.push(`/marketing/forms/${created.formId}/edit`);
    } catch {
      showToast.error("Failed to create form");
    } finally {
      setSaving(false);
    }
  };

  const embedCode = `<script>
  (function() {
    var d = document.createElement('div');
    d.id = 'crm-form';
    document.currentScript.parentNode.insertBefore(d, document.currentScript);
    // CRM Form Embed - configure form ID below
    d.innerHTML = '<p>Form embed placeholder</p>';
  })();
</script>`;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/marketing/forms" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Form</h1>
      </div>

      {/* Tabs */}
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

      <form onSubmit={handleSubmit}>
        {activeTab === "builder" && (
          <div className="grid grid-cols-5 gap-6">
            {/* Fields */}
            <div className="col-span-3 space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Form Name *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Contact Form"
                  />
                </div>
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
                {form.fields?.length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-4">
                    No fields yet. Click Add Field to start.
                  </p>
                )}
                <div className="space-y-3">
                  {form.fields?.map((field, i) => (
                    <div
                      key={field.fieldId}
                      className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg"
                    >
                      <GripVertical className="w-4 h-4 text-gray-300 mt-2 cursor-move" />
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateField(i, { label: e.target.value })}
                          className="col-span-2 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Field label"
                        />
                        <select
                          value={field.type}
                          onChange={(e) =>
                            updateField(i, { type: e.target.value as FormFieldType })
                          }
                          className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {FIELD_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        <label className="flex items-center gap-2 text-xs text-gray-600 col-span-2">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateField(i, { required: e.target.checked })}
                          />
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
                </div>
              </div>
            </div>

            {/* Settings Panel */}
            <div className="col-span-2 space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                <h3 className="font-semibold text-gray-800">Settings</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Theme Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.themeColor}
                      onChange={(e) => setForm({ ...form, themeColor: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={form.themeColor}
                      onChange={(e) => setForm({ ...form, themeColor: e.target.value })}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thank You Message
                  </label>
                  <textarea
                    rows={2}
                    value={form.thankYouMessage}
                    onChange={(e) => setForm({ ...form, thankYouMessage: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Redirect URL
                  </label>
                  <input
                    type="url"
                    value={form.redirectUrl}
                    onChange={(e) => setForm({ ...form, redirectUrl: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/thank-you"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Submit Action</label>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={form.submitAction?.createLead}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          submitAction: { ...form.submitAction, createLead: e.target.checked },
                        })
                      }
                    />
                    Create Lead
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={form.submitAction?.createContact}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          submitAction: { ...form.submitAction, createContact: e.target.checked },
                        })
                      }
                    />
                    Create Contact
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "preview" && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-6" style={{ color: form.themeColor }}>
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
                  ) : field.type === "CHECKBOX" ? (
                    <input type="checkbox" disabled className="rounded" />
                  ) : field.type === "DROPDOWN" ? (
                    <select
                      disabled
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50"
                    >
                      {field.options?.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type.toLowerCase()}
                      disabled
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50"
                    />
                  )}
                </div>
              ))}
              {form.fields?.length === 0 && (
                <p className="text-gray-400 text-center py-8">Add fields to see preview</p>
              )}
              <button
                disabled
                className="w-full py-2 rounded-lg text-white text-sm font-medium"
                style={{ backgroundColor: form.themeColor }}
              >
                Submit
              </button>
            </div>
          </div>
        )}

        {activeTab === "embed" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Embed Code</h3>
            <p className="text-sm text-gray-500 mb-4">
              Save the form first, then copy the embed code from the forms list page.
            </p>
            <div className="bg-gray-900 rounded-lg p-4">
              <pre className="text-green-400 text-xs overflow-x-auto">{embedCode}</pre>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <Link
            href="/marketing/forms"
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Create Form"}
          </button>
        </div>
      </form>
    </div>
  );
}
