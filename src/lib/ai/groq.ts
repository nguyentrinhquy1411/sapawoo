export interface ChatMessage {
	role: "system" | "user" | "assistant";
	content: string;
}

export interface StreamOptions {
	messages: ChatMessage[];
	signal?: AbortSignal;
	onToken: (token: string) => void;
	temperature?: number;
}

const CHAT_ENDPOINT = "/api/chat";

let configuredPromise: Promise<boolean> | null = null;

export function aiConfigured() {
	if (!configuredPromise) {
		configuredPromise = fetch(CHAT_ENDPOINT)
			.then((response) => (response.ok ? response.json() : { configured: false }))
			.then((data) => Boolean(data.configured))
			.catch(() => false);
	}
	return configuredPromise;
}

async function request(body: Record<string, unknown>, signal?: AbortSignal) {
	const response = await fetch(CHAT_ENDPOINT, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
		signal,
	});

	if (!response.ok) {
		const detail = await response.text();
		try {
			const parsed = JSON.parse(detail) as { error?: string | { message?: string } };
			const message = typeof parsed.error === "string" ? parsed.error : parsed.error?.message;
			if (message) throw new Error(message);
		} catch (issue) {
			if (issue instanceof Error && issue.message) throw issue;
		}
		throw new Error(`Assistant request failed (${response.status})`);
	}

	return response;
}

export async function streamChat({ messages, signal, onToken, temperature = 0.4 }: StreamOptions) {
	const response = await request({ messages, temperature, stream: true }, signal);
	const reader = response.body?.getReader();
	if (!reader) throw new Error("The assistant returned an empty stream");

	const decoder = new TextDecoder();
	let buffer = "";
	let full = "";

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;

		buffer += decoder.decode(value, { stream: true });
		const lines = buffer.split("\n");
		buffer = lines.pop() ?? "";

		for (const line of lines) {
			const trimmed = line.trim();
			if (!trimmed.startsWith("data:")) continue;

			const payload = trimmed.slice(5).trim();
			if (payload === "[DONE]") return full;

			try {
				const token = JSON.parse(payload).choices?.[0]?.delta?.content as string | undefined;
				if (token) {
					full += token;
					onToken(token);
				}
			} catch {
				// A partial frame: the next chunk completes it.
			}
		}
	}

	return full;
}

export async function completeJson<T>(messages: ChatMessage[], signal?: AbortSignal): Promise<T> {
	const response = await request(
		{ messages, temperature: 0, response_format: { type: "json_object" } },
		signal,
	);
	const data = await response.json();
	return JSON.parse(data.choices?.[0]?.message?.content ?? "{}") as T;
}
