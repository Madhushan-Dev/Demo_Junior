import { useState, useEffect } from "react";
import { usePermission } from "../context/PermissionContext";
import { getAllProjects } from "./projectget";

export const useAccessibleProjects = () => {
  const {
    projects: accessibleProjects,
    isAdmin,
    isLoading: permissionLoading,
    switchProject,
    selectedProjectId,
  } = usePermission();
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      setIsLoading(true);
      try {
        if (isAdmin) {
          const response = await getAllProjects();
          const allProjects = Array.isArray(response)
            ? response
            : response?.data || [];
          setProjects(allProjects);
        } else {
          const accessibleProjectIds = accessibleProjects.map((p) =>
            p.projectId.toString(),
          );
          const response = await getAllProjects();
          const allProjects = Array.isArray(response)
            ? response
            : response?.data || [];
          const filteredProjects = allProjects.filter((project) =>
            accessibleProjectIds.includes(String(project.id)),
          );
          setProjects(filteredProjects);
        }
      } catch (error) {
setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (!permissionLoading) {
      loadProjects();
    }
  }, [isAdmin, accessibleProjects, permissionLoading]);

  return {
    projects,
    isLoading: isLoading || permissionLoading,
    switchProject,
    selectedProjectId,
  };
};
