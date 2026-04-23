"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formsService, LandingPage } from "@/lib/forms";
import { showToast } from "@/lib/toast";
import { PlusCircle, Globe, ExternalLink, Trash2 } from "lucide-react";

export default function LandingPagesPage() {
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      setLoading(true);
      const data = await formsService.getLandingPages();
      setPages(data);
    } catch {
      showToast.error("Failed to load landing pages");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (pageId: string) => {
    try {
      await formsService.publishLandingPage(pageId);
      showToast.success("Page published");
      loadPages();
    } catch {
      showToast.error("Failed to publish page");
    }
  };

  const handleDelete = async (pageId: string) => {
    if (!confirm("Delete this landing page?")) return;
    try {
      await formsService.deleteLandingPage(pageId);
      showToast.success("Page deleted");
      loadPages();
    } catch {
      showToast.error("Failed to delete page");
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
          <h1 className="text-2xl font-bold text-gray-900">Landing Pages</h1>
          <p className="text-gray-500 text-sm">{pages.length} pages</p>
        </div>
        <Link
          href="/marketing/landing-pages/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
        >
          <PlusCircle className="w-4 h-4" /> New Page
        </Link>
      </div>

      {pages.length === 0 ? (
        <div className="text-center py-16">
          <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No landing pages yet</p>
          <Link
            href="/marketing/landing-pages/new"
            className="text-blue-600 text-sm mt-2 inline-block"
          >
            Create your first landing page
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map((page) => (
            <div key={page.pageId} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{page.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">/{page.slug}</p>
                </div>
                <button
                  onClick={() => handleDelete(page.pageId)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {page.heroText && (
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{page.heroText}</p>
              )}
              <div className="flex items-center justify-between mt-4">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${page.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                >
                  {page.published ? "Published" : "Draft"}
                </span>
                <div className="flex gap-2">
                  {!page.published && (
                    <button
                      onClick={() => handlePublish(page.pageId)}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      Publish
                    </button>
                  )}
                  {page.published && (
                    <Link
                      href={`/lp/${page.slug}`}
                      target="_blank"
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                    >
                      <ExternalLink className="w-3 h-3" /> View
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
