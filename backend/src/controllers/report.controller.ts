import { Request, Response } from "express";
import {
  generateReportData,
  generateCSV,
  generateTXT,
} from "../services/report.service";
import ejs from "ejs";
import puppeteer, { Browser } from "puppeteer";
import path from "path";
import fs from "fs";
import logger from "../config/logger";
import prisma from "../config/database";
import { parseReportDateRange } from "../utils/timezone";

/**
 * Generate report data
 */
export const generateReport = async (req: Request, res: Response) => {
  try {
    const { deviceId, startDate, endDate, frequency, units } = req.body;

    // Validate required fields
    if (!deviceId || !startDate || !endDate || !frequency) {
      return res.status(400).json({
        error:
          "Missing required fields: deviceId, startDate, endDate, frequency",
      });
    }

    // Parse and convert dates to UTC (handles Malaysia timezone)
    const { start, end } = parseReportDateRange(startDate, endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: "Invalid date format",
      });
    }

    // Validate frequency
    if (!["daily", "weekly", "monthly"].includes(frequency)) {
      return res.status(400).json({
        error: "Invalid frequency. Must be 'daily', 'weekly', or 'monthly'",
      });
    }

    // Generate report data
    const reportData = await generateReportData({
      deviceId,
      startDate: start,
      endDate: end,
      frequency,
      units,
    });

    res.json(reportData);
  } catch (error: any) {
    logger.error("Error generating report:", error);
    res.status(500).json({
      error: "Failed to generate report",
      message: error.message,
    });
  }
};

/**
 * Export report as PDF
 */
export const exportPDF = async (req: Request, res: Response) => {
  let browser: Browser | null = null;

  try {
    const { deviceId, startDate, endDate, frequency, units } = req.body;

    // Validate required fields
    if (!deviceId || !startDate || !endDate || !frequency) {
      return res.status(400).json({
        error:
          "Missing required fields: deviceId, startDate, endDate, frequency",
      });
    }

    // Parse and convert dates to UTC (handles Malaysia timezone)
    const { start, end } = parseReportDateRange(startDate, endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: "Invalid date format",
      });
    }

    // Debug: Log the date range being used for PDF export
    console.log(`\n📄 Exporting ${frequency} PDF report:`);
    console.log(`   Start Date: ${start.toISOString()}`);
    console.log(`   End Date: ${end.toISOString()}`);
    console.log(
      `   Days diff: ${Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))}`,
    );
    console.log(
      `   Hours diff: ${Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60))}`,
    );

    // Generate report data
    const reportData = await generateReportData({
      deviceId,
      startDate: start,
      endDate: end,
      frequency,
      units,
    });

    // Build a unit lookup from the resolved parameter metadata so the
    // summary block matches the dashboard's selected units.
    const unitFor = (key: string): string =>
      reportData.parameters.find((p) => p.key === key)?.unit || "";

    // Format summary for template
    const formattedSummary = {
      maxTemp: reportData.summary.maxTemp?.toFixed(2) || "N/A",
      minWind: reportData.summary.minWind?.toFixed(2) || "N/A",
      avgSO2: reportData.summary.avgSO2?.toFixed(4) || "N/A",
      avgH2S: reportData.summary.avgH2S?.toFixed(4) || "N/A",
      avgNO2: reportData.summary.avgNO2?.toFixed(4) || "N/A",
      // BTEX components — Synspec GC955
      avgBenzene: reportData.summary.avgBenzene?.toFixed(4) || "N/A",
      avgToluene: reportData.summary.avgToluene?.toFixed(4) || "N/A",
      avgEthylbenzene: reportData.summary.avgEthylbenzene?.toFixed(4) || "N/A",
      avgXylenes: reportData.summary.avgXylenes?.toFixed(4) || "N/A",
      avgSolar: reportData.summary.avgSolar?.toFixed(2) || "N/A",
      units: {
        temperature: unitFor("temperature"),
        windSpeed: unitFor("windSpeed"),
        so2: unitFor("so2"),
        h2s: unitFor("h2s"),
        no2: unitFor("no2"),
        benzene: unitFor("benzene"),
        toluene: unitFor("toluene"),
        ethylbenzene: unitFor("ethylbenzene"),
        xylenes: unitFor("xylenes"),
        solar: unitFor("solar"),
      },
      availability: reportData.summary.availability || {}, // Pass availability data
      incompletePeriods: reportData.summary.incompletePeriods || {}, // Pass incomplete periods
    };

    // Render HTML template
    const templatePath = path.join(
      __dirname,
      "../../reports/report-template.ejs",
    );
    const html = await ejs.renderFile(templatePath, {
      deviceId: reportData.deviceId,
      dateRange: reportData.dateRange,
      generatedOn: reportData.generatedOn,
      location: reportData.location,
      parameters: reportData.parameters,
      data: reportData.data,
      summary: formattedSummary,
    });

    // Generate PDF with Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px",
      },
    });

    await browser.close();
    browser = null;

    // Save report to database
    const { parameters } = req.body; // Extract parameters from request
    const filename = `report_${reportData.deviceId}_${frequency}_${start.toISOString().split("T")[0]}_to_${end.toISOString().split("T")[0]}.pdf`;
    const reportsDir = path.join(__dirname, "../../reports/generated");

    // Create directory if it doesn't exist
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const filePath = path.join(reportsDir, filename);

    // Save PDF to file system
    fs.writeFileSync(filePath, pdfBuffer);

    // Get device details for title
    // Try to find device by ID (UUID) or by device code
    let device = await prisma.device
      .findUnique({
        where: { id: deviceId },
      })
      .catch(() => null);

    // If not found by ID, try by device code
    if (!device) {
      device = await prisma.device
        .findUnique({
          where: { deviceCode: deviceId },
        })
        .catch(() => null);
    }

    const deviceName = device?.name || device?.location || deviceId;

    // Save report metadata to database (optional, don't fail if it errors)
    try {
      const userId = (req as any).user?.userId;

      if (userId) {
        const reportRecord = await prisma.report.create({
          data: {
            reportType: frequency,
            title: `${frequency.charAt(0).toUpperCase() + frequency.slice(1)} AQMS Report`,
            description: `Air quality monitoring report for ${start.toISOString().split("T")[0]} to ${end.toISOString().split("T")[0]}`,
            timeFrom: start,
            timeTo: end,
            deviceIds: [device?.id || deviceId],
            parameters: parameters || [],
            fileFormat: "PDF",
            filePath: filePath,
            fileName: filename,
            fileSize: pdfBuffer.length,
            status: "completed",
            createdBy: userId,
          },
        });

        logger.info(`✅ Report saved to database: ${reportRecord.id}`);
      } else {
        logger.warn("⚠️ User ID not found, report not saved to database");
      }
    } catch (dbError) {
      logger.error("Error saving report to database:", dbError);
      // Continue anyway - don't fail the PDF generation
    }

    // Send PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    logger.error("Error exporting PDF:", error);

    // Close browser if still open
    if (browser) {
      await browser.close();
    }

    res.status(500).json({
      error: "Failed to export PDF",
      message: error.message,
    });
  }
};

/**
 * Export report as CSV
 */
export const exportCSV = async (req: Request, res: Response) => {
  try {
    const { deviceId, startDate, endDate, frequency, units } = req.body;

    // Validate required fields
    if (!deviceId || !startDate || !endDate || !frequency) {
      return res.status(400).json({
        error:
          "Missing required fields: deviceId, startDate, endDate, frequency",
      });
    }

    // Parse and convert dates to UTC (handles Malaysia timezone)
    const { start, end } = parseReportDateRange(startDate, endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: "Invalid date format",
      });
    }

    // Debug: Log the date range being used for CSV export
    console.log(`\n📄 Exporting ${frequency} CSV report:`);
    console.log(`   Start Date: ${start.toISOString()}`);
    console.log(`   End Date: ${end.toISOString()}`);

    // Generate report data
    const reportData = await generateReportData({
      deviceId,
      startDate: start,
      endDate: end,
      frequency,
      units,
    });

    // Generate CSV
    const csvContent = generateCSV(reportData);

    // Save report to database
    const { parameters } = req.body; // Extract parameters from request
    const filename = `report_${reportData.deviceId}_${frequency}_${start.toISOString().split("T")[0]}_to_${end.toISOString().split("T")[0]}.csv`;
    const reportsDir = path.join(__dirname, "../../reports/generated");

    // Create directory if it doesn't exist
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const filePath = path.join(reportsDir, filename);

    // Save CSV to file system
    fs.writeFileSync(filePath, csvContent);

    // Get device details for title
    // Try to find device by ID (UUID) or by device code
    let device = await prisma.device
      .findUnique({
        where: { id: deviceId },
      })
      .catch(() => null);

    // If not found by ID, try by device code
    if (!device) {
      device = await prisma.device
        .findUnique({
          where: { deviceCode: deviceId },
        })
        .catch(() => null);
    }

    const deviceName = device?.name || device?.location || deviceId;

    // Save report metadata to database (optional, don't fail if it errors)
    try {
      const userId = (req as any).user?.userId;

      if (userId) {
        const reportRecord = await prisma.report.create({
          data: {
            reportType: frequency,
            title: `${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Report`,
            description: `Air quality monitoring report for ${start.toISOString().split("T")[0]} to ${end.toISOString().split("T")[0]}`,
            timeFrom: start,
            timeTo: end,
            deviceIds: [device?.id || deviceId],
            parameters: parameters || [],
            fileFormat: "CSV",
            filePath: filePath,
            fileName: filename,
            fileSize: Buffer.byteLength(csvContent, "utf8"),
            status: "completed",
            createdBy: userId,
          },
        });

        logger.info(`✅ Report saved to database: ${reportRecord.id}`);
      } else {
        logger.warn("⚠️ User ID not found, report not saved to database");
      }
    } catch (dbError) {
      logger.error("Error saving report to database:", dbError);
      // Continue anyway - don't fail the CSV generation
    }

    // Send CSV
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (error: any) {
    logger.error("Error exporting CSV:", error);
    res.status(500).json({
      error: "Failed to export CSV",
      message: error.message,
    });
  }
};

/**
 * Export report as TXT
 */
export const exportTXT = async (req: Request, res: Response) => {
  try {
    const { deviceId, startDate, endDate, frequency, units } = req.body;

    // Validate required fields
    if (!deviceId || !startDate || !endDate || !frequency) {
      return res.status(400).json({
        error:
          "Missing required fields: deviceId, startDate, endDate, frequency",
      });
    }

    // Parse and convert dates to UTC (handles Malaysia timezone)
    const { start, end } = parseReportDateRange(startDate, endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: "Invalid date format",
      });
    }

    // Generate report data
    const reportData = await generateReportData({
      deviceId,
      startDate: start,
      endDate: end,
      frequency,
      units,
    });

    // Generate TXT
    const txtContent = generateTXT(reportData);

    // Save report to database
    const { parameters } = req.body;
    const filename = `report_${reportData.deviceId}_${frequency}_${start.toISOString().split("T")[0]}_to_${end.toISOString().split("T")[0]}.txt`;
    const reportsDir = path.join(__dirname, "../../reports/generated");

    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const filePath = path.join(reportsDir, filename);
    fs.writeFileSync(filePath, txtContent);

    // Get device details
    let device = await prisma.device
      .findUnique({ where: { id: deviceId } })
      .catch(() => null);

    if (!device) {
      device = await prisma.device
        .findUnique({ where: { deviceCode: deviceId } })
        .catch(() => null);
    }

    // Save report metadata to database
    try {
      const userId = (req as any).user?.userId;
      if (userId) {
        await prisma.report.create({
          data: {
            reportType: frequency,
            title: `${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Report`,
            description: `Air quality monitoring report for ${start.toISOString().split("T")[0]} to ${end.toISOString().split("T")[0]}`,
            timeFrom: start,
            timeTo: end,
            deviceIds: [device?.id || deviceId],
            parameters: parameters || [],
            fileFormat: "TXT",
            filePath: filePath,
            fileName: filename,
            fileSize: Buffer.byteLength(txtContent, "utf8"),
            status: "completed",
            createdBy: userId,
          },
        });
        logger.info(`✅ TXT Report saved to database`);
      }
    } catch (dbError) {
      logger.error("Error saving TXT report to database:", dbError);
    }

    // Send TXT
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(txtContent);
  } catch (error: any) {
    logger.error("Error exporting TXT:", error);
    res.status(500).json({
      error: "Failed to export TXT",
      message: error.message,
    });
  }
};

/**
 * Get all reports for current user
 */
export const getAllReports = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where: { createdBy: userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          creator: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
      }),
      prisma.report.count({ where: { createdBy: userId } }),
    ]);

    res.json({
      success: true,
      data: reports,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    logger.error("Error fetching reports:", error);
    res.status(500).json({
      error: "Failed to fetch reports",
      message: error.message,
    });
  }
};

/**
 * Download a specific report by ID
 */
export const downloadReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    // Check ownership
    if (report.createdBy !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Check if file exists
    if (!fs.existsSync(report.filePath)) {
      return res.status(404).json({ error: "Report file not found" });
    }

    // Send file
    res.download(report.filePath, report.fileName);
  } catch (error: any) {
    logger.error("Error downloading report:", error);
    res.status(500).json({
      error: "Failed to download report",
      message: error.message,
    });
  }
};

/**
 * Delete a specific report by ID
 */
export const deleteReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    // Check ownership
    if (report.createdBy !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Delete file from filesystem if it exists
    if (fs.existsSync(report.filePath)) {
      fs.unlinkSync(report.filePath);
      logger.info(`🗑️ Deleted report file: ${report.filePath}`);
    }

    // Delete from database
    await prisma.report.delete({
      where: { id },
    });

    logger.info(`✅ Report deleted: ${id}`);
    res.json({ message: "Report deleted successfully" });
  } catch (error: any) {
    logger.error("Error deleting report:", error);
    res.status(500).json({
      error: "Failed to delete report",
      message: error.message,
    });
  }
};
