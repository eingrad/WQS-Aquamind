import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Map each route path to a human-readable page title */
const ROUTE_TITLES: Record<string, string> = {
  "/login": "Login",
  "/dashboard": "Dashboard",
  "/analytics": "Analytics",
  "/overview": "Overview",
  "/reports": "Reports",
  "/data-validation": "Data Validation",
  "/data-approval": "Data Approval",
  "/alert-thresholds": "Alert Thresholds",
  "/alert-history": "Alert History",
  "/parameters": "Parameters",
  "/settings": "Settings",
  "/telegram-setup": "Telegram Setup",
  "/newmap": "Wind Direction Map",
  "/displays": "Custom Displays",
};

const APP_NAME = "MyAQMS";

/**
 * Listens to route changes and updates the browser tab title.
 * Renders nothing — just a side-effect component.
 */
export default function DynamicTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    let pageTitle = ROUTE_TITLES[pathname];

    // Handle dynamic display viewer route: /display/:slug
    if (!pageTitle && pathname.startsWith("/display/")) {
      pageTitle = "Display";
    }

    document.title = pageTitle
      ? `${pageTitle} - ${APP_NAME}`
      : APP_NAME;
  }, [pathname]);

  return null;
}
