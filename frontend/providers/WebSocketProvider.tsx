"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { authService } from "@/lib/auth";
import { meService, CurrentUser } from "@/lib/me";
import { showToast } from "@/lib/toast";

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

export interface TypingIndicator {
  userId: string;
  userName: string;
  recipientId: string;
  recipientType: string;
  isTyping: boolean;
  timestamp: string;
}

export interface NotificationSettings {
  leaveApproved: boolean;
  attendanceAlerts: boolean;
  taskReminders: boolean;
  systemAnnouncements: boolean;
  chatMessages: boolean;
}

interface WebSocketContextType {
  connected: boolean;
  chatMessages: ChatMessage[];
  notifications: Notification[];
  typingUsers: Record<string, TypingIndicator>;
  sendMessage: (recipientId: string, content: string, recipientType?: string) => void;
  sendTypingIndicator: (recipientId: string, recipientType: string, isTyping: boolean) => void;
  subscribeToChat: (recipientId: string) => void;
  fetchChatHistory: (recipientId: string, recipientType?: string) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  unreadNotificationCount: number;
  unreadMessageCount: number;
  unreadMessageCounts: Record<string, number>;
  clearUnreadMessages: (senderId?: string) => void;
  // Loading states
  loadingNotifications: boolean;
  loadingMoreNotifications: boolean;
  setLoadingNotifications: (loading: boolean) => void;
  // Pagination
  hasMoreNotifications: boolean;
  fetchMoreNotifications: () => Promise<void>;
  // Refresh notifications from server
  refreshNotifications: () => Promise<void>;
  // Notification settings
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (key: keyof NotificationSettings, value: boolean) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
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
  const [typingUsers, setTypingUsers] = useState<Record<string, TypingIndicator>>({});
  const clientRef = useRef<Client | null>(null);

  // Notification loading & pagination
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [loadingMoreNotifications, setLoadingMoreNotifications] = useState(false);
  const [hasMoreNotifications, setHasMoreNotifications] = useState(true);
  const [notificationPage, setNotificationPage] = useState(0);
  const NOTIFICATION_PAGE_SIZE = 20;

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    leaveApproved: true,
    attendanceAlerts: true,
    taskReminders: true,
    systemAnnouncements: true,
    chatMessages: true,
  });

  // Track active subscriptions
  const chatSubscriptions = useRef<Map<string, StompSubscription>>(new Map());

  // Offline message queue
  const offlineMessageQueue = useRef<
    Array<{
      recipientId: string;
      content: string;
      recipientType: string;
      timestamp: number;
    }>
  >([]);

  // Auto-clear typing indicators after 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTypingUsers((prev) => {
        const now = new Date().getTime();
        const updated = { ...prev };
        let changed = false;

        Object.keys(updated).forEach((key) => {
          const typing = updated[key];
          const typingTime = new Date(typing.timestamp).getTime();
          // Clear if older than 3 seconds
          if (now - typingTime > 3000) {
            delete updated[key];
            changed = true;
          }
        });

        return changed ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const token = authService.getToken();
    if (token && !connected && !clientRef.current) {
      meService
        .getCurrentUser()
        .then((user) => {
          setCurrentUser(user);
          connect(token, user);
        })
        .catch(console.error);
    }

    return () => {
      if (clientRef.current && clientRef.current.active) {
        clientRef.current.deactivate();
      }
    };
  }, []);

  const connect = (token: string, user: CurrentUser) => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
    const wsUrl = `${backendUrl}/ws`;

    const stompClient = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000, // Reconnect after 5 seconds
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log("Connected to WebSocket");
        setConnected(true);
        showToast.success("Chat connected");

        // Process offline message queue
        if (offlineMessageQueue.current.length > 0) {
          console.log(`Sending ${offlineMessageQueue.current.length} queued messages`);
          showToast.info(`Sending ${offlineMessageQueue.current.length} queued message(s)...`);

          offlineMessageQueue.current.forEach((queuedMsg) => {
            try {
              stompClient.publish({
                destination: "/app/chat.send",
                body: JSON.stringify({
                  recipientId: queuedMsg.recipientId,
                  content: queuedMsg.content,
                  recipientType: queuedMsg.recipientType,
                }),
              });
            } catch (error) {
              console.error("Failed to send queued message:", error);
            }
          });

          offlineMessageQueue.current = [];
        }

        // Subscribe to notifications queue
        stompClient.subscribe(`/user/queue/notifications`, (message: IMessage) => {
          const notification = JSON.parse(message.body) as Notification;
          // Prevent duplicates
          setNotifications((prev) => {
            const exists = prev.some((n) => n.id === notification.id);
            return exists ? prev : [notification, ...prev];
          });
        });

        // Subscribe to user's direct messages queue
        stompClient.subscribe(`/user/queue/chat`, (message: IMessage) => {
          const chatMsg = JSON.parse(message.body) as ChatMessage;
          // Prevent duplicate messages
          setChatMessages((prev) => {
            const exists = prev.some((m) => m.id === chatMsg.id);
            if (exists) return prev;

            // Update unread count only for new messages from others
            if (chatMsg.senderId !== user.id) {
              setUnreadMessageCount((count) => count + 1);
              const trackingId =
                chatMsg.recipientType === "GROUP" ? chatMsg.recipientId : chatMsg.senderId;
              setUnreadMessageCounts((counts) => ({
                ...counts,
                [trackingId]: (counts[trackingId] || 0) + 1,
              }));
            }

            return [...prev, chatMsg];
          });
        });

        // Subscribe to typing indicators
        stompClient.subscribe(`/user/queue/typing`, (message: IMessage) => {
          const typingEvent = JSON.parse(message.body) as TypingIndicator;
          const key = `${typingEvent.userId}-${typingEvent.recipientId}`;

          setTypingUsers((prev) => {
            if (typingEvent.isTyping) {
              return { ...prev, [key]: typingEvent };
            } else {
              const updated = { ...prev };
              delete updated[key];
              return updated;
            }
          });
        });

        // Fetch initial notifications using generic fetch to backend rest API
        setLoadingNotifications(true);
        fetchNotifications(token);
      },
      onStompError: (frame) => {
        console.error("Broker reported error: " + frame.headers["message"]);
        console.error("Additional details: " + frame.body);
        showToast.error("Chat connection error. Please refresh the page.");
      },
      onDisconnect: () => {
        console.log("Disconnected from WebSocket");
        setConnected(false);
        showToast.warning("Chat disconnected. Reconnecting...");
      },
      onWebSocketError: (event) => {
        console.error("WebSocket error:", event);
        showToast.error("Unable to connect to chat. Please check your internet connection.");
      },
    });

    stompClient.activate();
    clientRef.current = stompClient;
  };

  const fetchNotifications = async (token: string, page = 0, append = false) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
      const res = await fetch(`${backendUrl}/notifications?page=${page}&size=${NOTIFICATION_PAGE_SIZE}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.content) {
          setNotifications((prev) => {
            if (append) {
              // Deduplicate
              const existingIds = new Set(prev.map((n) => n.id));
              const newNotifications = data.content.filter((n: Notification) => !existingIds.has(n.id));
              return [...prev, ...newNotifications];
            }
            // Preserve local read status when refreshing
            const existingReadIds = new Set(
              prev.filter((n) => n.isRead).map((n) => n.id)
            );
            const mergedNotifications = data.content.map((n: Notification) => {
              if (existingReadIds.has(n.id)) {
                return { ...n, isRead: true };
              }
              return n;
            });
            return mergedNotifications;
          });
          setHasMoreNotifications(!data.last);
          setNotificationPage(page);
        }
      }
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    } finally {
      setLoadingNotifications(false);
      setLoadingMoreNotifications(false);
    }
  };

  const fetchMoreNotifications = async () => {
    if (loadingMoreNotifications || !hasMoreNotifications) return;
    setLoadingMoreNotifications(true);
    const token = authService.getToken();
    if (token) {
      await fetchNotifications(token, notificationPage + 1, true);
    }
  };

  const refreshNotifications = async () => {
    const token = authService.getToken();
    if (token) {
      setLoadingNotifications(true);
      // Reset pagination and fetch fresh data (not append)
      setNotificationPage(0);
      await fetchNotifications(token, 0, false);
      setLoadingNotifications(false);
    }
  };

  const markAllNotificationsAsRead = async () => {
    // Optimistic update - mark all as read locally
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    const token = authService.getToken();
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
    try {
      await fetch(`${backendUrl}/notifications/read-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      console.error("Failed to mark all as read", e);
    }
  };

  const updateNotificationSettings = (key: keyof NotificationSettings, value: boolean) => {
    setNotificationSettings((prev) => ({ ...prev, [key]: value }));
    // Optionally persist to backend
    localStorage.setItem("notificationSettings", JSON.stringify({
      ...notificationSettings,
      [key]: value,
    }));
  };

  // Load notification settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("notificationSettings");
    if (saved) {
      try {
        setNotificationSettings(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, []);

  const fetchChatHistory = async (recipientId: string, recipientType: string = "USER") => {
    try {
      const token = authService.getToken();
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
      const res = await fetch(
        `${backendUrl}/chat/history/${recipientType}/${recipientId}?page=0&size=50`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.content) {
          // Prepend older messages that are not already in state.
          // Assuming data.content returns newer messages first or something?
          // According to ChatService, history is fetched with OrderByTimestampDesc.
          // So we must reverse it to get chronological order (oldest first).
          const historyMessages = [...data.content].reverse() as ChatMessage[];
          setChatMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newMessages = historyMessages.filter((m) => !existingIds.has(m.id));
            return [...newMessages, ...prev].sort(
              (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
          });
        }
      }
    } catch (e) {
      console.error("Failed to fetch chat history", e);
    }
  };

  const sendMessage = (recipientId: string, content: string, recipientType: string = "USER") => {
    if (clientRef.current && clientRef.current.connected) {
      try {
        clientRef.current.publish({
          destination: "/app/chat.send",
          body: JSON.stringify({ recipientId, content, recipientType }),
        });
      } catch (error) {
        console.error("Failed to send message:", error);
        showToast.error("Failed to send message. Please try again.");
      }
    } else {
      // Queue message for sending when reconnected
      console.log("Queueing message for offline sending");
      offlineMessageQueue.current.push({
        recipientId,
        content,
        recipientType,
        timestamp: Date.now(),
      });
      showToast.warning("Message queued. Will send when reconnected.");
    }
  };

  const sendTypingIndicator = (recipientId: string, recipientType: string, isTyping: boolean) => {
    if (clientRef.current && clientRef.current.connected) {
      clientRef.current.publish({
        destination: "/app/chat.typing",
        body: JSON.stringify({ recipientId, recipientType, typing: isTyping }),
      });
    }
  };

  const subscribeToChat = (recipientId: string) => {
    // Here we could subscribe to a specific group chat topic instead of just queue
    // if recipientId == "ALL", subscribe to /topic/tenant.{tenantId}.chat
    // However, personal queues are handled onConnect.
    if (
      recipientId === "ALL" &&
      currentUser?.tenantId &&
      clientRef.current &&
      clientRef.current.connected
    ) {
      const topic = `/topic/tenant.${currentUser.tenantId}.chat`;
      if (!chatSubscriptions.current.has(topic)) {
        const sub = clientRef.current.subscribe(topic, (message: IMessage) => {
          const chatMsg = JSON.parse(message.body) as ChatMessage;
          // Add with deduplication
          setChatMessages((prev) => {
            const exists = prev.some((m) => m.id === chatMsg.id);
            if (exists) return prev;

            // Update unread count for messages from others
            if (currentUser && chatMsg.senderId !== currentUser.id) {
              setUnreadMessageCount((count) => count + 1);
              const trackingId =
                chatMsg.recipientType === "GROUP" ? chatMsg.recipientId : chatMsg.senderId;
              setUnreadMessageCounts((counts) => ({
                ...counts,
                [trackingId]: (counts[trackingId] || 0) + 1,
              }));
            }

            return [...prev, chatMsg];
          });
        });
        chatSubscriptions.current.set(topic, sub);
      }
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );

    const token = authService.getToken();
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
    try {
      await fetch(`${backendUrl}/notifications/${notificationId}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      console.error("Failed to mark as read", e);
    }
  };

  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;

  const clearUnreadMessages = (senderId?: string) => {
    if (senderId) {
      setUnreadMessageCounts((prev) => {
        const count = prev[senderId] || 0;
        if (count > 0) {
          setUnreadMessageCount((total) => Math.max(0, total - count));
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
    <WebSocketContext.Provider
      value={{
        connected,
        chatMessages,
        notifications,
        typingUsers,
        sendMessage,
        sendTypingIndicator,
        subscribeToChat,
        fetchChatHistory,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        unreadNotificationCount,
        unreadMessageCount,
        unreadMessageCounts,
        clearUnreadMessages,
        loadingNotifications,
        loadingMoreNotifications,
        setLoadingNotifications,
        hasMoreNotifications,
        fetchMoreNotifications,
        refreshNotifications,
        notificationSettings,
        updateNotificationSettings,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};
