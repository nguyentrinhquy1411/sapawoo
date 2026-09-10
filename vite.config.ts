import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { type Plugin, defineConfig, loadEnv } from "vite";
import { type ChatRequestBody, isConfigured, proxyToGroq } from "./api/_groq.js";

function aiProxy(env: Record<string, string>): Plugin {
	const groqEnv = { GROQ_API_KEY: env.GROQ_API_KEY, GROQ_MODEL: env.GROQ_MODEL };

	return {
		name: "sapawoo-ai-proxy",
		configureServer(server) {
			server.middlewares.use("/api/chat", async (request, response) => {
				if (request.method === "GET") {
					response.setHeader("content-type", "application/json");
					response.end(JSON.stringify({ configured: isConfigured(groqEnv) }));
					return;
				}

				const chunks: Buffer[] = [];
				for await (const chunk of request) chunks.push(chunk as Buffer);

				let body: ChatRequestBody;
				try {
					body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
				} catch {
					response.statusCode = 400;
					response.end(JSON.stringify({ error: "Invalid JSON body" }));
					return;
				}

				const upstream = await proxyToGroq(body, groqEnv);
				response.statusCode = upstream.status;
				response.setHeader("content-type", upstream.headers.get("content-type") ?? "application/json");

				const reader = upstream.body?.getReader();
				if (!reader) {
					response.end();
					return;
				}

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					response.write(value);
				}
				response.end();
			});
		},
	};
}

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");

	return {
		plugins: [react(), tailwindcss(), aiProxy(env)],
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "./src"),
			},
		},
	};
});
