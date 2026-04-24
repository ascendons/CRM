"use client";

import { useState, useEffect } from "react";
import {
  api,
  type TermsTemplate,
  type TermsType,
  type CreateTermsTemplateRequest,
} from "@/lib/api-client";
import { Loader2, AlertCircle, Plus, Pencil, Trash2, Check, X } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type GroupedTemplates = Record<TermsType, TermsTemplate[]>;

const TYPE_LABELS: Record<TermsType, string> = {
  PAYMENT_TERMS: "Payment Terms",
  DELIVERY_TERMS: "Delivery Terms",
  NOTES: "Notes",
};

const ALL_TYPES: TermsType[] = ["PAYMENT_TERMS", "DELIVERY_TERMS", "NOTES"];

const inputCls =
  "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm";
const labelCls = "block text-sm font-medium text-gray-700 mb-1";

// ── Blank form state ──────────────────────────────────────────────────────────

const emptyForm = (type: TermsType): CreateTermsTemplateRequest => ({
  type,
  name: "",
  content: "",
  isDefault: false,
});

// ── Inline form component ─────────────────────────────────────────────────────

interface TemplateFormProps {
  initialData?: TermsTemplate;
  defaultType: TermsType;
  onSave: (data: CreateTermsTemplateRequest) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

function TemplateForm({ initialData, defaultType, onSave, onCancel, saving }: TemplateFormProps) {
  const [form, setForm] = useState<CreateTermsTemplateRequest>(
    initialData
      ? {
          type: initialData.type,
          name: initialData.name,
          content: initialData.content,
          isDefault: initialData.isDefault,
        }
      : emptyForm(defaultType)
  );
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    if (!form.content.trim()) {
      setError("Content is required");
      return;
    }
    setError("");
    await onSave(form);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3 mt-3"
    >
      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Name *</label>
          <input
            type="text"
            className={inputCls}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g., 50% Advance, 50% on Delivery"
            maxLength={120}
          />
        </div>
        <div className="flex items-end gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer mb-2">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={form.isDefault}
              onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
            />
            Set as default
          </label>
        </div>
      </div>

      <div>
        <label className={labelCls}>Content *</label>
        <textarea
          className={inputCls}
          value={form.content}
          onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
          placeholder="Full text that will populate the field when this template is selected..."
          rows={4}
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
          Save
        </button>
      </div>
    </form>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TermsTemplatesPage() {
  const [grouped, setGrouped] = useState<GroupedTemplates>({
    PAYMENT_TERMS: [],
    DELIVERY_TERMS: [],
    NOTES: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Which type's "add" form is open; null = none
  const [addingType, setAddingType] = useState<TermsType | null>(null);
  // Which template id is being edited; null = none
  const [editingId, setEditingId] = useState<string | null>(null);
  // Which template id is awaiting delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await api.getTermsTemplates();
      const g: GroupedTemplates = { PAYMENT_TERMS: [], DELIVERY_TERMS: [], NOTES: [] };
      data.forEach((t) => g[t.type].push(t));
      setGrouped(g);
    } catch (err: any) {
      setError(err.message || "Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (type: TermsType, data: CreateTermsTemplateRequest) => {
    setSaving(true);
    try {
      await api.createTermsTemplate(data);
      setAddingType(null);
      await loadTemplates();
    } catch (err: any) {
      setError(err.message || "Failed to create template");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string, data: CreateTermsTemplateRequest) => {
    setSaving(true);
    try {
      await api.updateTermsTemplate(id, data);
      setEditingId(null);
      await loadTemplates();
    } catch (err: any) {
      setError(err.message || "Failed to update template");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    try {
      await api.deleteTermsTemplate(id);
      setDeletingId(null);
      await loadTemplates();
    } catch (err: any) {
      setError(err.message || "Failed to delete template");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Terms Templates</h1>
        <p className="text-gray-600 mt-2">
          Manage reusable payment terms, delivery terms, and notes that populate proposal fields.
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
            <button
              className="ml-auto text-red-400 hover:text-red-600"
              onClick={() => setError("")}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* One card per type */}
      <div className="space-y-6">
        {ALL_TYPES.map((type) => (
          <div key={type} className="bg-white rounded-xl shadow-sm border border-gray-200">
            {/* Card header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">{TYPE_LABELS[type]}</h2>
              <button
                onClick={() => {
                  setAddingType(type);
                  setEditingId(null);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Template
              </button>
            </div>

            {/* Template list */}
            <div className="divide-y divide-gray-100">
              {grouped[type].length === 0 && addingType !== type && (
                <p className="px-5 py-4 text-sm text-gray-500 italic">
                  No templates yet. Click "Add Template" to create one.
                </p>
              )}

              {grouped[type].map((template) => (
                <div key={template.id} className="px-5 py-4">
                  {editingId === template.id ? (
                    <TemplateForm
                      initialData={template}
                      defaultType={type}
                      onSave={(data) => handleUpdate(template.id, data)}
                      onCancel={() => setEditingId(null)}
                      saving={saving}
                    />
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">{template.name}</span>
                          {template.isDefault && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 whitespace-pre-wrap line-clamp-2">
                          {template.content}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => {
                            setEditingId(template.id);
                            setAddingType(null);
                            setDeletingId(null);
                          }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        {deletingId === template.id ? (
                          <span className="flex items-center gap-1">
                            <span className="text-xs text-red-600 font-medium">Delete?</span>
                            <button
                              onClick={() => handleDelete(template.id)}
                              disabled={saving}
                              className="p-1 text-red-600 hover:text-red-700 rounded transition-colors"
                              title="Confirm delete"
                            >
                              {saving ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setDeletingId(template.id);
                              setEditingId(null);
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add form inline at the bottom of the card */}
              {addingType === type && (
                <div className="px-5 pb-5">
                  <TemplateForm
                    defaultType={type}
                    onSave={(data) => handleCreate(type, data)}
                    onCancel={() => setAddingType(null)}
                    saving={saving}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
