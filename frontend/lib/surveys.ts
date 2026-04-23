import { apiRequest } from "./api-client";

export type SurveyQuestionType = "RATING" | "MULTIPLE_CHOICE" | "TEXT" | "YES_NO" | "NPS";

export interface SurveyQuestion {
  questionId: string;
  text: string;
  type: SurveyQuestionType;
  options?: string[];
  required: boolean;
}

export interface Survey {
  surveyId: string;
  title: string;
  description: string;
  questions: SurveyQuestion[];
  isAnonymous: boolean;
  targetUserIds: string[];
  dueDate?: string;
  status: string;
  createdAt: string;
}

export interface SurveyAnswer {
  questionId: string;
  value: string;
}

export const surveysApi = {
  getAll: () => apiRequest<Survey[]>("/surveys"),
  create: (data: Partial<Survey>) =>
    apiRequest<Survey>("/surveys", { method: "POST", body: JSON.stringify(data) }),
  getById: (id: string) => apiRequest<Survey>(`/surveys/${id}`),
  update: (id: string, data: Partial<Survey>) =>
    apiRequest<Survey>(`/surveys/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => apiRequest<void>(`/surveys/${id}`, { method: "DELETE" }),
  respond: (id: string, answers: SurveyAnswer[], anonymous = false) =>
    apiRequest<any>(`/surveys/${id}/respond?anonymous=${anonymous}`, {
      method: "POST",
      body: JSON.stringify(answers),
    }),
  getResults: (id: string) => apiRequest<any>(`/surveys/${id}/results`),
};
