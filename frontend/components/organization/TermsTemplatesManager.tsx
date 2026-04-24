"use client";

import { useState, useEffect } from "react";
import {
  api,
  type TermsTemplate,
  type TermsType,
  type CreateTermsTemplateRequest,
} from "@/lib/api-client";
import { Loader2, Plus, Pencil, Trash2, Check, X, Star } from "lucide-react";

type GroupedTemplates = Record<TermsType, TermsTemplate[]>;

const TYPE_LABELS: Record<TermsType, string> = {
  PAYMENT_TERMS: "Payment Terms",
  DELIVERY_TERMS: "Delivery Terms",
  NOTES: "Notes",
};

const ALL_TYPES: TermsType[] = ["PAYMENT_TERMS", "DELIVERY_TERMS", "NOTES"];

const inputCls =
  "w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm";
const labelCls = "block text-sm font-medium text-gray-700 mb-1";

function TemplateForm({
  initialData,
  defaultType,
  onSave,
  onCancel,
  saving,
}: {
  initialData?: TermsTemplate;
  defaultType: TermsType;
  onSave: (data: CreateTermsTemplateRequest) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<CreateTermsTemplateRequest>(
    initialData
      ? {
          type: initialData.type,
          name: initialData.name,
          content: initialData.content,
          isDefault: initialData.isDefault,
        }
      : { type: defaultType, name: "", content: "", isDefault: false }
  );
  const [err, setErr] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErr("Name is required");
      return;
    }
    if (!form.content.trim()) {
      setErr("Content is required");
      return;
    }
    setErr("");
    await onSave(form);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3 mt-2"
    >
      {err && <p className="text-xs text-red-600">{err}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Name *</label>
          <input
            type="text"
            className={inputCls}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder='e.g., "50% Advance, 50% on Delivery"'
            maxLength={120}
          />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={form.isDefault}
              onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
            />
            Auto-fill in new proposals
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
          rows={3}
        />
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <X className="w-3.5 h-3.5" /> Cancel
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

function TemplateTypeSection({
  type,
  templates,
  onRefresh,
}: {
  type: TermsType;
  templates: TermsTemplate[];
  onRefresh: () => Promise<void>;
}) {
  const [addingOpen, setAddingOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleCreate = async (data: CreateTermsTemplateRequest) => {
    setSaving(true);
    try {
      await api.createTermsTemplate(data);
      setAddingOpen(false);
      await onRefresh();
    } catch (e: any) {
      setErr(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string, data: CreateTermsTemplateRequest) => {
    setSaving(true);
    try {
      await api.updateTermsTemplate(id, data);
      setEditingId(null);
      await onRefresh();
    } catch (e: any) {
      setErr(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    try {
      await api.deleteTermsTemplate(id);
      setDeletingId(null);
      await onRefresh();
    } catch (e: any) {
      setErr(e.message || "Failed to delete");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <span className="text-sm font-semibold text-gray-800">{TYPE_LABELS[type]}</span>
        <button
          onClick={() => {
            setAddingOpen(true);
            setEditingId(null);
          }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>

      {err && (
        <div className="px-4 py-2 bg-red-50 text-xs text-red-700 flex items-center justify-between">
          {err}
          <button onClick={() => setErr("")}>
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="divide-y divide-gray-100">
        {templates.length === 0 && !addingOpen && (
          <p className="px-4 py-3 text-sm text-gray-400 italic">
            No templates yet — click Add to create one.
          </p>
        )}

        {templates.map((t) => (
          <div key={t.id} className="px-4 py-3">
            {editingId === t.id ? (
              <TemplateForm
                initialData={t}
                defaultType={type}
                onSave={(data) => handleUpdate(t.id, data)}
                onCancel={() => setEditingId(null)}
                saving={saving}
              />
            ) : (
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-sm font-medium text-gray-900">{t.name}</span>
                    {t.isDefault && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                        <Star className="w-2.5 h-2.5" /> Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 whitespace-pre-wrap">
                    {t.content}
                  </p>
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => {
                      setEditingId(t.id);
                      setAddingOpen(false);
                      setDeletingId(null);
                    }}
                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  {deletingId === t.id ? (
                    <span className="flex items-center gap-1">
                      <span className="text-xs text-red-600 font-medium">Delete?</span>
                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={saving}
                        className="p-1 text-red-600 hover:text-red-700 rounded"
                        title="Confirm"
                      >
                        {saving ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setDeletingId(t.id);
                        setEditingId(null);
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {addingOpen && (
          <div className="px-4 pb-4">
            <TemplateForm
              defaultType={type}
              onSave={(data) => handleCreate(data)}
              onCancel={() => setAddingOpen(false)}
              saving={saving}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function TermsTemplatesManager() {
  const [grouped, setGrouped] = useState<GroupedTemplates>({
    PAYMENT_TERMS: [],
    DELIVERY_TERMS: [],
    NOTES: [],
  });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await api.getTermsTemplates();
      const g: GroupedTemplates = { PAYMENT_TERMS: [], DELIVERY_TERMS: [], NOTES: [] };
      data.forEach((t) => g[t.type].push(t));
      setGrouped(g);
    } catch {
      // silently fail — section just shows empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading templates...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {ALL_TYPES.map((type) => (
        <TemplateTypeSection key={type} type={type} templates={grouped[type]} onRefresh={load} />
      ))}
    </div>
  );
}
