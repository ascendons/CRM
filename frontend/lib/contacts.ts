import { Contact, CreateContactRequest, UpdateContactRequest } from '@/types/contact';
import { ApiResponse } from '@/types/api';
import { authService } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

class ContactService {
  private getAuthHeader() {
    const token = authService.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  async createContact(request: CreateContactRequest): Promise<Contact> {
    const response = await fetch(`${API_URL}/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create contact');
    }

    const result: ApiResponse<Contact> = await response.json();
    return result.data;
  }

  async getAllContacts(): Promise<Contact[]> {
    const response = await fetch(`${API_URL}/contacts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch contacts');
    }

    const result: ApiResponse<Contact[]> = await response.json();
    return result.data;
  }

  async getContactById(id: string): Promise<Contact> {
    const response = await fetch(`${API_URL}/contacts/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch contact');
    }

    const result: ApiResponse<Contact> = await response.json();
    return result.data;
  }

  async getContactByContactId(contactId: string): Promise<Contact> {
    const response = await fetch(`${API_URL}/contacts/code/${contactId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch contact');
    }

    const result: ApiResponse<Contact> = await response.json();
    return result.data;
  }

  async getContactsByAccount(accountId: string): Promise<Contact[]> {
    const response = await fetch(`${API_URL}/contacts/account/${accountId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch contacts');
    }

    const result: ApiResponse<Contact[]> = await response.json();
    return result.data;
  }

  async searchContacts(query: string): Promise<Contact[]> {
    const response = await fetch(`${API_URL}/contacts/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to search contacts');
    }

    const result: ApiResponse<Contact[]> = await response.json();
    return result.data;
  }

  async updateContact(id: string, request: UpdateContactRequest): Promise<Contact> {
    const response = await fetch(`${API_URL}/contacts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update contact');
    }

    const result: ApiResponse<Contact> = await response.json();
    return result.data;
  }

  async deleteContact(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/contacts/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete contact');
    }
  }

  async getContactCount(): Promise<number> {
    const response = await fetch(`${API_URL}/contacts/statistics/count`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch contact count');
    }

    const result: ApiResponse<number> = await response.json();
    return result.data;
  }
}

export const contactsService = new ContactService();
