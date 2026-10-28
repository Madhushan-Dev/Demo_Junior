import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  User,
  LogOut,
  Settings,
  QrCode,
  Wifi,
  WifiOff,
  X,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";
import { useApp } from "../../context/AppContext";
import QuickAddDefect from "../../pages/QuickAddDefect";
import QuickAddTestCase from "../../pages/QuickAddTestCase";
import { useLocation } from "react-router-dom";
import UserDetailsDrawer from "../../pages/UserDetailsDrawer";
import { io } from "socket.io-client";
import { usePermission } from "../../context/PermissionContext";
const WHATSAPP_API_URL = "";

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { selectedProjectId, modulesByProject } = useApp();
  const location = useLocation();
  const { can } = usePermission();
  const [showUserDrawer, setShowUserDrawer] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isWhatsAppConnected, setIsWhatsAppConnected] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [whatsAppStatus, setWhatsAppStatus] = useState<
    "checking" | "connected" | "disconnected"
  >("checking");
  const [isLoadingQR, setIsLoadingQR] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showReconnectWarning, setShowReconnectWarning] = useState(false);
  const [isManualLogout, setIsManualLogout] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

 const showQuickAdd = React.useMemo(() => {
  return /^\/projects\/[^/]+(\/module\/[^/]+)?(\/subModule\/[^/]+)?\/(project-management|test-cases|releases|defects)/.test(
    location.pathname,
  );
}, [location.pathname]);

  const checkWhatsAppStatus = async () => {
    try {
      const res = await fetch(`${WHATSAPP_API_URL}/status`);
      const data = await res.json();
      setIsWhatsAppConnected(data.connected);
      setWhatsAppStatus(data.connected ? "connected" : "disconnected");
      setIsManualLogout(data.manualLogout || false);

      if (data.connected && showQRModal) {
        setShowQRModal(false);
        setQrCode(null);
        setErrorMessage(null);
        setShowReconnectWarning(false);
      }
    } catch (error) {
setWhatsAppStatus("disconnected");
      setIsWhatsAppConnected(false);
    }
  };

  const requestQRCode = async () => {
    if (isWhatsAppConnected) {
      setShowReconnectWarning(true);
      return;
    }

    try {
      setIsLoadingQR(true);
      setErrorMessage(null);
      setQrCode(null);

      const res = await fetch(`${WHATSAPP_API_URL}/auth/qr`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        pollForQRCode();
      } else {
        setErrorMessage(data.message);
        setIsLoadingQR(false);
      }
    } catch (error) {
setErrorMessage("Failed to generate QR code. Please try again.");
      setIsLoadingQR(false);
    }
  };

  const forceReconnect = async () => {
    try {
      setIsLoadingQR(true);
      setErrorMessage(null);
      setShowReconnectWarning(false);

      await fetch(`${WHATSAPP_API_URL}/auth/reset`, { method: "POST" });

      setTimeout(async () => {
        await requestQRCode();
      }, 2000);
    } catch (error) {
setErrorMessage("Failed to reconnect. Please try again.");
      setIsLoadingQR(false);
    }
  };

  const pollForQRCode = () => {
    let attempts = 0;
    const maxAttempts = 60;

    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`${WHATSAPP_API_URL}/auth/qr`);
        const data = await res.json();

        if (data.connected) {
          setIsWhatsAppConnected(true);
          setWhatsAppStatus("connected");
          setShowQRModal(false);
          setQrCode(null);
          clearInterval(interval);
          setIsLoadingQR(false);
        } else if (data.qr) {
          setQrCode(data.qr);
          setIsLoadingQR(false);
          clearInterval(interval);
        } else if (
          data.message === "Manually logged out. Please request new connection."
        ) {
          setErrorMessage(
            "Session was manually logged out. Please reset and try again.",
          );
          setIsLoadingQR(false);
          clearInterval(interval);
        }

        if (attempts >= maxAttempts && !data.qr && !data.connected) {
          clearInterval(interval);
          setIsLoadingQR(false);
          setErrorMessage("Timeout. Please try again.");
        }
      } catch (error) {
if (attempts >= maxAttempts) {
          clearInterval(interval);
          setIsLoadingQR(false);
          setErrorMessage("Failed to get QR code. Please try again.");
        }
      }
    }, 1000);
  };

  const disconnectWhatsApp = async () => {
    if (window.confirm("⚠️ Are you sure you want to disconnect WhatsApp?")) {
      try {
        setIsLoadingQR(true);

        let success = false;
        for (let i = 0; i < 3; i++) {
          try {
            const res = await fetch(`${WHATSAPP_API_URL}/auth/logout`, {
              method: "POST",
            });
            const data = await res.json();
            if (data.success) {
              success = true;
              break;
            }
          } catch (err) {
await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        if (success) {
          setIsWhatsAppConnected(false);
          setWhatsAppStatus("disconnected");
          setQrCode(null);
          setIsManualLogout(true);
          alert("✅ WhatsApp disconnected");
        } else {
          await fetch(`${WHATSAPP_API_URL}/auth/reset`, { method: "POST" });
          setIsWhatsAppConnected(false);
          setWhatsAppStatus("disconnected");
          alert("✅ Reset successful");
        }
      } catch (error) {
        setErrorMessage("Failed to disconnect");
      } finally {
        setIsLoadingQR(false);
      }
    }
  };

  const handleLogout = async () => {
    logout();
  };

  useEffect(() => {
    checkWhatsAppStatus();

    const socket = io(WHATSAPP_API_URL, {
      transports: ["polling", "websocket"],
      autoConnect: false,
    });

    socket.on("connect_error", (err) => {});

    socket.on("connect", () => {
});

    socket.on("whatsapp-status", (data) => {
      setIsWhatsAppConnected(data.connected);
      setWhatsAppStatus(data.connected ? "connected" : "disconnected");
      setIsManualLogout(data.manualLogout || false);

      if (data.connected && showQRModal) {
        setShowQRModal(false);
        setQrCode(null);
        setErrorMessage(null);
        setShowReconnectWarning(false);
      }
    });

    socket.on("disconnect", () => {
});

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowSettingsDropdown(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const QRModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center animate-fadeIn">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 transform animate-slideUp">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            WhatsApp Connection
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center">
          {showReconnectWarning ? (
            <div className="py-8">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              </div>
              <p className="text-yellow-600 font-semibold text-lg mb-2">
                WhatsApp Already Connected!
              </p>
              <p className="text-gray-600 text-sm mb-4">
                WhatsApp is already connected. Do you want to reconnect with a
                new QR?
                <br />
                <br />
                <strong>Note:</strong> This will disconnect the current session.
              </p>
              <div className="space-y-2">
                <Button
                  onClick={forceReconnect}
                  variant="primary"
                  className="w-full"
                >
                  Yes, Reconnect
                </Button>
                <Button
                  onClick={() => {
                    setShowReconnectWarning(false);
                    onClose();
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : whatsAppStatus === "connected" ? (
            <div className="py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-green-600 font-semibold text-lg mb-2">
                WhatsApp Connected!
              </p>
              <p className="text-gray-600 text-sm mb-2">
                ✅ Connection is active and stable
              </p>
              <p className="text-gray-600 text-sm mb-4">
                🔒 Will stay connected until manual logout
              </p>
              {user?.userId == 2 && (
                <Button
                  onClick={disconnectWhatsApp}
                  variant="outline"
                  className="mt-2 text-red-600 border-red-300 hover:bg-red-50"
                >
                  Disconnect WhatsApp
                </Button>
              )}
            </div>
          ) : isLoadingQR ? (
            <div className="py-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <p className="text-gray-600">Generating QR code...</p>
            </div>
          ) : qrCode ? (
            <>
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <img
                  src={qrCode}
                  alt="WhatsApp QR Code"
                  className="mx-auto w-64 h-64"
                />
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Scan this QR code with WhatsApp to connect
              </p>
              <p className="text-sm text-gray-600 mb-2">
                1. Open WhatsApp on your phone
              </p>
              <p className="text-sm text-gray-600 mb-2">
                2. Tap Menu → Linked Devices
              </p>
              <p className="text-sm text-gray-600 mb-4">
                3. Point your phone to scan this QR code
              </p>
              <p className="text-xs text-blue-600 mb-4">
                💡 Connection will stay active even after server restart
              </p>
              <button
                onClick={requestQRCode}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                disabled={isLoadingQR}
              >
                Refresh QR Code
              </button>
            </>
          ) : errorMessage ? (
            <div className="py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-red-600 mb-4">{errorMessage}</p>
              <div className="space-y-2">
                <Button
                  onClick={requestQRCode}
                  variant="primary"
                  className="w-full"
                >
                  Try Again
                </Button>
                <Button
                  onClick={forceReconnect}
                  variant="outline"
                  className="w-full"
                >
                  Reset Connection
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-gray-600 mb-2">
                Connect WhatsApp for notifications
              </p>
              <p className="text-gray-600 text-sm mb-4">
                {isManualLogout
                  ? "Previous session was manually logged out. Click below to start fresh."
                  : "Click below to generate QR code and connect"}
              </p>
              <Button
                onClick={requestQRCode}
                variant="primary"
                className="mx-auto"
              >
                Generate QR Code
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (!user) return null;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 px-6 py-4 shadow-sm z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">DT</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  DefectTracker Pro
                </h1>
                <p className="text-xs text-gray-500">
                  Project Management Suite
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {}
            <div className="hidden md:flex items-center mr-2">
              {whatsAppStatus === "connected" ? (
                <div className="flex items-center text-green-600 text-xs bg-green-50 px-2 py-1 rounded-lg">
                  <Wifi className="w-3 h-3 mr-1" />
                  <span>WhatsApp Connected</span>
                </div>
              ) : whatsAppStatus === "checking" ? (
                <div className="flex items-center text-yellow-600 text-xs bg-yellow-50 px-2 py-1 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse mr-1"></div>
                  <span>Checking...</span>
                </div>
              ) : (
                <div className="flex items-center text-gray-500 text-xs bg-gray-50 px-2 py-1 rounded-lg">
                  <WifiOff className="w-3 h-3 mr-1" />
                  <span>WhatsApp Offline</span>
                </div>
              )}
            </div>

            {showQuickAdd && (
              <>
                {can.defect.create && (
                  <div className="flex items-center">
                    <QuickAddDefect
                      projectModules={
                        selectedProjectId
                          ? modulesByProject[selectedProjectId] || []
                          : []
                      }
                      renderButton={({ onClick, disabled }) => (
                        <Button
                          onClick={onClick}
                          disabled={disabled}
                          variant="primary"
                          size="sm"
                          className="rounded-xl flex items-center mr-2"
                        >
                          Add Defect
                        </Button>
                      )}
                    />
                  </div>
                )}
                {can.testCase.create && (
                  <div className="flex items-center">
                    <QuickAddTestCase
                      selectedProjectId={selectedProjectId || ""}
                      renderButton={({ onClick, disabled }) => (
                        <Button
                          onClick={onClick}
                          disabled={disabled}
                          variant="primary"
                          size="sm"
                          className="rounded-xl flex items-center mr-2"
                        >
                          Add Test Case
                        </Button>
                      )}
                    />
                  </div>
                )}
              </>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="p-2.5 rounded-xl relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </Button>

            {}
            <div className="relative" ref={dropdownRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                className="p-2.5 rounded-xl"
              >
                <Settings className="w-5 h-5" />
              </Button>

              {showSettingsDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 transform animate-slideDown">
                  {}
                  <button
                    onClick={() => {
                      setShowSettingsDropdown(false);
                      setShowQRModal(true);
                      setErrorMessage(null);
                      setShowReconnectWarning(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                  >
                    <QrCode className="w-4 h-4 text-gray-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        WhatsApp Connection
                      </p>
                      <p className="text-xs text-gray-500">
                        {whatsAppStatus === "connected"
                          ? "Connected ✓"
                          : isManualLogout
                            ? "Manually Logged Out"
                            : "Not Connected"}
                      </p>
                    </div>
                    {whatsAppStatus === "connected" && (
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                  </button>

                  <div className="border-t border-gray-100 my-1"></div>

                  {}
                </div>
              )}
            </div>

            {}
            <div className="flex items-center space-x-3">
              <div
                className="flex items-center space-x-3 px-4 py-2.5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setShowUserDrawer(true)}
                title="View user details"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900">
                    {(user as any)?.employeeName ||
                      (user as any)?.firstName ||
                      user?.email?.split("@")[0] ||
                      "User"}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLogoutDialog(true)}
                className="p-2.5 rounded-xl text-red-600 hover:bg-red-50"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {showUserDrawer && (
        <UserDetailsDrawer
          user={user}
          onClose={() => setShowUserDrawer(false)}
        />
      )}

      {showQRModal && (
        <QRModal
          onClose={() => {
            setShowQRModal(false);
            setQrCode(null);
            setErrorMessage(null);
            setIsLoadingQR(false);
            setShowReconnectWarning(false);
            checkWhatsAppStatus();
          }}
        />
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideDown {
          from { 
            opacity: 0;
            transform: translateY(-10px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>

      {showLogoutDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md mx-4 shadow-2xl overflow-hidden animate-slideUp">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <LogOut className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Confirm Logout</h2>
            </div>

            <div className="p-6 text-center">
              <p className="text-gray-700 text-lg mb-2">
                Are you sure you want to logout?
              </p>

              <p className="text-gray-500 text-sm mb-6">
                You will need to sign in again to access your account.
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowLogoutDialog(false)}
                >
                  Cancel
                </Button>

                <Button
                  variant="primary"
                  className="flex-1 bg-red-600 hover:bg-red-700 border-red-600"
                  onClick={() => {
                    setShowLogoutDialog(false);
                    logout();
                  }}
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
