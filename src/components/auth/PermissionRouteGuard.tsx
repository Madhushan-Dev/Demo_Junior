import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { usePermission } from "../../context/PermissionContext";

interface Props {
  children: React.ReactNode;
  permission: string;
}

const PermissionRouteGuard: React.FC<Props> = ({ children, permission }) => {
  const { hasPermission, isLoading, permissionsReady } = usePermission();

  if (isLoading || !permissionsReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!hasPermission(permission.toUpperCase())) {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
};

export default PermissionRouteGuard;