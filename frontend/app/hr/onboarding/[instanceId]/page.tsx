"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { onboardingApi } from "@/lib/onboarding";
import { showToast } from "@/lib/toast";

export default function InstancePage() {
  const { instanceId } = useParams<{ instanceId: string }>();
  const [instance, setInstance] = useState<any>(null);

  useEffect(() => {
    load();
  }, [instanceId]);

  async function load() {
    try {
      // Get all instances and find this one
      const res = await onboardingApi.getInstances();
      const found = (res.data || []).find((i: any) => i.instanceId === instanceId);
      setInstance(found || null);
    } catch {
      showToast.error("Failed to load");
    }
  }

  async function handleComplete(taskIndex: number) {
    try {
      await onboardingApi.completeTask(instanceId, taskIndex);
      showToast.success("Task completed");
      load();
    } catch {
      showToast.error("Failed");
    }
  }

  if (!instance) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Onboarding: {instance.employeeId}</h1>
        <p className="text-slate-500">
          Mentor: {instance.mentorId || "N/A"} · Started: {instance.startDate}
        </p>
      </div>

      <div className="bg-white border rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">Progress</span>
          <span className="text-lg font-bold text-primary">{instance.progress}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3">
          <div
            className="bg-primary h-3 rounded-full transition-all"
            style={{ width: `${instance.progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {(instance.tasks || []).map((task: any, i: number) => (
          <div
            key={i}
            className={`bg-white border rounded-xl p-4 flex items-center gap-3 ${task.status === "DONE" ? "opacity-60" : ""}`}
          >
            <input
              type="checkbox"
              checked={task.status === "DONE"}
              onChange={() => task.status !== "DONE" && handleComplete(i)}
              className="w-5 h-5 accent-primary"
            />
            <div className="flex-1">
              <p className={`font-medium ${task.status === "DONE" ? "line-through" : ""}`}>
                {task.taskTitle}
              </p>
              {task.description && <p className="text-sm text-slate-500">{task.description}</p>}
              <p className="text-xs text-slate-400">
                Assignee: {task.assigneeTo} · Due: Day {task.dueDaysFromStart}
              </p>
            </div>
            {task.status === "DONE" && (
              <span className="text-green-600 text-sm font-medium">Done</span>
            )}
            {task.isRequired && task.status !== "DONE" && (
              <span className="text-xs text-red-500">Required</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
