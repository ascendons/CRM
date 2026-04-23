"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { kbService, KbArticle, KbCategory } from "@/lib/knowledge-base";
import { showToast } from "@/lib/toast";
import { ArrowLeft, Eye, BookOpen, PlusCircle } from "lucide-react";

export default function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [articles, setArticles] = useState<KbArticle[]>([]);
  const [category, setCategory] = useState<KbCategory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (categoryId) loadData();
  }, [categoryId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cats, arts] = await Promise.all([
        kbService.getCategories(),
        kbService.getArticles(categoryId as string),
      ]);
      const cat = cats.find((c) => c.categoryId === categoryId);
      setCategory(cat || null);
      setArticles(arts);
    } catch {
      showToast.error("Failed to load articles");
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

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/knowledge-base" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{category?.name || "Category"}</h1>
          {category?.description && <p className="text-gray-500 text-sm">{category.description}</p>}
        </div>
        <Link
          href="/knowledge-base/articles/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
          <PlusCircle className="w-4 h-4" /> New Article
        </Link>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No articles in this category</p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <Link key={article.articleId} href={`/knowledge-base/articles/${article.articleId}`}>
              <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{article.title}</h3>
                    {article.body && (
                      <p className="text-gray-500 text-sm line-clamp-2">
                        {article.body.replace(/<[^>]*>/g, "").slice(0, 150)}...
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      {article.tags?.map((t) => (
                        <span key={t} className="bg-gray-100 text-xs px-2 py-0.5 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-1 text-xs text-gray-400">
                    <Eye className="w-3 h-3" /> {article.viewCount || 0}
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {article.publishedAt
                    ? new Date(article.publishedAt).toLocaleDateString("en-IN")
                    : "Draft"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
