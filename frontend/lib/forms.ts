import { api } from "./api-client";

export type FormFieldType =
  | "TEXT"
  | "EMAIL"
  | "PHONE"
  | "NUMBER"
  | "DROPDOWN"
  | "CHECKBOX"
  | "TEXTAREA"
  | "DATE";

export interface FormField {
  fieldId?: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  options?: string[];
}

export interface SubmitAction {
  createLead?: boolean;
  createContact?: boolean;
}

export interface WebForm {
  id: string;
  formId: string;
  name: string;
  fields?: FormField[];
  submitAction?: SubmitAction;
  redirectUrl?: string;
  thankYouMessage?: string;
  themeColor?: string;
  createdAt?: string;
  createdBy?: string;
}

export interface WebFormSubmission {
  id: string;
  submissionId: string;
  formId: string;
  submittedAt: string;
  ipAddress?: string;
  responses?: Record<string, string>;
  createdLeadId?: string;
}

export interface LandingPage {
  id: string;
  pageId: string;
  slug: string;
  title: string;
  heroText?: string;
  ctaText?: string;
  formId?: string;
  heroImageUrl?: string;
  published: boolean;
  createdAt?: string;
}

export interface CreateWebFormRequest {
  name: string;
  fields?: FormField[];
  submitAction?: SubmitAction;
  redirectUrl?: string;
  thankYouMessage?: string;
  themeColor?: string;
}

export interface CreateLandingPageRequest {
  title: string;
  slug: string;
  heroText?: string;
  ctaText?: string;
  formId?: string;
  heroImageUrl?: string;
  published?: boolean;
}

export const formsService = {
  // Forms
  async getForms(): Promise<WebForm[]> {
    return await api.get<WebForm[]>("/forms");
  },

  async createForm(request: CreateWebFormRequest): Promise<WebForm> {
    return await api.post<WebForm>("/forms", request);
  },

  async getFormById(formId: string): Promise<WebForm> {
    return await api.get<WebForm>(`/forms/${formId}`);
  },

  async updateForm(formId: string, request: CreateWebFormRequest): Promise<WebForm> {
    return await api.put<WebForm>(`/forms/${formId}`, request);
  },

  async deleteForm(formId: string): Promise<void> {
    await api.delete(`/forms/${formId}`);
  },

  async getSubmissions(formId: string): Promise<WebFormSubmission[]> {
    return await api.get<WebFormSubmission[]>(`/forms/${formId}/submissions`);
  },

  async getEmbedCode(formId: string): Promise<string> {
    return await api.get<string>(`/forms/${formId}/embed-code`);
  },

  // Landing Pages
  async getLandingPages(): Promise<LandingPage[]> {
    return await api.get<LandingPage[]>("/landing-pages");
  },

  async createLandingPage(request: CreateLandingPageRequest): Promise<LandingPage> {
    return await api.post<LandingPage>("/landing-pages", request);
  },

  async getLandingPageById(pageId: string): Promise<LandingPage> {
    return await api.get<LandingPage>(`/landing-pages/${pageId}`);
  },

  async getLandingPageBySlug(slug: string): Promise<LandingPage> {
    return await api.get<LandingPage>(`/landing-pages/public/${slug}`);
  },

  async publishLandingPage(pageId: string): Promise<LandingPage> {
    return await api.post<LandingPage>(`/landing-pages/${pageId}/publish`, {});
  },

  async deleteLandingPage(pageId: string): Promise<void> {
    await api.delete(`/landing-pages/${pageId}`);
  },
};
