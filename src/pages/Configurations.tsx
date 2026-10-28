import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/Card";
import {
  Briefcase,
  UserCog,
  Bug,
  Rocket,
  AlertTriangle,
  Flag,
  Mail,
  ListChecks,
  Shield,
} from "lucide-react";
import { Toast } from "../components/ui/Toast";
import { usePermission } from "../context/PermissionContext";

const Configurations: React.FC = () => {
  const navigate = useNavigate();
  const [toast, setToast] = useState<{
    isOpen: boolean;
    message: string;
    type: "success" | "error";
  }>({
    isOpen: false,
    message: "",
    type: "success",
  });

  const { can } = usePermission();

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ isOpen: true, message, type });
  };

  const handleCardClick = (path: string, name: string) => {
    showToast(`Navigating to ${name} configuration`, "success");
    navigate(path);
  };

  useEffect(() => {
    localStorage.removeItem("selectedProjectId");
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-8">
      {}
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Configurations</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {}
        {can.designation.view && (
          <Card
            hover
            className="cursor-pointer group transition-all duration-300 hover:shadow-lg hover:scale-[1.03]"
            onClick={() =>
              handleCardClick("/configurations/designation", "Designation")
            }
          >
            <CardContent className="flex flex-col items-center justify-center p-8">
              <Briefcase className="w-12 h-12 text-blue-500 mb-4 group-hover:text-blue-700 transition-colors" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Designation
              </h2>
              <p className="text-gray-600 text-center">
                Manage designation-related configurations.
              </p>
            </CardContent>
          </Card>
        )}
        {}
        {can.role.view && (
          <Card
            hover
            className="cursor-pointer group transition-all duration-300 hover:shadow-lg hover:scale-[1.03]"
            onClick={() => handleCardClick("/configurations/role", "Role")}
          >
            <CardContent className="flex flex-col items-center justify-center p-8">
              <UserCog className="w-12 h-12 text-blue-500 mb-4 group-hover:text-blue-700 transition-colors" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Role</h2>
              <p className="text-gray-600 text-center">
                Manage role-related configurations.
              </p>
            </CardContent>
          </Card>
        )}
        {}
        {can.permission.view && (
          <Card
            hover
            className="cursor-pointer group transition-all duration-300 hover:shadow-lg hover:scale-[1.03]"
            onClick={() =>
              handleCardClick("/configurations/privileges", "Privileges")
            }
          >
            <CardContent className="flex flex-col items-center justify-center p-8">
              <Shield className="w-12 h-12 text-blue-500 mb-4 group-hover:text-blue-700 transition-colors" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Privileges
              </h2>
              <p className="text-gray-600 text-center">
                Manage user privileges and permissions.
              </p>
            </CardContent>
          </Card>
        )}
        {}
        {can.defectType.view && (
          <Card
            hover
            className="cursor-pointer group transition-all duration-300 hover:shadow-lg hover:scale-[1.03]"
            onClick={() =>
              handleCardClick("/configurations/defect-type", "Defect Type")
            }
          >
            <CardContent className="flex flex-col items-center justify-center p-8">
              <Bug className="w-12 h-12 text-blue-500 mb-4 group-hover:text-blue-700 transition-colors" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Defect Type
              </h2>
              <p className="text-gray-600 text-center">
                Manage defect type configurations.
              </p>
            </CardContent>
          </Card>
        )}
        {}
        {can.releaseType.view && (
          <Card
            hover
            className="cursor-pointer group transition-all duration-300 hover:shadow-lg hover:scale-[1.03]"
            onClick={() =>
              handleCardClick("/configurations/release-type", "Release Type")
            }
          >
            <CardContent className="flex flex-col items-center justify-center p-8">
              <Rocket className="w-12 h-12 text-blue-500 mb-4 group-hover:text-blue-700 transition-colors" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Release Type
              </h2>
              <p className="text-gray-600 text-center">
                Manage release type configurations.
              </p>
            </CardContent>
          </Card>
        )}
        {}
        {can.severity.view && (
          <Card
            hover
            className="cursor-pointer group transition-all duration-300 hover:shadow-lg hover:scale-[1.03]"
            onClick={() =>
              handleCardClick("/configurations/severity", "Severity")
            }
          >
            <CardContent className="flex flex-col items-center justify-center p-8">
              <AlertTriangle className="w-12 h-12 text-blue-500 mb-4 group-hover:text-blue-700 transition-colors" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Severity
              </h2>
              <p className="text-gray-600 text-center">
                Manage severity configurations.
              </p>
            </CardContent>
          </Card>
        )}
        {}
        {can.priority.view && (
          <Card
            hover
            className="cursor-pointer group transition-all duration-300 hover:shadow-lg hover:scale-[1.03]"
            onClick={() =>
              handleCardClick("/configurations/priority", "Priority")
            }
          >
            <CardContent className="flex flex-col items-center justify-center p-8">
              <Flag className="w-12 h-12 text-blue-500 mb-4 group-hover:text-blue-700 transition-colors" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Priority
              </h2>
              <p className="text-gray-600 text-center">
                Manage priority configurations.
              </p>
            </CardContent>
          </Card>
        )}
        {}
        {can.statusType.view && (
          <Card
            hover
            className="cursor-pointer group transition-all duration-300 hover:shadow-lg hover:scale-[1.03]"
            onClick={() => handleCardClick("/configurations/status", "Status")}
          >
            <CardContent className="flex flex-col items-center justify-center p-8">
              <ListChecks className="w-12 h-12 text-blue-500 mb-4 group-hover:text-blue-700 transition-colors" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Status
              </h2>
              <p className="text-gray-600 text-center">
                Manage status configurations.
              </p>
            </CardContent>
          </Card>
        )}
        {}
        {(can.emailConfig.view ||
          can.pointSetup.view ||
          can.roleEmailRecipient.view ||
          can.employeeEmailRecipient.view) && (
          <Card
            hover
            className="cursor-pointer group transition-all duration-300 hover:shadow-lg hover:scale-[1.03]"
            onClick={() =>
              handleCardClick(
                "/configurations/email-configuration",
                "Email Configuration",
              )
            }
          >
            <CardContent className="flex flex-col items-center justify-center p-8">
              <Mail className="w-12 h-12 text-blue-500 mb-4 group-hover:text-blue-700 transition-colors" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Email Configuration
              </h2>
              <p className="text-gray-600 text-center">
                Manage email configuration settings.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Configurations;
