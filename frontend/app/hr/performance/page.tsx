"use client";
import { useEffect, useState } from "react";
import { performanceApi } from "@/lib/performance";
import { showToast } from "@/lib/toast";

export default function PerformancePage() {
  const [cycles, setCycles] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "", reviewerType: "MANAGER" });

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await performanceApi.getCycles();
      setCycles(res.data || []);
    } catch { showToast("Failed to load cycles", "error"); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await performanceApi.createCycle(form);
      showToast("Cycle created", "success");
      setShowForm(false);
      load();
    } catch { showToast("Failed to create cycle", "error"); }
  }

  async function handleDelete(cycleId: string) {
    if (!confirm("Delete this cycle?")) return;
    try {
      await performanceApi.deleteCycle(cycleId);
      showToast("Deleted", "success");
      load();
    } catch { showToast("Failed", "error"); }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Performance Review Cycles</h1>
        <button onClick={() => setShowForm(true)} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">add</span> New Cycle
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Create Review Cycle</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <input className="input w-full border rounded-lg px-3 py-2" placeholder="Cycle name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              <input type="date" className="input w-full border rounded-lg px-3 py-2" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required />
              <input type="date" className="input w-full border rounded-lg px-3 py-2" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} required />
              <select className="input w-full border rounded-lg px-3 py-2" value={form.reviewerType} onChange={e => setForm({ ...form, reviewerType: e.target.value })}>
                {["MANAGER", "PEER", "SELF", "THREE_SIXTY"].map(t => <option key={t}>{t}</option>)}
              </select>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg flex-1">Create</button>
                <button type="button" onClick={() => setShowForm(false)} className="border px-4 py-2 rounded-lg flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {cycles.map((c: any) => (
          <div key={c.cycleId} className="bg-white border rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold">{c.name}</p>
              <p className="text-sm text-slate-500">{c.startDate} — {c.endDate} · {c.reviewerType}</p>
            </div>
            <div className="flex gap-2">
              <a href={`/hr/performance/reviews/${c.cycleId}`} className="text-sm text-primary underline">View Reviews</a>
              <button onClick={() => handleDelete(c.cycleId)} className="text-red-500 hover:text-red-700">
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
            </div>
          </div>
        ))}
        {cycles.length === 0 && <p className="text-slate-500 text-center py-8">No review cycles yet.</p>}
      </div>
    </div>
  );
}
