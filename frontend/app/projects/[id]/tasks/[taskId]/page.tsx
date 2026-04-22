"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { projectsService, ProjectTask, TaskComment, TaskStatus } from "@/lib/projects";
import { showToast } from "@/lib/toast";
import { ArrowLeft, MessageSquare, Send, Trash2 } from "lucide-react";

const STATUS_OPTIONS: TaskStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"];

export default function TaskDetailPage() {
  const { id, taskId } = useParams<{ id: string; taskId: string }>();
  const router = useRouter();
  const [task, setTask] = useState<ProjectTask | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (taskId) loadData();
  }, [taskId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [t, c] = await Promise.all([
        projectsService.getTaskById(taskId as string),
        projectsService.getComments(taskId as string),
      ]);
      setTask(t);
      setComments(c);
    } catch {
      showToast("Failed to load task", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: TaskStatus) => {
    if (!task) return;
    try {
      await projectsService.updateTaskStatus(task.taskId, status);
      await loadData();
      showToast("Status updated", "success");
    } catch {
      showToast("Failed to update status", "error");
    }
  };

  const handleDeleteTask = async () => {
    if (!confirm("Delete this task?")) return;
    try {
      await projectsService.deleteTask(taskId as string);
      showToast("Task deleted", "success");
      router.push(`/projects/${id}`);
    } catch {
      showToast("Failed to delete task", "error");
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      setSubmittingComment(true);
      await projectsService.addComment(taskId as string, commentText);
      setCommentText("");
      const c = await projectsService.getComments(taskId as string);
      setComments(c);
    } catch {
      showToast("Failed to add comment", "error");
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  if (!task) return <div className="p-6">Task not found</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/projects/${id}`} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{task.title}</h1>
          <p className="text-xs text-gray-400">{task.taskId}</p>
        </div>
        <button onClick={handleDeleteTask} className="text-red-500 hover:text-red-700">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
            <p className="text-gray-600 text-sm">{task.description || "No description."}</p>
          </div>

          {/* Checklist */}
          {task.checklistItems && task.checklistItems.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-3">Checklist</h3>
              <div className="space-y-2">
                {task.checklistItems.map(item => (
                  <div key={item.itemId} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={item.completed} readOnly className="rounded" />
                    <span className={item.completed ? "line-through text-gray-400" : "text-gray-700"}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-gray-500" />
              <h3 className="font-semibold text-gray-800">Comments ({comments.length})</h3>
            </div>
            <div className="space-y-3 mb-4">
              {comments.map(comment => (
                <div key={comment.commentId} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700">{comment.body}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {comment.createdAt ? new Date(comment.createdAt).toLocaleString("en-IN") : ""}
                  </p>
                </div>
              ))}
              {comments.length === 0 && <p className="text-gray-400 text-sm">No comments yet.</p>}
            </div>
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-gray-500 text-xs">Status</label>
                <select
                  value={task.status}
                  onChange={e => handleStatusChange(e.target.value as TaskStatus)}
                  className="w-full mt-1 border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s.replace("_", " ")}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-gray-500 text-xs">Priority</label>
                <p className="text-gray-800 font-medium">{task.priority || "-"}</p>
              </div>
              {task.dueDate && (
                <div>
                  <label className="text-gray-500 text-xs">Due Date</label>
                  <p className="text-gray-800">{new Date(task.dueDate).toLocaleDateString("en-IN")}</p>
                </div>
              )}
              {task.estimatedHours && (
                <div>
                  <label className="text-gray-500 text-xs">Estimated Hours</label>
                  <p className="text-gray-800">{task.estimatedHours}h</p>
                </div>
              )}
              <div>
                <label className="text-gray-500 text-xs">Completion</label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${task.completionPct || 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">{task.completionPct || 0}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
