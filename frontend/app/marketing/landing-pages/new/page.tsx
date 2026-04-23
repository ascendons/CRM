"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formsService, WebForm, CreateLandingPageRequest } from "@/lib/forms";
import { showToast } from "@/lib/toast";
import { ArrowLeft, Save } from "lucide-react";

export default function NewLandingPagePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [forms, setForms] = useState<WebForm[]>([]);
  const [form, setForm] = useState<CreateLandingPageRequest>({
    title: "",
    slug: "",
    heroText: "",
    ctaText: "Get Started",
    formId: "",
    heroImageUrl: "",
    published: false,
  });

  useEffect(() => {
    formsService
      .getForms()
      .then(setForms)
      .catch(() => {});
  }, []);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleTitleChange = (title: string) => {
    setForm((f) => ({ ...f, title, slug: f.slug || generateSlug(title) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.slug.trim()) {
      showToast.error("Title and slug are required");
      return;
    }
    try {
      setSaving(true);
      await formsService.createLandingPage(form);
      showToast.success("Landing page created");
      router.push("/marketing/landing-pages");
    } catch {
      showToast.error("Failed to create landing page");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/marketing/landing-pages" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Landing Page</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-gray-200 p-6 space-y-5"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Page Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Get Started with Our Product"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug *</label>
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
            <span className="bg-gray-50 px-3 py-2 text-sm text-gray-400 border-r border-gray-300">
              /lp/
            </span>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className="flex-1 px-3 py-2 text-sm focus:outline-none"
              placeholder="get-started"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hero Text</label>
          <textarea
            rows={3}
            value={form.heroText}
            onChange={(e) => setForm({ ...form, heroText: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your compelling headline goes here..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CTA Button Text</label>
          <input
            type="text"
            value={form.ctaText}
            onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Get Started"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Form</label>
          <select
            value={form.formId}
            onChange={(e) => setForm({ ...form, formId: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a form (optional)</option>
            {forms.map((f) => (
              <option key={f.formId} value={f.formId}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hero Image URL</label>
          <input
            type="url"
            value={form.heroImageUrl}
            onChange={(e) => setForm({ ...form, heroImageUrl: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm({ ...form, published: e.target.checked })}
          />
          Publish immediately
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/marketing/landing-pages"
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Create Page"}
          </button>
        </div>
      </form>
    </div>
  );
}
