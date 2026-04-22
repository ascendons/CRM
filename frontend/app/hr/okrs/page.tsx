"use client";
import { useEffect, useState } from "react";
import { performanceApi } from "@/lib/performance";
import { showToast } from "@/lib/toast";

export default function OkrPage() {
  const [objectives, setObjectives] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", ownerId: "", quarter: "Q1", year: new Date().getFullYear(), keyResults: [{ title: "", targetValue: 100, currentValue: 0, unit: "%" }] });

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await performanceApi.getObjectives();
      setObjectives(res.data || []);
    } catch { showToast("Failed to load", "error"); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await performanceApi.createObjective(form);
      showToast("Objective created", "success");
      setShowForm(false);
      load();
    } catch { showToast("Failed", "error"); }
  }

  async function updateKr(objId: string, krIndex: number, currentValue: number) {
    try {
      await performanceApi.updateKeyResult(objId, krIndex, { currentValue });
      showToast("Updated", "success");
      load();
    } catch { showToast("Failed", "error"); }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Objectives & Key Results</h1>
        <button onClick={() => setShowForm(true)} className="bg-primary text-white px-4 py-2 rounded-lg">New Objective</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg m-4">
            <h2 className="text-lg font-semibold mb-4">Create Objective</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <input className="w-full border rounded-lg px-3 py-2" placeholder="Objective title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              <input className="w-full border rounded-lg px-3 py-2" placeholder="Owner ID" value={form.ownerId} onChange={e => setForm({ ...form, ownerId: e.target.value })} />
              <div className="flex gap-2">
                <select className="border rounded-lg px-3 py-2 flex-1" value={form.quarter} onChange={e => setForm({ ...form, quarter: e.target.value })}>
                  {["Q1","Q2","Q3","Q4"].map(q => <option key={q}>{q}</option>)}
                </select>
                <input type="number" className="border rounded-lg px-3 py-2 flex-1" value={form.year} onChange={e => setForm({ ...form, year: parseInt(e.target.value) })} />
              </div>
              <div>
                <p className="font-medium mb-2">Key Results</p>
                {form.keyResults.map((kr, i) => (
                  <div key={i} className="border rounded-lg p-3 mb-2 space-y-2">
                    <input className="w-full border rounded px-2 py-1" placeholder="Key Result title" value={kr.title} onChange={e => { const krs = [...form.keyResults]; krs[i].title = e.target.value; setForm({ ...form, keyResults: krs }); }} />
                    <div className="flex gap-2">
                      <input type="number" className="border rounded px-2 py-1 flex-1" placeholder="Target" value={kr.targetValue} onChange={e => { const krs = [...form.keyResults]; krs[i].targetValue = parseFloat(e.target.value); setForm({ ...form, keyResults: krs }); }} />
                      <input className="border rounded px-2 py-1 w-20" placeholder="Unit" value={kr.unit} onChange={e => { const krs = [...form.keyResults]; krs[i].unit = e.target.value; setForm({ ...form, keyResults: krs }); }} />
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => setForm({ ...form, keyResults: [...form.keyResults, { title: "", targetValue: 100, currentValue: 0, unit: "%" }] })} className="text-primary text-sm underline">+ Add Key Result</button>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg flex-1">Create</button>
                <button type="button" onClick={() => setShowForm(false)} className="border px-4 py-2 rounded-lg flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {objectives.map((obj: any) => (
          <div key={obj.objectiveId} className="bg-white border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold text-lg">{obj.title}</p>
                <p className="text-sm text-slate-500">{obj.quarter} {obj.year} · Owner: {obj.ownerId}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{Math.round(obj.progress ?? 0)}%</p>
                <p className="text-xs text-slate-500">Overall</p>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mb-3">
              <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min(100, obj.progress ?? 0)}%` }} />
            </div>
            <div className="space-y-2">
              {(obj.keyResults || []).map((kr: any, i: number) => (
                <div key={i} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{kr.title}</span>
                    <span className="text-sm text-slate-500">{kr.currentValue ?? 0} / {kr.targetValue} {kr.unit}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                      <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${kr.targetValue > 0 ? Math.min(100, ((kr.currentValue ?? 0) / kr.targetValue) * 100) : 0}%` }} />
                    </div>
                    <input
                      type="number"
                      className="border rounded px-2 py-0.5 w-20 text-sm"
                      defaultValue={kr.currentValue ?? 0}
                      onBlur={e => updateKr(obj.objectiveId, i, parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {objectives.length === 0 && <p className="text-slate-500 text-center py-8">No objectives yet.</p>}
      </div>
    </div>
  );
}
