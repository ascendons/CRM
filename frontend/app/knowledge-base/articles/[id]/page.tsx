"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { kbService, KbArticle } from "@/lib/knowledge-base";
import { showToast } from "@/lib/toast";
import { ArrowLeft, Edit, Eye, Calendar } from "lucide-react";

export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<KbArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadArticle();
  }, [id]);

  const loadArticle = async () => {
    try {
      setLoading(true);
      const data = await kbService.getArticleById(id as string);
      setArticle(data);
    } catch {
      showToast.error("Failed to load article");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  if (!article) return <div className="p-6">Article not found</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/knowledge-base" className="hover:text-gray-700">
          Knowledge Base
        </Link>
        {article.categoryId && (
          <>
            <span>/</span>
            <Link href={`/knowledge-base/${article.categoryId}`} className="hover:text-gray-700">
              Category
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-gray-800">{article.title}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <Link href="/knowledge-base" className="text-gray-500 hover:text-gray-700 mt-1">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 mx-4">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-gray-900">{article.title}</h1>
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${
                article.status === "PUBLISHED"
                  ? "bg-green-100 text-green-700"
                  : article.status === "DRAFT"
                    ? "bg-gray-100 text-gray-600"
                    : "bg-orange-100 text-orange-700"
              }`}
            >
              {article.status}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" /> {article.viewCount || 0} views
            </div>
            {article.publishedAt && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(article.publishedAt).toLocaleDateString("en-IN")}
              </div>
            )}
          </div>
        </div>
        <Link
          href={`/knowledge-base/articles/${id}/edit`}
          className="flex items-center gap-2 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-50"
        >
          <Edit className="w-4 h-4" /> Edit
        </Link>
      </div>

      {article.tags && article.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {article.tags.map((t) => (
            <span key={t} className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full">
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-8">
        {article.body ? (
          <div
            className="prose prose-gray max-w-none text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: article.body }}
          />
        ) : (
          <p className="text-gray-400 italic">No content yet.</p>
        )}
      </div>
    </div>
  );
}
