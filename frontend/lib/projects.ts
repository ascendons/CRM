import { api } from "./api-client";

export type ProjectStatus = "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "CANCELLED";

export interface Project {
  id: string;
  projectId: string;
  tenantId: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  ownerId?: string;
  memberIds?: string[];
  startDate?: string;
  dueDate?: string;
  budget?: number;
  milestones?: string[];
  tags?: string[];
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface ProjectTask {
  id: string;
  taskId: string;
  tenantId: string;
  projectId: string;
  title: string;
  description?: string;
  assigneeIds?: string[];
  priority?: TaskPriority;
  status: TaskStatus;
  parentTaskId?: string;
  dueDate?: string;
  estimatedHours?: number;
  completionPct?: number;
  checklistItems?: { itemId: string; label: string; completed: boolean }[];
  attachments?: string[];
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface TaskComment {
  id: string;
  commentId: string;
  taskId: string;
  authorId: string;
  body: string;
  mentions?: string[];
  createdAt?: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  status?: ProjectStatus;
  ownerId?: string;
  memberIds?: string[];
  startDate?: string;
  dueDate?: string;
  budget?: number;
  milestones?: string[];
  tags?: string[];
}

export interface CreateProjectTaskRequest {
  title: string;
  projectId: string;
  description?: string;
  assigneeIds?: string[];
  priority?: TaskPriority;
  status?: TaskStatus;
  parentTaskId?: string;
  dueDate?: string;
  estimatedHours?: number;
  completionPct?: number;
}

export const projectsService = {
  async createProject(request: CreateProjectRequest): Promise<Project> {
    return await api.post<Project>("/projects", request);
  },

  async getAllProjects(status?: ProjectStatus): Promise<Project[]> {
    const url = status ? `/projects?status=${status}` : "/projects";
    return await api.get<Project[]>(url);
  },

  async getProjectById(projectId: string): Promise<Project> {
    return await api.get<Project>(`/projects/${projectId}`);
  },

  async updateProject(projectId: string, request: Partial<CreateProjectRequest>): Promise<Project> {
    return await api.put<Project>(`/projects/${projectId}`, request);
  },

  async deleteProject(projectId: string): Promise<void> {
    await api.delete(`/projects/${projectId}`);
  },

  async addMember(projectId: string, memberId: string): Promise<Project> {
    return await api.post<Project>(`/projects/${projectId}/members`, { memberId });
  },

  async removeMember(projectId: string, memberId: string): Promise<Project> {
    return await api.delete<Project>(`/projects/${projectId}/members/${memberId}`);
  },

  async getProjectTasks(projectId: string): Promise<ProjectTask[]> {
    return await api.get<ProjectTask[]>(`/projects/${projectId}/tasks`);
  },

  // Tasks
  async createTask(request: CreateProjectTaskRequest): Promise<ProjectTask> {
    return await api.post<ProjectTask>("/project-tasks", request);
  },

  async getAllTasks(): Promise<ProjectTask[]> {
    return await api.get<ProjectTask[]>("/project-tasks");
  },

  async getTaskById(taskId: string): Promise<ProjectTask> {
    return await api.get<ProjectTask>(`/project-tasks/${taskId}`);
  },

  async updateTask(
    taskId: string,
    request: Partial<CreateProjectTaskRequest>
  ): Promise<ProjectTask> {
    return await api.put<ProjectTask>(`/project-tasks/${taskId}`, request);
  },

  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<ProjectTask> {
    return await api.post<ProjectTask>(`/project-tasks/${taskId}/status`, { status });
  },

  async deleteTask(taskId: string): Promise<void> {
    await api.delete(`/project-tasks/${taskId}`);
  },

  async addComment(taskId: string, body: string, mentions?: string[]): Promise<TaskComment> {
    return await api.post<TaskComment>(`/project-tasks/${taskId}/comments`, { body, mentions });
  },

  async getComments(taskId: string): Promise<TaskComment[]> {
    return await api.get<TaskComment[]>(`/project-tasks/${taskId}/comments`);
  },
};
