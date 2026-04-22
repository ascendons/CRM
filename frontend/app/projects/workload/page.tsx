"use client";

import { useState, useEffect } from "react";
import { timesheetsService, WorkloadSummary } from "@/lib/timesheets";
import { showToast } from "@/lib/toast";
import { Users } from "lucide-react";

export default function WorkloadPage() {
  const [workload, setWorkload] = useState<WorkloadSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkload();
  }, []);

  const loadWorkload = async () => {
    try {
      setLoading(true);
      const data = await timesheetsService.getWorkload();
      setWorkload(data);
    } catch {
      showToast("Failed to load workload", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Team Workload</h1>
        <p className="text-gray-500 text-sm">Current week workload by team member</p>
      </div>

      {workload.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No workload data available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workload.map(member => {
            const completionRate = member.assignedTasks > 0
              ? Math.round((member.completedTasks / member.assignedTasks) * 100)
              : 0;
            return (
              <div key={member.userId} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                    {member.userName?.slice(0, 2).toUpperCase() || "??"}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{member.userName}</p>
                    <p className="text-xs text-gray-400">{member.userId}</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Assigned Tasks</span>
                    <span className="font-medium text-gray-800">{member.assignedTasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Completed</span>
                    <span className="font-medium text-green-700">{member.completedTasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Hours Logged</span>
                    <span className="font-medium text-gray-800">{member.totalHoursLogged}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Pending Hours</span>
                    <span className="font-medium text-orange-600">{member.pendingHours.toFixed(1)}h</span>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Completion</span>
                      <span>{completionRate}%</span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
