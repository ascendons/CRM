"use client";

import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useWebSocket } from '@/providers/WebSocketProvider';

interface NotificationPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
    const { notifications, markNotificationAsRead } = useWebSocket();

    const handleNotificationClick = (id: string, actionUrl?: string) => {
        markNotificationAsRead(id);
        if (actionUrl) {
            window.location.href = actionUrl;
        }
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/40 transition-opacity backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-in-out duration-300 sm:duration-500"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-300 sm:duration-500"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel className="pointer-events-auto w-screen max-w-sm">
                                    <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                                        <div className="px-4 py-6 border-b border-slate-100 sm:px-6 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
                                            <Dialog.Title className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary">notifications</span>
                                                Notifications
                                            </Dialog.Title>
                                            <button
                                                type="button"
                                                className="rounded-md text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                                onClick={onClose}
                                            >
                                                <span className="sr-only">Close panel</span>
                                                <span className="material-symbols-outlined">close</span>
                                            </button>
                                        </div>
                                        <div className="relative mt-2 flex-1 px-4 sm:px-6 mb-6">
                                            {notifications.length === 0 ? (
                                                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                                                    <span className="material-symbols-outlined text-6xl text-slate-200">notifications_off</span>
                                                    <p className="text-sm">No new notifications</p>
                                                </div>
                                            ) : (
                                                <ul className="space-y-3">
                                                    {notifications.map((notification) => (
                                                        <li
                                                            key={notification.id}
                                                            className={`p-4 rounded-xl transition-all duration-200 cursor-pointer border ${notification.isRead ? 'bg-white border-slate-200 hover:border-slate-300' : 'bg-primary/5 border-primary/20 hover:border-primary/40 shadow-sm'}`}
                                                            onClick={() => handleNotificationClick(notification.id, notification.actionUrl)}
                                                        >
                                                            <div className="flex justify-between items-start mb-1">
                                                                <h4 className={`text-sm font-semibold flex items-center gap-2 ${notification.isRead ? 'text-slate-700' : 'text-slate-900'}`}>
                                                                    {!notification.isRead && (
                                                                        <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                                                                    )}
                                                                    {notification.title}
                                                                </h4>
                                                                <span className="text-xs text-slate-400 font-medium shrink-0 ml-2">
                                                                    {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                            <p className={`text-sm ${notification.isRead ? 'text-slate-500' : 'text-slate-700'}`}>{notification.message}</p>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
