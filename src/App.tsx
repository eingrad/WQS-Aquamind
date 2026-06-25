import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DynamicTitle from "./components/common/DynamicTitle";
import { type ReactElement } from "react";
import { UnitProvider } from "./context/UnitContext";
import { isAuthenticated } from "./services/auth.service";
import { getStorageItem, STORAGE_KEYS } from "./utils/storage";
import ErrorBoundary from "./components/common/ErrorBoundary";
import Login from "./pages/auth/login";
import DashboardPage from "./pages/main/dashboard";
import OverviewPage from "./pages/overview/newmap";
import ReportsPage from "./pages/report/ReportsPage";
import SettingsPage from "./pages/settings/SettingPage";
import TelegramSetupGuide from "./pages/settings/TelegramSetupGuide";
import DataValidationPage from "./pages/validation/DataValidationPage";
import DataValidationApprovalPage from "./pages/validation/DataValidationApprovalPage";
import ThresholdManagementPage from "./pages/alerts/ThresholdManagementPage";
import AlertHistoryPage from "./pages/alerts/AlertHistoryPage";
import AnalyticsPage from "./pages/analytics/AnalyticsPage";
import ParameterInfoPage from "./pages/parameters/ParameterInfoPage";
import MaintenancePage from "./pages/maintenance/MaintenancePage";
import CalibrationPage from "./pages/calibration/CalibrationPage";

/** Known role IDs — mirrors backend seed.ts */
type UserRole = "admin" | "qa_qc" | "technician" | "user";

const ALL_ROLES: UserRole[] = ["admin", "qa_qc", "technician", "user"];

/** Map display names (roleName) to roleId for resilient matching */
const ROLE_NAME_MAP: Record<string, UserRole> = {
  administrator: "admin",
  admin: "admin",
  "qa/qc": "qa_qc",
  qa_qc: "qa_qc",
  technician: "technician",
  user: "user",
};

/** Read the current user's role from storage (falls back to most restrictive) */
function getUserRole(): UserRole {
  try {
    const parsed = getStorageItem<Record<string, any>>(STORAGE_KEYS.USER);
    if (!parsed) return "user";

    // Try direct roleId match first
    const roleId = parsed?.role || parsed?.userRole?.roleId;
    if (roleId && ALL_ROLES.includes(roleId)) return roleId as UserRole;

    // Fallback: match by roleName
    const roleName = parsed?.roleName || parsed?.userRole?.role?.roleName;
    if (roleName) {
      const mapped = ROLE_NAME_MAP[roleName.toLowerCase()];
      if (mapped) return mapped;
    }

    // Also try matching roleId through the name map
    if (roleId) {
      const mapped = ROLE_NAME_MAP[roleId.toLowerCase()];
      if (mapped) return mapped;
    }

    if (roleId || roleName) {
      console.warn(`[App] Unrecognized role: roleId="${roleId}", roleName="${roleName}". Falling back to "user".`);
    }
    return "user";
  } catch {
    return "user";
  }
}

/** Redirects unauthenticated users to /login */
function PrivateRoute({ element }: { element: ReactElement }) {
  return isAuthenticated() ? element : <Navigate to="/login" replace />;
}

/** Redirects authenticated but unauthorized users to /dashboard */
function RoleRoute({
  element,
  allowedRoles,
}: {
  element: ReactElement;
  allowedRoles: UserRole[];
}) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(getUserRole()))
    return <Navigate to="/dashboard" replace />;
  return element;
}

export default function App() {
  return (
    <ErrorBoundary>
      <UnitProvider>
        <BrowserRouter>
          <DynamicTitle />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<PrivateRoute element={<DashboardPage />} />} />
            <Route path="/analytics" element={<RoleRoute element={<AnalyticsPage />} allowedRoles={["admin", "qa_qc", "technician", "user"]} />} />
            <Route path="/overview" element={<PrivateRoute element={<OverviewPage />} />} />
            <Route path="/reports" element={<PrivateRoute element={<ReportsPage />} />} />
            <Route path="/data-validation" element={<RoleRoute element={<DataValidationPage />} allowedRoles={["admin", "qa_qc", "technician"]} />} />
            <Route path="/data-approval" element={<RoleRoute element={<DataValidationApprovalPage />} allowedRoles={["admin", "qa_qc"]} />} />
            <Route path="/alert-thresholds" element={<PrivateRoute element={<ThresholdManagementPage />} />} />
            <Route path="/alert-history" element={<PrivateRoute element={<AlertHistoryPage />} />} />
            <Route path="/parameters" element={<PrivateRoute element={<ParameterInfoPage />} />} />
            <Route path="/settings" element={<PrivateRoute element={<SettingsPage />} />} />
            <Route path="/telegram-setup" element={<PrivateRoute element={<TelegramSetupGuide />} />} />
            <Route path="/maintenance" element={<RoleRoute element={<MaintenancePage />} allowedRoles={["admin", "technician"]} />} />
            <Route path="/calibration" element={<RoleRoute element={<CalibrationPage />} allowedRoles={["admin", "technician"]} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </UnitProvider>
    </ErrorBoundary>
  );
}

