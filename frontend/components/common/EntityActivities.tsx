import { useState } from "react";
import { Activity, ActivityType, ActivityStatus, CreateActivityRequest, UpdateActivityRequest } from "@/types/activity";
import { formatDistanceToNow } from "date-fns";
import { Phone, Mail, Calendar, CheckSquare, FileText, User, MoreVertical, Pencil, Trash2, Send, X } from "lucide-react";
import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
import toast from "react-hot-toast";
import { activitiesService } from "@/lib/activities";

interface EntityActivitiesProps {
    entityId: string;
    entityType: 'LEAD' | 'ACCOUNT' | 'OPPORTUNITY' | 'CONTACT';
    activities: Activity[];
    loading?: boolean;
    onActivityChanged: () => Promise<void>;
}

export function EntityActivities({ entityId, entityType, activities, loading, onActivityChanged }: EntityActivitiesProps) {
    const [newNote, setNewNote] = useState("");
    const [newSubject, setNewSubject] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");
    const [editSubject, setEditSubject] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim() || !newSubject.trim()) return;

        setIsSubmitting(true);
        try {
            const activityRequest: CreateActivityRequest = {
                type: ActivityType.NOTE,
                subject: newSubject,
                description: newNote,
                status: ActivityStatus.COMPLETED,
                scheduledDate: new Date().toISOString(),
            };

            // Assign ID based on entity type
            if (entityType === 'LEAD') activityRequest.leadId = entityId;
            else if (entityType === 'ACCOUNT') activityRequest.accountId = entityId;
            else if (entityType === 'OPPORTUNITY') activityRequest.opportunityId = entityId;
            else if (entityType === 'CONTACT') activityRequest.contactId = entityId;

            await activitiesService.createActivity(activityRequest);
            setNewNote("");
            setNewSubject("");
            toast.success("Note added");
            await onActivityChanged();
        } catch (error) {
            console.error(error);
            toast.error("Failed to add note");
        } finally {
            setIsSubmitting(false);
        }
    };

    const startEditing = (activity: Activity) => {
        setEditingId(activity.id);
        setEditContent(activity.description || "");
        setEditSubject(activity.subject || "");
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditContent("");
        setEditSubject("");
    };

    const handleUpdate = async (activityId: string) => {
        if (!editContent.trim() || !editSubject.trim()) return;

        setIsUpdating(true);
        try {
            await activitiesService.updateActivity(activityId, {
                subject: editSubject,
                description: editContent
            });
            setEditingId(null);
            toast.success("Activity updated");
            await onActivityChanged();
        } catch (error) {
            console.error(error);
            toast.error("Failed to update activity");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async (activityId: string) => {
        if (!confirm("Are you sure you want to delete this activity?")) return;

        try {
            await activitiesService.deleteActivity(activityId);
            toast.success("Activity deleted");
            await onActivityChanged();
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete activity");
        }
    };

    const getActivityIcon = (type: ActivityType) => {
        switch (type) {
            case ActivityType.CALL:
                return <Phone className="h-4 w-4 text-blue-500" />;
            case ActivityType.EMAIL:
                return <Mail className="h-4 w-4 text-green-500" />;
            case ActivityType.MEETING:
                return <Calendar className="h-4 w-4 text-purple-500" />;
            case ActivityType.TASK:
                return <CheckSquare className="h-4 w-4 text-orange-500" />;
            case ActivityType.NOTE:
            default:
                return <FileText className="h-4 w-4 text-gray-500" />;
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading activities...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Add Note Section */}
            <form onSubmit={handleAddNote} className="relative bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="space-y-3">
                    <div>
                        <label htmlFor="subject" className="sr-only">Subject</label>
                        <input
                            type="text"
                            id="subject"
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                            placeholder="Subject (e.g., Call Summary)"
                            value={newSubject}
                            onChange={(e) => setNewSubject(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="comment" className="sr-only">Note</label>
                        <textarea
                            rows={3}
                            name="comment"
                            id="comment"
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                            placeholder="Add a note or details..."
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                        />
                    </div>
                </div>

                <div className="mt-3 flex justify-end">
                    <button
                        type="submit"
                        disabled={isSubmitting || !newNote.trim() || !newSubject.trim()}
                        className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Adding...' : 'Add Note'}
                    </button>
                </div>
            </form>

            {/* Activities List */}
            <div className="flow-root">
                {activities.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
                        <p className="text-gray-500">No activities found.</p>
                    </div>
                ) : (
                    <ul role="list" className="-mb-8">
                        {activities.map((activity, activityIdx) => (
                            <li key={activity.id}>
                                <div className="relative pb-8">
                                    {activityIdx !== activities.length - 1 ? (
                                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                                    ) : null}
                                    <div className="relative flex space-x-3">
                                        <div>
                                            <span className="h-8 w-8 rounded-full bg-white border border-gray-300 flex items-center justify-center ring-8 ring-white">
                                                {getActivityIcon(activity.type)}
                                            </span>
                                        </div>
                                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5 group">
                                            <div className="w-full">
                                                <div className="flex justify-between items-start">
                                                    <p className="text-sm text-gray-500">
                                                        <span className="font-medium text-gray-900">{activity.subject}</span>
                                                    </p>
                                                    <div className="whitespace-nowrap text-right text-sm text-gray-500 flex items-center gap-2">
                                                        <time dateTime={activity.createdAt}>
                                                            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                                        </time>

                                                        {/* Actions Menu */}
                                                        <Menu as="div" className="relative inline-block text-left">
                                                            <div>
                                                                <Menu.Button className="-m-2 flex items-center rounded-full p-2 text-gray-400 hover:text-gray-600">
                                                                    <span className="sr-only">Open options</span>
                                                                    <MoreVertical className="h-4 w-4" aria-hidden="true" />
                                                                </Menu.Button>
                                                            </div>
                                                            <Transition
                                                                as={Fragment}
                                                                enter="transition ease-out duration-100"
                                                                enterFrom="transform opacity-0 scale-95"
                                                                enterTo="transform opacity-100 scale-100"
                                                                leave="transition ease-in duration-75"
                                                                leaveFrom="transform opacity-100 scale-100"
                                                                leaveTo="transform opacity-0 scale-95"
                                                            >
                                                                <Menu.Items className="absolute right-0 z-10 mt-2 w-32 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                                                    <div className="py-1">
                                                                        <Menu.Item>
                                                                            {({ active }) => (
                                                                                <button
                                                                                    onClick={() => startEditing(activity)}
                                                                                    className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                                                                        } flex w-full items-center px-4 py-2 text-sm gap-2`}
                                                                                >
                                                                                    <Pencil className="h-3 w-3" /> Edit
                                                                                </button>
                                                                            )}
                                                                        </Menu.Item>
                                                                        <Menu.Item>
                                                                            {({ active }) => (
                                                                                <button
                                                                                    onClick={() => handleDelete(activity.id)}
                                                                                    className={`${active ? 'bg-gray-100 text-red-900' : 'text-red-700'
                                                                                        } flex w-full items-center px-4 py-2 text-sm gap-2`}
                                                                                >
                                                                                    <Trash2 className="h-3 w-3" /> Delete
                                                                                </button>
                                                                            )}
                                                                        </Menu.Item>
                                                                    </div>
                                                                </Menu.Items>
                                                            </Transition>
                                                        </Menu>
                                                    </div>
                                                </div>

                                                {editingId === activity.id ? (
                                                    <div className="mt-2 space-y-3">
                                                        <div>
                                                            <label htmlFor={`edit-subject-${activity.id}`} className="sr-only">Subject</label>
                                                            <input
                                                                type="text"
                                                                id={`edit-subject-${activity.id}`}
                                                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                                                value={editSubject}
                                                                onChange={(e) => setEditSubject(e.target.value)}
                                                                placeholder="Subject"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label htmlFor={`edit-content-${activity.id}`} className="sr-only">Content</label>
                                                            <textarea
                                                                id={`edit-content-${activity.id}`}
                                                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                                                rows={3}
                                                                value={editContent}
                                                                onChange={(e) => setEditContent(e.target.value)}
                                                                placeholder="Description"
                                                            />
                                                        </div>
                                                        <div className="mt-2 flex justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={cancelEditing}
                                                                className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUpdate(activity.id)}
                                                                disabled={isUpdating}
                                                                className="rounded-md bg-blue-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                                                            >
                                                                {isUpdating ? 'Saving...' : 'Save'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    activity.description && (
                                                        <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{activity.description}</p>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
