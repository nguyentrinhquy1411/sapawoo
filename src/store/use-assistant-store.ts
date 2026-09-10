import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProposedAction } from "@/lib/ai/actions";

export type AssistantViewMode = "modal" | "sidebar";

export interface AssistantMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	actions?: ProposedAction[];
	appliedCount?: number;
	error?: string;
	createdAt: string;
}

export interface AssistantThread {
	id: string;
	title: string;
	createdAt: string;
	messages: AssistantMessage[];
}

interface AssistantState {
	mode: AssistantViewMode;
	modalOpen: boolean;
	sidebarOpen: boolean;
	threads: AssistantThread[];
	activeThreadId: string | null;
	streamingMessageId: string | null;

	setMode: (mode: AssistantViewMode) => void;
	setModalOpen: (open: boolean) => void;
	setSidebarOpen: (open: boolean) => void;
	openAssistant: () => void;

	newThread: () => string;
	selectThread: (threadId: string) => void;
	deleteThread: (threadId: string) => void;
	renameThread: (threadId: string, title: string) => void;

	appendMessage: (threadId: string, message: AssistantMessage) => void;
	updateMessage: (threadId: string, messageId: string, patch: Partial<AssistantMessage>) => void;
	setStreamingMessageId: (messageId: string | null) => void;
}

const randomId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

function createThread(): AssistantThread {
	return { id: randomId("thread"), title: "New chat", createdAt: new Date().toISOString(), messages: [] };
}

export const useAssistantStore = create<AssistantState>()(
	persist(
		(set, get) => ({
			mode: "modal",
			modalOpen: false,
			sidebarOpen: false,
			threads: [],
			activeThreadId: null,
			streamingMessageId: null,

			setMode: (mode) => set({ mode, modalOpen: mode === "modal" && get().modalOpen }),
			setModalOpen: (modalOpen) => set({ modalOpen }),
			setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

			openAssistant: () =>
				set((state) => (state.mode === "modal" ? { modalOpen: true } : { sidebarOpen: true })),

			newThread: () => {
				const thread = createThread();
				set((state) => ({ threads: [thread, ...state.threads], activeThreadId: thread.id }));
				return thread.id;
			},

			selectThread: (activeThreadId) => set({ activeThreadId }),

			deleteThread: (threadId) =>
				set((state) => {
					const threads = state.threads.filter((thread) => thread.id !== threadId);
					return {
						threads,
						activeThreadId: state.activeThreadId === threadId ? (threads[0]?.id ?? null) : state.activeThreadId,
					};
				}),

			renameThread: (threadId, title) =>
				set((state) => ({
					threads: state.threads.map((thread) => (thread.id === threadId ? { ...thread, title } : thread)),
				})),

			appendMessage: (threadId, message) =>
				set((state) => ({
					threads: state.threads.map((thread) =>
						thread.id === threadId ? { ...thread, messages: [...thread.messages, message] } : thread,
					),
				})),

			updateMessage: (threadId, messageId, patch) =>
				set((state) => ({
					threads: state.threads.map((thread) =>
						thread.id === threadId
							? {
									...thread,
									messages: thread.messages.map((message) =>
										message.id === messageId ? { ...message, ...patch } : message,
									),
								}
							: thread,
					),
				})),

			setStreamingMessageId: (streamingMessageId) => set({ streamingMessageId }),
		}),
		{
			name: "sapawoo-assistant",
			version: 1,
			partialize: (state) => ({
				mode: state.mode,
				sidebarOpen: state.sidebarOpen,
				threads: state.threads,
				activeThreadId: state.activeThreadId,
			}),
		},
	),
);

export function useActiveThread() {
	return useAssistantStore((state) => state.threads.find((thread) => thread.id === state.activeThreadId));
}

export { randomId as assistantId };
