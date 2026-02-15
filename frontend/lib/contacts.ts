import { api } from "./api-client";
import { Contact, CreateContactRequest, UpdateContactRequest } from "@/types/contact";

export const contactsService = {
  async createContact(request: CreateContactRequest): Promise<Contact> {
    return await api.post<Contact>("/contacts", request);
  },

  async getAllContacts(): Promise<Contact[]> {
    const response = await api.get<any>("/contacts");
    return response?.content || response || [];
  },

  async getContactById(id: string): Promise<Contact> {
    return await api.get<Contact>(`/contacts/${id}`);
  },

  async getContactByContactId(contactId: string): Promise<Contact> {
    return await api.get<Contact>(`/contacts/code/${contactId}`);
  },

  async getContactsByAccount(accountId: string): Promise<Contact[]> {
    return await api.get<Contact[]>(`/contacts/account/${accountId}`);
  },

  async searchContacts(query: string): Promise<Contact[]> {
    return await api.get<Contact[]>(`/contacts/search?q=${encodeURIComponent(query)}`);
  },

  async updateContact(id: string, request: UpdateContactRequest): Promise<Contact> {
    return await api.put<Contact>(`/contacts/${id}`, request);
  },

  async deleteContact(id: string): Promise<void> {
    return await api.delete<void>(`/contacts/${id}`);
  },

  async getContactCount(): Promise<number> {
    return await api.get<number>("/contacts/statistics/count");
  },
};
