import { useQuery, useAction } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "@convex/_generated/api";

/**
 * Hook to get authentication state and current librarian
 */
export function useAuth() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const currentLibrarian = useQuery(
    api.librarians.getCurrentLibrarian,
    isAuthenticated ? {} : "skip"
  );

  return {
    isLoading: isLoading || (isAuthenticated && currentLibrarian === undefined),
    isAuthenticated,
    librarian: currentLibrarian,
    isAdmin: currentLibrarian?.role === "admin",
    isStaff: currentLibrarian?.role === "staff" || currentLibrarian?.role === "admin",
    isStudentAssistant: currentLibrarian?.role === "student_assistant",
  };
}

/**
 * Hook for authentication actions
 */
export function useAuthActions() {
  const { signIn, signOut } = useAuthFromConvex();

  return {
    signIn,
    signOut,
  };
}

// Using the Convex auth helpers
function useAuthFromConvex() {
  const signInAction = useAction(api.auth.signIn);
  const signOutAction = useAction(api.auth.signOut);

  return {
    signIn: async (provider: string, params: Record<string, unknown>) => {
      await signInAction({ provider, params });
    },
    signOut: async () => {
      await signOutAction();
    },
  };
}

