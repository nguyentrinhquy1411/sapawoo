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

const ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

export function groqApiKey() {
	return import.meta.env.VITE_GROQ_API_KEY as string | undefined;
}

export function groqModel() {
	return (import.meta.env.VITE_GROQ_MODEL as string | undefined) ?? "openai/gpt-oss-120b";
}

export function isAiConfigured() {
	return Boolean(groqApiKey());
}

async function request(body: Record<string, unknown>, signal?: AbortSignal) {
	const apiKey = groqApiKey();
	if (!apiKey) throw new Error("Missing VITE_GROQ_API_KEY");

	const response = await fetch(ENDPOINT, {
		method: "POST",
		headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
		body: JSON.stringify({ model: groqModel(), ...body }),
		signal,
	});

	if (!response.ok) {
		const detail = await response.text();
		throw new Error(`Groq request failed (${response.status}): ${detail.slice(0, 200)}`);
	}

	return response;
}

export async function streamChat({ messages, signal, onToken, temperature = 0.4 }: StreamOptions) {
	const response = await request({ messages, temperature, stream: true }, signal);
	const reader = response.body?.getReader();
	if (!reader) throw new Error("Groq returned an empty stream");

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
