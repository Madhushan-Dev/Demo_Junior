import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import { PermissionProvider } from "./context/PermissionContext";

import { Layout } from "./components/layout/Layout";
import ProjectAccessGuard from "./components/auth/ProjectAccessGuard";
import PermissionRouteGuard from "./components/auth/PermissionRouteGuard";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Employees } from "./pages/Employees";
import { Bench } from "./pages/Bench";
import { Projects } from "./pages/Projects";
import { Defects } from "./pages/Defects";
import { TestCase } from "./pages/TestCase";
import { TestExecution } from "./pages/TestExecution";
import { ModuleManagement } from "./pages/ModuleManagement";
import { ProjectManagement } from "./pages/ProjectManagement";
import ProjectAllocationHistory from "./pages/projectAllocationHistory";
import { Releases } from "./pages/release";
import { Allocation } from "./pages/allocation";
import { ReleaseView } from "./pages/ReleaseView";
import Configurations from "./pages/Configurations";
import Designation from "./pages/Designation";
import Role from "./pages/Role";
import DefectType from "./pages/DefectType";
import Privileges from "./pages/Privileges";
import EmailConfiguration from "./pages/EmailConfiguration";
import ReleaseType from "./pages/ReleaseType";
import Severity from "./pages/Severity";
import Priority from "./pages/Priority";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import StatusWorkflow from "./pages/StatusWorkflow";
import StatusType from "./pages/StatusType";
import BenchAllocate from "./pages/BenchAllocate";
import Status from "./pages/Status";
import ReleaseDetails from "./pages/ReleaseDetails";
import { AccessDenied } from "./pages/AccessDenied";
import { NotFound } from "./pages/NotFound";


const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  noLayout?: boolean;
}> = ({ children, noLayout }) => {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            Loading DefectTracker Pro...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    sessionStorage.setItem(
      "redirectUrl",
      window.location.pathname + window.location.search,
    );

    return <Navigate to="/login" replace />;
  }

  if (noLayout) return <>{children}</>;

  return <Layout>{children}</Layout>;
};

const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employees"
          element={
            <ProtectedRoute>
              <PermissionRouteGuard permission="Employee_READ">
                <Employees />
              </PermissionRouteGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/bench"
          element={
            <ProtectedRoute>
              <PermissionRouteGuard permission="Bench_READ">
                <Bench />
              </PermissionRouteGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <PermissionRouteGuard permission="Project_READ">
                <Projects />
              </PermissionRouteGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects/:projectId/test-cases"
          element={
            <ProtectedRoute>
              <PermissionRouteGuard permission="Test_Case_READ">
                <ProjectAccessGuard>
                  <TestCase />
                </ProjectAccessGuard>
              </PermissionRouteGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects/:projectId/module/:moduleId/test-cases"
          element={
            <ProtectedRoute>
              <PermissionRouteGuard permission="Test_Case_READ">
                <ProjectAccessGuard>
                  <TestCase />
                </ProjectAccessGuard>
              </PermissionRouteGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects/:projectId/module/:moduleId/subModule/:subModuleId/test-cases"
          element={
            <ProtectedRoute>
              <PermissionRouteGuard permission="Test_Case_READ">
                <ProjectAccessGuard>
                  <TestCase />
                </ProjectAccessGuard>
              </PermissionRouteGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects/:projectId/releases"
          element={
            <ProtectedRoute>
              <PermissionRouteGuard permission="Release_READ">
                <ProjectAccessGuard>
                  <Releases />
                </ProjectAccessGuard>
              </PermissionRouteGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects/:projectId/releases/allocation"
          element={
            <ProtectedRoute>
              <PermissionRouteGuard permission="TEST_CASE_ALLOCATION_ACCESS">
                <ProjectAccessGuard>
                  <Allocation />
                </ProjectAccessGuard>
              </PermissionRouteGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects/:projectId/releases/test-execution"
          element={
            <ProtectedRoute>
              <PermissionRouteGuard permission="Test_Case_READ">
                <ProjectAccessGuard>
                  <TestExecution />
                </ProjectAccessGuard>
              </PermissionRouteGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects/:projectId/releases/test-execution/:releaseId"
          element={
            <ProtectedRoute>
              <PermissionRouteGuard permission="Test_Case_READ">
                <ProjectAccessGuard>
                  <TestExecution />
                </ProjectAccessGuard>
              </PermissionRouteGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects/:projectId/defects"
          element={
            <ProtectedRoute>
              <PermissionRouteGuard permission="Defect_READ">
                <ProjectAccessGuard>
                  <Defects />
                </ProjectAccessGuard>
              </PermissionRouteGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects/:projectId/project-management"
          element={
            <ProtectedRoute>
              <PermissionRouteGuard permission="Project_READ">
                <ProjectAccessGuard>
                  <ProjectManagement />
                </ProjectAccessGuard>
              </PermissionRouteGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects/:projectId/project-management/view"
          element={
            <ProtectedRoute>
              <PermissionRouteGuard permission="Project_READ">
                <ProjectAccessGuard>
                  <ReleaseView />
                </ProjectAccessGuard>
              </PermissionRouteGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects/:projectId/project-management/allocation-history"
          element={
            <ProtectedRoute>
              <PermissionRouteGuard permission="Project_Allocation_READ">
                <ProjectAccessGuard>
                  <ProjectAllocationHistory />
                </ProjectAccessGuard>
              </PermissionRouteGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects/:projectId/project-management/module-management"
          element={
            <ProtectedRoute>
              <PermissionRouteGuard permission="Module_READ">
                <ProjectAccessGuard>
                  <ModuleManagement />
                </ProjectAccessGuard>
              </PermissionRouteGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects/:projectId/releases/:releaseId/details"
          element={
            <ProtectedRoute>
              <PermissionRouteGuard permission="Release_READ">
                <ProjectAccessGuard>
                  <ReleaseDetails />
                </ProjectAccessGuard>
              </PermissionRouteGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/configurations"
          element={
            <ProtectedRoute>
              <Configurations />
            </ProtectedRoute>
          }
        />

        <Route
          path="/configurations/designation"
          element={
            <ProtectedRoute>
              <PermissionRouteGuard permission="Designation_READ">
                <Designation />
              </PermissionRouteGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/configurations/role"
          element={
            <ProtectedRoute>
              <PermissionRouteGuard permission="Role_READ">
                <Role />
              </PermissionRouteGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/configurations/defect-type"
          element={
            <ProtectedRoute>
              <PermissionRouteGuard permission="Defect_Type_READ">
                <DefectType />
              </PermissionRouteGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/configurations/privileges"
          element={
            <ProtectedRoute>
              <PermissionRouteGuard permission="Permission_READ">
                <Privileges />
              </PermissionRouteGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/configurations/email-configuration"
          element={
            <ProtectedRoute>
              <PermissionRouteGuard permission="Email_Config_READ">
                <EmailConfiguration />
              </PermissionRouteGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/configurations/release-type"
          element={
            <ProtectedRoute>
              <PermissionRouteGuard permission="Release_Type_READ">
                <ReleaseType />
              </PermissionRouteGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/configurations/severity"
          element={
            <ProtectedRoute>
              <PermissionRouteGuard permission="Severity_READ">
                <Severity />
              </PermissionRouteGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/configurations/priority"
          element={
            <ProtectedRoute>
              <PermissionRouteGuard permission="Priority_READ">
                <Priority />
              </PermissionRouteGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/configurations/status"
          element={
            <ProtectedRoute>
              <PermissionRouteGuard permission="STATUS_READ">
                <Status />
              </PermissionRouteGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/configurations/status/workflow"
          element={
            <ProtectedRoute>
              <PermissionRouteGuard permission="Workflow_READ">
                <StatusWorkflow />
              </PermissionRouteGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/configurations/status/type"
          element={
            <ProtectedRoute>
              <PermissionRouteGuard permission="STATUS_READ">
                <StatusType />
              </PermissionRouteGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/bench-allocate"
          element={
            <ProtectedRoute noLayout>
              <BenchAllocate />
            </ProtectedRoute>
          }
        />

        <Route path="/access-denied" element={<AccessDenied />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <PermissionProvider>
          <AppRoutes />
        </PermissionProvider>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;