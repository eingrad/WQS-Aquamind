import { Router } from "express";
import * as displayController from "../controllers/display.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

// Public route - no auth required
router.get("/:slug/public", displayController.getDisplayBySlug);

// Authenticated routes
router.get("/", authenticate, displayController.listDisplays);
router.post("/", authenticate, authorize(["admin", "qa_qc"]), displayController.createDisplay);
router.put("/:id", authenticate, authorize(["admin", "qa_qc"]), displayController.updateDisplay);
router.delete("/:id", authenticate, authorize(["admin", "qa_qc"]), displayController.deleteDisplay);

export default router;
