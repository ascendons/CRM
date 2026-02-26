"use client";

import React, { Fragment, useEffect, useState, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useWebSocket } from '@/providers/WebSocketProvider';
import { usersService } from '@/lib/users';
import { UserResponse } from '@/types/user';
import { meService, CurrentUser } from '@/lib/me';
import { authService } from '@/lib/auth';

export interface ChatGroup {
    id: string;
    name: string;
    members: UserResponse[];
    createdBy: string;
    createdAt: string;
}

interface ChatPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
    const { chatMessages, sendMessage, subscribeToChat, fetchChatHistory, connected, unreadMessageCounts, clearUnreadMessages, typingUsers, sendTypingIndicator } = useWebSocket();
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [groups, setGroups] = useState<ChatGroup[]>([]);
    const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
    const [selectedRecipientType, setSelectedRecipientType] = useState<'USER' | 'GROUP' | 'ALL' | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadInitialData();
        }
    }, [isOpen]);

    useEffect(() => {
        // Auto-scroll to bottom of messages
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages, selectedRecipientId]);

    const loadInitialData = async () => {
        try {
            const token = authService.getToken();
            const [me, allUsers, groupsRes] = await Promise.all([
                meService.getCurrentUser(),
                usersService.getAllUsers(true), // active only
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/chat/groups`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).catch(() => null)
            ]);
            setCurrentUser(me);
            setUsers(allUsers.filter(u => u.id !== me.id));

            if (groupsRes && groupsRes.ok) {
                const data = await groupsRes.json();
                if (data.data) {
                    setGroups(data.data);
                }
            }
        } catch (error) {
            console.error('Failed to load users for chat:', error);
        }
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || !selectedRecipientId) return;

        // Stop typing indicator
        if (selectedRecipientId && selectedRecipientType) {
            sendTypingIndicator(selectedRecipientId, selectedRecipientType === 'GROUP' ? 'GROUP' : 'USER', false);
        }

        sendMessage(selectedRecipientId, inputValue, selectedRecipientType === 'GROUP' ? 'GROUP' : 'USER');
        setInputValue('');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);

        // Send typing indicator
        if (selectedRecipientId && selectedRecipientType) {
            sendTypingIndicator(selectedRecipientId, selectedRecipientType === 'GROUP' ? 'GROUP' : 'USER', true);

            // Clear previous timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Stop typing after 3 seconds of no input
            typingTimeoutRef.current = setTimeout(() => {
                sendTypingIndicator(selectedRecipientId, selectedRecipientType === 'GROUP' ? 'GROUP' : 'USER', false);
            }, 3000);
        }
    };

    const handleSelectRecipient = (id: string, type: 'USER' | 'GROUP' | 'ALL') => {
        setSelectedRecipientId(id);
        setSelectedRecipientType(type);
        if (type === 'GROUP' || type === 'USER') {
            fetchChatHistory(id, type === 'GROUP' ? 'GROUP' : 'USER');
        }
        if (id !== 'ALL') {
            clearUnreadMessages(id);
        }
    };

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName.trim() || selectedMemberIds.length === 0) return;

        try {
            const token = authService.getToken();
            const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
            const res = await fetch(`${backendUrl}/chat/groups`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: newGroupName,
                    memberIds: selectedMemberIds
                })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.data) {
                    setGroups(prev => [...prev, data.data]);
                }
                setIsCreateGroupModalOpen(false);
                setNewGroupName('');
                setSelectedMemberIds([]);
            }
        } catch (error) {
            console.error('Failed to create group', error);
        }
    };

    // Filter messages relevant to the selected conversation
    const activeConversationMessages = chatMessages.filter(msg => {
        if (!currentUser || !selectedRecipientId) return false;

        if (selectedRecipientType === 'ALL') {
            return msg.recipientId === 'ALL';
        } else if (selectedRecipientType === 'GROUP') {
            return msg.recipientId === selectedRecipientId && msg.recipientType === 'GROUP';
        } else {
            // Direct messages
            return (msg.senderId === currentUser.id && msg.recipientId === selectedRecipientId && msg.recipientType !== 'GROUP') ||
                (msg.senderId === selectedRecipientId && msg.recipientId === currentUser.id && msg.recipientType !== 'GROUP');
        }
    });

    // Get typing indicators for current conversation
    const activeTypingUsers = Object.values(typingUsers).filter(typing => {
        if (!selectedRecipientId || !currentUser) return false;

        if (selectedRecipientType === 'GROUP') {
            return typing.recipientId === selectedRecipientId && typing.userId !== currentUser.id;
        } else {
            return typing.recipientId === selectedRecipientId && typing.userId !== currentUser.id;
        }
    });

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
                                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                                    <div className="flex h-full flex-col bg-slate-50 shadow-xl overflow-hidden">
                                        <div className="px-4 py-4 border-b border-slate-200 bg-white sm:px-6 flex items-center justify-between z-10">
                                            <Dialog.Title className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary">chat</span>
                                                Team Chat
                                            </Dialog.Title>
                                            <div className="flex items-center gap-4">
                                                <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                    {connected ? 'Online' : 'Offline'}
                                                </span>
                                                <button
                                                    type="button"
                                                    className="rounded-md text-slate-400 hover:text-slate-500 focus:outline-none"
                                                    onClick={onClose}
                                                >
                                                    <span className="sr-only">Close panel</span>
                                                    <span className="material-symbols-outlined">close</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex flex-1 overflow-hidden">
                                            {/* Sidebar: Users List */}
                                            <div className="w-[70px] sm:w-1/3 border-r border-slate-200 bg-white overflow-y-auto shrink-0 transition-all duration-200">
                                                <div className="p-2">
                                                    <button
                                                        onClick={() => {
                                                            handleSelectRecipient('ALL', 'ALL');
                                                            subscribeToChat('ALL');
                                                        }}
                                                        className={`w-full text-left px-2 sm:px-3 py-2 rounded-lg transition-colors flex items-center justify-center sm:justify-start gap-2 ${selectedRecipientId === 'ALL' ? 'bg-primary/10 text-primary' : 'hover:bg-slate-50 text-slate-700'}`}
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                                            <span className="material-symbols-outlined text-primary text-sm">public</span>
                                                        </div>
                                                        <span className="text-sm font-medium truncate hidden sm:block">Everyone</span>
                                                    </button>
                                                </div>
                                                <div className="px-3 py-2 border-t border-slate-200">
                                                    <div className="flex items-center justify-center sm:justify-between mb-2">
                                                        <h3 className="text-[10px] sm:text-xs font-semibold text-slate-400 tracking-wider uppercase hidden sm:block">Custom Groups</h3>
                                                        <button
                                                            onClick={() => setIsCreateGroupModalOpen(true)}
                                                            className="text-primary hover:bg-primary/10 p-1 rounded-md"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px]">add</span>
                                                        </button>
                                                    </div>
                                                    <ul className="space-y-1">
                                                        {groups.map(group => (
                                                            <li key={group.id}>
                                                                <button
                                                                    onClick={() => handleSelectRecipient(group.id, 'GROUP')}
                                                                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${selectedRecipientId === group.id ? 'bg-primary/10 text-primary' : 'hover:bg-slate-50 text-slate-700'}`}
                                                                >
                                                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 text-slate-600 font-medium text-xs">
                                                                        <span className="material-symbols-outlined text-sm">groups</span>
                                                                    </div>
                                                                    <span className="text-sm font-medium truncate flex-1">
                                                                        {group.name}
                                                                    </span>
                                                                    {unreadMessageCounts[group.id] > 0 && (
                                                                        <span className="shrink-0 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                                            {unreadMessageCounts[group.id] > 9 ? '9+' : unreadMessageCounts[group.id]}
                                                                        </span>
                                                                    )}
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div className="px-3 py-2 border-t border-slate-200">
                                                    <h3 className="text-[10px] sm:text-xs font-semibold text-slate-400 tracking-wider uppercase mb-2 hidden sm:block">Direct Messages</h3>
                                                    <ul className="space-y-1">
                                                        {users.map(user => (
                                                            <li key={user.id}>
                                                                <button
                                                                    onClick={() => handleSelectRecipient(user.id, 'USER')}
                                                                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${selectedRecipientId === user.id ? 'bg-primary/10 text-primary' : 'hover:bg-slate-50 text-slate-700'}`}
                                                                >
                                                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 text-slate-600 font-medium text-xs">
                                                                        {user.profile?.firstName?.charAt(0) || user.username.charAt(0)}
                                                                    </div>
                                                                    <span className="text-sm font-medium truncate flex-1">
                                                                        {user.profile?.fullName || user.username}
                                                                    </span>
                                                                    {unreadMessageCounts[user.id] > 0 && (
                                                                        <span className="shrink-0 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                                            {unreadMessageCounts[user.id] > 9 ? '9+' : unreadMessageCounts[user.id]}
                                                                        </span>
                                                                    )}
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>

                                            {/* Chat Area */}
                                            <div className="flex-1 w-full flex flex-col bg-slate-50 min-w-0">
                                                {!selectedRecipientId ? (
                                                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                                                        <span className="material-symbols-outlined text-5xl mb-3 text-slate-300">chat_bubble</span>
                                                        <p className="text-sm">Select a user or group to start chatting</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {/* Messages Area */}
                                                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                                            {activeConversationMessages.length === 0 ? (
                                                                <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                                                                    No messages yet
                                                                </div>
                                                            ) : (
                                                                activeConversationMessages.map((msg, idx) => {
                                                                    const isMe = msg.senderId === currentUser?.id;
                                                                    return (
                                                                        <div key={msg.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                                            {!isMe && (selectedRecipientType === 'ALL' || selectedRecipientType === 'GROUP') && (
                                                                                <span className="text-xs text-slate-500 mb-1 ml-1">{msg.senderName}</span>
                                                                            )}
                                                                            <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`}>
                                                                                {msg.content}
                                                                            </div>
                                                                            <span className="text-[10px] text-slate-400 mt-1 mx-1">
                                                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                })
                                                            )}
                                                            <div ref={messagesEndRef} />
                                                        </div>

                                                        {/* Typing Indicators */}
                                                        {activeTypingUsers.length > 0 && (
                                                            <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
                                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                                    <div className="flex gap-1">
                                                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                                                    </div>
                                                                    <span>
                                                                        {activeTypingUsers.length === 1
                                                                            ? `${activeTypingUsers[0].userName} is typing...`
                                                                            : `${activeTypingUsers.length} people are typing...`}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Input Area */}
                                                        <div className="p-3 bg-white border-t border-slate-200">
                                                            <form onSubmit={handleSendMessage} className="flex gap-2 relative">
                                                                <input
                                                                    type="text"
                                                                    value={inputValue}
                                                                    onChange={handleInputChange}
                                                                    placeholder="Type a message..."
                                                                    className="flex-1 border border-slate-300 rounded-full pl-4 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                                                    disabled={!connected}
                                                                />
                                                                <button
                                                                    type="submit"
                                                                    disabled={!inputValue.trim() || !connected}
                                                                    className="absolute right-1 top-1 bottom-1 w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                                >
                                                                    <span className="material-symbols-outlined text-[18px]">send</span>
                                                                </button>
                                                            </form>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>

                <Transition.Root show={isCreateGroupModalOpen} as={Fragment}>
                    <Dialog as="div" className="relative z-[60]" onClose={() => setIsCreateGroupModalOpen(false)}>
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" />
                        </Transition.Child>

                        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
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
                                    <Dialog.Panel className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-slate-100">
                                        <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4 border-b border-slate-100">
                                            <div className="sm:flex sm:items-start">
                                                <div className="mx-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 sm:mx-0 sm:h-10 sm:w-10">
                                                    <span className="material-symbols-outlined text-primary">group_add</span>
                                                </div>
                                                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                                                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-slate-900">
                                                        Create Custom Group
                                                    </Dialog.Title>
                                                    <div className="mt-2 text-sm text-slate-500">
                                                        Create a new group chat and select members.
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <form onSubmit={handleCreateGroup}>
                                            <div className="px-4 py-5 sm:p-6 space-y-4">
                                                <div>
                                                    <label htmlFor="groupName" className="block text-sm font-medium text-slate-700">Group Name</label>
                                                    <input
                                                        type="text"
                                                        id="groupName"
                                                        value={newGroupName}
                                                        onChange={(e) => setNewGroupName(e.target.value)}
                                                        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                                                        placeholder="e.g. Project Alpha Team"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Members</label>
                                                    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-md p-2 space-y-1">
                                                        {users.map(user => (
                                                            <div key={user.id} className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded">
                                                                <input
                                                                    type="checkbox"
                                                                    id={`user-${user.id}`}
                                                                    checked={selectedMemberIds.includes(user.id)}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) setSelectedMemberIds(prev => [...prev, user.id]);
                                                                        else setSelectedMemberIds(prev => prev.filter(id => id !== user.id));
                                                                    }}
                                                                    className="rounded border-slate-300 text-primary focus:ring-primary"
                                                                />
                                                                <label htmlFor={`user-${user.id}`} className="text-sm text-slate-700 cursor-pointer flex-1">
                                                                    {user.profile?.fullName || user.username}
                                                                </label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <p className="mt-1 text-xs text-slate-500">You will automatically be added to the group.</p>
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-slate-100">
                                                <button
                                                    type="submit"
                                                    disabled={!newGroupName.trim() || selectedMemberIds.length === 0}
                                                    className="inline-flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 disabled:opacity-50 sm:ml-3 sm:w-auto transition-colors"
                                                >
                                                    Create
                                                </button>
                                                <button
                                                    type="button"
                                                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 sm:mt-0 sm:w-auto transition-colors"
                                                    onClick={() => setIsCreateGroupModalOpen(false)}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    </Dialog.Panel>
                                </Transition.Child>
                            </div>
                        </div>
                    </Dialog>
                </Transition.Root>
            </Dialog>
        </Transition.Root>
    );
}
