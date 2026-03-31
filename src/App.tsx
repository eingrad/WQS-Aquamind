import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { type ReactElement } from "react";
import { UnitProvider } from "./context/UnitContext";
import { isAuthenticated } from "./services/auth.service";
import ErrorBoundary from "./components/common/ErrorBoundary";
import PetronasLogin from "./pages/auth/login";
import DashboardPage from "./pages/main/dashboard";
import OverviewPage from "./pages/overview/map";
import ReportsPage from "./pages/report/ReportsPage";
import SettingsPage from "./pages/settings/SettingPage";
import TelegramSetupGuide from "./pages/settings/TelegramSetupGuide";
import WindDirectionMap from "./pages/overview/newmap";
import DataValidationPage from "./pages/validation/DataValidationPage";
import DataValidationApprovalPage from "./pages/validation/DataValidationApprovalPage";
import ThresholdManagementPage from "./pages/alerts/ThresholdManagementPage";
import AlertHistoryPage from "./pages/alerts/AlertHistoryPage";
import AnalyticsPage from "./pages/analytics/AnalyticsPage";

/** Redirects unauthenticated users to /login */
function PrivateRoute({ element }: { element: ReactElement }) {
  return isAuthenticated() ? element : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <UnitProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PetronasLogin />} />
            <Route path="/dashboard" element={<PrivateRoute element={<DashboardPage />} />} />
            <Route path="/analytics" element={<PrivateRoute element={<AnalyticsPage />} />} />
            <Route path="/overview" element={<PrivateRoute element={<OverviewPage />} />} />
            <Route path="/reports" element={<PrivateRoute element={<ReportsPage />} />} />
            <Route path="/data-validation" element={<PrivateRoute element={<DataValidationPage />} />} />
            <Route path="/data-approval" element={<PrivateRoute element={<DataValidationApprovalPage />} />} />
            <Route path="/alert-thresholds" element={<PrivateRoute element={<ThresholdManagementPage />} />} />
            <Route path="/alert-history" element={<PrivateRoute element={<AlertHistoryPage />} />} />
            <Route path="/settings" element={<PrivateRoute element={<SettingsPage />} />} />
            <Route path="/telegram-setup" element={<PrivateRoute element={<TelegramSetupGuide />} />} />
            <Route path="/newmap" element={<PrivateRoute element={<WindDirectionMap />} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </UnitProvider>
    </ErrorBoundary>
  );
}
