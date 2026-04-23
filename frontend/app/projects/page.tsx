"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { projectsService, Project, ProjectStatus } from "@/lib/projects";
import { showToast } from "@/lib/toast";
import {
  PlusCircle,
  FolderOpen,
  Clock,
  CheckCircle,
  XCircle,
  PauseCircle,
  Search,
} from "lucide-react";

const STATUS_COLORS: Record<ProjectStatus, string> = {
  PLANNING: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  ON_HOLD: "bg-gray-100 text-gray-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const STATUS_ICONS: Record<ProjectStatus, React.ReactNode> = {
  PLANNING: <Clock className="w-4 h-4" />,
  IN_PROGRESS: <Clock className="w-4 h-4" />,
  ON_HOLD: <PauseCircle className="w-4 h-4" />,
  COMPLETED: <CheckCircle className="w-4 h-4" />,
  CANCELLED: <XCircle className="w-4 h-4" />,
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filtered, setFiltered] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "">("");

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    let data = projects;
    if (search) {
      data = data.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    }
    if (statusFilter) {
      data = data.filter((p) => p.status === statusFilter);
    }
    setFiltered(data);
  }, [projects, search, statusFilter]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectsService.getAllProjects();
      setProjects(data);
    } catch (err) {
      showToast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 text-sm mt-1">{projects.length} projects total</p>
        </div>
        <Link
          href="/projects/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          New Project
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | "")}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="PLANNING">Planning</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="ON_HOLD">On Hold</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Project Cards Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No projects found</p>
          <Link href="/projects/new" className="text-blue-600 text-sm mt-2 inline-block">
            Create your first project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <Link key={project.projectId} href={`/projects/${project.projectId}`}>
              <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 line-clamp-1">{project.name}</h3>
                  <span
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[project.status]}`}
                  >
                    {STATUS_ICONS[project.status]}
                    {project.status.replace("_", " ")}
                  </span>
                </div>
                {project.description && (
                  <p className="text-gray-500 text-sm line-clamp-2 mb-3">{project.description}</p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-400 mt-3">
                  <span>{project.memberIds?.length || 0} members</span>
                  {project.dueDate && (
                    <span>Due: {new Date(project.dueDate).toLocaleDateString("en-IN")}</span>
                  )}
                </div>
                {project.tags && project.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {project.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
