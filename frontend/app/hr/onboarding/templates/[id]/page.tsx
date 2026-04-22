"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { onboardingApi } from "@/lib/onboarding";
import { showToast } from "@/lib/toast";

export default function TemplateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const [form, setForm] = useState<any>({ name: "", type: "ONBOARDING", tasks: [] });

  useEffect(() => {
    if (!isNew) {
      onboardingApi.getTemplate(id).then(res => setForm(res.data)).catch(() => showToast("Failed to load", "error"));
    }
  }, [id]);

  async function handleSave() {
    try {
      await onboardingApi.createTemplate(form);
      showToast("Saved", "success");
      window.location.href = "/hr/onboarding/templates";
    } catch { showToast("Failed to save", "error"); }
  }

  const addTask = () => setForm({ ...form, tasks: [...(form.tasks || []), { taskTitle: "", description: "", assigneeTo: "SELF", dueDaysFromStart: 1, isRequired: true }] });
  const removeTask = (i: number) => { const tasks = [...form.tasks]; tasks.splice(i, 1); setForm({ ...form, tasks }); };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{isNew ? "New Template" : "Edit Template"}</h1>
      <div className="bg-white border rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input className="w-full border rounded-lg px-3 py-2" value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select className="w-full border rounded-lg px-3 py-2" value={form.type || "ONBOARDING"} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option>ONBOARDING</option>
              <option>OFFBOARDING</option>
            </select>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium">Tasks</label>
            <button onClick={addTask} className="text-primary text-sm underline">+ Add Task</button>
          </div>
          {(form.tasks || []).map((task: any, i: number) => (
            <div key={i} className="border rounded-lg p-3 mb-2 space-y-2">
              <input className="w-full border rounded px-2 py-1 text-sm" placeholder="Task title" value={task.taskTitle} onChange={e => { const tasks = [...form.tasks]; tasks[i].taskTitle = e.target.value; setForm({ ...form, tasks }); }} />
              <input className="w-full border rounded px-2 py-1 text-sm" placeholder="Description" value={task.description} onChange={e => { const tasks = [...form.tasks]; tasks[i].description = e.target.value; setForm({ ...form, tasks }); }} />
              <div className="flex gap-2">
                <select className="border rounded px-2 py-1 text-sm flex-1" value={task.assigneeTo} onChange={e => { const tasks = [...form.tasks]; tasks[i].assigneeTo = e.target.value; setForm({ ...form, tasks }); }}>
                  {["SELF","MANAGER","HR","IT"].map(a => <option key={a}>{a}</option>)}
                </select>
                <input type="number" className="border rounded px-2 py-1 text-sm w-24" placeholder="Due days" value={task.dueDaysFromStart} onChange={e => { const tasks = [...form.tasks]; tasks[i].dueDaysFromStart = parseInt(e.target.value); setForm({ ...form, tasks }); }} />
                <label className="flex items-center gap-1 text-sm">
                  <input type="checkbox" checked={task.isRequired} onChange={e => { const tasks = [...form.tasks]; tasks[i].isRequired = e.target.checked; setForm({ ...form, tasks }); }} />
                  Required
                </label>
                <button onClick={() => removeTask(i)} className="text-red-500 text-sm">Remove</button>
              </div>
            </div>
          ))}
        </div>
        <button onClick={handleSave} className="bg-primary text-white px-6 py-2 rounded-lg">Save Template</button>
      </div>
    </div>
  );
}
