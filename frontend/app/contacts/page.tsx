"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Contact } from "@/types/contact";
import { contactsService } from "@/lib/contacts";
import { authService } from "@/lib/auth";
import { EmptyState } from "@/components/EmptyState";
import ConfirmModal from "@/components/ConfirmModal";
import { showToast } from "@/lib/toast";
import {
  Search,
  UserPlus,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Mail,
  Building2,
  XCircle
} from "lucide-react";

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Sorting
  const [sortColumn, setSortColumn] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Selection
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

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
    setCurrentPage(1);

    if (!query.trim()) {
      setFilteredContacts(contacts);
      return;
    }

    try {
      // Optimistic filtering first
      const term = query.toLowerCase();
      const localFiltered = contacts.filter(c =>
        c.firstName.toLowerCase().includes(term) ||
        c.lastName.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term)
      );
      setFilteredContacts(localFiltered);
    } catch (err) {
      console.error("Search failed", err);
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const getSortedContacts = (contactsToSort: Contact[]) => {
    return [...contactsToSort].sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortColumn) {
        case "name":
          aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
          bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
          break;
        case "account":
          aValue = (a.accountName || '').toLowerCase();
          bValue = (b.accountName || '').toLowerCase();
          break;
        case "title":
          aValue = (a.jobTitle || '').toLowerCase();
          bValue = (b.jobTitle || '').toLowerCase();
          break;
        case "email":
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case "createdAt":
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  const sortedContacts = getSortedContacts(filteredContacts);
  const totalPages = Math.ceil(sortedContacts.length / itemsPerPage);
  const paginatedContacts = sortedContacts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const confirmDelete = (id: string) => {
    setContactToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!contactToDelete) return;

    try {
      setActionLoading(true);
      await contactsService.deleteContact(contactToDelete);
      showToast.success("Contact deleted successfully");
      setShowDeleteModal(false);
      setContactToDelete(null);
      await loadContacts();
    } catch {
      showToast.error("Failed to delete contact");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContacts(paginatedContacts.map((c) => c.id));
    } else {
      setSelectedContacts([]);
    }
  };

  const handleSelectContact = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedContacts([...selectedContacts, id]);
    } else {
      setSelectedContacts(selectedContacts.filter((c) => c !== id));
    }
  };

  const isAllSelected = paginatedContacts.length > 0 && selectedContacts.length === paginatedContacts.length;
  const isSomeSelected = selectedContacts.length > 0 && selectedContacts.length < paginatedContacts.length;


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 ">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        </div>
        <div className="relative text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500  font-medium">Loading contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      {/* Header */}
      <div className="sticky top-16 z-20 bg-white/80  backdrop-blur-lg border-b border-slate-200 ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900  tracking-tight">Contact Management</h1>
              <p className="text-sm text-slate-500 ">Manage your contact relationships and communications.</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-white  border border-slate-200  text-slate-700  rounded-xl text-sm font-semibold hover:bg-slate-50  transition-colors shadow-sm">
                <Download className="h-4 w-4" />
                Export
              </button>
              <button
                onClick={() => router.push("/contacts/new")}
                className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
              >
                <UserPlus className="h-4 w-4" />
                New Contact
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in-up">
        {/* Toolbar */}
        <div className="bg-white  rounded-2xl shadow-sm border border-slate-200  p-2">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search contacts by name, email, or company..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50  border border-slate-200  rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            {selectedContacts.length > 0 && (
              <div className="flex items-center gap-3 bg-blue-50  text-blue-700  px-4 py-2 rounded-xl text-sm font-medium animate-fade-in">
                <span>{selectedContacts.length} selected</span>
                <div className="h-4 w-px bg-blue-200  mx-1"></div>
                <button onClick={() => setSelectedContacts([])} className="hover:underline">Clear</button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50  border border-red-200  text-red-700  p-4 rounded-xl flex items-center gap-3">
            <XCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}

        {/* Contacts Table */}
        <div className="bg-white  rounded-2xl shadow-sm border border-slate-200  overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50  border-b border-slate-200 ">
                  <th className="px-6 py-4 w-12">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={(el) => { if (el) el.indeterminate = isSomeSelected; }}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-4 h-4 text-primary bg-white border-slate-300 rounded focus:ring-primary focus:ring-2 cursor-pointer"
                      />
                    </div>
                  </th>
                  {[
                    { key: 'name', label: 'Contact' },
                    { key: 'account', label: 'Account' },
                    { key: 'title', label: 'Job Title' },
                    { key: 'email', label: 'Email' },
                  ].map((col) => (
                    <th
                      key={col.key}
                      className="px-6 py-4 text-xs font-semibold text-slate-500  uppercase tracking-wider cursor-pointer hover:bg-slate-100  transition-colors group"
                      onClick={() => handleSort(col.key)}
                    >
                      <div className="flex items-center gap-2">
                        {col.label}
                        <ArrowUpDown className={`h-3 w-3 ${sortColumn === col.key ? 'text-primary' : 'text-slate-300 group-hover:text-slate-500'}`} />
                      </div>
                    </th>
                  ))}
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500  uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 ">
                {sortedContacts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      {searchQuery ? (
                        <EmptyState
                          icon="search"
                          title="No contacts found"
                          description="No contacts match your current filters."
                        />
                      ) : (
                        <EmptyState
                          icon="users"
                          title="No contacts yet"
                          description="Get started by adding your first contact."
                          action={{ label: "Add Your First Contact", href: "/contacts/new" }}
                        />
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedContacts.map((contact) => (
                    <tr
                      key={contact.id}
                      className="hover:bg-slate-50  transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedContacts.includes(contact.id)}
                            onChange={(e) => handleSelectContact(contact.id, e.target.checked)}
                            className="w-4 h-4 text-primary bg-white border-slate-300 rounded focus:ring-primary focus:ring-2 cursor-pointer"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 cursor-pointer" onClick={() => router.push(`/contacts/${contact.id}`)}>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-purple-100  flex items-center justify-center text-purple-700  font-bold text-xs ring-2 ring-white  shadow-sm">
                            {contact.firstName?.[0]}{contact.lastName?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 ">
                              {contact.firstName} {contact.lastName}
                            </p>
                            <p className="text-xs text-slate-500 ">{contact.contactId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 ">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-slate-400" />
                          {contact.accountName || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 ">
                        {contact.jobTitle || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 ">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-slate-400" />
                          {contact.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => router.push(`/contacts/${contact.id}`)}
                            className="p-1.5 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="View"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => confirmDelete(contact.id)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {sortedContacts.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white px-4 sm:px-6 py-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-sm text-slate-600 ">
              Showing <span className="font-semibold text-slate-900 ">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-semibold text-slate-900 ">{Math.min(currentPage * itemsPerPage, sortedContacts.length)}</span> of <span className="font-semibold text-slate-900 ">{sortedContacts.length}</span> results
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200  rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50  transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-slate-600 " />
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200  rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50  transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-slate-600 " />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Contact"
        message="Are you sure you want to delete this contact? This action cannot be undone."
        confirmLabel="Delete Contact"
        cancelLabel="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        isLoading={actionLoading}
      />
    </div>
  );
}
