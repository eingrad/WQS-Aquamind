import { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  generateReport,
  exportPDF,
  exportCSV,
  exportTXT,
  getAllReports,
  downloadReport,
  deleteReport,
} from "../controllers/report.controller";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Generate report data
router.post("/generate", generateReport);

// Export as PDF
router.post("/export/pdf", exportPDF);

// Export as CSV
router.post("/export/csv", exportCSV);

// Export as TXT
router.post("/export/txt", exportTXT);

// Get all reports for current user
router.get("/", getAllReports);

// Download specific report
router.get("/:id/download", downloadReport);

// Delete specific report
router.delete("/:id", deleteReport);

export default router;
