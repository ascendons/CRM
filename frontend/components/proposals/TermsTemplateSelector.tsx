"use client";

import { useState, useEffect } from "react";
import { api, type TermsTemplate, type TermsType } from "@/lib/api-client";

interface Props {
  type: TermsType;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label: string;
  placeholder?: string;
}

const inputCls =
  "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 text-sm";
const labelCls = "block text-sm font-medium text-gray-700 mb-1.5";

export default function TermsTemplateSelector({
  type,
  value,
  onChange,
  disabled = false,
  label,
  placeholder,
}: Props) {
  const [templates, setTemplates] = useState<TermsTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getTermsTemplates(type)
      .then((data) => {
        if (!cancelled) setTemplates(data);
      })
      .catch(() => {
        // Silently fail — feature is optional
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [type]);

  const handleTemplateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) return;
    const template = templates.find((t) => t.id === selectedId);
    if (template) {
      onChange(template.content);
    }
    // Reset the select back to placeholder after applying
    e.target.value = "";
  };

  return (
    <div>
      <label className={labelCls}>{label}</label>

      {/* Template picker — only shown when templates exist and not loading */}
      {!loading && templates.length > 0 && (
        <select
          className={`${inputCls} mb-2`}
          defaultValue=""
          onChange={handleTemplateSelect}
          disabled={disabled}
        >
          <option value="" disabled>
            Select a template...
          </option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
              {t.isDefault ? " (Default)" : ""}
            </option>
          ))}
        </select>
      )}

      {/* Editable textarea — always visible */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className={inputCls}
        disabled={disabled}
      />
    </div>
  );
}
