import { useCallback, useRef } from "react";
import { extractActions } from "@/lib/ai/actions";
import { ASSISTANT_SYSTEM_PROMPT, type BoardContext, serializeBoard } from "@/lib/ai/context";
import { type ChatMessage, isAiConfigured, streamChat } from "@/lib/ai/groq";
import { assistantId, useAssistantStore } from "@/store/use-assistant-store";

export function useOrin(context: BoardContext | null) {
	const abortRef = useRef<AbortController | null>(null);
	const streamingMessageId = useAssistantStore((state) => state.streamingMessageId);

	const send = useCallback(
		async (prompt: string) => {
			const store = useAssistantStore.getState();
			const threadId = store.activeThreadId ?? store.newThread();
			const thread = useAssistantStore.getState().threads.find((item) => item.id === threadId);
			const history = thread?.messages ?? [];

			store.appendMessage(threadId, {
				id: assistantId("msg"),
				role: "user",
				content: prompt,
				createdAt: new Date().toISOString(),
			});

			if (history.length === 0) {
				store.renameThread(threadId, prompt.length > 42 ? `${prompt.slice(0, 42)}…` : prompt);
			}

			const replyId = assistantId("msg");
			store.appendMessage(threadId, {
				id: replyId,
				role: "assistant",
				content: "",
				createdAt: new Date().toISOString(),
			});
			store.setStreamingMessageId(replyId);

			if (!isAiConfigured()) {
				store.updateMessage(threadId, replyId, {
					error: "No Groq API key found. Add VITE_GROQ_API_KEY to .env.local and restart the dev server.",
				});
				store.setStreamingMessageId(null);
				return;
			}

			const messages: ChatMessage[] = [
				{ role: "system", content: ASSISTANT_SYSTEM_PROMPT },
				...(context
					? [{ role: "system" as const, content: `Current board data:\n${serializeBoard(context)}` }]
					: []),
				...history.map((message) => ({
					role: message.role,
					content: message.content,
				})),
				{ role: "user", content: prompt },
			];

			abortRef.current?.abort();
			const controller = new AbortController();
			abortRef.current = controller;

			try {
				let streamed = "";
				await streamChat({
					messages,
					signal: controller.signal,
					onToken: (token) => {
						streamed += token;
						useAssistantStore.getState().updateMessage(threadId, replyId, { content: streamed });
					},
				});

				const { text, actions } = extractActions(streamed);
				useAssistantStore.getState().updateMessage(threadId, replyId, {
					content: text,
					actions: actions.length > 0 ? actions : undefined,
				});
			} catch (error) {
				if ((error as Error).name === "AbortError") return;
				useAssistantStore.getState().updateMessage(threadId, replyId, {
					error: (error as Error).message,
				});
			} finally {
				useAssistantStore.getState().setStreamingMessageId(null);
			}
		},
		[context],
	);

	const stop = useCallback(() => {
		abortRef.current?.abort();
		useAssistantStore.getState().setStreamingMessageId(null);
	}, []);

	return { send, stop, isStreaming: streamingMessageId !== null };
}
