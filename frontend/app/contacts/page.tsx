"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Contact } from "@/types/contact";
import { contactsService } from "@/lib/contacts";
import { authService } from "@/lib/auth";
import { EmptyState } from "@/components/EmptyState";

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadContacts();
  }, [router]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await contactsService.getAllContacts();
      setContacts(data);
      setFilteredContacts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredContacts(contacts);
      return;
    }

    try {
      const results = await contactsService.searchContacts(query);
      setFilteredContacts(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) {
      return;
    }

    try {
      await contactsService.deleteContact(id);
      loadContacts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete contact");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-700">Loading contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light">
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
          {/* Page Header */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Contact Management
              </h2>
              <p className="text-slate-700">
                Manage your contact relationships and communications.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/contacts/new")}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
              >
                <span className="material-symbols-outlined text-lg">person_add</span>
                New Contact
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-xl p-4">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                search
              </span>
              <input
                type="text"
                placeholder="Search contacts by name or email..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
          </div>

          {error && <div className="bg-rose-50">{error}</div>}

          {/* Contacts Table */}
          <div className="bg-white rounded-xl overflow-hidden">
            <div className="overflow-x-auto p-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                      Account
                    </th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                      Job Title
                    </th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                      Email
                    </th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredContacts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-0">
                        {searchQuery ? (
                          <EmptyState
                            icon="search_off"
                            title="No contacts found"
                            description="No contacts match your current search. Try adjusting your search criteria."
                          />
                        ) : (
                          <EmptyState
                            icon="contacts"
                            title="No contacts yet"
                            description="Get started by adding your first contact to manage customer relationships."
                            action={{ label: "Add Your First Contact", href: "/contacts/new" }}
                          />
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredContacts.map((contact) => (
                      <tr key={contact.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold text-xs">
                              {contact.firstName?.[0]?.toUpperCase() || ""}
                              {contact.lastName?.[0]?.toUpperCase() || "C"}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {contact.firstName} {contact.lastName}
                              </p>
                              <p className="text-xs text-slate-700">{contact.contactId}</p>
                              {contact.isPrimaryContact && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-primary/10 text-primary mt-1">
                                  Primary
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900">
                          {contact.accountName || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900">
                          {contact.jobTitle || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900">{contact.email}</td>
                        <td className="px-6 py-4 text-sm text-slate-900">
                          {contact.phone || contact.mobilePhone || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900">{contact.ownerName}</td>
                        <td className="px-6 py-4 text-right text-sm font-medium">
                          <button
                            onClick={() => router.push(`/contacts/${contact.id}`)}
                            className="text-primary hover:text-primary/90 mr-4 transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => router.push(`/contacts/${contact.id}/edit`)}
                            className="text-primary hover:text-primary/90 mr-4 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(contact.id)}
                            className="text-rose-600"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stats */}
          <div className="text-sm text-slate-700">
            Showing {filteredContacts.length} of {contacts.length} contacts
          </div>
        </div>
      </main>
    </div>
  );
}
