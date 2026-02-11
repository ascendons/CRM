"use client";

import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, UserPlus, Search } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { usersService } from "@/lib/users";
import { leadAssignmentService } from "@/lib/leadAssignment";
import type { UserProfile, UserResponse } from "@/types/user";

interface AssignLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  leadName: string;
  currentAssignedUserId?: string;
  onSuccess?: () => void;
}

export function AssignLeadModal({
  isOpen,
  onClose,
  leadId,
  leadName,
  currentAssignedUserId,
  onSuccess,
}: AssignLeadModalProps) {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      setSelectedUserId(currentAssignedUserId || "");
    }
  }, [isOpen, currentAssignedUserId]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await usersService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error("Failed to load users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    if (!searchTerm) {
      setFilteredUsers(users);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = users.filter(
      (user) =>
        user.profile?.fullName?.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.username?.toLowerCase().includes(term)
    );
    setFilteredUsers(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId) {
      toast.error("Please select a user");
      return;
    }

    setSubmitting(true);
    try {
      await leadAssignmentService.assignLead(leadId, { userId: selectedUserId });
      toast.success("Lead assigned successfully");
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Failed to assign lead:", error);
      toast.error(error.message || "Failed to assign lead");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                    <UserPlus className="h-5 w-5 mr-2 text-blue-600" />
                    Assign Lead
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Lead Info */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Assigning: <span className="font-medium text-gray-900">{leadName}</span>
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Search Box */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* User List */}
                  <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-sm">No users found</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {filteredUsers.map((user) => (
                          <label
                            key={user.id}
                            className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors ${selectedUserId === user.userId ? "bg-blue-50" : ""
                              }`}
                          >
                            <input
                              type="radio"
                              name="assignedUser"
                              value={user.userId}
                              checked={selectedUserId === user.userId}
                              onChange={(e) => setSelectedUserId(e.target.value)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <div className="ml-3 flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {user.profile?.fullName || user.username}
                                  </p>
                                  <p className="text-xs text-gray-500">{user.email}</p>
                                </div>
                                {user.roleName && (
                                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                    {user.roleName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="default" disabled={submitting || !selectedUserId}>
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Assigning...
                        </>
                      ) : (
                        "Assign Lead"
                      )}
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
