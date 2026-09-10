import { useEffect, useState } from "react";
import { aiConfigured } from "@/lib/ai/groq";

export function useAiConfigured() {
	const [configured, setConfigured] = useState<boolean | null>(null);

	useEffect(() => {
		let active = true;
		aiConfigured().then((value) => {
			if (active) setConfigured(value);
		});
		return () => {
			active = false;
		};
	}, []);

	return configured;
}
