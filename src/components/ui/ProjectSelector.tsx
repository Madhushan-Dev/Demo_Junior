import React, { useState } from "react";
import { Card, CardContent } from "./Card";
import { Button } from "./Button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePermission } from "../../context/PermissionContext";

interface Project {
  id: string;
  name?: string;
  projectName?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  projectStatus?: string;
  clientName?: string;
  country?: string;
  state?: string;
  email?: string;
  phoneNo?: string;
  userId?: number;
}

interface ProjectSelectorProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelect: (id: string, projectData?: Project) => void;
  className?: string;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  selectedProjectId,
  onSelect,
  className = "",
}) => {
  const { projects: accessibleProjects, isAdmin, isLoading } = usePermission();
  const [searchTerm, setSearchTerm] = useState("");

  const getFilteredProjects = () => {
    if (isLoading) return [];

    if (isAdmin) return projects;

    const accessibleProjectIds = accessibleProjects.map((p) =>
      p.projectId.toString(),
    );

    return projects.filter((project) =>
      accessibleProjectIds.includes(String(project.id)),
    );
  };

  const filteredProjects = getFilteredProjects();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-center py-4 text-gray-500">
            Loading projects...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (filteredProjects.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-center py-4 text-gray-500">
            No projects available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Project Selection
        </h2>

        {}
        <div className="mb-3 relative">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 
                       focus:border-blue-500 transition"
          />

          <svg
            className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        {}
        <div className="relative flex items-center">
          <button
            onClick={() => {
              const container = document.getElementById("project-scroll");
              if (container) container.scrollLeft -= 200;
            }}
            className="flex-shrink-0 z-10 bg-white shadow-md rounded-full p-1 hover:bg-gray-50 mr-2"
            type="button"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          <div
            id="project-scroll"
            className="flex space-x-2 overflow-x-auto pb-2 scroll-smooth flex-1"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              maxWidth: "100%",
            }}
          >
            {filteredProjects
              ?.filter((project) =>
                (project.projectName || project.name || "")
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase()),
              )
              .map((project) => {
                const isSelected =
                  Number(selectedProjectId) === Number(project.id);

                return (
                  <Button
                    key={project.id}
                    variant={isSelected ? "primary" : "secondary"}
                    onClick={() => onSelect(project.id, project)}
                    className="whitespace-nowrap m-2"
                  >
                    {project.projectName || project.name}
                  </Button>
                );
              })}
          </div>

          <button
            onClick={() => {
              const container = document.getElementById("project-scroll");
              if (container) container.scrollLeft += 200;
            }}
            className="flex-shrink-0 z-10 bg-white shadow-md rounded-full p-1 hover:bg-gray-50 ml-2"
            type="button"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectSelector;
