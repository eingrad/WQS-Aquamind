import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PetronasLogin from "./pages/auth/login";
import DashboardPage from "./pages/main/dashboard";
import OverviewPage from "./pages/overview/map";
import ReportsPage from "./pages/report/ReportsPage";
import SettingsPage from "./pages/settings/SettingPage";
import WindDirectionMap from "./pages/overview/newmap";
import DataValidationPage from "./pages/validation/DataValidationPage";
import DataValidationApprovalPage from "./pages/validation/DataValidationApprovalPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PetronasLogin />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/overview" element={<OverviewPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/data-validation" element={<DataValidationPage />} />
        <Route path="/data-approval" element={<DataValidationApprovalPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/newmap" element={<WindDirectionMap />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
