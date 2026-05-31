import { create } from 'zustand';
import { getChatSessions, saveChatSessions, type ChatMessage } from '../lib/tauri';

export interface Message extends ChatMessage {}

export interface ChatSession {
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    toolId: string;
    config: {
        chatType: 'normal' | 'code' | 'deep';
        mcpEnabled: boolean;
        skillsEnabled: boolean;
    };
}

interface ChatState {
    sessions: ChatSession[];
    messages: Record<string, Message[]>;
    activeSessionId: string | null;
    isLoaded: boolean;

    // Actions
    loadSessions: () => Promise<void>;
    createSession: (toolId: string, initialTitle?: string) => string;
    setActiveSession: (id: string) => void;
    deleteSession: (id: string) => void;
    clearAllSessions: () => void;
    addMessage: (sessionId: string, message: Omit<Message, 'timestamp'>) => void;
    updateLastMessage: (sessionId: string, appendContent: string) => void;
    updateSessionTitle: (sessionId: string, title: string) => void;
    updateSessionConfig: (sessionId: string, config: Partial<ChatSession['config']>) => void;
}

const persistSessions = async (state: ChatState) => {
    if (!state.isLoaded) return;
    const sessionsWithMessages = state.sessions.map(s => ({
        ...s,
        messages: state.messages[s.id] || []
    }));
    try {
        await saveChatSessions(sessionsWithMessages);
    } catch (e) {
        console.error("Failed to persist sessions", e);
    }
};

export const useChatStore = create<ChatState>((set, get) => ({
    sessions: [],
    messages: {},
    activeSessionId: null,
    isLoaded: false,

    loadSessions: async () => {
        try {
            const data = await getChatSessions();
            const sessions: ChatSession[] = [];
            const messages: Record<string, Message[]> = {};
            
            data.forEach((s: any) => {
                const { messages: msgs, ...sessionData } = s;
                sessions.push(sessionData);
                messages[s.id] = msgs || [];
            });

            set({ 
                sessions, 
                messages, 
                activeSessionId: sessions[0]?.id || null,
                isLoaded: true 
            });
        } catch (e) {
            console.error("Failed to load sessions", e);
            set({ isLoaded: true });
        }
    },

    createSession: (toolId: string, initialTitle: string = 'New Chat') => {
        const id = `chat-${Date.now()}`;
        const newSession: ChatSession = {
            id,
            title: initialTitle,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            toolId,
            config: {
                chatType: 'normal',
                mcpEnabled: true,
                skillsEnabled: true,
            }
        };
        set((state) => ({
            sessions: [newSession, ...state.sessions],
            messages: { ...state.messages, [id]: [] },
            activeSessionId: id,
        }));
        persistSessions(get());
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
        persistSessions(get());
    },

    clearAllSessions: () => {
        set({ sessions: [], messages: {}, activeSessionId: null });
        persistSessions(get());
    },

    addMessage: (sessionId: string, message) => {
        set((state) => {
            const sessionMessages = state.messages[sessionId] || [];
            const fullMessage: Message = { ...message, timestamp: Date.now() };

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

            newSessions.sort((a, b) => b.updatedAt - a.updatedAt);

            return {
                messages: {
                    ...state.messages,
                    [sessionId]: [...sessionMessages, fullMessage]
                },
                sessions: newSessions
            };
        });
        persistSessions(get());
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
        persistSessions(get());
    },

    updateSessionTitle: (sessionId: string, title: string) => {
        set((state) => ({
            sessions: state.sessions.map((s) =>
                s.id === sessionId ? { ...s, title, updatedAt: Date.now() } : s
            ),
        }));
        persistSessions(get());
    },
    updateSessionConfig: (sessionId: string, config: Partial<ChatSession['config']>) => {
        set((state) => ({
            sessions: state.sessions.map((s) =>
                s.id === sessionId ? { 
                    ...s, 
                    config: { ...s.config, ...config },
                    updatedAt: Date.now() 
                } : s
            ),
        }));
        persistSessions(get());
    },
}));
