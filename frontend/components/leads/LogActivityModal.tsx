"use client";

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ActivityType, ActivityStatus, CreateActivityRequest } from '@/types/activity';
import { X, Calendar, Clock, AlignLeft, Type, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface LogActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (activityData: CreateActivityRequest) => Promise<void>;
    leadId: string;
    leadName?: string;
    newStatus: string;
    modalTitle?: string;
    defaultSubject?: string;
}

export function LogActivityModal({
    isOpen,
    onClose,
    onSave,
    leadId,
    newStatus,
    modalTitle,
    defaultSubject
}: LogActivityModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<Partial<CreateActivityRequest>>({
        type: ActivityType.CALL,
        subject: defaultSubject || '',
        description: '',
        status: ActivityStatus.COMPLETED,
        scheduledDate: new Date().toISOString().split('T')[0],
        durationMinutes: 15,
    });

    // Reset form when modal opens or defaultSubject changes
    useEffect(() => {
        if (isOpen) {
            setFormData({
                type: ActivityType.CALL,
                subject: defaultSubject || '',
                description: '',
                status: ActivityStatus.COMPLETED,
                scheduledDate: new Date().toISOString().split('T')[0], // Reset to current date
                durationMinutes: 15, // Reset to default duration
            });
        }
    }, [isOpen, defaultSubject]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.subject) {
            toast.error("Subject is required");
            return;
        }

        setIsSubmitting(true);
        try {
            // BACKEND FIX: Ensure scheduledDate is a proper LocalDateTime string (ISO format including time)
            // The input type="date" returns "YYYY-MM-DD", but backend needs "YYYY-MM-DDTHH:mm:ss"
            let finalScheduledDate = formData.scheduledDate;
            if (finalScheduledDate && finalScheduledDate.length === 10) {
                // Append current time or default to start of day? 
                // Let's us current time for "now" but keep the date selected.
                const now = new Date();
                const timePart = now.toTimeString().split(' ')[0]; // "HH:MM:SS"
                finalScheduledDate = `${finalScheduledDate}T${timePart}`;
            }

            await onSave({
                ...formData,
                scheduledDate: finalScheduledDate,
                leadId,
                status: ActivityStatus.COMPLETED,
            } as CreateActivityRequest);
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Failed to save activity");
        } finally {
            setIsSubmitting(false);
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
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                                                {modalTitle || "Log Activity"}
                                            </Dialog.Title>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Lead is moving to <span className="font-medium text-blue-600">{newStatus.replace(/_/g, " ")}</span>. Please log the interaction.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                                            onClick={onClose}
                                        >
                                            <X className="h-5 w-5" aria-hidden="true" />
                                        </button>
                                    </div>

                                    <form id="activity-form" onSubmit={handleSubmit} className="space-y-4">
                                        {/* Activity Type */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {[ActivityType.CALL, ActivityType.EMAIL, ActivityType.MEETING].map((type) => (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, type })}
                                                        className={`flex items-center justify-center px-3 py-2 border rounded-md text-sm font-medium ${formData.type === type
                                                            ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                                                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        {type.charAt(0) + type.slice(1).toLowerCase()}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Subject */}
                                        <div>
                                            <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                                                Subject
                                            </label>
                                            <div className="relative mt-1 rounded-md shadow-sm">
                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                    <Type className="h-4 w-4 text-gray-400" aria-hidden="true" />
                                                </div>
                                                <input
                                                    type="text"
                                                    id="subject"
                                                    required
                                                    className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                                    placeholder="e.g. Intro Call, Follow-up Email"
                                                    value={formData.subject}
                                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                                Description / Notes
                                            </label>
                                            <div className="relative mt-1 rounded-md shadow-sm">
                                                <div className="pointer-events-none absolute top-3 left-0 flex items-center pl-3">
                                                    <AlignLeft className="h-4 w-4 text-gray-400" aria-hidden="true" />
                                                </div>
                                                <textarea
                                                    id="description"
                                                    rows={3}
                                                    className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                                    placeholder="Enter details..."
                                                    value={formData.description}
                                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Date */}
                                            <div>
                                                <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                                                    Date
                                                </label>
                                                <div className="relative mt-1 rounded-md shadow-sm">
                                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                        <Calendar className="h-4 w-4 text-gray-400" aria-hidden="true" />
                                                    </div>
                                                    <input
                                                        type="date"
                                                        id="date"
                                                        className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                                        value={formData.scheduledDate}
                                                        onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            {/* Duration */}
                                            <div>
                                                <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                                                    Duration (min)
                                                </label>
                                                <div className="relative mt-1 rounded-md shadow-sm">
                                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                        <Clock className="h-4 w-4 text-gray-400" aria-hidden="true" />
                                                    </div>
                                                    <input
                                                        type="number"
                                                        id="duration"
                                                        min="0"
                                                        step="15"
                                                        className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                                        value={formData.durationMinutes}
                                                        onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 0 })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                                    <button
                                        type="submit"
                                        form="activity-form"
                                        disabled={isSubmitting}
                                        className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? 'Saving...' : 'Save & Move Lead'}
                                    </button>
                                    <button
                                        type="button"
                                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                                        onClick={onClose}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
