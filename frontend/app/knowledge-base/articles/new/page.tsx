"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  kbService,
  KbCategory,
  KbArticleStatus,
  CreateKbArticleRequest,
} from "@/lib/knowledge-base";
import { showToast } from "@/lib/toast";
import { ArrowLeft, Save, Eye } from "lucide-react";

export default function NewArticlePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [categories, setCategories] = useState<KbCategory[]>([]);
  const [form, setForm] = useState<CreateKbArticleRequest>({
    title: "",
    categoryId: "",
    body: "",
    status: "DRAFT",
    tags: [],
    searchKeywords: [],
  });
  const [tagsInput, setTagsInput] = useState("");

  useEffect(() => {
    kbService
      .getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      showToast.error("Title is required");
      return;
    }
    try {
      setSaving(true);
      const tags = tagsInput
        ? tagsInput
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];
      const article = await kbService.createArticle({ ...form, tags });
      showToast.success("Article created successfully");
      router.push(`/knowledge-base/articles/${article.articleId}`);
    } catch {
      showToast.error("Failed to create article");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/knowledge-base" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Article</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Article title"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.categoryId} value={c.categoryId}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as KbArticleStatus })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="tag1, tag2, tag3"
            />
          </div>
        </div>

        {/* Editor */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center border-b border-gray-200 px-4 py-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPreview(false)}
                className={`px-3 py-1 text-sm rounded ${!preview ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:text-gray-700"}`}
              >
                Write
              </button>
              <button
                type="button"
                onClick={() => setPreview(true)}
                className={`flex items-center gap-1 px-3 py-1 text-sm rounded ${preview ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:text-gray-700"}`}
              >
                <Eye className="w-3 h-3" /> Preview
              </button>
            </div>
          </div>
          {preview ? (
            <div
              className="p-6 min-h-64 prose prose-gray max-w-none text-gray-700"
              dangerouslySetInnerHTML={{
                __html: form.body || "<p class='text-gray-400'>Nothing to preview</p>",
              }}
            />
          ) : (
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className="w-full p-4 text-sm font-mono text-gray-700 min-h-64 focus:outline-none resize-y"
              placeholder="Write your article content here. HTML is supported."
            />
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Link
            href="/knowledge-base"
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Article"}
          </button>
        </div>
      </form>
    </div>
  );
}
