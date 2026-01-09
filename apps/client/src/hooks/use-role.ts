import { useAuth } from "./use-auth";

type Role = "admin" | "staff" | "student_assistant";

/**
 * Hook for role-based access control
 */
export function useRole() {
  const { librarian, isAdmin, isStaff, isStudentAssistant } = useAuth();

  const hasRole = (role: Role): boolean => {
    if (!librarian) return false;
    return librarian.role === role;
  };

  const hasAnyRole = (roles: Role[]): boolean => {
    if (!librarian) return false;
    return roles.includes(librarian.role);
  };

  const canAccess = (requiredRoles: Role[]): boolean => {
    return hasAnyRole(requiredRoles);
  };

  // Permission checks
  const permissions = {
    // Circulation
    canCheckout: isStaff || isStudentAssistant,
    canCheckin: isStaff || isStudentAssistant,
    canRenew: isStaff,

    // Catalog
    canViewCatalog: true, // All librarians
    canEditCatalog: isStaff,
    canDeleteBook: isAdmin,

    // Students
    canViewStudents: isStaff,
    canEditStudents: isStaff,
    canBlockStudents: isStaff,
    canDeleteStudents: isAdmin,

    // Reports
    canViewReports: isStaff,
    canExportReports: isAdmin,

    // Settings
    canViewSettings: isAdmin,
    canEditSettings: isAdmin,

    // Users
    canManageUsers: isAdmin,
  };

  return {
    role: librarian?.role,
    hasRole,
    hasAnyRole,
    canAccess,
    permissions,
    isAdmin,
    isStaff,
    isStudentAssistant,
  };
}
