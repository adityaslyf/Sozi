import { createFileRoute } from "@tanstack/react-router";
import WorkspaceManager from "@/components/workspace-manager";

export const Route = createFileRoute("/workspaces/")({
	component: WorkspacesIndexComponent,
});

function WorkspacesIndexComponent() {
	return <WorkspaceManager />;
}