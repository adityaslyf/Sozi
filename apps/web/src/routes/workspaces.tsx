import { createFileRoute, Outlet } from "@tanstack/react-router";
import WorkspaceManager from "@/components/workspace-manager";

export const Route = createFileRoute("/workspaces")({
	component: WorkspacesComponent,
});

function WorkspacesComponent() {
	// Always render the Outlet - TanStack Router will handle the routing
	return (
		<main className="min-h-screen bg-white">
			<Outlet />
		</main>
	);
}
