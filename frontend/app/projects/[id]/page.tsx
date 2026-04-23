"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  projectsService,
  Project,
  ProjectTask,
  TaskStatus,
  TaskPriority,
  CreateProjectTaskRequest,
} from "@/lib/projects";
import { showToast } from "@/lib/toast";
import {
  ArrowLeft,
  Users,
  Calendar,
  DollarSign,
  Tag,
  Edit,
  Trash2,
  LayoutGrid,
  List,
  BarChart2,
  PlusCircle,
  X,
} from "lucide-react";

type TabType = "overview" | "kanban" | "list" | "gantt";

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
  CANCELLED: "Cancelled",
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  TODO: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  IN_REVIEW: "bg-yellow-100 text-yellow-700",
  DONE: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskForm, setTaskForm] = useState<{
    title: string;
    description: string;
    priority: TaskPriority | "";
    dueDate: string;
  }>({ title: "", description: "", priority: "", dueDate: "" });
  const [savingTask, setSavingTask] = useState(false);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [p, t] = await Promise.all([
        projectsService.getProjectById(id as string),
        projectsService.getProjectTasks(id as string),
      ]);
      setProject(p);
      setTasks(t);
    } catch {
      showToast.error("Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this project?")) return;
    try {
      await projectsService.deleteProject(id as string);
      showToast.success("Project deleted");
      router.push("/projects");
    } catch {
      showToast.error("Failed to delete project");
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim() || !project) return;
    try {
      setSavingTask(true);
      const req: CreateProjectTaskRequest = {
        title: taskForm.title.trim(),
        projectId: project.projectId,
        description: taskForm.description || undefined,
        priority: taskForm.priority || undefined,
        dueDate: taskForm.dueDate || undefined,
        status: "TODO",
      };
      await projectsService.createTask(req);
      showToast.success("Task added");
      setShowAddTask(false);
      setTaskForm({ title: "", description: "", priority: "", dueDate: "" });
      await loadData();
    } catch {
      showToast.error("Failed to add task");
    } finally {
      setSavingTask(false);
    }
  };

  const handleTaskStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      await projectsService.updateTaskStatus(taskId, status);
      await loadData();
      showToast.success("Task status updated");
    } catch {
      showToast.error("Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!project) return <div className="p-6">Project not found</div>;

  const tasksByStatus = (Object.keys(STATUS_LABELS) as TaskStatus[]).reduce(
    (acc, s) => {
      acc[s] = tasks.filter((t) => t.status === s);
      return acc;
    },
    {} as Record<TaskStatus, ProjectTask[]>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/projects" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-500 text-sm">{project.projectId}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            className="flex items-center gap-1 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-sm hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {[
          { key: "overview", label: "Overview", icon: <List className="w-4 h-4" /> },
          { key: "kanban", label: "Kanban", icon: <LayoutGrid className="w-4 h-4" /> },
          { key: "list", label: "List", icon: <List className="w-4 h-4" /> },
          { key: "gantt", label: "Gantt", icon: <BarChart2 className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as TabType)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-3">Description</h3>
              <p className="text-gray-600 text-sm">
                {project.description || "No description provided."}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">Tasks ({tasks.length})</h3>
                <button
                  onClick={() => setShowAddTask(true)}
                  className="flex items-center gap-1 text-blue-600 text-sm hover:text-blue-800"
                >
                  <PlusCircle className="w-4 h-4" /> Add Task
                </button>
              </div>
              <div className="space-y-2">
                {tasks.slice(0, 5).map((task) => (
                  <Link key={task.taskId} href={`/projects/${id}/tasks/${task.taskId}`}>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100 hover:bg-gray-50 rounded px-2">
                      <span className="text-sm text-gray-700">{task.title}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[task.status]}`}
                      >
                        {STATUS_LABELS[task.status]}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <h3 className="font-semibold text-gray-800 mb-2">Details</h3>
              {project.startDate && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Start: {new Date(project.startDate).toLocaleDateString("en-IN")}</span>
                </div>
              )}
              {project.dueDate && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Due: {new Date(project.dueDate).toLocaleDateString("en-IN")}</span>
                </div>
              )}
              {project.budget && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span>Budget: ₹{project.budget.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4 text-gray-400" />
                <span>{project.memberIds?.length || 0} members</span>
              </div>
              {project.tags && project.tags.length > 0 && (
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <Tag className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div className="flex flex-wrap gap-1">
                    {project.tags.map((t) => (
                      <span key={t} className="bg-gray-100 text-xs px-2 py-0.5 rounded">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-3">Progress</h3>
              {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
                <div key={s} className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">{STATUS_LABELS[s]}</span>
                  <span className="font-medium">{tasksByStatus[s]?.length || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Kanban Tab */}
      {activeTab === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] as TaskStatus[]).map((status) => (
            <div key={status} className="flex-shrink-0 w-72">
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm text-gray-700">{STATUS_LABELS[status]}</h3>
                  <span className="bg-white text-xs text-gray-500 px-2 py-0.5 rounded-full border">
                    {tasksByStatus[status]?.length || 0}
                  </span>
                </div>
                <div className="space-y-2">
                  {tasksByStatus[status]?.map((task) => (
                    <div
                      key={task.taskId}
                      className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition-shadow"
                    >
                      <Link href={`/projects/${id}/tasks/${task.taskId}`}>
                        <p className="text-sm font-medium text-gray-800 mb-1">{task.title}</p>
                        {task.dueDate && (
                          <p className="text-xs text-gray-400">
                            {new Date(task.dueDate).toLocaleDateString("en-IN")}
                          </p>
                        )}
                      </Link>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] as TaskStatus[])
                          .filter((s) => s !== status)
                          .map((s) => (
                            <button
                              key={s}
                              onClick={() => handleTaskStatusChange(task.taskId, s)}
                              className="text-xs text-gray-500 hover:text-blue-600 hover:underline"
                            >
                              → {STATUS_LABELS[s]}
                            </button>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List Tab */}
      {activeTab === "list" && (
        <div className="bg-white rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left p-4 font-medium text-gray-600">Task</th>
                <th className="text-left p-4 font-medium text-gray-600">Status</th>
                <th className="text-left p-4 font-medium text-gray-600">Priority</th>
                <th className="text-left p-4 font-medium text-gray-600">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.taskId} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4">
                    <Link
                      href={`/projects/${id}/tasks/${task.taskId}`}
                      className="text-blue-600 hover:underline"
                    >
                      {task.title}
                    </Link>
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[task.status]}`}
                    >
                      {STATUS_LABELS[task.status]}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">{task.priority || "-"}</td>
                  <td className="p-4 text-gray-600">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-IN") : "-"}
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400">
                    No tasks yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Gantt Tab */}
      {activeTab === "gantt" && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Timeline</h3>
          {tasks.filter((t) => t.dueDate).length === 0 ? (
            <p className="text-gray-400 text-sm">
              No tasks with due dates to display on Gantt chart.
            </p>
          ) : (
            <div className="space-y-3">
              {tasks
                .filter((t) => t.dueDate)
                .map((task) => {
                  const start = project.startDate ? new Date(project.startDate) : new Date();
                  const end = project.dueDate
                    ? new Date(project.dueDate)
                    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                  const taskDue = new Date(task.dueDate!);
                  const total = end.getTime() - start.getTime();
                  const taskPos = Math.max(
                    0,
                    Math.min(100, ((taskDue.getTime() - start.getTime()) / total) * 100)
                  );
                  return (
                    <div key={task.taskId} className="flex items-center gap-3">
                      <div className="w-48 text-sm text-gray-700 truncate">{task.title}</div>
                      <div className="flex-1 bg-gray-100 rounded h-6 relative">
                        <div
                          className="absolute top-0 h-6 bg-blue-400 rounded"
                          style={{ left: "0%", width: `${Math.max(2, taskPos)}%` }}
                        />
                        <span className="absolute right-1 top-0.5 text-xs text-gray-500">
                          {new Date(task.dueDate!).toLocaleDateString("en-IN")}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Add Task</h2>
              <button
                onClick={() => setShowAddTask(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={taskForm.title}
                  onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Task title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Optional description"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) =>
                      setTaskForm((f) => ({ ...f, priority: e.target.value as TaskPriority | "" }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm((f) => ({ ...f, dueDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTask}
                  className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingTask ? "Adding..." : "Add Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
