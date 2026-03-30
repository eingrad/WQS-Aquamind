import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UnitProvider } from "./context/UnitContext";
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

export default function App() {
  return (
    <UnitProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PetronasLogin />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/data-validation" element={<DataValidationPage />} />
          <Route
            path="/data-approval"
            element={<DataValidationApprovalPage />}
          />
          <Route
            path="/alert-thresholds"
            element={<ThresholdManagementPage />}
          />
          <Route path="/alert-history" element={<AlertHistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/telegram-setup" element={<TelegramSetupGuide />} />
          <Route path="/newmap" element={<WindDirectionMap />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </UnitProvider>
  );
}
