import React from "react";
import { Navigate, useParams, useLocation } from "react-router-dom";
import { useAccessibleProjects } from "../../api/useAccessibleProjects";

interface Props {
  children: React.ReactNode;
}

const ProjectAccessGuard: React.FC<Props> = ({ children }) => {
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const { projects, isLoading } = useAccessibleProjects();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Checking project access...</p>
        </div>
      </div>
    );
  }

  const hasAccess = projects.some(
    (project) =>
      String(project.id ?? project.projectId) === String(projectId),
  );

  if (!hasAccess) {
    return <Navigate to="/access-denied" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProjectAccessGuard;
