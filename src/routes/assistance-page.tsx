import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AssistanceThread } from "@/components/assistance/assistance-thread";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";

export function AssistancePage() {
	return (
		<>
			<TopBar
				title="ORIN"
				subtitle="Ask about your boards, review the changes it proposes"
				actions={
					<Button asChild variant="outline" size="sm" className="gap-1.5">
						<Link to="/">
							<ArrowLeft />
							<span>Back to app</span>
						</Link>
					</Button>
				}
			/>
			<div className="min-h-0 flex-1">
				<AssistanceThread showHistory fullscreen />
			</div>
		</>
	);
}
