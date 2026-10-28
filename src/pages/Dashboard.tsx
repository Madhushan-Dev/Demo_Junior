import ENDPOINTS from "../utils/endpoints";

import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProjectCard from "../components/ui/ProjectCard";
import { useApp } from "../context/AppContext";
import { Pie as ChartJSPie } from "react-chartjs-2";
import { Modal } from "../components/ui/Modal";
import { usePermission } from "../context/PermissionContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
} from "chart.js";
import {
  AlertCircle,
  Clock,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { ProjectSelector } from "../components/ui/ProjectSelector";
import DefectToRemarkRatio from "../components/ui/DefectToRemarkRatio";
import {
  getDefectSeveritySummary,
  getReleaseDefectsDaily,
  getAllDefectsDaily,
  getTimeToFixDefectsDaily,
  getAllTimeToFixDefectsDaily,
  TimeToFindDefectsResponse,
  TimeToFixDefectsResponse,
} from "../api/dashboard/dash_get";
import { getAllDefectStatuses, DefectStatus } from "../api/defectStatus";
import { getSeverities, Severity } from "../api/severity";
import { getDefectTypeByProjectId } from "../api/dashboard/defecttype";
import { getDefectRemarkRatioByProjectId } from "../api/dashboard/remarkratio";
import { getDefectSeverityIndex } from "../api/dashboard/dsi";
import {
  getKILOC,
  getDefectDensity,
  DefectDensityData,
} from "../api/KLOC/getKLOC";
import {
  updateProjectKloc,
  calculateKlocFromGithub,
  CalculateKlocRequest,
} from "../api/KLOC/putKLOC";
import { getDefectsByModule } from "../api/dashboard/defectbymodule";
import { getAllProjectsForDashbord } from "../api/projectget";
import { getProjectCardColor } from "../api/dashboard/projectCardColor";
import { getReopenCountSummary } from "../api/dashboard/Defectreopen";
import {
  projectReleaseCardView,
  ProjectRelease,
} from "../api/releaseView/ProjectReleaseCardView";
import {
  getActiveReleases,
  ActiveRelease,
} from "../api/releaseView/ActiveReleases";
import {
  getDefectsByProjectId,
  FilteredDefect,
} from "../api/defect/filterDefectByProject";
import apiClient from "../lib/api";


ChartJS.register(ArcElement, ChartTooltip, ChartLegend);

export const Dashboard: React.FC = () => {
  const { defects, selectedProjectId, setSelectedProjectId } = useApp();
  const [projects, setProjects] = useState<any[]>([]);
  const {
    projects: userProjects,
    isAdmin,
    isLoading: permissionLoading,
  } = usePermission();
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [projectRiskData, setProjectRiskData] = useState<{
    [projectId: string]: "high" | "medium" | "low";
  }>({});
  const [dsiStatus, setDsiStatus] = useState<string>("Healthy");
  const [loadingRiskData, setLoadingRiskData] = useState(false);

  useEffect(() => {}, [selectedProjectId]);

  const navigate = useNavigate();
  const [reopenModal, setReopenModal] = useState<{
    open: boolean;
    label: string;
    defects: any[];
  }>({ open: false, label: "", defects: [] });
  const [riskFilter, setRiskFilter] = useState<
    "all" | "high" | "medium" | "low"
  >("all");
  const [pieModal, setPieModal] = useState<{
    open: boolean;
    severity: string | null;
  }>({ open: false, severity: null });
  const [reopenedHoveredIdx, setReopenedHoveredIdx] = useState<number | null>(
    null,
  );
  const reopenedChartRef = useRef<any>(null);
  const [isReopenedCardHovered, setIsReopenedCardHovered] = useState(false);
  const [hoveredModuleIdx, setHoveredModuleIdx] = useState<number | null>(null);
  const [isModuleCardHovered, setIsModuleCardHovered] = useState(false);
  const [moduleDetailModal, setModuleDetailModal] = useState<{
    open: boolean;
    mod: any;
    totalHigh: number;
    totalMed: number;
    totalLow: number;
  } | null>(null);
  const [reopenedDetailModal, setReopenedDetailModal] = useState<{
    open: boolean;
    label: string;
    defects: any[];
  } | null>(null);

  const [hoveredReopenSegment, setHoveredReopenSegment] = useState<{
    label: string;
    defects: FilteredDefect[];
  } | null>(null);
  const [allDefects, setAllDefects] = useState<FilteredDefect[]>([]);
  const [loadingDefects, setLoadingDefects] = useState(false);

  const [defectSeveritySummary, setDefectSeveritySummary] = useState<any>(null);
  const [loadingSeveritySummary, setLoadingSeveritySummary] = useState(false);
  const [severitySummaryError, setSeveritySummaryError] = useState<
    string | null
  >(null);

  const [statusTypes, setStatusTypes] = useState<DefectStatus[]>([]);
  const [loadingStatusTypes, setLoadingStatusTypes] = useState(true);
  const [statusTypesError, setStatusTypesError] = useState<string | null>(null);

  const [severities, setSeverities] = useState<Severity[]>([]);
  const [loadingSeverities, setLoadingSeverities] = useState(true);
  const [severitiesError, setSeveritiesError] = useState<string | null>(null);

  const [defectTypeData, setDefectTypeData] = useState<{
    labels: string[];
    counts: number[];
    percentages?: number[];
    total?: number;
    mostCommon?: string;
    mostCount?: number;
  } | null>(null);
  const [loadingDefectType, setLoadingDefectType] = useState(false);
  const [defectTypeError, setDefectTypeError] = useState<string | null>(null);

  const [remarkRatioData, setRemarkRatioData] = useState<{
    ratio?: string;
    category?: string;
    color?: string;
  } | null>(null);
  const [loadingRemarkRatio, setLoadingRemarkRatio] = useState(false);
  const [klocChanged, setKlocChanged] = useState(false);
  const [remarkRatioError, setRemarkRatioError] = useState<string | null>(null);
  const [dsi, setDsi] = useState<string | null>(null);
  const [loadingDsi, setLoadingDsi] = useState(false);
  const [dsiError, setDsiError] = useState<string | null>(null);

  const [dsiSeverityCounts, setDsiSeverityCounts] = useState({
  high: 0,
  medium: 0,
  low: 0,
});

  const [klocInput, setKlocInput] = useState<number>(0.1);
  const [defectDensity, setDefectDensity] = useState<DefectDensityData | null>(
    null,
  );
  const [showKlocModal, setShowKlocModal] = useState(false);
  const [klocModalForm, setKlocModalForm] = useState<CalculateKlocRequest>({
    backendRepo: "",
    frontendRepo: "",
    githubUsername: "",
    githubToken: "",
  });
  const getCombinedRisk = (
    remarkCategory: "high" | "medium" | "low",
    densityRisk: "high" | "medium" | "low",
    dsiRisk: "high" | "medium" | "low",
  ): "high" | "medium" | "low" => {
    if (
      remarkCategory === "high" ||
      densityRisk === "high" ||
      dsiRisk === "high"
    ) {
      return "high";
    }
    if (
      remarkCategory === "medium" ||
      densityRisk === "medium" ||
      dsiRisk === "medium"
    ) {
      return "medium";
    }
    return "low";
  };

  const refreshCombinedRiskForProject = async (projectId: string | number) => {
    try {
      let remarkCategory: "high" | "medium" | "low" = "low";
      try {
        const remarkRes = await getDefectRemarkRatioByProjectId(projectId);
        const cat = remarkRes?.data?.category?.toLowerCase();
        if (cat === "high" || cat === "medium" || cat === "low")
          remarkCategory = cat;
      } catch {}

      let densityRisk: "high" | "medium" | "low" = "low";
      try {
        const densityRes = await getDefectDensity(projectId);
        const density = densityRes?.data?.defectDensity ?? 0;
        if (density >= 10) densityRisk = "high";
        else if (density >= 7) densityRisk = "medium";
        else densityRisk = "low";
      } catch {}

      let dsiRisk: "high" | "medium" | "low" = "low";
      try {
      //   const dsiRes = await getDefectSeverityIndex(projectId);
      //   const status = dsiRes?.data?.dsiStatus || "Healthy";
      //   if (status === "Critical" || status === "High Risk") dsiRisk = "high";
      //   else if (status === "Needs Attention") dsiRisk = "medium";
      //   else dsiRisk = "low";
      // } catch {}

    const dsiRes = await getDefectSeverityIndex(project.id);

  const status =
    dsiRes?.data?.riskLevel ??
    dsiRes?.riskLevel ??
    dsiRes?.data?.dsiStatus ??
    dsiRes?.dsiStatus ??
    "Low Risk";

  const normalizedStatus = String(status).toLowerCase();

  if (
    normalizedStatus === "critical" ||
    normalizedStatus === "high risk" ||
    normalizedStatus === "high"
  ) {
    dsiRisk = "high";
  } else if (
    normalizedStatus === "needs attention" ||
    normalizedStatus === "medium risk" ||
    normalizedStatus === "medium"
  ) {
    dsiRisk = "medium";
  } else {
    dsiRisk = "low";
  }
} catch {
  dsiRisk = "low";
}

      const overallRisk = getCombinedRisk(remarkCategory, densityRisk, dsiRisk);

      setProjectRiskData((prev) => ({
        ...prev,
        [projectId]: overallRisk,
      }));
    } catch (error) {}
  };
  const [calculatingKloc, setCalculatingKloc] = useState(false);
  const [klocModalError, setKlocModalError] = useState<string | null>(null);
  const [klocUpdated, setKlocUpdated] = useState(0);
  const [loadingDefectDensity, setLoadingDefectDensity] = useState(false);
  const [defectDensityError, setDefectDensityError] = useState<string | null>(
    null,
  );
  const [defectsByModule, setDefectsByModule] = useState<any[]>([]);
  const [loadingDefectsByModule, setLoadingDefectsByModule] = useState(false);
  const [defectsByModuleError, setDefectsByModuleError] = useState<
    string | null
  >(null);
  const [releases, setReleases] = useState<ProjectRelease[]>([]);
const [selectedRelease, setSelectedRelease] = useState<{
  releaseId: number;
  releaseName: string;
}>({
  releaseId: 0,
  releaseName: "All Releases",
});
  const [loadingReleases, setLoadingReleases] = useState(false);
  const [releasesError, setReleasesError] = useState<string | null>(null);
  const [releaseDailyDefects, setReleaseDailyDefects] = useState<
    TimeToFindDefectsResponse["data"] | null
  >(null);
  const [loadingReleaseDailyDefects, setLoadingReleaseDailyDefects] =
    useState(false);
  const [releaseDailyFixedDefects, setReleaseDailyFixedDefects] = useState<
    TimeToFixDefectsResponse["dailyData"] | null
  >(null);
  const [loadingReleaseDailyFixedDefects, setLoadingReleaseDailyFixedDefects] =
    useState(false);

  const FetchData = async () => {
    setLoadingProjects(true);
    setProjectsError(null);
    try {
      const response: any = await getAllProjectsForDashbord();
      let allProjects = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.content)
            ? response.data.content
            : Array.isArray(response?.content)
              ? response.content
              : [];

      if (!isAdmin) {
        if (userProjects && userProjects.length > 0) {
          const userProjectIds = userProjects.map((p) =>
            Number(p.projectId || p.id || p.project_id),
          );
          allProjects = allProjects.filter((project: any) =>
            userProjectIds.includes(Number(project.id)),
          );
        } else {
          allProjects = [];
        }
      }

      setProjects(Array.isArray(allProjects) ? allProjects : []);
      setLoadingProjects(false);

      setLoadingRiskData(true);
      const riskMap: { [key: string]: "high" | "medium" | "low" } = {};

      // await Promise.all(
      //   allProjects.map(async (project: any) => {
      //     try {
      //       let remarkCategory: "high" | "medium" | "low" = "low";
      //       try {
      //         const remarkRes = await getDefectRemarkRatioByProjectId(
      //           project.id,
      //         );
      //         const cat = remarkRes?.data?.category?.toLowerCase();
      //         if (cat === "high" || cat === "medium" || cat === "low") {
      //           remarkCategory = cat;
      //         }
      //       } catch {
      //         remarkCategory = "low";
      //       }
      //       let densityRisk: "high" | "medium" | "low" = "low";
      //       try {
      //         const densityRes = await getDefectDensity(project.id);
      //         const density = densityRes?.data?.defectDensity ?? 0;

      //         if (density > 10) densityRisk = "high";
      //         else if (density > 7) densityRisk = "medium";
      //         else densityRisk = "low";
      //       } catch {
      //         densityRisk = "low";
      //       }

      //       let dsiRisk: "high" | "medium" | "low" = "low";
      //       try {
      //         const dsiRes = await getDefectSeverityIndex(project.id);
      //         const status = dsiRes?.data?.dsiStatus || "Healthy";
      //         if (status === "Critical" || status === "High Risk") {
      //           dsiRisk = "high";
      //         } else if (status === "Needs Attention") {
      //           dsiRisk = "medium";
      //         } else {
      //           dsiRisk = "low";
      //         }
      //       } catch {
      //         dsiRisk = "low";
      //       }

      //       // let overallRisk: "high" | "medium" | "low" = "low";
      //       // if (
      //       //   remarkCategory === "high" ||
      //       //   densityRisk === "high" ||
      //       //   dsiRisk === "high"
      //       // ) {
      //       //   overallRisk = "high";
      //       // } else if (
      //       //   remarkCategory === "medium" ||
      //       //   densityRisk === "medium" ||
      //       //   dsiRisk === "medium"
      //       // ) {
      //       //   overallRisk = "medium";
      //       // } else {
      //       //   overallRisk = "low";
      //       // }

      //       const overallRisk = getCombinedRisk(
      //         remarkCategory,
      //         densityRisk,
      //         dsiRisk,
      //       );

      //       riskMap[project.id] = overallRisk;
      //     } catch (error) {
      //       riskMap[project.id] = "low";
      //     }
      //   }),
      // );

          await Promise.all(
      allProjects.map(async (project: any) => {
        try {
          // -----------------------------
          // 1. Defect to Remark Ratio
          // -----------------------------
         let remarkCategory: "high" | "medium" | "low" = "low";

try {
  const remarkRes = await getDefectRemarkRatioByProjectId(project.id);

  const category = remarkRes?.data?.category ?? "low";

  const normalizedCategory = String(category).toLowerCase();

  if (
    normalizedCategory === "high" ||
    normalizedCategory === "medium" ||
    normalizedCategory === "low"
  ) {
    remarkCategory = normalizedCategory as
      | "high"
      | "medium"
      | "low";
  }
} catch {
  remarkCategory = "low";
}

          // -----------------------------
          // 2. Defect Density
          // -----------------------------
          let densityRisk: "high" | "medium" | "low" = "low";

          try {
            const densityRes = await getDefectDensity(project.id);

            const density = Number(
              densityRes?.data?.defectDensity ?? 0,
            );

            if (density > 10) {
              densityRisk = "high";
            } else if (density > 7) {
              densityRisk = "medium";
            } else {
              densityRisk = "low";
            }
          } catch {
            densityRisk = "low";
          }

          // -----------------------------
          // 3. Defect Severity Index
          // -----------------------------
          let dsiRisk: "high" | "medium" | "low" = "low";

          try {
            const dsiRes = await getDefectSeverityIndex(project.id);

            const status =
              dsiRes?.data?.riskLevel ??
              dsiRes?.riskLevel ??
              dsiRes?.data?.dsiStatus ??
              dsiRes?.dsiStatus ??
              "Low Risk";

            const normalizedStatus = String(status).toLowerCase();

            if (
              normalizedStatus === "critical" ||
              normalizedStatus === "high risk" ||
              normalizedStatus === "high"
            ) {
              dsiRisk = "high";
            } else if (
              normalizedStatus === "needs attention" ||
              normalizedStatus === "medium risk" ||
              normalizedStatus === "medium"
            ) {
              dsiRisk = "medium";
            } else {
              dsiRisk = "low";
            }
          } catch {
            dsiRisk = "low";
          }

          // -----------------------------
          // 4. Overall Project Risk
          // Priority:
          // HIGH > MEDIUM > LOW
          // -----------------------------
          const overallRisk = getCombinedRisk(
            remarkCategory,
            densityRisk,
            dsiRisk,
          );

          riskMap[project.id] = overallRisk;
        } catch {
          riskMap[project.id] = "low";
        }
      }),
    );
      setProjectRiskData(riskMap);
      setLoadingRiskData(false);
    } catch (error) {
      setProjectsError("Failed to load projects");
      setLoadingProjects(false);
    }
  };
  useEffect(() => {
    if (!permissionLoading) {
      FetchData();
    }
  }, [permissionLoading, isAdmin, userProjects]);

  const [reopenSummary, setReopenSummary] = useState<any[]>([]);
  const [loadingReopenSummary, setLoadingReopenSummary] = useState(false);
  const [reopenSummaryError, setReopenSummaryError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!selectedProjectId) {
      setDefectSeveritySummary(null);
      setDsi(null);
      return;
    }

    setLoadingSeveritySummary(true);
    setSeveritySummaryError(null);

    const numericProjectId = String(selectedProjectId).replace(/\D/g, "");

    getDefectSeveritySummary(numericProjectId)
      .then((apiData) => {
        const dynamicSummary: any = {};

        if (apiData && apiData.data) {
          dynamicSummary.Remark = apiData.data.totalRemark || 0;
          dynamicSummary.TotalDefect = apiData.data.totalDefects || 0;

          if (Array.isArray(apiData.data.severities)) {
            apiData.data.severities.forEach((item: any) => {
              const sevKey = String(item.severityName || "").toLowerCase();

              const normalizedStatusCounts = Object.fromEntries(
                Object.entries(item.statusCounts || {}).map(([key, value]) => [
                  key.toLowerCase(),
                  value,
                ]),
              );

              dynamicSummary[sevKey] = {
                statusCounts: normalizedStatusCounts,
                total: item.totalDefects || 0,
                totalDefects: item.totalDefects || 0,
                validDefects: item.totalDefects || 0,
                severityColor: item.severityColor,
              };
            });
          }
        }

        setDefectSeveritySummary(
          Object.keys(dynamicSummary).length > 0 ? dynamicSummary : null,
        );
        setLoadingSeveritySummary(false);
      })
      .catch(() => {
        setSeveritySummaryError("Failed to load defect severity summary");
        setLoadingSeveritySummary(false);
      });
  }, [selectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId) {
      setAllDefects([]);
      return;
    }
    setLoadingDefects(true);
    getDefectsByProjectId(selectedProjectId, 0, 1000000)
      .then((defects) => {
        setAllDefects(defects);
        setLoadingDefects(false);
      })
      .catch((error) => {
        setAllDefects([]);
        setLoadingDefects(false);
      });
  }, [selectedProjectId]);

  const getDefectsByReopenCount = (label: string): FilteredDefect[] => {
    if (!allDefects.length) return [];

    if (label.includes("1 time")) {
      return allDefects.filter((d) => d.reOpenCount === 1);
    } else if (label.includes("2 times")) {
      return allDefects.filter((d) => d.reOpenCount === 2);
    } else if (label.includes("3 times")) {
      return allDefects.filter((d) => d.reOpenCount === 3);
    } else if (label.includes("4+ times") || label.includes("4 or more")) {
      return allDefects.filter((d) => d.reOpenCount >= 4);
    } else {
      const match = label.match(/(\d+)/);
      if (match) {
        const count = parseInt(match[1]);
        return allDefects.filter((d) => d.reOpenCount === count);
      }
    }
    return [];
  };

  useEffect(() => {
    if (!selectedProjectId) {
      setDsi(null);
      setDsiStatus("Healthy");
      setDsiError(null);
      return;
    }
    setLoadingDsi(true);
    setDsiError(null);
  getDefectSeverityIndex(selectedProjectId)
  .then((data) => {

    console.log("DSI data in Dashboard:", data);

    const value = data?.defectSeverityIndex ?? 0;
    const status = data?.riskLevel ?? "Low Risk";

    setDsi(Number(value).toFixed(2));
    setDsiStatus(status);

    setDsiSeverityCounts({
      high: data?.highDefects ?? 0,
      medium: data?.mediumDefects ?? 0,
      low: data?.lowDefects ?? 0,
    });

    setLoadingDsi(false);
  })
  .catch((error) => {
    console.error("Dashboard DSI error:", error);

    setDsiError("Failed to load Defect Severity Index");
    setDsi(null);
    setDsiStatus("Healthy");
    setLoadingDsi(false);
  });

  }, [selectedProjectId]);

  useEffect(() => {
    setLoadingStatusTypes(true);
    setStatusTypesError(null);

    const fetchStatuses = async () => {
      try {
        const response = await apiClient.get(
          ENDPOINTS.statusTypePagination(0, 100),
        );

        let statusData = [];
        if (response.data?.data?.content) {
          statusData = response.data.data.content;
        } else if (response.data && Array.isArray(response.data)) {
          statusData = response.data;
        } else if (
          response.data?.content &&
          Array.isArray(response.data.content)
        ) {
          statusData = response.data.content;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          statusData = response.data.data;
        }

        const mappedStatuses = statusData.map((s: any) => ({
          id: s.id,
          defectStatusName: s.name || s.statusName || s.defectStatusName,
          colorCode: s.color || s.colorCode || "#808080",

          name: s.name || s.statusName || s.defectStatusName,
          color: s.color || s.colorCode || "#808080",
        }));

        setStatusTypes(mappedStatuses);
        setLoadingStatusTypes(false);
      } catch (error) {
        setStatusTypesError("Failed to load status types");
        setStatusTypes([]);
        setLoadingStatusTypes(false);
      }
    };

    fetchStatuses();
  }, []);

  useEffect(() => {
    setLoadingSeverities(true);
    setSeveritiesError(null);
    getSeverities()
      .then((res) => {
        let severityContent: any[] = [];
        if (res && res.data && res.data.content && Array.isArray(res.data.content)) {
          severityContent = res.data.content;
        } else if (res && res.data && Array.isArray(res.data)) {
          severityContent = res.data;
        } else if (Array.isArray(res)) {
          severityContent = res;
        }

        const mappedSeverities = severityContent.map((s: any) => ({
          ...s,
          id: s.id || s.severityId,
          name: s.name || s.severityName || "",
          severityName: s.severityName || s.name || "",
          color: s.color || s.colorCode || "#6B7280",
          colorCode: s.colorCode || s.color || "#6B7280",
        }));

        setSeverities(mappedSeverities);
        setLoadingSeverities(false);
      })
      .catch(() => {
        setSeveritiesError("Failed to load severities");
        setSeverities([]);
        setLoadingSeverities(false);
      });
  }, []);

/////////////////////////////////////////////
  useEffect(() => {
   if (!selectedProjectId) {
       setDefectTypeData(null);
       return;
     }

    // const activeRelease = releases.find(
    //     (r) => r.status?.toLowerCase() === "active",
    // );
    // const activeReleaseId = activeRelease ? Number(activeRelease.releaseId) : null;
    //
    // if (!activeReleaseId) {
    //   setDefectTypeData(null);
    //   return;
    // }


     setLoadingDefectType(true);
     setDefectTypeError(null);

     getDefectTypeByProjectId(selectedProjectId)
       .then((res) => {
         if (
           res?.data?.defectTypes &&
           Array.isArray(res.data.defectTypes)
         ) {
           setDefectTypeData({
             labels: res.data.defectTypes.map(
               (d: any) => d.defectTypeName
             ),
             counts: res.data.defectTypes.map(
               (d: any) => d.defectCount
             ),
             percentages: res.data.defectTypes.map(
               (d: any) => d.percentage
             ),
             total: res.data.totalDefectCount,
             mostCommon: res.data.mostCommonDefectType,
             mostCount: res.data.mostCommonDefectCount,
           });
         } else {
           setDefectTypeData(null);
           setDefectTypeError("No data available");
         }

         setLoadingDefectType(false);
       })
       .catch((error) => {
         console.error(
           "Failed to load defect type distribution:",
           error
         );

         setDefectTypeError(
           "Failed to load defect type distribution"
         );
         setDefectTypeData(null);
         setLoadingDefectType(false);
       });
   }, [selectedProjectId]);

     ////////////////////////

  useEffect(() => {
    if (!selectedProjectId) {
      setRemarkRatioData(null);
      return;
    }
    setLoadingRemarkRatio(true);
    setRemarkRatioError(null);
    getDefectRemarkRatioByProjectId(selectedProjectId)
      .then((res) => {
        if (!res || !res.data || Object.keys(res.data).length === 0) {
          setRemarkRatioData(null);
          setRemarkRatioError("No defect or remark data available");
          setLoadingRemarkRatio(false);
          return;
        }

        if (res.data.error) {
          setRemarkRatioData(null);
          setRemarkRatioError(res.data.error);
          setLoadingRemarkRatio(false);
          return;
        }

        if (
          typeof res.data.ratio === "string" &&
          typeof res.data.category === "string" &&
          typeof res.data.color === "string"
        ) {
          setRemarkRatioData({
            ratio: res.data.ratio,
            category: res.data.category,
            color: res.data.color,
          });
          setRemarkRatioError(null);
          setLoadingRemarkRatio(false);
          return;
        }

        setRemarkRatioData(null);
        setRemarkRatioError("Invalid defect to remark ratio data");
        setLoadingRemarkRatio(false);
      })
      .catch(() => {
        setRemarkRatioError("No data available");
        setRemarkRatioData(null);
        setLoadingRemarkRatio(false);
      });
  }, [selectedProjectId]);

 useEffect(() => {
  if (!selectedProjectId) {
    setDefectsByModule([]);
    setDefectsByModuleError(null);
    return;
  }

  setLoadingDefectsByModule(true);
  setDefectsByModuleError(null);

  getDefectsByModule(Number(selectedProjectId))
    .then((res) => {
      if (res && Array.isArray(res.data) && res.data.length > 0) {
        setDefectsByModule(res.data);
      } else {
        setDefectsByModule([]);
        setDefectsByModuleError("No data available");
      }
      setLoadingDefectsByModule(false);
    })
    .catch(() => {
      setDefectsByModuleError("No data available");
      setDefectsByModule([]);
      setLoadingDefectsByModule(false);
    });
}, [selectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId) {
      setReopenSummary([]);
      return;
    }

    setLoadingReopenSummary(true);
    setReopenSummaryError(null);

    getReopenCountSummary(Number(selectedProjectId))
      .then((res) => {
        if (res && res.data && Array.isArray(res.data)) {
          setReopenSummary(res.data);
        } else {
          setReopenSummary([]);
        }
        setLoadingReopenSummary(false);
      })
      .catch((err) => {
        setReopenSummaryError("Failed to load reopen summary");
        setReopenSummary([]);
        setLoadingReopenSummary(false);
      });
  }, [selectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId) {
      setReleases([]);
     // setSelectedRelease(null);
      setKlocInput(0);
      return;
    }

    const fetchData = async () => {
      setLoadingReleases(true);
      setReleasesError(null);

     try {
const res = await projectReleaseCardView(selectedProjectId);

console.log("PROJECT RELEASE RESPONSE:", res);
console.log("PROJECT RELEASE DATA:", res.data);

const releaseData = res.data || [];

setReleases(releaseData);

setSelectedRelease({
  releaseId: 0,
  releaseName: "All Releases",
});
} catch (error) {
  console.error("FAILED TO LOAD RELEASES:", error);
  setReleases([]);
  setReleasesError("Failed to load releases");
} finally {
        setLoadingReleases(false);
      }

      try {
        const klocRes = await getKILOC(Number(selectedProjectId));
        if (klocRes?.data?.kloc) {
          const Kloc = klocRes.data.kloc;
          setKlocInput(Kloc);
          setKlocChanged(false);
          setDefectDensity((prev) => ({
            ...prev!,
            kloc: Kloc,
          }));
          setKlocUpdated((prev) => prev + 1);
        }
      } catch {
        setKlocInput(0);
      }
    };

    fetchData();
  }, [selectedProjectId]);
const handleKlocInputChange = async () => {
  if (!selectedProjectId) return;

  const projectId = Number(selectedProjectId);
  const updatedKloc = Number(klocInput);

  if (!updatedKloc || updatedKloc <= 0) {
    console.error("Invalid KLOC value");
    return;
  }

  try {
    // 1. Update KLOC in backend
    const updateResponse = await updateProjectKloc(
      projectId,
      updatedKloc
    );

    console.log("KLOC update response:", updateResponse);

    // 2. Get latest defect density from backend
    const densityResponse = await getDefectDensity(projectId);

    console.log(
      "Updated defect density response:",
      densityResponse
    );

    // 3. Update KLOC
    setKlocInput(densityResponse.data.kloc);

    // 4. Update defect density object
    setDefectDensity({
      kloc: densityResponse.data.kloc,
      totalDefects: densityResponse.data.totalDefects,
      defectDensity: densityResponse.data.defectDensity,
    });

    // 5. Mark KLOC as saved
    setKlocChanged(false);

    // 6. Refresh project risk
    await refreshCombinedRiskForProject(projectId);

  } catch (error) {
    console.error("Failed to update KLOC / defect density:", error);
  }
};
const handleCalculateKloc = async () => {
  if (!selectedProjectId) {
    setKlocModalError("Please select a project");
    return;
  }

  const projectId = Number(selectedProjectId);

  // const activeRelease = releases.find(
  //   (r) => r.status?.toUpperCase() === "ACTIVE",
  // );

  // const activeReleaseId = activeRelease
  //   ? Number(activeRelease.id)
  //   : null;

    const activeRelease = releases.find(
  (r) => r.status?.toUpperCase() === "ACTIVE",
);

const activeReleaseId = activeRelease
  ? Number(activeRelease.releaseId)
  : null;
  
  if (!activeReleaseId) {

      console.log("SELECTED PROJECT:", selectedProjectId);
  console.log("RELEASES STATE:", releases);
    setKlocModalError("No active release found for this project");
    return;
  }

  if (
    !klocModalForm.backendRepo ||
    !klocModalForm.frontendRepo ||
    !klocModalForm.githubUsername ||
    !klocModalForm.githubToken
  ) {
    setKlocModalError("Please fill all fields");
    return;
  }

  setCalculatingKloc(true);
  setKlocModalError(null);

  try {
    // 1. Calculate KLOC from GitHub
    const res = await calculateKlocFromGithub(
      projectId,
      klocModalForm,
    );

    // 2. Check calculated KLOC
    if (res?.data?.totalKLOC !== undefined) {
      const calculatedKloc = res.data.totalKLOC;

      // 3. Save calculated KLOC into backend/database
      await updateProjectKloc(
        projectId,
        calculatedKloc,
      );

      // 4. Update KLOC in frontend
      setKlocInput(calculatedKloc);
      setKlocChanged(false);

      // 5. Refresh defect density
      setKlocUpdated((prev) => prev + 1);

      // 6. Refresh project risk
      await refreshCombinedRiskForProject(projectId);

      // 7. Close modal
      setShowKlocModal(false);

      // 8. Clear form
      setKlocModalForm({
        backendRepo: "",
        frontendRepo: "",
        githubUsername: "",
        githubToken: "",
      });
    } else {
      setKlocModalError(
        "KLOC calculation returned no result",
      );
    }
  } catch (error) {
    console.error(
      "Failed to calculate KLOC:",
      error,
    );

    setKlocModalError(
      "Failed to calculate KLOC. Check your GitHub credentials and repository URLs.",
    );
  } finally {
    setCalculatingKloc(false);
  }
};

/*
  const handleCalculateKloc = async () => {
    const activeRelease = releases.find(
      (r) => r.status?.toUpperCase() === "ACTIVE",
    );
    const activeReleaseId = activeRelease ? Number(activeRelease.releaseId) : null;

    if (!activeReleaseId) {
      setKlocModalError("No active release found for this project");
      return;
    }

    if (
      !klocModalForm.backendRepo ||
      !klocModalForm.frontendRepo ||
      !klocModalForm.githubUsername ||
      !klocModalForm.githubToken
    ) {
      setKlocModalError("Please fill all fields");
      return;
    }
    setCalculatingKloc(true);
    setKlocModalError(null);

    try {
      const res = await calculateKlocFromGithub(klocModalForm);

      if (res?.data?.totalKLOC) {
        const calculatedKloc = res.data.totalKLOC;
        setKlocInput(calculatedKloc);
        setKlocChanged(true);
        setDefectDensity((prev) => ({
          ...prev!,
          kloc: calculatedKloc,
        }));

        setShowKlocModal(false);
        setKlocModalForm({
          backendRepo: "",
          frontendRepo: "",
          githubUsername: "",
          githubToken: "",
        });
        if (selectedProjectId) {
          await refreshCombinedRiskForProject(selectedProjectId);
        }
      }
    } catch (error) {
      setKlocModalError(
        "Failed to calculate KLOC. Check your credentials and repo URLs.",
      );
    } finally {
      setCalculatingKloc(false);
    }
  };*/

useEffect(() => {

  if (!selectedProjectId || !selectedRelease) {
    setReleaseDailyDefects(null);
    return;
  }

  setLoadingReleaseDailyDefects(true);

  // All Releases
  if (
    selectedRelease.releaseId === null ||
    selectedRelease.releaseId === undefined ||
    selectedRelease.releaseId === 0
  ) {

    getAllDefectsDaily(String(selectedProjectId))
      .then((res) => {
        setReleaseDailyDefects(res.data || []);
        setLoadingReleaseDailyDefects(false);
      })
      .catch(() => {
        setReleaseDailyDefects([]);
        setLoadingReleaseDailyDefects(false);
      });

  } else {

    // Specific Release
    getReleaseDefectsDaily(
      String(selectedProjectId),
      String(selectedRelease.releaseId),
    )
      .then((res) => {
        setReleaseDailyDefects(res.data || []);
        setLoadingReleaseDailyDefects(false);
      })
      .catch(() => {
        setReleaseDailyDefects([]);
        setLoadingReleaseDailyDefects(false);
      });
  }

}, [selectedProjectId, selectedRelease]);

useEffect(() => {
  if (!selectedProjectId || !selectedRelease) {
    setReleaseDailyFixedDefects(null);
    return;
  }

  setLoadingReleaseDailyFixedDefects(true);

  // All Releases
  if (
    selectedRelease.releaseId === null ||
    selectedRelease.releaseId === undefined ||
    selectedRelease.releaseId === 0
  ) {
    getAllTimeToFixDefectsDaily(Number(selectedProjectId))
      .then((res) => {
        let dailyData = [];

        if (res && Array.isArray(res)) {
          dailyData = res;
        } else if (res && res.data && Array.isArray(res.data)) {
          dailyData = res.data;
        } else if (
          res &&
          res.dailyData &&
          Array.isArray(res.dailyData)
        ) {
          dailyData = res.dailyData;
        }

        setReleaseDailyFixedDefects(dailyData);
        setLoadingReleaseDailyFixedDefects(false);
      })
      .catch(() => {
        setReleaseDailyFixedDefects([]);
        setLoadingReleaseDailyFixedDefects(false);
      });

  } else {

    // Specific Release
    getTimeToFixDefectsDaily(
      Number(selectedProjectId),
      selectedRelease.releaseId,
    )
      .then((res) => {
        let dailyData = [];

        if (res && Array.isArray(res)) {
          dailyData = res;
        } else if (res && res.data && Array.isArray(res.data)) {
          dailyData = res.data;
        } else if (
          res &&
          res.dailyData &&
          Array.isArray(res.dailyData)
        ) {
          dailyData = res.dailyData;
        }

        setReleaseDailyFixedDefects(dailyData);
        setLoadingReleaseDailyFixedDefects(false);
      })
      .catch(() => {
        setReleaseDailyFixedDefects([]);
        setLoadingReleaseDailyFixedDefects(false);
      });
  }

}, [selectedProjectId, selectedRelease]);

  function getProjectStatusColor(
    projectId: string,
  ): "red" | "yellow" | "green" {
    const projectDefects = defects.filter((d) => d.projectId === projectId);
    if (
      projectDefects.some(
        (d) => d.severity === "high" || d.severity === "critical",
      )
    )
      return "red";
    if (projectDefects.some((d) => d.severity === "medium")) return "yellow";
    return "green";
  }

  const projectDefects = selectedProjectId
    ? defects.filter((d) => d.projectId === selectedProjectId)
    : [];
  const selectedProject = Array.isArray(projects)
    ? projects.find((p: any) => p.id === selectedProjectId)
    : null;

  const filteredDefects = selectedProjectId
    ? defects.filter(
        (d) =>
          d.projectId === selectedProjectId &&
          (!selectedRelease?.releaseName ||
            String(d.releaseId ?? "") === selectedRelease.releaseName),
      )
    : [];

  if (selectedProjectId) {
    const projectDefectsForDebug = defects.filter(
      (d) => d.projectId === selectedProjectId,
    );

    if (typeof window !== "undefined") {
    }
  }

  const riskCounts = {
  high: 0,
  medium: 0,
  low: 0,
};

if (!loadingRiskData && Array.isArray(projects)) {
  projects.forEach((project) => {
    const risk = projectRiskData[project.id];

    if (risk === "high") {
      riskCounts.high++;
    } else if (risk === "medium") {
      riskCounts.medium++;
    } else if (risk === "low") {
      riskCounts.low++;
    }
  });
}

  useEffect(() => {
    if (!selectedProjectId) {
      setDefectDensity(null);
      return;
    }

    const numericProjectId = Number(selectedProjectId);

    setLoadingDefectDensity(true);
    setDefectDensityError(null);

    getDefectDensity(numericProjectId)
      .then((apiData) => {
        if (apiData?.data) {
          const { kloc, totalDefects, defectDensity } = apiData.data;
          setDefectDensity({
            kloc: kloc,
            totalDefects: totalDefects,
            defectDensity: defectDensity,
          });
        } else {
          setDefectDensity({ kloc: 0.1, totalDefects: 0, defectDensity: 0 });
        }
      })
      .catch((err) => {
        setDefectDensityError("Failed to load defect density");
        setDefectDensity({ kloc: 0.1, totalDefects: 0, defectDensity: 0 });
      })
      .finally(() => {
        setLoadingDefectDensity(false);
      });
  }, [selectedProjectId, klocUpdated]);

  function getTextColorClass(bgClass: string | undefined): string {
    if (!bgClass) return "";

    const match = bgClass.match(/from-([a-z]+-[0-9]+)/);
    if (match) {
      return `text-${match[1]}`;
    }

    return "";
  }

  function getRiskLabelFromClass(bgClass: string | undefined): string {
    if (!bgClass) return "";
    const cls = bgClass.toLowerCase();

    if (/(red|rose|#ef4444|#dc2626|rgb\(\s*239\s*,\s*68\s*,\s*68)/.test(cls))
      return "High Risk";

    if (
      /(yellow|amber|#f59e0b|#facc15|rgb\(\s*250\s*,\s*204\s*,\s*21)/.test(cls)
    )
      return "Medium Risk";

    if (
      /(green|emerald|lime|teal|#22c55e|#10b981|#16a34a|rgb\(\s*34\s*,\s*197\s*,\s*94)/.test(
        cls,
      )
    )
      return "Low Risk";
    return "";
  }

  function getRiskLevelFromClass(
    bgClass: string | undefined,
  ): "high" | "medium" | "low" | undefined {
    if (!bgClass) return undefined;
    const cls = bgClass.toLowerCase();
    if (/(red|rose|#ef4444|#dc2626|rgb\(\s*239\s*,\s*68\s*,\s*68)/.test(cls))
      return "high";
    if (
      /(yellow|amber|#f59e0b|#facc15|rgb\(\s*250\s*,\s*204\s*,\s*21)/.test(cls)
    )
      return "medium";
    if (
      /(green|emerald|lime|teal|#22c55e|#10b981|#16a34a|rgb\(\s*34\s*,\s*197\s*,\s*94)/.test(
        cls,
      )
    )
      return "low";
    return undefined;
  }

  const selectedProjectRiskLabel = (() => {
    if (!selectedProject) return "";
    const risk = projectRiskData[selectedProject.id];
    if (risk === "high") return "High Risk";
    if (risk === "medium") return "Medium Risk";
    return "Low Risk";
  })();

  if (!selectedProjectId) {
    return (
      <>
        {}
        <div className="max-w-5xl mx-auto flex flex-col items-center mt-16 mb-12">
          <h1
            className="text-5xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-4 drop-shadow-sm"
            style={{
              letterSpacing: "-0.02em",
              fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
            }}
          >
            Dashboard Overview
          </h1>
          <p
            className="text-lg md:text-xl font-medium text-gray-500 text-center max-w-2xl mb-2"
            style={{
              fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
              lineHeight: "1.6",
            }}
          >
            Gain insights into your projects with real-time health metrics and
            status summaries
          </p>
          <div className="h-1 w-24 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full mt-2 mb-1 opacity-80" />
        </div>

        {}
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6 text-left tracking-tight flex items-center gap-3">
            <span className="inline-block w-2 h-8 bg-blue-500 rounded-full mr-2" />
            Project Status Insights
          </h2>
          {}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-7 mb-12">
            {}
            <div className="bg-white rounded-2xl shadow-lg flex items-center p-7 min-h-[150px] border-2 border-red-500/100 hover:shadow-xl transition-transform hover:scale-[1.03] group relative">
              <span className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-red-800 mr-5 shadow-md">
                {<AlertCircle className="w-9 h-9 text-red-100" />}
              </span>
              <div>
                <div className="text-slate-700 font-semibold text-lg mb-1">
                  High Risk Projects
                </div>
                <div className="text-4xl font-extrabold text-red-600">
                  {riskCounts.high}
                </div>
                <div className="text-xs text-red-500 mt-1 font-medium">
                  Immediate attention required
                </div>
              </div>
              <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            </div>
            {}
            <div className="bg-white rounded-2xl shadow-lg flex items-center p-7 min-h-[150px] border-2 border-yellow-500/100 hover:shadow-xl transition-transform hover:scale-[1.03] group relative">
              <span className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 mr-5 shadow-md">
                <Clock className="w-9 h-9 text-yellow-100" />
              </span>
              <div>
                <div className="text-slate-700 font-semibold text-lg mb-1">
                  Medium Risk Projects
                </div>
                <div className="text-4xl font-extrabold text-yellow-600">
                  {riskCounts.medium}
                </div>
                <div className="text-xs text-yellow-600 mt-1 font-medium">
                  Monitor progress closely
                </div>
              </div>
              <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />
            </div>
            {}
            <div className="bg-white rounded-2xl shadow-lg flex items-center p-7 min-h-[150px] border-2 border-green-600/80 hover:shadow-xl transition-transform hover:scale-[1.03] group relative">
              <span className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 mr-5 shadow-md">
                <CheckCircle className="w-9 h-9 text-green-100" />
              </span>
              <div>
                <div className="text-slate-700 font-semibold text-lg mb-1">
                  Low Risk Projects
                </div>
                <div className="text-4xl font-extrabold text-green-600">
                  {riskCounts.low}
                </div>
                <div className="text-xs text-green-600 mt-1 font-medium">
                  Stable and on track
                </div>
              </div>
              <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            </div>
          </div>
        </div>
        {}
        <hr className="my-10 border-gray-200 max-w-5xl mx-auto" />

        {}
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <h2 className="text-2xl font-bold text-gray-900">All Projects</h2>
          </div>
          {}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-8">
            <span className="text-gray-700 font-medium mr-0 sm:mr-3 whitespace-nowrap self-start sm:self-center">
              Filter by severity:
            </span>
            <div className="flex bg-gradient-to-r from-slate-50 via-blue-50 to-slate-100 border border-slate-200 rounded-full shadow-[0_2px_16px_rgba(30,41,59,0.10)] px-2 py-1 gap-4 backdrop-blur-sm w-fit">
              <button
                className={`px-5 py-2 rounded-full font-semibold transition text-sm focus:outline-none focus:ring-2 focus:ring-blue-400
                  ${
                    riskFilter === "all"
                      ? "bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow-lg scale-105 ring-2 ring-blue-300"
                      : "bg-white/60 text-slate-700 hover:bg-blue-100/60 hover:shadow-md hover:scale-105"
                  }
                  backdrop-blur-[2px] border border-transparent`}
                style={{
                  boxShadow:
                    riskFilter === "all"
                      ? "0 4px 24px 0 rgba(59,130,246,0.10)"
                      : undefined,
                }}
                onClick={() => setRiskFilter("all")}
              >
                All Projects
              </button>
              <button
                className={`px-5 py-2 rounded-full font-semibold transition text-sm focus:outline-none focus:ring-2 focus:ring-red-300
                  ${
                    riskFilter === "high"
                      ? "bg-gradient-to-r from-red-600 to-red-800 text-white shadow-lg scale-105 ring-2 ring-red-200"
                      : "bg-white/60 text-red-700 hover:bg-red-100/60 hover:shadow-md hover:scale-105"
                  }
                  backdrop-blur-[2px] border border-transparent`}
                style={{
                  boxShadow:
                    riskFilter === "high"
                      ? "0 4px 24px 0 rgba(239,68,68,0.10)"
                      : undefined,
                }}
                onClick={() => setRiskFilter("high")}
              >
                High Risk
              </button>
              <button
                className={`px-5 py-2 rounded-full font-semibold transition text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300
                  ${
                    riskFilter === "medium"
                      ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg scale-105 ring-2 ring-yellow-200"
                      : "bg-white/60 text-yellow-700 hover:bg-yellow-100/60 hover:shadow-md hover:scale-105"
                  }
                  backdrop-blur-[2px] border border-transparent`}
                style={{
                  boxShadow:
                    riskFilter === "medium"
                      ? "0 4px 24px 0 rgba(251,191,36,0.10)"
                      : undefined,
                }}
                onClick={() => setRiskFilter("medium")}
              >
                Medium Risk
              </button>
              <button
                className={`px-5 py-2 rounded-full font-semibold transition text-sm focus:outline-none focus:ring-2 focus:ring-green-300
                  ${
                    riskFilter === "low"
                      ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg scale-105 ring-2 ring-green-200"
                      : "bg-white/60 text-green-700 hover:bg-green-100/60 hover:shadow-md hover:scale-105"
                  }
                  backdrop-blur-[2px] border border-transparent`}
                style={{
                  boxShadow:
                    riskFilter === "low"
                      ? "0 4px 24px 0 rgba(34,197,94,0.10)"
                      : undefined,
                }}
                onClick={() => setRiskFilter("low")}
              >
                Low Risk
              </button>
            </div>
          </div>
          {}
          <div className="flex flex-wrap gap-8 justify-start py-6">
  {loadingProjects || loadingRiskData ? (
    <div className="w-full flex justify-center py-12">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>

        <p className="text-gray-500 font-medium">
          Loading projects...
        </p>

        <p className="text-sm text-gray-400">
          Please wait while project risk data is loading
        </p>
      </div>
    </div>
  ) : projectsError ? (
              <div className="text-red-500">{projectsError}</div>
            ) : projects.length === 0 ? (
              <div className="text-gray-400">No projects found.</div>
            ) : (
              (() => {
                const projectsWithRisk = projects.map((project: any) => {
                  const risk = projectRiskData[project.id] || "low";

                  const projectDefs = defects.filter(
                    (d) => d.projectId === project.id,
                  );
                  const highCount = projectDefs.filter(
                    (d) =>
                      d.severity?.toLowerCase() === "high" ||
                      d.severity?.toLowerCase() === "critical",
                  ).length;
                  const mediumCount = projectDefs.filter(
                    (d) => d.severity?.toLowerCase() === "medium",
                  ).length;
                  const lowCount = projectDefs.filter(
                    (d) => d.severity?.toLowerCase() === "low",
                  ).length;

                  return { ...project, risk, highCount, mediumCount, lowCount };
                });

                const riskOrder = { high: 0, medium: 1, low: 2 };
                const sortedProjects = projectsWithRisk.sort(
                  (a, b) => riskOrder[a.risk] - riskOrder[b.risk],
                );

                const filtered =
                  riskFilter === "all"
                    ? sortedProjects
                    : sortedProjects.filter((p) => p.risk === riskFilter);

                return filtered.map((project, idx) => (
                  <div
                    key={project.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    <ProjectCard
                      name={
                        project.name || project.projectName || "Unnamed Project"
                      }
                      risk={project.risk}
                      defectCounts={{
                        high: project.highCount,
                        medium: project.mediumCount,
                        low: project.lowCount,
                      }}
                      onClick={() => setSelectedProjectId(project.id)}
                      size="small"
                      customBgClass={getProjectCardColor(
                        project.id,
                        project.risk,
                      )}
                      riskLabel={
                        project.risk === "high"
                          ? "High Risk"
                          : project.risk === "medium"
                            ? "Medium Risk"
                            : "Low Risk"
                      }
                    />
                  </div>
                ));
              })()
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>
        {`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
      <div className="max-w-6xl mx-auto px-4 pt-8">
        {}
        {selectedProject && (
          <div className="flex justify-end mb-4">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold shadow-sm border border-gray-200 transition"
              onClick={() => {
                setSelectedProjectId(null);
              }}
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>
          </div>
        )}
        {}
        <div className="mb-6">
          <ProjectSelector
            projects={projects}
            selectedProjectId={selectedProjectId || ""}
            onSelect={(id: string) => setSelectedProjectId(id)}
          />
        </div>
        {}
        {selectedProject && (
          <div
            className="bg-white rounded-2xl border border-gray-200 flex items-center justify-between px-8 py-4 mb-12"
            style={{ minHeight: "80px" }}
          >
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {selectedProject.name ||
                  selectedProject.projectName ||
                  "Unnamed Project"}
              </div>
            </div>
            <div className="flex flex-col items-end">
              {selectedProjectRiskLabel && (
                <span
                  className={
                    selectedProjectRiskLabel === "High Risk"
                      ? "bg-red-100 text-red-700 rounded-full px-4 py-1 text-sm font-semibold"
                      : selectedProjectRiskLabel === "Medium Risk"
                        ? "bg-yellow-100 text-yellow-800 rounded-full px-4 py-1 text-sm font-semibold"
                        : selectedProjectRiskLabel === "Low Risk"
                          ? "bg-green-100 text-green-800 rounded-full px-4 py-1 text-sm font-semibold"
                          : "bg-gray-100 text-gray-500 rounded-full px-4 py-1 text-sm font-semibold"
                  }
                >
                  {selectedProjectRiskLabel}
                </span>
              )}
              {!selectedProjectRiskLabel && (
                <span className="bg-gray-100 text-gray-500 rounded-full px-4 py-1 text-sm font-semibold">
                  NO RISK
                </span>
              )}
            </div>
          </div>
        )}
        {}
        <div className="mb-14">
          <div className="flex items-center mb-3 gap-4">
            <h2 className="text-lg font-semibold text-gray-600">
              Defect Severity Breakdown
            </h2>
            {}
            {defectSeveritySummary && (
              <div className="flex items-center gap-3">
                <span
                  className="text-base font-bold text-blue-500 border border-blue-400 rounded-lg px-3 py-1 bg-blue-50 shadow-sm"
                  style={{ boxShadow: "0 1px 4px 0 rgba(59,130,246,0.07)" }}
                >
                  Total Remark : {defectSeveritySummary.Remark || 0}
                </span>
                <span
                  className="text-base font-bold text-red-500 border border-red-400 rounded-lg px-3 py-1 bg-red-50 shadow-sm"
                  style={{ boxShadow: "0 1px 4px 0 rgba(239,68,68,0.07)" }}
                >
                  Total Defect : {defectSeveritySummary.TotalDefect || 0}
                </span>
              </div>
            )}
          </div>
          {(loadingSeveritySummary ||
            loadingStatusTypes ||
            loadingSeverities) && (
            <div className="text-gray-500 p-4">Loading...</div>
          )}
          {(severitySummaryError || statusTypesError || severitiesError) && (
            <div className="text-red-500 p-4">
              {severitySummaryError || statusTypesError || severitiesError}
            </div>
          )}
          {!loadingSeveritySummary &&
            !loadingStatusTypes &&
            !severitySummaryError &&
            !statusTypesError &&
            defectSeveritySummary &&
            statusTypes.length > 0 && (
              <div className="relative flex items-center">
                <button
                  onClick={() => {
                    const container =
                      document.getElementById("severity-scroll");
                    if (container) container.scrollLeft -= 300;
                  }}
                  className="flex-shrink-0 z-10 bg-white shadow-md rounded-full p-1 hover:bg-gray-50 mr-2"
                  type="button"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div
                  id="severity-scroll"
                  className="flex space-x-6 overflow-x-auto pb-2 scroll-smooth flex-1 scrollbar-hide"
                  style={{
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    maxWidth: "100%",
                  }}
                >
                  {(() => {
                    const severityKeys = Object.keys(
                      defectSeveritySummary,
                    ).filter((key) => {
                      const v = defectSeveritySummary[key];
                      return v && typeof v === "object" && "statusCounts" in v;
                    });
                    const severityOrder: Record<string, number> = {
                      critical: 3,
                      high: 2,
                      medium: 1,
                      low: 0,
                    };
                    severityKeys.sort(
                      (a, b) =>
                        (severityOrder[b] ?? -1) - (severityOrder[a] ?? -1),
                    );
                    return severityKeys.map((severity) => {
                      const severityLabel = `Defects on ${severity.charAt(0).toUpperCase() + severity.slice(1)}`;
                      const summary = defectSeveritySummary[severity] || {
                        statusCounts: {},
                        total: 0,
                      };
                      const severityData =
                        severities.length > 0
                          ? severities.find(
                              (s: any) =>
                                (s?.name || s?.severityName || "").toLowerCase() === severity,
                            )
                          : undefined;
                      const severityColor =
                        severityData?.color ||
                        summary.severityColor ||
                        "#6B7280";
                      const hexColor = severityColor.startsWith("#")
                        ? severityColor
                        : `#${severityColor}`;

                  const statusList = statusTypes
                    .filter((s) => s.defectStatusName)
                    .map((s) => s.defectStatusName.toLowerCase());

                      const statusColorMap: Record<string, string> =
                        Object.fromEntries(
                          statusTypes
                            .filter((s) => s.defectStatusName)
                            .map((s) => [
                              s.defectStatusName.toLowerCase(),
                              s.colorCode,
                            ]),
                        );
                      const statusCounts = statusList.map(
                        (status) => summary.statusCounts?.[status] || 0,
                      );

                      const validStatusTypes = statusTypes.filter(
                        (s) => s.defectStatusName,
                      );
                      const half = Math.ceil(statusList.length / 2);
                      const leftStatuses = statusList.slice(0, half);
                      const rightStatuses = statusList.slice(half);
                      return (
                        <div
                          key={severity}
                          className={`bg-white rounded-xl shadow flex flex-col justify-between min-h-[200px] min-w-[300px] border border-gray-200 border-l-8`}
                          style={{ borderLeftColor: hexColor }}
                        >
                          <div className="px-6 pt-4 pb-1">
                            <div className="flex items-center justify-between mb-2">
                              <span
                                className="font-semibold text-base"
                                style={{ color: hexColor }}
                              >
                                {severityLabel}
                              </span>
                              <span className="font-semibold text-gray-600 text-base"></span>
                            </div>
                            {}
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
                                Total Defect: {summary.validDefects || 0}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-row gap-8 px-6 pb-1">
                            <div className="flex flex-col gap-1">
                              {leftStatuses.map((status, idx) => (
                                <div
                                  key={status}
                                  className="flex items-center gap-2 text-xs"
                                >
                                  <span
                                    className="inline-block w-2.5 h-2.5 rounded-full"
                                    style={{
                                      backgroundColor: statusColorMap[status],
                                    }}
                                  ></span>
                                  <span className="text-gray-700 font-normal">
                                    {validStatusTypes[idx]?.defectStatusName ||
                                      "Unknown"}
                                  </span>
                                  <span className="text-gray-700 font-medium">
                                    {statusCounts[idx]}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="flex flex-col gap-1">
                              {rightStatuses.map((status, idx) => (
                                <div
                                  key={status}
                                  className="flex items-center gap-2 text-xs"
                                >
                                  <span
                                    className="inline-block w-2.5 h-2.5 rounded-full"
                                    style={{
                                      backgroundColor: statusColorMap[status],
                                    }}
                                  ></span>
                                  <span className="text-gray-700 font-normal">
                                    {validStatusTypes[half + idx]
                                      ?.defectStatusName || "Unknown"}
                                  </span>
                                  <span className="text-gray-700 font-medium">
                                    {statusCounts[half + idx]}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="px-6 pb-3">
                            <button
                              className="mt-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-md font-medium text-xs border border-blue-100 hover:bg-blue-100 transition"
                              onClick={() =>
                                setPieModal({ open: true, severity })
                              }
                            >
                              View Chart
                            </button>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
                <button
                  onClick={() => {
                    const container =
                      document.getElementById("severity-scroll");
                    if (container) container.scrollLeft += 300;
                  }}
                  className="flex-shrink-0 z-10 bg-white shadow-md rounded-full p-1 hover:bg-gray-50 ml-2"
                  type="button"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            )}
        </div>
        {}
        {pieModal.open &&
          pieModal.severity &&
          (() => {
            const severity = pieModal.severity;

            const statusList = statusTypes.map((s) =>
              (s.defectStatusName || "").toLowerCase(),
            );
            const statusColorMap = Object.fromEntries(
              statusTypes.map((s) => [
                (s.defectStatusName || "").toLowerCase(),
                s.colorCode,
              ]),
            );
            const summary = defectSeveritySummary[severity] || {
              statusCounts: {},
              total: 0,
            };
            const statusCounts = statusList.map(
              (status) => summary.statusCounts?.[status] || 0,
            );
            const pieData = {
              labels: statusList.map((s) => s.toUpperCase()),
              datasets: [
                {
                  data: statusCounts,
                  backgroundColor: statusList.map(
                    (s) => statusColorMap[s] || "#ccc",
                  ),
                },
              ],
            };
            return (
              <Modal
                isOpen={pieModal.open}
                onClose={() => setPieModal({ open: false, severity: null })}
                title={`Status Breakdown for ${severity.charAt(0).toUpperCase() + severity.slice(1)}`}
              >
                <div className="flex flex-col items-center justify-center p-4">
                  <div className="w-64 h-64">
                    <ChartJSPie
                      data={pieData}
                      options={{
                        plugins: {
                          legend: { display: true, position: "bottom" },
                        },
                      }}
                    />
                  </div>
                </div>
              </Modal>
            );
          })()}
      </div>
      {}
      <div className="mb-14 grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {}
        <div className="bg-white rounded-xl shadow flex flex-col p-6 h-full border border-gray-200">
          <h2 className="text-lg font-semibold mb-3 text-gray-700">
            Defect Density
          </h2>
          <div className="flex-1 flex flex-col justify-center">
            {loadingDefectDensity ? (
              <div className="text-gray-500">Loading...</div>
            ) : defectDensityError ? (
              <div className="text-red-500">{defectDensityError}</div>
            ) : defectDensity ? (
              <DefectDensityMeter
                kloc={defectDensity.kloc}
                defectCount={defectDensity.totalDefects}
                defectDensity={defectDensity.defectDensity}
                klocInput={klocInput}
                onKlocInputChange={(value) => {
                  setKlocInput(value);
                  setKlocChanged(true);
                }}
                onKlocUpdate={handleKlocInputChange}
                onCalculateClick={() => setShowKlocModal(true)}
                klocChanged={klocChanged}
                canEdit={true}
              />
            ) : null}
          </div>
        </div>
        {}
        {showKlocModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
              {}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  Calculate KLOC from GitHub
                </h2>
                <button
                  className="text-gray-400 hover:text-gray-600 transition"
                  onClick={() => {
                    setShowKlocModal(false);
                    setKlocModalError(null);
                  }}
                  //className="flex-shrink-0 z-10 bg-white shadow-md rounded-full p-1 hover:bg-gray-50 mr-2"
                  type="button"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {}
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Backend Repo URL
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="https://github.com/org/backend-repo.git"
                    value={klocModalForm.backendRepo}
                    onChange={(e) =>
                      setKlocModalForm((p) => ({
                        ...p,
                        backendRepo: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Frontend Repo URL
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="https://github.com/org/frontend-repo.git"
                    value={klocModalForm.frontendRepo}
                    onChange={(e) =>
                      setKlocModalForm((p) => ({
                        ...p,
                        frontendRepo: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    GitHub Username
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="your-github-username"
                    value={klocModalForm.githubUsername}
                    onChange={(e) =>
                      setKlocModalForm((p) => ({
                        ...p,
                        githubUsername: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    GitHub Token
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="ghp_xxxxxxxxxxxx"
                    value={klocModalForm.githubToken}
                    onChange={(e) =>
                      setKlocModalForm((p) => ({
                        ...p,
                        githubToken: e.target.value,
                      }))
                    }
                  />
                </div>

                {}
                {klocModalError && (
                  <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {klocModalError}
                  </div>
                )}
              </div>

              {}
              <div className="flex gap-3 mt-6 justify-end">
                <button
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium transition"
                  onClick={() => {
                    setShowKlocModal(false);
                    setKlocModalError(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold transition disabled:opacity-50"
                  onClick={handleCalculateKloc}
                  disabled={calculatingKloc}
                >
                  {calculatingKloc ? "Calculating..." : "Calculate"}
                </button>
              </div>
            </div>
          </div>
        )}
        {}
        <div className="bg-white rounded-xl shadow flex flex-col p-6 h-full border border-gray-200">
          <h2 className="text-lg font-semibold mb-3 text-gray-700">
            Defect Severity Index
          </h2>
          <div className="flex-1 flex flex-col items-center justify-center">
            {loadingDsi ? (
              <span className="text-gray-400">Loading...</span>
            ) : dsiError ? (
              <span className="text-red-500">{dsiError}</span>
            ) : (
              (() => {
                const dsiValue =
                  typeof dsi === "string"
                    ? parseFloat(dsi)
                    : typeof dsi === "number"
                      ? dsi
                      : 0;
                const statusText = dsiStatus || "Healthy";

                let barColor = "#22c55e";
                let numberColor = "text-green-600";
                let badgeBg = "#22c55e20";
                let badgeBorder = "#22c55e40";

                switch (statusText) {
                  case "Critical":
                    barColor = "#b91c1c";
                    numberColor = "text-red-800";
                    badgeBg = "#b91c1c20";
                    badgeBorder = "#b91c1c40";
                    break;
                  case "High Risk":
                    barColor = "#ef4444";
                    numberColor = "text-red-600";
                    badgeBg = "#ef444420";
                    badgeBorder = "#ef444440";
                    break;
                  case "Needs Attention":
                    barColor = "#f59e0b";
                    numberColor = "text-amber-600";
                    badgeBg = "#f59e0b20";
                    badgeBorder = "#f59e0b40";
                    break;
                  default:
                    barColor = "#22c55e";
                    numberColor = "text-green-600";
                    badgeBg = "#22c55e20";
                    badgeBorder = "#22c55e40";
                    break;
                }

                const maxWeight = 4;
                const maxBarHeight = 120;
                const cappedDsi = Math.max(1, Math.min(dsiValue, maxWeight));
                const barHeight =
                  ((cappedDsi - 1) / (maxWeight - 1)) * maxBarHeight;

                return (
                  <div className="flex flex-col items-center w-full">
                    <div
                      className="flex flex-row items-end justify-center gap-6 w-full"
                      style={{ minHeight: maxBarHeight + 20 }}
                    >
                      <div
                        className="flex flex-col items-center justify-end h-full"
                        style={{ height: maxBarHeight }}
                      >
                        <div
                          style={{
                            width: "28px",
                            height: `${maxBarHeight}px`,
                            background: "#f3f4f6",
                            borderRadius: "16px",
                            position: "relative",
                            display: "flex",
                            alignItems: "flex-end",
                            boxShadow: "0 2px 8px 0 rgba(30,41,59,0.07)",
                          }}
                        >
                          <div
                            style={{
                              width: "100%",
                              height: `${barHeight}px`,
                              background: barColor,
                              borderRadius: "16px",
                              position: "absolute",
                              bottom: 0,
                              left: 0,
                              transition:
                                "height 0.7s cubic-bezier(0.4,0,0.2,1)",
                            }}
                          />
                          <div
                            style={{
                              position: "absolute",
                              left: "100%",
                              top: 0,
                              height: "100%",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                              marginLeft: "6px",
                              fontSize: "12px",
                              color: "#64748b",
                              fontWeight: 500,
                              pointerEvents: "none",
                            }}
                          >
                            <span>4</span>
                            <span>3</span>
                            <span>2</span>
                            <span>1</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-center justify-center ml-2">
                        <span
                          className={`text-4xl font-bold mb-1 ${numberColor}`}
                        >
                          {isNaN(dsiValue) ? "0.00" : dsiValue.toFixed(2)}
                        </span>
                        <span
                          className="text-xs font-semibold px-3 py-1 rounded-full"
                          style={{
                            backgroundColor: badgeBg,
                            color: barColor,
                            border: `1px solid ${badgeBorder}`,
                          }}
                        >
                          {statusText}
                        </span>
                        <span className="text-gray-700 text-center text-sm mt-2">
                          Weighted severity score (higher = more severe defects)
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>
        {}
        <div className="bg-white rounded-xl shadow flex flex-col p-6 h-full border border-gray-200">
          <h2 className="text-lg font-semibold mb-3 text-gray-700">
            Defect to Remark Ratio
          </h2>
          <div className="flex-1 flex flex-col items-center justify-center">
            {loadingRemarkRatio ? (
              <span className="text-gray-500">Loading...</span>
            ) : remarkRatioError ? (
              <span className="text-red-500">{remarkRatioError}</span>
            ) : remarkRatioData ? (
              <DefectToRemarkRatio
                ratio={remarkRatioData.ratio}
                category={remarkRatioData.category}
                color={remarkRatioData.color}
              />
            ) : (
              <span className="text-gray-400">No data available.</span>
            )}
          </div>
        </div>
      </div>
      {}
      <div className="mb-14 flex flex-col md:flex-row gap-8 items-stretch">
        {}
        <div className="flex-1 bg-white rounded-2xl shadow p-6 flex flex-col relative">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">
            Defects Reopened Multiple Times
          </h2>
          {loadingReopenSummary ? (
            <div className="text-gray-500">Loading...</div>
          ) : reopenSummaryError ? (
            <div className="text-red-500">{reopenSummaryError}</div>
          ) : reopenSummary && reopenSummary.length > 0 && reopenSummary.some((item) => item.count > 0) ? (
            (() => {
              const labels = reopenSummary.map((item) => item.label);
              const data = {
                labels,
                datasets: [
                  {
                    data: reopenSummary.map((item) => item.count),
                    backgroundColor: [
                      "#4285F4",
                      "#FBBC05",
                      "#EA4335",
                      "#C5221F",
                      "#F29900",
                      "#00B894",
                      "#A259F7",
                      "#00B8D9",
                      "#FF6F00",
                      "#8E24AA",
                    ].slice(0, reopenSummary.length),
                  },
                ],
              };
              const total = reopenSummary.reduce(
                (a, b) => a + (b.count || 0),
                0,
              );
              return (
                <>
                  <div className="w-64 h-64 relative">
                    <ChartJSPie
                      data={data}
                      options={{
                        plugins: { legend: { display: false } },
                        onHover: (_, elements) => {
                          if (elements.length > 0) {
                            const elementIndex = elements[0].index;
                            const label = labels[elementIndex];
                            const filteredDefects =
                              getDefectsByReopenCount(label);
                            setHoveredReopenSegment({
                              label,
                              defects: filteredDefects,
                            });
                          } else {
                            setHoveredReopenSegment(null);
                          }
                        },
                        interaction: {
                          intersect: false,
                          mode: "nearest",
                        },
                      }}
                    />
                    {}
                    {hoveredReopenSegment &&
                      hoveredReopenSegment.defects.length > 0 && (
                        <div className="absolute top-0 left-full ml-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10 min-w-[150px]">
                          <h4 className="font-semibold text-gray-800 mb-2">
                            {hoveredReopenSegment.label}
                          </h4>
                          <div className="max-h-48 overflow-y-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-gray-200">
                                  <th className="text-left py-1 px-2 font-medium text-gray-600">
                                    Defect ID
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {hoveredReopenSegment.defects
                                  .slice(0, 10)
                                  .map((defect, idx) => (
                                    <tr
                                      key={defect.id}
                                      className={
                                        idx % 2 === 0
                                          ? "bg-gray-50"
                                          : "bg-white"
                                      }
                                    >
                                      <td className="py-1 px-2 text-gray-800">
                                        {defect.defectId}
                                      </td>
                                    </tr>
                                  ))}
                                {hoveredReopenSegment.defects.length > 10 && (
                                  <tr>
                                    <td
                                      colSpan={2}
                                      className="py-1 px-2 text-gray-500 text-center"
                                    >
                                      +
                                      {hoveredReopenSegment.defects.length - 10}{" "}
                                      more defects
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                  </div>
                  <div className="mt-6 grid grid-cols-1 gap-1 text-sm">
                    {reopenSummary.map((item, idx) => (
                      <div key={item.label} className="flex items-center gap-2">
                        <span
                          className="inline-block w-3 h-3 rounded-full"
                          style={{
                            backgroundColor:
                              data.datasets[0].backgroundColor[idx],
                          }}
                        ></span>
                        <span className="text-gray-700">
                          {item.label}:{" "}
                          <span className="font-semibold">{item.count}</span>{" "}
                          <span className="text-gray-500">
                            (
                            {total > 0
                              ? ((item.count / total) * 100).toFixed(1)
                              : 0}
                            %)
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()
          ) : (
            <div className="text-gray-400">No data available.</div>
          )}
        </div>
        {}
        <div className="flex-1 bg-white rounded-2xl shadow p-6 flex flex-col">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">
            Defect Distribution by Type
          </h2>
          {loadingDefectType && (
            <div className="text-gray-500 p-4">Loading...</div>
          )}
          {(severitySummaryError || statusTypesError || severitiesError) && (
            <div className="text-red-500 p-4">
              {severitySummaryError || statusTypesError || severitiesError}
            </div>
          )}
          {!loadingDefectType &&
          !defectTypeError &&
          defectTypeData &&
          Array.isArray(defectTypeData.labels) &&
          Array.isArray(defectTypeData.counts) &&
          defectTypeData.labels.length === defectTypeData.counts.length &&
          defectTypeData.labels.length > 0
            ? (() => {
                const labels = defectTypeData.labels;
                const counts = defectTypeData.counts;
                const percentages =
                  defectTypeData.percentages ||
                  counts.map((c) => {
                    const total = counts.reduce((a, b) => a + b, 0);
                    return total > 0 ? (c / total) * 100 : 0;
                  });
                const data = {
                  labels,
                  datasets: [
                    {
                      data: counts,
                      backgroundColor: [
                        "#4285F4",
                        "#00B894",
                        "#FBBC05",
                        "#EA4335",
                        "#A259F7",
                        "#FF6F00",
                        "#8E24AA",
                        "#43A047",
                        "#F4511E",
                      ].slice(0, labels.length),
                    },
                  ],
                };
                const total =
                  defectTypeData.total || counts.reduce((a, b) => a + b, 0);
                const mostCommon =
                  defectTypeData.mostCommon ||
                  (() => {
                    let idx = 0,
                      max = 0;
                    counts.forEach((c, i) => {
                      if (c > max) {
                        max = c;
                        idx = i;
                      }
                    });
                    return labels[idx];
                  })();
                const mostCount =
                  defectTypeData.mostCount || Math.max(...counts);
                return (
                  <>
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-64 h-64">
                        <ChartJSPie
                          data={data}
                          options={{ plugins: { legend: { display: false } } }}
                        />
                      </div>
                      <div className="mt-6 grid grid-cols-1 gap-1 text-sm">
                        {labels.map((type, idx) => (
                          <div key={type} className="flex items-center gap-2">
                            <span
                              className="inline-block w-3 h-3 rounded-full"
                              style={{
                                backgroundColor:
                                  data.datasets[0].backgroundColor[idx],
                              }}
                            ></span>
                            <span className="text-gray-700">
                              {type}:{" "}
                              <span className="font-semibold">
                                {counts[idx]}
                              </span>{" "}
                              <span className="text-gray-500">
                                ({percentages[idx]?.toFixed(1)}%)
                              </span>
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-6 flex justify-between w-full max-w-xs mx-auto border-t pt-4">
                        <div className="flex flex-col items-center">
                          <span className="text-2xl font-bold text-gray-900">
                            {total}
                          </span>
                          <span className="text-xs text-gray-500">
                            Total Defects
                          </span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-2xl font-bold text-blue-600">
                            {mostCount}
                          </span>
                          <span className="text-xs text-gray-500">
                            Most Common
                          </span>
                          <span className="text-xs text-gray-700 font-semibold">
                            {mostCommon}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()
            : null}
          {!loadingDefectType &&
            !defectTypeError &&
            defectTypeData &&
            (!Array.isArray(defectTypeData.labels) ||
              !Array.isArray(defectTypeData.counts) ||
              defectTypeData.labels.length !== defectTypeData.counts.length ||
              defectTypeData.labels.length === 0) && (
              <div className="text-gray-400 p-4">
                No defect type data available.
              </div>
            )}
        </div>
      </div>

      {}
      <div className="mb-14 flex flex-col gap-4">
        {}
        {selectedProjectId && (
          <div className="flex items-center gap-3 mb-2">
            <label
              htmlFor="release-select"
              className="font-medium text-gray-700"
            >
              Release:
            </label>
<select
  value={selectedRelease?.releaseId === 0 ? "" : String(selectedRelease?.releaseId ?? "")}
  onChange={(e) => {
    const selectedValue = e.target.value;

    // All Releases
    if (selectedValue === "") {
      setSelectedRelease({
        releaseId: 0,
        releaseName: "All Releases",
      });
      return;
    }

    // Specific Release
    const selected = releases.find(
      (r) => String(r.releaseId ?? r.id) === selectedValue
    );

    if (selected) {
      setSelectedRelease({
        releaseId: Number(selected.releaseId ?? selected.id),
        releaseName: selected.releaseName,
      });
    }
  }}
  disabled={loadingReleases || releases.length === 0}
>
  <option value="">All Releases</option>

  {releases.map((r) => (
    <option
      key={r.releaseId ?? r.id}
      value={String(r.releaseId ?? r.id)}
    >
      {r.releaseName}
    </option>
  ))}
</select>
            {loadingReleases && (
              <span className="ml-2 text-gray-400 text-sm">Loading...</span>
            )}
            {releasesError && (
              <span className="ml-2 text-red-500 text-sm">{releasesError}</span>
            )}
          </div>
        )}
        <div className="flex flex-col md:flex-row gap-8 items-stretch">
          {}
          <div className="flex-1 bg-white rounded-2xl shadow p-6 flex flex-col">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">
              Time to Find Defects
            </h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={(() => {
              if (
                    selectedProjectId &&
                    selectedRelease &&
                    releaseDailyDefects &&
                    releaseDailyDefects.length > 0
                 ) {
                      const maxDay = Math.max(
                        ...releaseDailyDefects.map((d) => d.dayNumber),
                      );
                      const days = Array.from(
                        { length: maxDay },
                        (_, i) => `Day ${i + 1}`,
                      );
                      const defectCounts = Array(maxDay).fill(0);
                      releaseDailyDefects.forEach((d) => {
                        if (d.dayNumber >= 1 && d.dayNumber <= maxDay) {
                          defectCounts[d.dayNumber - 1] = d.totalDefects;
                        }
                      });
                      return days.map((day, i) => ({
                        day,
                        defects: defectCounts[i],
                      }));
                    }

                    if (!selectedRelease?.releaseName) {
                      return Array.from({ length: 7 }, (_, i) => ({
                        day: `Day ${i + 1}`,
                        defects: 0,
                      }));
                    }
                    const days = Array.from(
                      { length: 7 },
                      (_, i) => `Day ${i + 1}`,
                    );
                    const dateCounts: number[] = Array(7).fill(0);
                    filteredDefects.forEach((d) => {
                      if (d.createdAt) {
                        const createdDate = new Date(d.createdAt);
                        const dayIdx = createdDate.getDate() - 1;
                        if (dayIdx >= 0 && dayIdx < 7) {
                          dateCounts[dayIdx]++;
                        }
                      }
                    });
                    return days.map((day, i) => ({
                      day,
                      defects: dateCounts[i],
                    }));
                  })()}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="day"
                    label={{
                      value: "Day",
                      position: "insideBottom",
                      offset: -5,
                    }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickCount={5}
                    interval={0}
                    domain={[0, "auto"]}
                    tickFormatter={(v) => v}
                    ticks={[0, 2, 4, 6, 8, 10, 12, 14]}
                    label={{
                      value: "Defects Count",
                      angle: -90,
                      position: "insideLeft",
                      offset: 10,
                    }}
                  />
                  <Tooltip formatter={(v) => `${v} defects`} />
                  <Line
                    type="monotone"
                    dataKey="defects"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{
                      r: 5,
                      stroke: "#2563eb",
                      strokeWidth: 2,
                      fill: "#fff",
                    }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              {loadingReleaseDailyDefects && (
                <div className="text-gray-400 text-center mt-2">
                  Loading time to find data...
                </div>
              )}
              {!loadingReleaseDailyDefects &&
                (!releaseDailyDefects || releaseDailyDefects.length === 0) && (
                  <div className="text-gray-400 text-center mt-2">
                    No time to find data available for selected release
                  </div>
                )}
            </div>
          </div>
          {}
          <div className="flex-1 bg-white rounded-2xl shadow p-6 flex flex-col">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">
              Time to Fix Defects
            </h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={(() => {
                    if (
                      selectedProjectId &&
                      selectedRelease?.releaseId &&
                      releaseDailyFixedDefects &&
                      releaseDailyFixedDefects.length > 0
                    ) {
                      const maxDay = Math.max(
                        ...releaseDailyFixedDefects.map((d) => d.dayNumber),
                      );
                      const days = Array.from(
                        { length: maxDay },
                        (_, i) => `Day ${i + 1}`,
                      );
                      const fixedCounts = Array(maxDay).fill(0);
                      releaseDailyFixedDefects.forEach((d) => {
                        if (d.dayNumber >= 1 && d.dayNumber <= maxDay) {
                          fixedCounts[d.dayNumber - 1] = d.defectFixedCount;
                        }
                      });
                      return days.map((day, i) => ({
                        day,
                        defects: fixedCounts[i],
                      }));
                    }

                    return Array.from({ length: 7 }, (_, i) => ({
                      day: `Day ${i + 1}`,
                      defects: 0,
                    }));

                    if (
                      selectedProjectId &&
                      selectedRelease?.releaseId &&
                      releaseDailyFixedDefects &&
                      releaseDailyFixedDefects.length > 0
                    ) {
                      const days = Array.from(
                        { length: 7 },
                        (_, i) => `Day ${i + 1}`,
                      );
                      const fixedCounts = Array(7).fill(0);
                      releaseDailyFixedDefects.forEach((d) => {
                        if (d.dayNumber >= 1 && d.dayNumber <= 7) {
                          fixedCounts[d.dayNumber - 1] = d.defectFixedCount;
                        }
                      });
                      const chartData = days.map((day, i) => ({
                        day,
                        defects: fixedCounts[i],
                      }));

                      return chartData;
                    }

                    if (!selectedRelease?.releaseId) {
                      return Array.from({ length: 7 }, (_, i) => ({
                        day: `Day ${i + 1}`,
                        defects: 0,
                      }));
                    }

                    const days = Array.from(
                      { length: 7 },
                      (_, i) => `Day ${i + 1}`,
                    );
                    const fixTimes: number[][] = Array(7)
                      .fill(null)
                      .map(() => []);

                    const releaseFilteredDefects =
                      selectedProjectId && selectedRelease?.releaseId
                        ? defects.filter(
                            (d) =>
                              d.projectId === selectedProjectId &&
                              Number(d.releaseId ?? 0) ===
                                Number(selectedRelease.releaseId),
                          )
                        : [];

                    releaseFilteredDefects.forEach((d) => {
                      if (
                        d.createdAt &&
                        d.updatedAt &&
                        d.updatedAt > d.createdAt
                      ) {
                        const createdDate = new Date(d.createdAt);
                        const dayIdx = createdDate.getDate() - 1;
                        if (dayIdx >= 0 && dayIdx < 7) {
                          const daysToFix = Math.ceil(
                            (new Date(d.updatedAt).getTime() -
                              new Date(d.createdAt).getTime()) /
                              (1000 * 60 * 60 * 24),
                          );
                          fixTimes[dayIdx].push(daysToFix);
                        }
                      }
                    });
                    const fallbackData = days.map((day, i) => ({
                      day,
                      defects:
                        fixTimes[i].length > 0
                          ? fixTimes[i].reduce((a, b) => a + b, 0) /
                            fixTimes[i].length
                          : 0,
                    }));

                    return fallbackData;
                  })()}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="day"
                    label={{
                      value: "Day",
                      position: "insideBottom",
                      offset: -5,
                    }}
                  />
                  <YAxis
                    allowDecimals={true}
                    tickCount={5}
                    interval={0}
                    domain={[0, "auto"]}
                    tickFormatter={(v) => v}
                    label={{
                      value: "Defects Fixed",
                      angle: -90,
                      position: "insideLeft",
                      offset: 10,
                    }}
                  />
                  <Tooltip formatter={(v) => `${v} defects`} />
                  <Line
                    type="monotone"
                    dataKey="defects"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{
                      r: 5,
                      stroke: "#10b981",
                      strokeWidth: 2,
                      fill: "#fff",
                    }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              {loadingReleaseDailyFixedDefects && (
                <div className="text-gray-400 text-center mt-2">
                  Loading time to fix data...
                </div>
              )}
              {!loadingReleaseDailyFixedDefects &&
                (!releaseDailyFixedDefects ||
                  releaseDailyFixedDefects.length === 0) && (
                  <div className="text-gray-400 text-center mt-2">
                    No time to fix data available for selected release
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-8 flex flex-col items-center mt-10">
        <h2 className="text-xl font-bold mb-6 text-center">
          Defects by Module
        </h2>
        {loadingDefectsByModule ? (
          <div className="text-gray-500">Loading...</div>
        ) : defectsByModuleError ? (
          <div className="text-red-500">{defectsByModuleError}</div>
        ) : defectsByModule && defectsByModule.length > 0 ? (
          <>
            <div className="w-72 h-72 mx-auto">
              <ChartJSPie
                data={{
                  labels: defectsByModule.map((m) => m.name),
                  datasets: [
                    {
                      data: defectsByModule.map((m) => m.value),
                      backgroundColor: [
                        "#4285F4",
                        "#00B894",
                        "#FBBC05",
                        "#EA4335",
                        "#A259F7",
                        "#00B8D9",
                        "#FF6F00",
                        "#8E24AA",
                        "#43A047",
                        "#F4511E",
                      ].slice(0, defectsByModule.length),
                    },
                  ],
                }}
                options={{ plugins: { legend: { display: false } } }}
              />
            </div>
            <div className="mt-8 w-full max-w-md mx-auto">
              <div className="space-y-2">
                {defectsByModule.map((item, idx) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between w-full"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span
                        className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: [
                            "#4285F4",
                            "#00B894",
                            "#FBBC05",
                            "#EA4335",
                            "#A259F7",
                            "#00B8D9",
                            "#FF6F00",
                            "#8E24AA",
                            "#43A047",
                            "#F4511E",
                          ][idx % 10],
                        }}
                      ></span>
                      <span className="text-gray-700 text-sm truncate">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-bold text-gray-900 text-sm min-w-[2rem] text-right">
                        {item.value}
                      </span>
                      <span className="text-gray-500 text-sm min-w-[3.5rem] text-right">
                        ({item.percentage?.toFixed(1) ?? 0}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-gray-400">No data available.</div>
        )}
      </div>
    </>
  );
};

export default Dashboard;

function DefectDensityMeter({
  kloc,
  defectCount,
  defectDensity,
  klocInput,
  onKlocInputChange,
  onKlocUpdate,
  onCalculateClick,
  klocChanged,
  canEdit = false,
}: {
  kloc: number;
  defectCount: number;
  defectDensity?: number;
  klocInput?: number;
  onKlocInputChange?: (value: number) => void;
  onKlocUpdate?: () => void;
  onCalculateClick?: () => void;
  klocChanged?: boolean;
  canEdit?: boolean;
}) {
  const density =
    typeof defectDensity === "number"
      ? defectDensity
      : kloc > 0
        ? defectCount / kloc
        : 0;

  const min = 0,
    max = 15;
  const cappedDensity = Math.max(min, Math.min(density, max));

  const angle = -90 + (cappedDensity / 15) * 180;
  const needleRef = useRef<SVGPolygonElement>(null);

  useEffect(() => {
    if (needleRef.current) {
      needleRef.current.style.transition =
        "transform 0.7s cubic-bezier(0.4,0,0.2,1)";
      needleRef.current.style.transform = `rotate(${angle}deg)`;
    }
  }, [angle]);

  const getZoneColor = (val: number) => {
    if (val <= 7) return "#22c55e";
    if (val <= 10) return "#facc15";
    return "#ef4444";
  };
  const zoneColor = getZoneColor(density);

  function describeArc(
    cx: number,
    cy: number,
    r: number,
    startValue: number,
    endValue: number,
  ) {
    const valueToAngle = (v: number) => -90 + (v / 15) * 180;
    const startAngle = valueToAngle(startValue);
    const endAngle = valueToAngle(endValue);
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M",
      start.x,
      start.y,
      "A",
      r,
      r,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
    ].join(" ");
  }
  function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
    const rad = ((angle - 90) * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  }

  const arcGreenStart = 0,
    arcGreenEnd = 7;
  const arcYellowStart = 7.1,
    arcYellowEnd = 10;
  const arcRedStart = 10.1,
    arcRedEnd = 15;

  const ticks = [0, 7, 10];
  const valueToAngle = (v: number) => -90 + (v / 15) * 180;
  const tickAngles = ticks.map(valueToAngle);
  const tickRadius = 80;
  const tickLabelRadius = 95;

  return (
    <div className="flex flex-col items-center">
      <div className="text-lg font-semibold mb-1 text-center">
        Defect Density:
        <span className="ml-2 font-extrabold" style={{ color: zoneColor }}>
          {isNaN(density) ? "0.00" : density.toFixed(2)}
        </span>
      </div>
      <div className="w-72 h-40 flex items-end justify-center relative">
        <svg viewBox="0 0 200 120" className="w-full h-full">
          {}
          <path
            d={describeArc(100, 100, 70, 0, 15)}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="18"
          />
          {}
          <path
            d={describeArc(100, 100, 70, arcGreenStart, arcGreenEnd)}
            fill="none"
            stroke="#22c55e"
            strokeWidth="14"
          />
          {}
          <path
            d={describeArc(100, 100, 70, arcYellowStart, arcYellowEnd)}
            fill="none"
            stroke="#facc15"
            strokeWidth="14"
          />
          {}
          <path
            d={describeArc(100, 100, 70, arcRedStart, arcRedEnd)}
            fill="none"
            stroke="#ef4444"
            strokeWidth="14"
          />
          {}
          <g
            style={{
              transform: "rotate(0deg)",
              transformOrigin: "100px 100px",
            }}
          >
            <polygon
              ref={needleRef}
              points="100,35 97,100 103,100"
              fill="#334155"
              style={{
                transform: `rotate(${angle}deg)`,
                transformOrigin: "100px 100px",
                transition: "transform 0.7s cubic-bezier(0.4,0,0.2,1)",
              }}
            />
          </g>
          {}
          <circle cx="100" cy="100" r="7" fill="#334155" />
          {}
          {ticks.map((tick, i) => {
            const a = tickAngles[i];
            const tickStart = polarToCartesian(100, 100, tickRadius, a);
            const tickEnd = polarToCartesian(100, 100, tickRadius + 8, a);
            const labelPos = polarToCartesian(100, 100, tickLabelRadius, a);
            return (
              <g key={tick}>
                <line
                  x1={tickStart.x}
                  y1={tickStart.y}
                  x2={tickEnd.x}
                  y2={tickEnd.y}
                  stroke="#64748b"
                  strokeWidth="2"
                />
                <text
                  x={labelPos.x}
                  y={labelPos.y + 5}
                  fontSize="13"
                  fill="#64748b"
                  textAnchor="middle"
                >
                  {tick}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {}
      {canEdit && (
        <div className="mt-4 flex items-center gap-2 justify-center">
          <label
            htmlFor="kloc-input-dashboard"
            className="text-sm text-gray-600 font-medium"
          >
            KLOC:
          </label>
          <input
            id="kloc-input-dashboard"
            type="number"
            min={0.1}
            step={0.1}
            className="w-20 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
            value={klocInput || kloc}
            onChange={(e) =>
              onKlocInputChange &&
              onKlocInputChange(Number(e.target.value) || 0.1)
            }
            style={{ minWidth: 60 }}
          />
          <button
            type="button"
            className={`ml-1 w-8 h-8 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition disabled:opacity-50`}
            onClick={onKlocUpdate}
            disabled={!klocInput || !klocChanged}
            title="Update KLOC value"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </button>
          <button
            type="button"
            className="px-4 py-1.5 rounded-lg bg-blue-50 border border-blue-300 text-blue-700 text-sm font-semibold hover:bg-blue-100 transition"
            onClick={onCalculateClick}
          >
            Calculate KLOC
          </button>
        </div>
      )}
    </div>
  );
}
