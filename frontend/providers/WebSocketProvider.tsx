"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { authService } from '@/lib/auth';
import { meService, CurrentUser } from '@/lib/me';

export interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    recipientId: string;
    recipientType?: string;
    content: string;
    timestamp: string;
}

export interface Notification {
    id: string;
    targetUserId: string;
    title: string;
    message: string;
    type: string;
    actionUrl?: string;
    isRead: boolean;
    createdAt: string;
}

interface WebSocketContextType {
    connected: boolean;
    chatMessages: ChatMessage[];
    notifications: Notification[];
    sendMessage: (recipientId: string, content: string, recipientType?: string) => void;
    subscribeToChat: (recipientId: string) => void;
    fetchChatHistory: (recipientId: string, recipientType?: string) => Promise<void>;
    markNotificationAsRead: (notificationId: string) => void;
    unreadNotificationCount: number;
    unreadMessageCount: number;
    unreadMessageCounts: Record<string, number>;
    clearUnreadMessages: (senderId?: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};

export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [connected, setConnected] = useState(false);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadMessageCount, setUnreadMessageCount] = useState(0);
    const [unreadMessageCounts, setUnreadMessageCounts] = useState<Record<string, number>>({});
    const clientRef = useRef<Client | null>(null);

    // Track active subscriptions
    const chatSubscriptions = useRef<Map<string, StompSubscription>>(new Map());

    useEffect(() => {
        const token = authService.getToken();
        if (token && !connected && !clientRef.current) {
            meService.getCurrentUser().then(user => {
                setCurrentUser(user);
                connect(token, user);
            }).catch(console.error);
        }

        return () => {
            if (clientRef.current && clientRef.current.active) {
                clientRef.current.deactivate();
            }
        };
    }, []);

    const connect = (token: string, user: CurrentUser) => {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
        const wsUrl = `${backendUrl}/ws`;

        const stompClient = new Client({
            webSocketFactory: () => new SockJS(wsUrl),
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            onConnect: () => {
                console.log('Connected to WebSocket');
                setConnected(true);

                // Subscribe to notifications queue
                stompClient.subscribe(`/user/queue/notifications`, (message: IMessage) => {
                    const notification = JSON.parse(message.body) as Notification;
                    setNotifications(prev => [notification, ...prev]);
                });

                // Subscribe to user's direct messages queue
                stompClient.subscribe(`/user/queue/chat`, (message: IMessage) => {
                    const chatMsg = JSON.parse(message.body) as ChatMessage;
                    setChatMessages(prev => [...prev, chatMsg]);
                    if (chatMsg.senderId !== user.id) {
                        setUnreadMessageCount(prev => prev + 1);
                        const trackingId = chatMsg.recipientType === 'GROUP' ? chatMsg.recipientId : chatMsg.senderId;
                        setUnreadMessageCounts(prev => ({
                            ...prev,
                            [trackingId]: (prev[trackingId] || 0) + 1
                        }));
                    }
                });

                // Fetch initial notifications using generic fetch to backend rest API
                fetchNotifications(token);
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            },
            onDisconnect: () => {
                console.log('Disconnected from WebSocket');
                setConnected(false);
            }
        });

        stompClient.activate();
        clientRef.current = stompClient;
    };

    const fetchNotifications = async (token: string) => {
        try {
            const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
            const res = await fetch(`${backendUrl}/notifications?page=0&size=50`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.content) {
                    setNotifications(data.content);
                }
            }
        } catch (e) {
            console.error('Failed to fetch initial notifications', e);
        }
    };

    const fetchChatHistory = async (recipientId: string, recipientType: string = 'USER') => {
        try {
            const token = authService.getToken();
            const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
            const res = await fetch(`${backendUrl}/chat/history/${recipientType}/${recipientId}?page=0&size=50`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.content) {
                    // Prepend older messages that are not already in state.
                    // Assuming data.content returns newer messages first or something?
                    // According to ChatService, history is fetched with OrderByTimestampDesc.
                    // So we must reverse it to get chronological order (oldest first).
                    const historyMessages = [...data.content].reverse() as ChatMessage[];
                    setChatMessages(prev => {
                        const existingIds = new Set(prev.map(m => m.id));
                        const newMessages = historyMessages.filter(m => !existingIds.has(m.id));
                        return [...newMessages, ...prev].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                    });
                }
            }
        } catch (e) {
            console.error('Failed to fetch chat history', e);
        }
    };

    const sendMessage = (recipientId: string, content: string, recipientType: string = 'USER') => {
        if (clientRef.current && clientRef.current.connected) {
            clientRef.current.publish({
                destination: '/app/chat.send',
                body: JSON.stringify({ recipientId, content, recipientType })
            });
        } else {
            console.error('Cannot send message, WebSocket not connected');
        }
    };

    const subscribeToChat = (recipientId: string) => {
        // Here we could subscribe to a specific group chat topic instead of just queue
        // if recipientId == "ALL", subscribe to /topic/tenant.{tenantId}.chat
        // However, personal queues are handled onConnect.
        if (recipientId === 'ALL' && currentUser?.tenantId && clientRef.current && clientRef.current.connected) {
            const topic = `/topic/tenant.${currentUser.tenantId}.chat`;
            if (!chatSubscriptions.current.has(topic)) {
                const sub = clientRef.current.subscribe(topic, (message: IMessage) => {
                    const chatMsg = JSON.parse(message.body) as ChatMessage;
                    // Only add if we didn't send it, since sender also gets it via queue (or logic depending on backend)
                    // Here we'll just add it. Might need deduplication logic later if sender receives it twice.
                    setChatMessages(prev => [...prev, chatMsg]);
                    if (currentUser && chatMsg.senderId !== currentUser.id) {
                        setUnreadMessageCount(prev => prev + 1);
                        const trackingId = chatMsg.recipientType === 'GROUP' ? chatMsg.recipientId : chatMsg.senderId;
                        setUnreadMessageCounts(prev => ({
                            ...prev,
                            [trackingId]: (prev[trackingId] || 0) + 1
                        }));
                    }
                });
                chatSubscriptions.current.set(topic, sub);
            }
        }
    };

    const markNotificationAsRead = async (notificationId: string) => {
        // Optimistic UI update
        setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));

        const token = authService.getToken();
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
        try {
            await fetch(`${backendUrl}/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (e) {
            console.error('Failed to mark as read', e);
        }
    };

    const unreadNotificationCount = notifications.filter(n => !n.isRead).length;

    const clearUnreadMessages = (senderId?: string) => {
        if (senderId) {
            setUnreadMessageCounts(prev => {
                const count = prev[senderId] || 0;
                if (count > 0) {
                    setUnreadMessageCount(total => Math.max(0, total - count));
                    const next = { ...prev };
                    delete next[senderId];
                    return next;
                }
                return prev;
            });
        } else {
            setUnreadMessageCount(0);
            setUnreadMessageCounts({});
        }
    };

    return (
        <WebSocketContext.Provider value={{
            connected,
            chatMessages,
            notifications,
            sendMessage,
            subscribeToChat,
            fetchChatHistory,
            markNotificationAsRead,
            unreadNotificationCount,
            unreadMessageCount,
            unreadMessageCounts,
            clearUnreadMessages
        }}>
            {children}
        </WebSocketContext.Provider>
    );
};
