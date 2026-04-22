"use client";
import { useEffect, useState } from "react";
import { onboardingApi } from "@/lib/onboarding";
import { showToast } from "@/lib/toast";

export default function OnboardingPage() {
  const [instances, setInstances] = useState<any[]>([]);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await onboardingApi.getInstances();
      setInstances(res.data || []);
    } catch { showToast("Failed to load", "error"); }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Employee Onboarding</h1>
        <div className="flex gap-2">
          <a href="/hr/onboarding/templates" className="border px-4 py-2 rounded-lg text-sm">Templates</a>
        </div>
      </div>

      <div className="space-y-3">
        {instances.map((inst: any) => (
          <a key={inst.instanceId} href={`/hr/onboarding/${inst.instanceId}`} className="block bg-white border rounded-xl p-4 hover:border-primary transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold">Employee: {inst.employeeId}</p>
                <p className="text-sm text-slate-500">Mentor: {inst.mentorId || "N/A"} · Started: {inst.startDate}</p>
              </div>
              <span className="text-lg font-bold text-primary">{inst.progress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${inst.progress}%` }} />
            </div>
          </a>
        ))}
        {instances.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <p>No onboarding instances yet.</p>
            <p className="text-sm mt-1">Create a template first, then start an onboarding.</p>
          </div>
        )}
      </div>
    </div>
  );
}
