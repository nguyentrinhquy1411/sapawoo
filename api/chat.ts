import { type ChatRequestBody, isConfigured, proxyToGroq } from "./_groq";

export const config = { runtime: "edge" };

export default async function handler(request: Request) {
	const env = {
		GROQ_API_KEY: process.env.GROQ_API_KEY,
		GROQ_MODEL: process.env.GROQ_MODEL,
	};

	if (request.method === "GET") {
		return new Response(JSON.stringify({ configured: isConfigured(env) }), {
			headers: { "content-type": "application/json" },
		});
	}

	if (request.method !== "POST") {
		return new Response("Method not allowed", { status: 405 });
	}

	let body: ChatRequestBody;
	try {
		body = (await request.json()) as ChatRequestBody;
	} catch {
		return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
			status: 400,
			headers: { "content-type": "application/json" },
		});
	}

	const upstream = await proxyToGroq(body, env, request.signal);

	return new Response(upstream.body, {
		status: upstream.status,
		headers: {
			"content-type": upstream.headers.get("content-type") ?? "application/json",
			"cache-control": "no-store",
		},
	});
}
