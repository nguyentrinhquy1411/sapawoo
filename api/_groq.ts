const ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

const DEFAULT_MODEL = "openai/gpt-oss-120b";

export interface GroqEnv {
	GROQ_API_KEY?: string;
	GROQ_MODEL?: string;
}

export interface ChatRequestBody {
	messages?: Array<{ role: string; content: string }>;
	temperature?: number;
	stream?: boolean;
	response_format?: unknown;
}

export function isConfigured(env: GroqEnv) {
	return Boolean(env.GROQ_API_KEY);
}

function reasoningParams(model: string) {
	return model.includes("gpt-oss") ? { reasoning_effort: "low", reasoning_format: "hidden" } : {};
}

export async function proxyToGroq(body: ChatRequestBody, env: GroqEnv, signal?: AbortSignal) {
	if (!env.GROQ_API_KEY) {
		return new Response(JSON.stringify({ error: "GROQ_API_KEY is not set on the server" }), {
			status: 503,
			headers: { "content-type": "application/json" },
		});
	}

	if (!Array.isArray(body.messages) || body.messages.length === 0) {
		return new Response(JSON.stringify({ error: "messages is required" }), {
			status: 400,
			headers: { "content-type": "application/json" },
		});
	}

	const model = env.GROQ_MODEL || DEFAULT_MODEL;

	return fetch(ENDPOINT, {
		method: "POST",
		headers: {
			"content-type": "application/json",
			authorization: `Bearer ${env.GROQ_API_KEY}`,
		},
		body: JSON.stringify({
			model,
			...reasoningParams(model),
			messages: body.messages,
			temperature: body.temperature ?? 0.4,
			stream: body.stream ?? false,
			...(body.response_format ? { response_format: body.response_format } : {}),
		}),
		signal,
	});
}
