import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { IconLoader2 } from "@tabler/icons-react";

export const Route = createFileRoute("/")({
	component: Index,
});

function Index() {
	const { isLoading, isAuthenticated } = useConvexAuth();

	const currentLibrarian = useQuery(
		api.librarians.getCurrentLibrarian,
		isAuthenticated ? {} : "skip"
	);

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
				<IconLoader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	// Not authenticated -> login
	if (!isAuthenticated) {
		return <Navigate to="/login" />;
	}

	// Waiting for librarian query
	if (currentLibrarian === undefined) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
				<IconLoader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	// Authenticated but no librarian record -> setup (for invited users)
	if (currentLibrarian === null) {
		return <Navigate to="/setup" />;
	}

	// Has librarian -> dashboard
	return <Navigate to="/dashboard" />;
}

