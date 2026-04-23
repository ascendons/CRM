import { apiRequest } from "./api-client";

export type ReportDataSource =
  | "LEADS"
  | "OPPORTUNITIES"
  | "WORK_ORDERS"
  | "ATTENDANCE"
  | "INVOICES"
  | "ACTIVITIES";
export type ReportChartType = "TABLE" | "BAR" | "LINE" | "PIE" | "FUNNEL";

export interface ReportFilter {
  field: string;
  operator: string;
  value: string;
}

export interface SavedReport {
  reportId: string;
  name: string;
  dataSource: ReportDataSource;
  filters: ReportFilter[];
  columns: string[];
  groupBy: string;
  chartType: ReportChartType;
  isScheduled: boolean;
  scheduleFrequency?: string;
  recipientEmails?: string[];
  createdAt: string;
}

export const reportsApi = {
  getAll: () => apiRequest<SavedReport[]>("/reports"),
  create: (data: Partial<SavedReport>) =>
    apiRequest<SavedReport>("/reports", { method: "POST", body: JSON.stringify(data) }),
  getById: (id: string) => apiRequest<SavedReport>(`/reports/${id}`),
  update: (id: string, data: Partial<SavedReport>) =>
    apiRequest<SavedReport>(`/reports/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => apiRequest<void>(`/reports/${id}`, { method: "DELETE" }),
  run: (id: string) => apiRequest<Record<string, any>[]>(`/reports/${id}/run`, { method: "POST" }),
};
