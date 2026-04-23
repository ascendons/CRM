"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { performanceApi } from "@/lib/performance";
import { showToast } from "@/lib/toast";

export default function ReviewDetailPage() {
  const { id: cycleId } = useParams<{ id: string }>();
  const [reviews, setReviews] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    revieweeId: "",
    reviewerId: "",
    summary: "",
    ratings: [{ competency: "", score: 3, comment: "" }],
  });

  useEffect(() => {
    load();
  }, [cycleId]);

  async function load() {
    try {
      const res = await performanceApi.getReviews(cycleId);
      setReviews(res.data || []);
    } catch {
      showToast.error("Failed to load");
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await performanceApi.createReview({ ...form, cycleId });
      showToast.success("Review created");
      setShowForm(false);
      load();
    } catch {
      showToast.error("Failed");
    }
  }

  async function handleSubmit(reviewId: string) {
    try {
      await performanceApi.submitReview(reviewId);
      showToast.success("Review submitted");
      load();
    } catch {
      showToast.error("Failed");
    }
  }

  const addRating = () =>
    setForm({ ...form, ratings: [...form.ratings, { competency: "", score: 3, comment: "" }] });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Performance Reviews</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg"
        >
          New Review
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg m-4">
            <h2 className="text-lg font-semibold mb-4">Create Review</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Reviewee ID"
                value={form.revieweeId}
                onChange={(e) => setForm({ ...form, revieweeId: e.target.value })}
                required
              />
              <input
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Reviewer ID"
                value={form.reviewerId}
                onChange={(e) => setForm({ ...form, reviewerId: e.target.value })}
                required
              />
              <textarea
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Summary"
                rows={3}
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
              />
              <div>
                <p className="font-medium mb-2">Ratings</p>
                {form.ratings.map((r, i) => (
                  <div key={i} className="border rounded-lg p-3 mb-2 space-y-2">
                    <input
                      className="w-full border rounded px-2 py-1"
                      placeholder="Competency"
                      value={r.competency}
                      onChange={(e) => {
                        const rs = [...form.ratings];
                        rs[i].competency = e.target.value;
                        setForm({ ...form, ratings: rs });
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Score: {r.score}</span>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        value={r.score}
                        onChange={(e) => {
                          const rs = [...form.ratings];
                          rs[i].score = parseInt(e.target.value);
                          setForm({ ...form, ratings: rs });
                        }}
                        className="flex-1"
                      />
                    </div>
                    <input
                      className="w-full border rounded px-2 py-1"
                      placeholder="Comment"
                      value={r.comment}
                      onChange={(e) => {
                        const rs = [...form.ratings];
                        rs[i].comment = e.target.value;
                        setForm({ ...form, ratings: rs });
                      }}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addRating}
                  className="text-primary text-sm underline"
                >
                  + Add Competency
                </button>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg flex-1">
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="border px-4 py-2 rounded-lg flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {reviews.map((r: any) => (
          <div key={r.reviewId} className="bg-white border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold">Reviewee: {r.revieweeId}</p>
                <p className="text-sm text-slate-500">
                  Reviewer: {r.reviewerId} · Score: {r.overallScore ?? "N/A"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${r.status === "SUBMITTED" ? "bg-blue-100 text-blue-700" : r.status === "COMPLETED" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}
                >
                  {r.status}
                </span>
                {r.status === "DRAFT" && (
                  <button
                    onClick={() => handleSubmit(r.reviewId)}
                    className="text-sm bg-primary text-white px-3 py-1 rounded"
                  >
                    Submit
                  </button>
                )}
              </div>
            </div>
            {r.summary && <p className="text-sm text-slate-600">{r.summary}</p>}
          </div>
        ))}
        {reviews.length === 0 && (
          <p className="text-slate-500 text-center py-8">No reviews for this cycle.</p>
        )}
      </div>
    </div>
  );
}
