"use client";
import { useEffect, useState } from "react";
import { feedApi } from "@/lib/feed";
import { showToast } from "@/lib/toast";

const EMOJIS = ["👍", "❤️", "😂", "🎉", "😮"];

export default function FeedPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [compose, setCompose] = useState({ type: "POST", body: "", pollOptions: ["", ""] });
  const [tab, setTab] = useState<"POST"|"ANNOUNCEMENT"|"POLL">("POST");

  useEffect(() => { load(0); }, []);

  async function load(p: number) {
    try {
      const res = await feedApi.getFeed(p, 10);
      const content = res.data?.content || [];
      if (p === 0) setPosts(content);
      else setPosts(prev => [...prev, ...content]);
      setHasMore(!res.data?.last);
      setPage(p);
    } catch { showToast("Failed to load", "error"); }
  }

  async function handlePost() {
    if (!compose.body.trim()) return;
    const data: any = { type: tab, body: compose.body };
    if (tab === "POLL") {
      data.pollOptions = compose.pollOptions.filter(o => o.trim()).map(o => ({ option: o, voteCount: 0 }));
    }
    try {
      await feedApi.createPost(data);
      showToast("Posted", "success");
      setCompose({ type: "POST", body: "", pollOptions: ["", ""] });
      load(0);
    } catch { showToast("Failed", "error"); }
  }

  async function handleReact(postId: string, emoji: string) {
    try { await feedApi.react(postId, emoji); load(0); } catch {}
  }

  async function handleVote(postId: string, optionIndex: number) {
    try { await feedApi.vote(postId, optionIndex); showToast("Voted", "success"); load(0); } catch { showToast("Already voted", "error"); }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Activity Feed</h1>

      {/* Compose */}
      <div className="bg-white border rounded-xl p-4 mb-6">
        <div className="flex gap-2 mb-3">
          {(["POST","ANNOUNCEMENT","POLL"] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setCompose(c => ({ ...c, type: t })); }}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${tab === t ? "bg-primary text-white" : "bg-slate-100"}`}>{t}</button>
          ))}
        </div>
        <textarea
          className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
          rows={3}
          placeholder={tab === "ANNOUNCEMENT" ? "Write an announcement..." : tab === "POLL" ? "Ask a question..." : "What's on your mind?"}
          value={compose.body}
          onChange={e => setCompose({ ...compose, body: e.target.value })}
        />
        {tab === "POLL" && (
          <div className="mt-2 space-y-2">
            {compose.pollOptions.map((opt, i) => (
              <input key={i} className="w-full border rounded-lg px-3 py-1 text-sm" placeholder={`Option ${i + 1}`}
                value={opt} onChange={e => { const opts = [...compose.pollOptions]; opts[i] = e.target.value; setCompose({ ...compose, pollOptions: opts }); }} />
            ))}
            <button className="text-primary text-sm underline" onClick={() => setCompose({ ...compose, pollOptions: [...compose.pollOptions, ""] })}>+ Add option</button>
          </div>
        )}
        <div className="flex justify-end mt-3">
          <button onClick={handlePost} className="bg-primary text-white px-4 py-2 rounded-lg text-sm">Post</button>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {posts.map((post: any) => (
          <div key={post.postId} className={`bg-white border rounded-xl p-4 ${post.isPinned ? "border-amber-300 bg-amber-50/20" : ""}`}>
            {post.isPinned && <div className="flex items-center gap-1 text-amber-600 text-xs mb-2"><span className="material-symbols-outlined text-sm">push_pin</span> Pinned</div>}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">{post.authorId?.charAt(0)?.toUpperCase()}</div>
              <div>
                <p className="font-medium text-sm">{post.authorId}</p>
                <p className="text-xs text-slate-400">{post.createdAt?.substring(0, 16).replace("T", " ")}</p>
              </div>
              <span className={`ml-auto px-2 py-0.5 rounded text-xs font-medium ${post.type === "ANNOUNCEMENT" ? "bg-red-100 text-red-700" : post.type === "POLL" ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600"}`}>{post.type}</span>
            </div>
            <p className="text-sm mb-3">{post.body}</p>

            {/* Poll options */}
            {post.type === "POLL" && post.pollOptions && (
              <div className="space-y-2 mb-3">
                {post.pollOptions.map((opt: any, i: number) => {
                  const total = post.pollOptions.reduce((s: number, o: any) => s + (o.voteCount || 0), 0);
                  const pct = total > 0 ? Math.round(((opt.voteCount || 0) / total) * 100) : 0;
                  return (
                    <button key={i} onClick={() => handleVote(post.postId, i)} className="w-full text-left border rounded-lg p-2 hover:border-primary">
                      <div className="flex justify-between text-sm mb-1"><span>{opt.option}</span><span>{pct}%</span></div>
                      <div className="bg-slate-100 rounded h-1.5"><div className="bg-primary h-1.5 rounded" style={{ width: `${pct}%` }} /></div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Reactions */}
            <div className="flex items-center gap-2 flex-wrap">
              {EMOJIS.map(emoji => (
                <button key={emoji} onClick={() => handleReact(post.postId, emoji)}
                  className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-50 border hover:bg-slate-100 text-sm">
                  {emoji} <span className="text-xs text-slate-500">{post.reactionCounts?.[emoji] || 0}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <button onClick={() => load(page + 1)} className="w-full mt-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50">Load more</button>
      )}
    </div>
  );
}
