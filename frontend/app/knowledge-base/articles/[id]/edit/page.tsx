"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { kbService, KbArticle, KbCategory, KbArticleStatus } from "@/lib/knowledge-base";
import { showToast } from "@/lib/toast";
import { ArrowLeft, Save, Eye } from "lucide-react";

export default function EditArticlePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [categories, setCategories] = useState<KbCategory[]>([]);
  const [form, setForm] = useState({
    title: "",
    categoryId: "",
    body: "",
    status: "DRAFT" as KbArticleStatus,
    tags: "",
  });

  useEffect(() => {
    if (id) {
      Promise.all([kbService.getArticleById(id as string), kbService.getCategories()])
        .then(([article, cats]) => {
          setForm({
            title: article.title,
            categoryId: article.categoryId || "",
            body: article.body || "",
            status: article.status,
            tags: (article.tags || []).join(", "),
          });
          setCategories(cats);
        })
        .catch(() => showToast.error("Failed to load article"));
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await kbService.updateArticle(id as string, {
        title: form.title,
        categoryId: form.categoryId,
        body: form.body,
        status: form.status,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      showToast.success("Article updated");
      router.push(`/knowledge-base/articles/${id}`);
    } catch {
      showToast.error("Failed to update article");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/knowledge-base/articles/${id}`} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Article</h1>
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
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center border-b border-gray-200 px-4 py-2">
            <button
              type="button"
              onClick={() => setPreview(false)}
              className={`px-3 py-1 text-sm rounded mr-2 ${!preview ? "bg-blue-100 text-blue-700" : "text-gray-500"}`}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setPreview(true)}
              className={`flex items-center gap-1 px-3 py-1 text-sm rounded ${preview ? "bg-blue-100 text-blue-700" : "text-gray-500"}`}
            >
              <Eye className="w-3 h-3" /> Preview
            </button>
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
              placeholder="Write article content here. HTML supported."
            />
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Link
            href={`/knowledge-base/articles/${id}`}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
