import React, { useState, useEffect, version } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

import { Input } from "../components/ui/Input";

import { getReleasesByProjectId } from "../api/releaseView/getReleasesByProject";
//import { projectReleaseCardView } from "../api/releaseView/getReleaseView";

import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Eye,
  Edit2,
  Trash2,
  Plus,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { Modal } from "../components/ui/Modal";

import { ProjectSelector } from "../components/ui/ProjectSelector";

import { getModulesByProjectId } from "../api/module/getModule";
import { getTestCasesByFilter } from "../api/releasetestcase";
import { getSubmodulesByModuleId } from "../api/submodule/submoduleget";
import { getSeverities } from "../api/severity";
import { getDefectTypes } from "../api/defectType";
import { getAllReleaseTypes } from "../api/Releasetype.ts";
import AlertModal from "../components/ui/AlertModal";
import { Toast } from "../components/ui/Toast";
import { extractErrorMessage, formatErrorMessage } from "../lib/errorUtils";

import { getAllProjects } from "../api/projectget";
import { useAccessibleProjects } from "../api/useAccessibleProjects.ts";
import { usePermission } from "../context/PermissionContext.tsx";
import { getAllReleaseView } from "../api/releaseView/getReleaseView";
import { createReleaseView } from "../api/releaseView/createReleaseView";
import { updateReleaseView } from "../api/releaseView/updateReleaseView";
import { deleteReleaseView } from "../api/releaseView/deleteReleaseView";

interface TestCase {
  id: string;
  module: string;
  subModule: string;
  description: string;
  steps: string;
  type: string;
  severity: string;
  projectId: string;
  releaseId?: string;

  testCaseType?: string;
  testCaseSeverity?: string;
  testType?: string;
  testSeverity?: string;
  caseType?: string;
  caseSeverity?: string;
  assignedBy?: string;
}

interface Module {
  id: string;
  name: string;
  submodules: { id: string; name: string }[];
}

export const ReleaseView: React.FC = () => {
const { projectId } = useParams();
  const navigate = useNavigate();
  const { setSelectedProjectId } = useApp();

  const { projects, switchProject } = useAccessibleProjects();

  const { can } = usePermission();

  const [selectedProject, setSelectedProject] = useState<string | null>(
    projectId || null,
  );
const [selectedProjectData, setSelectedProjectData] = useState<any>(null);
  const [selectedRelease, setSelectedRelease] = useState<string | null>(null);
  const [releases, setReleases] = useState<any[]>([]);
  const [selectedModule, setSelectedModule] = useState("");
  const [projectModules, setProjectModules] = useState<Module[]>([]);
  const [filteredTestCases, setFilteredTestCases] = useState<TestCase[]>([]);
  const [loadingTestCases, setLoadingTestCases] = useState(false);
  const [testCaseError, setTestCaseError] = useState<string | null>(null);
  const [isViewStepsModalOpen, setIsViewStepsModalOpen] = useState(false);
  const [isViewTestCaseModalOpen, setIsViewTestCaseModalOpen] = useState(false);
  const [isCreateReleaseModalOpen, setIsCreateReleaseModalOpen] =
    useState(false);
  const [viewingTestCase, setViewingTestCase] = useState<TestCase | null>(null);
  const [releaseFormData, setReleaseFormData] = useState({
    name: "",
    version: "",
    releaseDate: "",
    releaseType_id: "",
  });

  const [submodules, setSubmodules] = useState<any[]>([]);
  const [selectedSubmoduleId, setSelectedSubmoduleId] = useState<string | null>(
    null,
  );

  const [severities, setSeverities] = useState<
    { id: number; name: string; color: string }[]
  >([]);
  const [defectTypes, setDefectTypes] = useState<
    { id: number; defectTypeName: string }[]
  >([]);
  const [editingReleaseId, setEditingReleaseId] = useState<string | null>(null);
  const [releaseTypes, setReleaseTypes] = useState<any[]>([]);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: "" });
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});
  const [toast, setToast] = useState({
    isOpen: false,
    message: "",
    type: "success" as "success" | "error",
  });
  const [savingRelease, setSavingRelease] = useState(false);

  useEffect(() => {
    if (!selectedProject) {
      setReleases([]);
      return;
    }

    const loadReleases = async () => {
      const data = await getReleasesByProjectId(selectedProject);


      setReleases(data);
    };

    loadReleases();
  }, [selectedProject]);

  const fetchProjectData = async (projectId: string) => {
    try {
const response = await getAllProjects();
      const allProjects = Array.isArray(response)
        ? response
        : (response as any)?.data || [];

      const project = allProjects.find(
        (p: any) => String(p.id) === String(projectId),
      );
if (project) {
        setSelectedProjectData(project);
        return project;
      } else {
return null;
      }
    } catch (error) {
return null;
    }
  };

  useEffect(() => {
if (projects.length > 0 && selectedProject) {
      const initialProject = projects.find(
        (p) => String(p.id) === String(selectedProject),
      );
if (initialProject) {
setSelectedProjectData(initialProject);
      } else {
const projectByNumber = projects.find(
          (p) => Number(p.id) === Number(selectedProject),
        );

        const projectByString =
          selectedProject != null
            ? projects.find((p) => p.id?.toString() === String(selectedProject))
            : undefined;
if (projectByNumber) {
setSelectedProjectData(projectByNumber);
        } else if (projectByString) {
setSelectedProjectData(projectByString);
        } else {
fetchProjectData(selectedProject);
        }
      }
    } else if (selectedProject && projects.length === 0) {
fetchProjectData(selectedProject);
    }
  }, [projects, selectedProject]);

  useEffect(() => {
    if (isCreateReleaseModalOpen) {
      getAllReleaseTypes(0, 100)
        .then((res) => {
          const types = res.data.content || [];

          setReleaseTypes(
            types.map((type: any) => ({
              id: type.releaseTypeId ?? type.id,
              releaseTypeName: type.releaseTypeName || type.name,
            })),
          );
        })
        .catch(() => setReleaseTypes([]));
    }
  }, [isCreateReleaseModalOpen]);

  useEffect(() => {
    if (
      selectedProject &&
      selectedModule &&
      selectedSubmoduleId &&
      selectedRelease
    ) {
      setLoadingTestCases(true);
      setTestCaseError(null);

      getTestCasesByFilter(
        selectedProject,
        selectedModule,
        selectedSubmoduleId,
        selectedRelease,
      )
        .then((res) => {
          if (res.data && res.data.length > 0) {
          }

          const mappedTestCases = (res.data || []).map((tc: any) => ({
            ...tc,
            severity: (severities.find((s) => s.id === tc.severityId)?.name ||
              "") as string,
            type: (defectTypes.find((dt) => dt.id === tc.defectTypeId)
              ?.defectTypeName || "") as string,
          }));

          setFilteredTestCases(mappedTestCases);
        })
        .catch((err) => {
setTestCaseError(err.message || "Failed to load test cases");
        })
        .finally(() => setLoadingTestCases(false));
    } else {
      setFilteredTestCases([]);
    }
  }, [
    selectedProject,
    selectedModule,
    selectedSubmoduleId,
    selectedRelease,
    severities,
    defectTypes,
  ]);


  const getReleaseCardView = async (projectId = selectedProject) => {
    if (!projectId) {
      setReleases([]);
      return;
    }

    try {

        console.log("Fetching releases for project:", projectId);

      const response = await getReleasesByProjectId(String(projectId));

    console.log("Release API response:", response);


setReleases(response || []);
    } catch (error) {
        console.error("Failed to load releases: ", error);
setReleases([]);
    }
  };

  useEffect(() => {
    if (selectedProject) {
      getReleaseCardView(selectedProject);
    } else {
      setReleases([]);
    }
  }, [selectedProject]);

  const handleProjectSelect = (projectId: string, projectData?: any) => {
    setSelectedProject(projectId);
    setSelectedProjectData(projectData);
    setSelectedProjectId(projectId);
    navigate(`/projects/${projectId}/project-management/view`);

    setSelectedRelease(null);
    setSelectedModule("");
    setProjectModules([]);
    setFilteredTestCases([]);
  };

  const handleModuleSelect = async (moduleId: string) => {
    setSelectedModule(moduleId);
    setSelectedSubmoduleId(null);
    getSubmodulesByModuleId(Number(moduleId))
      .then((res) => setSubmodules(res.data || []))
      .catch(() => setSubmodules([]));
  };

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ isOpen: true, message, type });
  };

  const deleteRelease = async (releaseId: number) => {
    try {
      const resp = await deleteReleaseView(releaseId as number);

      const successMsg =
        (resp as any)?.message || "Release deleted successfully.";
      await getReleaseCardView(selectedProject);
      showToast(successMsg, "success");
    } catch (error: any) {
      const backendMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to delete release.";
      showToast(formatErrorMessage(backendMsg), "error");
    }
  };

  const getSeverityColor = (severity: string) => {
    if (!severity) return "bg-gray-100 text-gray-800";

    switch (severity.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      {}
      <div className="mb-4 flex justify-end">
        <Button
          variant="secondary"
          onClick={() => navigate(`/projects/${projectId}/project-management`)}
          className="flex items-center"
        >
          <ChevronLeft className="w-5 h-5 mr-2" /> Back
        </Button>
      </div>
      {}
      {}
      <ProjectSelector
        projects={projects}
        selectedProjectId={selectedProject}
        onSelect={handleProjectSelect}
      />
      {}

      {}
      {selectedProject && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Release Overview
            </h2>
            {can.release.create && (
              <Button
                onClick={() => {
if (selectedProject) {
                    let currentProject = selectedProjectData;

                    if (!currentProject) {
                      currentProject = projects.find(
                        (p) => String(p.id) === String(selectedProject),
                      );
if (currentProject) {
                        setSelectedProjectData(currentProject);
                      }
                    }

                    if (!currentProject) {
                      const projectByNumber = projects.find(
                        (p) => Number(p.id) === Number(selectedProject),
                      );
                      const projectByString = projects.find(
                        (p) => p.id?.toString() === selectedProject.toString(),
                      );

                      if (projectByNumber) {
setSelectedProjectData(projectByNumber);
                      } else if (projectByString) {
setSelectedProjectData(projectByString);
                      } else {
fetchProjectData(selectedProject).then((project) => {
                          if (project) {
}
                        });
                      }
                    }
                  }

                  setIsCreateReleaseModalOpen(true);
                }}
                className="flex items-center space-x-2"
                disabled={!selectedProject}
              >
                <Plus className="w-4 h-4" />
                <span>Create Release</span>
              </Button>
            )}
          </div>
          {releases.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">
                  No releases found for the selected project. Please create
                  releases first.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {releases.map((release: any) => (
                <Card
                  key={release.releaseId}
                  hover
                  className={`cursor-pointer group transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${selectedRelease === release.id ? "border-4 border-blue-700 bg-blue-600 text-white" : "border border-gray-200 bg-white text-gray-900"}`}
                  onClick={() =>
                    navigate(
                      `/projects/${selectedProject}/releases/${release.releaseId}/details`,
                    )
                  }
                >
                  <CardContent
                    className={`p-6 relative ${selectedRelease === release.id ? "bg-blue-600 text-white" : "bg-white text-gray-900"}`}
                  >
                    {}
                    <div className="absolute top-4 right-4 flex space-x-2 opacity-80 group-hover:opacity-100 z-10">
                      {can.release.edit && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();

                            setReleaseFormData({
                              name: release.releaseName,
                              version: release.releaseVersion,
                              releaseDate: release.releaseDate
                                ? release.releaseDate.split("T")[0]
                                : "",
                              releaseType_id: String(release.releaseTypeId ?? ""),
                            });
                            setIsCreateReleaseModalOpen(true);

                            setEditingReleaseId(String(release.releaseId));
                          }}
                          title="Edit"
                          className="p-1 rounded hover:bg-gray-200"
                        >
                          <Edit2 className="w-5 h-5 text-blue-500" />
                        </button>
                      )}
                      {can.release.delete && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();

                            setDeleteTargetId(String(release.releaseId));
                            setConfirmDeleteOpen(true);
                          }}
                          title="Delete"
                          className="p-1 rounded hover:bg-gray-200"
                        >
                          <Trash2 className="w-5 h-5 text-red-500" />
                        </button>
                      )}
                    </div>
                    <div className="mb-4">
                      <h3
                        className={`text-lg font-semibold mb-1 truncate max-w-full ${selectedRelease === release.id ? "text-white" : "text-gray-900"}`}
                        title={release.releaseName || release.name}
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          display: "block",
                          maxWidth: "100%",
                        }}
                      >
                        {release.releaseName || release.name}
                      </h3>
                      <p className="mt-2 text-lg font-medium">
                        {release.releaseVersion}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <Calendar
                          className={`w-4 h-4 ${selectedRelease === release.id ? "text-white" : "text-gray-400"}`}
                        />
                        <div>
                          <p
                            className={`text-xs ${selectedRelease === release.id ? "text-white" : "text-gray-500"}`}
                          >
                            Release Date
                          </p>
                          <p
                            className={`text-sm font-medium ${selectedRelease === release.id ? "text-white" : "text-gray-900"}`}
                          >
                            {release.releaseDate || release.startDate
                              ? new Date(
                                  release.releaseDate || release.startDate,
                                ).toLocaleDateString()
                              : "TBD"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {}
      {selectedRelease && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Module Selection
            </h2>
            <div className="relative flex items-center">
              <button
                onClick={() => {
                  const container = document.getElementById("module-scroll");
                  if (container) container.scrollLeft -= 200;
                }}
                className="flex-shrink-0 z-10 bg-white shadow-md rounded-full p-1 hover:bg-gray-50 mr-2"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div
                id="module-scroll"
                className="flex space-x-2 overflow-x-auto pb-2 scroll-smooth flex-1"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {projectModules.map((module: Module) => (
                  <Button
                    key={module.id}
                    variant={
                      selectedModule === module.id ? "primary" : "secondary"
                    }
                    onClick={() => handleModuleSelect(module.id)}
                    className="whitespace-nowrap m-2"
                  >
                    {module.name}
                  </Button>
                ))}
              </div>
              <button
                onClick={() => {
                  const container = document.getElementById("module-scroll");
                  if (container) container.scrollLeft += 200;
                }}
                className="flex-shrink-0 z-10 bg-white shadow-md rounded-full p-1 hover:bg-gray-50 ml-2"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {}
      {selectedRelease && selectedModule && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Submodule Selection
            </h2>
            <div className="relative flex items-center">
              <button
                onClick={() => {
                  const container = document.getElementById("submodule-scroll");
                  if (container) container.scrollLeft -= 200;
                }}
                className="flex-shrink-0 z-10 bg-white shadow-md rounded-full p-1 hover:bg-gray-50 mr-2"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div
                id="submodule-scroll"
                className="flex flex-nowrap gap-2 overflow-x-auto scrollbar-hide scroll-smooth flex-1"
                style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
              >
                {submodules.map((submodule) => (
                  <Button
                    key={submodule.subModuleId}
                    variant={
                      selectedSubmoduleId === String(submodule.subModuleId)
                        ? "primary"
                        : "secondary"
                    }
                    onClick={() =>
                      setSelectedSubmoduleId(String(submodule.subModuleId))
                    }
                    className="min-w-max whitespace-nowrap m-2"
                  >
                    {submodule.subModuleName}
                  </Button>
                ))}
              </div>
              <button
                onClick={() => {
                  const container = document.getElementById("submodule-scroll");
                  if (container) container.scrollLeft += 200;
                }}
                className="flex-shrink-0 z-10 bg-white shadow-md rounded-full p-1 hover:bg-gray-50 ml-2"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {}
      {selectedRelease && selectedModule && (
        <Card>
          <CardContent className="p-0">
            {loadingTestCases ? (
              <div className="p-8 text-center">Loading test cases...</div>
            ) : testCaseError ? (
              <div className="p-8 text-center text-red-500">
                {testCaseError}
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Test Case ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Steps
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned By
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTestCases.map((testCase: TestCase) => (
                    <tr key={testCase.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {testCase.id}
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-gray-500 max-w-xs description-cell"
                        title={testCase.description}
                      >
                        {testCase.description}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <button
                          onClick={() => {
                            setViewingTestCase(testCase);
                            setIsViewStepsModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                          title="View Steps"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {testCase.type || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(testCase.severity || "low")}`}
                        >
                          {testCase.severity || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {testCase.assignedBy || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {}
      <Modal
        isOpen={isViewStepsModalOpen}
        onClose={() => {
          setIsViewStepsModalOpen(false);
          setViewingTestCase(null);
        }}
        title={`Test Steps - ${viewingTestCase?.id}`}
      >
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700 whitespace-pre-line">
              {viewingTestCase?.steps}
            </p>
          </div>
          <div className="flex justify-end pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsViewStepsModalOpen(false);
                setViewingTestCase(null);
              }}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {}
      <Modal
        isOpen={isViewTestCaseModalOpen}
        onClose={() => {
          setIsViewTestCaseModalOpen(false);
          setViewingTestCase(null);
        }}
        title={`Test Case Details - ${viewingTestCase?.id}`}
        size="xl"
      >
        {viewingTestCase && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Description
                </h3>
                <p className="mt-1 text-sm text-gray-900">
                  {viewingTestCase.description}
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Test Steps
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-line">
                  {viewingTestCase.steps}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Severity</h3>
                <span
                  className={`mt-1 inline-flex px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(
                    viewingTestCase.severity || "low",
                  )}`}
                >
                  {viewingTestCase.severity || "N/A"}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Module</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {viewingTestCase.module} / {viewingTestCase.subModule}
                </p>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsViewTestCaseModalOpen(false);
                  setViewingTestCase(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {}
      <Modal
        isOpen={isCreateReleaseModalOpen}
        onClose={() => {
          setIsCreateReleaseModalOpen(false);
          setReleaseFormData({
            name: "",
            releaseDate: "",
            version: "",
            releaseType_id: "",
          });
          setEditingReleaseId(null);
          setValidationErrors({});
        }}
        title={editingReleaseId ? "Edit Release" : "Create New Release"}
        size="xl"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!selectedProject) return;

            setValidationErrors({});

            if (!releaseFormData.name.trim()) {
              setValidationErrors((prev) => ({
                ...prev,
                name: "Release name is required",
              }));
              return;
            }

            const releaseName = releaseFormData.name.trim();

            const releaseNamePattern = /^Release\s+\d+$/;

            if (!releaseNamePattern.test(releaseName)) {
              showToast(
                "Invalid release name. Please use the format 'Release 1'.",
                "error",
              );
              return;
            }

            const duplicateRelease = releases.some(
              (release: any) =>
                release.releaseName?.trim().toLowerCase() ===
                  releaseName.toLowerCase() &&
                String(release.releaseId) !== String(editingReleaseId),
            );

            if (duplicateRelease) {
              showToast("Release name already exists.", "error");
              return;
            }

        const releaseVersion = releaseFormData.version.trim();

        const releaseVersionPattern = /^(?=.*[A-Za-z0-9])[A-Za-z0-9._\- ]+$/;

        if (!releaseVersion) {
          setValidationErrors((prev) => ({
            ...prev,
            version: "Release version is required",
          }));
          return;
        }

        if (!releaseVersionPattern.test(releaseVersion)) {
          setValidationErrors((prev) => ({
            ...prev,
            version:
              "Invalid release version. Only letters, numbers, -, _ and . are allowed.",
          }));
          return;
        }

        const duplicateVersion = releases.some(
          (release: any) =>
            release.releaseVersion?.trim().toLowerCase() ===
              releaseVersion.toLowerCase() &&
            String(release.releaseId) !== String(editingReleaseId),
        );

        if (duplicateVersion) {
          showToast(
            `Release version "${releaseVersion}" already exists in this project.`,
            "error",
          );
          return;
        }

        if (duplicateVersion) {
          showToast(
            `Release version "${releaseVersion}" already exists in this project.`,
            "error",
          );
          return;
        }

            if (!releaseFormData.releaseType_id) {
              setValidationErrors((prev) => ({
                ...prev,
                releaseType: "Release type is required",
              }));
              return;
            }

            if (!releaseFormData.releaseDate) {
              setValidationErrors((prev) => ({
                ...prev,
                releaseDate: "Release date is required",
              }));
              return;
            }

            const payload = {
              projectId: Number(selectedProject),
              releaseName: releaseFormData.name.trim(),
              releaseVersion: releaseFormData.version.trim(),
              releaseDate: releaseFormData.releaseDate,
              releaseTypeId: Number(releaseFormData.releaseType_id),
            };

            try {
              let createOrUpdateSucceeded = false;
              if (editingReleaseId) {
                const response = await updateReleaseView(
                  Number(editingReleaseId),
                  payload,
                );
                if (response) {
                  setIsCreateReleaseModalOpen(false);

                  setReleaseFormData({
                    name: "",
                    version: "",
                    releaseDate: "",
                    releaseType_id: "",
                  });
                  setEditingReleaseId(null);
                  setValidationErrors({});

                 await getReleaseCardView(selectedProject);
                  showToast(
                    response?.message || "Release updated successfully!",
                    "success",
                  );
                  createOrUpdateSucceeded = true;
                } else {
                  showToast(
                    formatErrorMessage(
                      response?.message || "Failed to update release",
                    ),
                    "error",
                  );
                }
              } else {
                if (savingRelease) return;

                setSavingRelease(true);

                try {
const response = await createReleaseView(payload);


                  if (response) {
                    setIsCreateReleaseModalOpen(false);

                    setReleaseFormData({
                      name: "",
                      version: "",
                      releaseDate: "",
                      releaseType_id: "",
                    });

                    setValidationErrors({});
                    await getReleaseCardView(selectedProject);
                    showToast(
                      response?.message || "Release created successfully!",
                      "success",
                    );
                  } else {
                    showToast(
                      formatErrorMessage(
                        response?.message || "Failed to create release",
                      ),
                      "error",
                    );
                  }
                } catch (error: any) {
                     console.error("Create release error:", error);

                     const message =
                       formatErrorMessage(
                         extractErrorMessage(error) ||
                           "Failed to create release, Release date must be after the previous release date.",
                       );

                     showToast(message, "error");
                 }
                 finally {
                  setSavingRelease(false);
                }
              }
            } catch (error: any) {
              const errorMessage =
                formatErrorMessage(
                  extractErrorMessage(error) ||
                    (editingReleaseId
                      ? "Failed to update release"
                      : "Failed to create release"),
                );

              showToast(errorMessage, "error");
            } finally {
            }
          }}
          className="space-y-4"
        >
          <Input
            label="Release Name *"
            value={releaseFormData.name}
            onChange={(e) =>
              setReleaseFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            required
          />
          {validationErrors.name && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
          )}

          <div>
            <Input
              label="Release Version *"
              value={releaseFormData.version}
              onChange={(e) => {
                const value = e.target.value;

                setReleaseFormData((prev) => ({
                  ...prev,
                  version: e.target.value.slice(0, 20),
                }));

                if (validationErrors.version) {
                  setValidationErrors((prev) => ({
                    ...prev,
                    version: "",
                  }));
                }
              }}
              required
            />

            {validationErrors.version && (
              <p className="text-red-500 text-sm mt-1">
                {validationErrors.version}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Release Type *
            </label>
            <select
              value={releaseFormData.releaseType_id}
              onChange={(e) =>
                setReleaseFormData((prev) => ({
                  ...prev,
                  releaseType_id: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select Release Type</option>
              {releaseTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.releaseTypeName}
                </option>
              ))}
            </select>
          </div>
          {validationErrors.releaseType && (
            <p className="text-red-500 text-sm mt-1">
              {validationErrors.releaseType}
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Release Date *
            </label>
            <input
              type="date"
              value={releaseFormData.releaseDate}
              min={
                selectedProjectData?.startDate
                  ? new Date(
                      new Date(selectedProjectData.startDate).getTime() +
                        86400000,
                    )
                      .toISOString()
                      .slice(0, 10)
                  : ""
              }
              max={
                selectedProjectData?.endDate
                  ? new Date(
                      new Date(selectedProjectData.endDate).getTime() -
                        86400000,
                    )
                      .toISOString()
                      .slice(0, 10)
                  : ""
              }
              onChange={(e) =>
                setReleaseFormData((prev) => ({
                  ...prev,
                  releaseDate: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />

            {}
            {(() => {
              let currentProject =
                selectedProjectData ||
                projects.find((p) => String(p.id) === String(selectedProject));

              if (!currentProject && selectedProject) {
                currentProject =
                  projects.find(
                    (p) => Number(p.projectId) === Number(selectedProject),
                  ) ||
                  projects.find(
                    (p) =>
                      p.projectId.toString() === selectedProject.toString(),
                  );
              }
if (!projectId) {
                return (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-xs text-yellow-700 font-medium mb-1">
                      No Project Selected
                    </div>
                    <div className="text-xs text-yellow-600">
                      Please select a project first to see the date range.
                    </div>
                  </div>
                );
              }

              if (!currentProject) {
                return (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-xs text-red-700 font-medium mb-1">
                      Project Data Not Available
                    </div>
                    <div className="text-xs text-red-600">
                      Unable to load project information. Please try selecting
                      the project again.
                    </div>
                  </div>
                );
              }
if (currentProject.startDate || currentProject.endDate) {
                return (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-xs text-blue-700 font-medium mb-1">
                      Project Date Range:
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs text-blue-600">
                      <div>
                        <span className="font-medium">Start Date:</span>
                        <span className="ml-1">
                          {currentProject.startDate
                            ? new Date(
                                currentProject.startDate,
                              ).toLocaleDateString()
                            : "Not set"}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">End Date:</span>
                        <span className="ml-1">
                          {currentProject.endDate
                            ? new Date(
                                currentProject.endDate,
                              ).toLocaleDateString()
                            : "Not set"}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-blue-500 mt-1 italic">
                      Release date must be within this range
                    </div>
                  </div>
                );
              } else {
                return (
                  <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="text-xs text-orange-700 font-medium mb-1">
                      No Date Range Set
                    </div>
                    <div className="text-xs text-orange-600">
                      This project doesn't have start/end dates configured.
                    </div>
                  </div>
                );
              }
            })()}

            {validationErrors.releaseDate && (
              <p className="text-red-500 text-sm mt-1">
                {validationErrors.releaseDate}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsCreateReleaseModalOpen(false);
                setReleaseFormData({
                  name: "",
                  version: "",
                  releaseDate: "",
                  releaseType_id: "",
                });
                setEditingReleaseId(null);
                setValidationErrors({});
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={savingRelease}>
              {savingRelease
                ? editingReleaseId
                  ? "Updating..."
                  : "Saving..."
                : editingReleaseId
                  ? "Update"
                  : "Create"}
            </Button>
          </div>
        </form>
      </Modal>

      {}
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() =>
          setToast({ isOpen: false, message: "", type: "success" })
        }
      />

      {}
      {confirmDeleteOpen && (
        <div className="fixed inset-0 z-[70] flex justify-center items-start bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-2xl min-w-[350px] max-w-[95vw] p-6 mt-8">
            <div className="text-lg font-semibold mb-4 text-gray-900">
              Delete Release
            </div>
            <div className="mb-6 text-gray-700">
              {(() => {
                const release = releases.find(
                  (r) => r.releaseId === deleteTargetId,
                );
                return (
                  <>
                    Are you sure you want to delete the release "
                    <span className="font-semibold">
                      {release?.releaseName || ""}
                    </span>
                    "? This action cannot be undone.
                  </>
                );
              })()}
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setConfirmDeleteOpen(false);
                  setDeleteTargetId(null);
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-6 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setConfirmDeleteOpen(false);
                  if (deleteTargetId)
                    await deleteRelease(Number(deleteTargetId));
                  setDeleteTargetId(null);
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      <AlertModal
        isOpen={alertModal.isOpen}
        message={alertModal.message}
        onClose={() => setAlertModal({ isOpen: false, message: "" })}
      />
    </div>
  );
};
