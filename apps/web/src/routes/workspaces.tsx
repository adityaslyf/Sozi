import { createFileRoute } from "@tanstack/react-router";
import WorkspaceManager from "@/components/workspace-manager";

export const Route = createFileRoute("/workspaces")({
	component: WorkspacesComponent,
});

function WorkspacesComponent() {
	return (
		<main className="min-h-screen bg-white">
			<WorkspaceManager />
		</main>
	);
}
