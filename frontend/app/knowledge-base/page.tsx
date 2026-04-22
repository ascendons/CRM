"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { kbService, KbCategory, KbArticle } from "@/lib/knowledge-base";
import { showToast } from "@/lib/toast";
import { BookOpen, Search, PlusCircle, Eye, FolderOpen } from "lucide-react";

export default function KnowledgeBasePage() {
  const [categories, setCategories] = useState<KbCategory[]>([]);
  const [recent, setRecent] = useState<KbArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<KbArticle[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cats, articles] = await Promise.all([
        kbService.getCategories(),
        kbService.getArticles(),
      ]);
      setCategories(cats);
      setRecent(articles.slice(0, 6));
    } catch {
      showToast("Failed to load knowledge base", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      setSearching(true);
      const results = await kbService.searchArticles(searchQuery);
      setSearchResults(results);
    } catch {
      showToast("Search failed", "error");
    } finally {
      setSearching(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
          <p className="text-gray-500 text-sm">{categories.length} categories</p>
        </div>
        <Link
          href="/knowledge-base/articles/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
        >
          <PlusCircle className="w-4 h-4" /> New Article
        </Link>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); if (!e.target.value) setSearchResults([]); }}
            placeholder="Search articles..."
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={searching}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {searching ? "Searching..." : "Search"}
        </button>
      </form>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Search Results ({searchResults.length})</h2>
          <div className="space-y-2">
            {searchResults.map(article => (
              <Link key={article.articleId} href={`/knowledge-base/articles/${article.articleId}`}>
                <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-800">{article.title}</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Eye className="w-3 h-3" /> {article.viewCount || 0}
                    </div>
                  </div>
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {article.tags.map(t => <span key={t} className="bg-gray-100 text-xs px-2 py-0.5 rounded">{t}</span>)}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Categories</h2>
        {categories.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <FolderOpen className="w-8 h-8 mx-auto mb-2" />
            <p>No categories yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => (
              <Link key={cat.categoryId} href={`/knowledge-base/${cat.categoryId}`}>
                <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{cat.icon || "📁"}</span>
                    <h3 className="font-semibold text-gray-800">{cat.name}</h3>
                  </div>
                  {cat.description && <p className="text-sm text-gray-500">{cat.description}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Articles */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Articles</h2>
        {recent.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <BookOpen className="w-8 h-8 mx-auto mb-2" />
            <p>No articles yet. <Link href="/knowledge-base/articles/new" className="text-blue-600">Create one</Link></p>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map(article => (
              <Link key={article.articleId} href={`/knowledge-base/articles/${article.articleId}`}>
                <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                  <div>
                    <h3 className="font-medium text-gray-800">{article.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {article.createdAt ? new Date(article.createdAt).toLocaleDateString("en-IN") : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Eye className="w-3 h-3" /> {article.viewCount || 0}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
