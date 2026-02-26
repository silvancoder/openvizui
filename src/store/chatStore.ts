/*
 * @Author: Anthony Rivera && opcnlin@gmail.com
 * @FilePath: \src\store\chatStore.ts
 * Copyright (c) 2026 OpenVizUI Contributors
 * Licensed under the MIT License
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
    id: string;
    type: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export interface ChatSession {
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    toolId: string;
}

interface ChatState {
    sessions: ChatSession[];
    messages: Record<string, Message[]>;
    activeSessionId: string | null;

    // Actions
    createSession: (toolId: string, initialTitle?: string) => string;
    setActiveSession: (id: string) => void;
    deleteSession: (id: string) => void;
    clearAllSessions: () => void;
    addMessage: (sessionId: string, message: Omit<Message, 'timestamp'>) => void;
    updateLastMessage: (sessionId: string, appendContent: string) => void;
    updateSessionTitle: (sessionId: string, title: string) => void;
}

export const useChatStore = create<ChatState>()(
    persist(
        (set) => ({
            sessions: [],
            messages: {},
            activeSessionId: null,

            createSession: (toolId: string, initialTitle: string = 'New Chat') => {
                const id = `chat-${Date.now()}`;
                const newSession: ChatSession = {
                    id,
                    title: initialTitle,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    toolId,
                };
                set((state) => ({
                    sessions: [newSession, ...state.sessions],
                    messages: { ...state.messages, [id]: [] },
                    activeSessionId: id,
                }));
                return id;
            },

            setActiveSession: (id: string) => {
                set({ activeSessionId: id });
            },

            deleteSession: (id: string) => {
                set((state) => {
                    const newSessions = state.sessions.filter((s) => s.id !== id);
                    const newMessages = { ...state.messages };
                    delete newMessages[id];

                    return {
                        sessions: newSessions,
                        messages: newMessages,
                        activeSessionId: state.activeSessionId === id
                            ? (newSessions[0]?.id || null)
                            : state.activeSessionId
                    };
                });
            },

            clearAllSessions: () => {
                set({ sessions: [], messages: {}, activeSessionId: null });
            },

            addMessage: (sessionId: string, message) => {
                set((state) => {
                    const sessionMessages = state.messages[sessionId] || [];
                    const fullMessage: Message = { ...message, timestamp: Date.now() };

                    // Auto-update title based on first user message if it's still generic
                    const session = state.sessions.find(s => s.id === sessionId);
                    let newSessions = state.sessions;

                    const isDefaultTitle = session && (!session.title || session.title === 'New Chat' || session.title === '新对话' || session.title === 'Terminal Chat');

                    if (session && message.type === 'user' && isDefaultTitle) {
                        const title = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '');
                        newSessions = state.sessions.map(s =>
                            s.id === sessionId ? { ...s, title, updatedAt: Date.now() } : s
                        );
                    } else {
                        newSessions = state.sessions.map(s =>
                            s.id === sessionId ? { ...s, updatedAt: Date.now() } : s
                        );
                    }

                    // Sort sessions by updatedAt
                    newSessions.sort((a, b) => b.updatedAt - a.updatedAt);

                    return {
                        messages: {
                            ...state.messages,
                            [sessionId]: [...sessionMessages, fullMessage]
                        },
                        sessions: newSessions
                    };
                });
            },

            updateLastMessage: (sessionId: string, appendContent: string) => {
                set((state) => {
                    const sessionMessages = state.messages[sessionId] || [];

                    const newSessions = state.sessions.map(s =>
                        s.id === sessionId ? { ...s, updatedAt: Date.now() } : s
                    );

                    if (sessionMessages.length === 0) {
                        return {
                            messages: {
                                ...state.messages,
                                [sessionId]: [{ id: Date.now().toString(), type: 'assistant', content: appendContent, timestamp: Date.now() }]
                            },
                            sessions: newSessions
                        };
                    }

                    const lastMessage = sessionMessages[sessionMessages.length - 1];
                    if (lastMessage.type !== 'assistant') {
                        return {
                            messages: {
                                ...state.messages,
                                [sessionId]: [...sessionMessages, { id: Date.now().toString(), type: 'assistant', content: appendContent, timestamp: Date.now() }]
                            },
                            sessions: newSessions
                        };
                    }

                    const updatedMessage = {
                        ...lastMessage,
                        content: lastMessage.content + appendContent,
                        timestamp: Date.now(),
                    };

                    return {
                        messages: {
                            ...state.messages,
                            [sessionId]: [...sessionMessages.slice(0, -1), updatedMessage]
                        },
                        sessions: newSessions
                    };
                });
            },

            updateSessionTitle: (sessionId: string, title: string) => {
                set((state) => ({
                    sessions: state.sessions.map((s) =>
                        s.id === sessionId ? { ...s, title, updatedAt: Date.now() } : s
                    ),
                }));
            },
        }),
        {
            name: 'openvizui-chat-storage', // key in local storage
        }
    )
);
