import { Request, Response } from "express";
import prisma from "../config/database";

/**
 * List all displays (authenticated users)
 */
export const listDisplays = async (req: Request, res: Response): Promise<void> => {
  try {
    const displays = await prisma.customDisplay.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        device: { select: { id: true, name: true, location: true } },
        creator: { select: { id: true, fullName: true, email: true } },
      },
    });

    res.json({ success: true, data: displays });
  } catch (error) {
    console.error("Error listing displays:", error);
    res.status(500).json({ error: "Failed to list displays" });
  }
};

/**
 * Get a display by slug (PUBLIC - no auth required)
 */
export const getDisplayBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const display = await prisma.customDisplay.findUnique({
      where: { slug },
      include: {
        device: {
          select: {
            id: true,
            name: true,
            location: true,
            latitude: true,
            longitude: true,
            status: true,
          },
        },
        creator: { select: { fullName: true } },
      },
    });

    if (!display) {
      res.status(404).json({ error: "Display not found" });
      return;
    }

    if (!display.isPublic) {
      res.status(403).json({ error: "This display is not public" });
      return;
    }

    res.json({ success: true, data: display });
  } catch (error) {
    console.error("Error fetching display:", error);
    res.status(500).json({ error: "Failed to fetch display" });
  }
};

/**
 * Create a new display
 */
export const createDisplay = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, deviceId, config, slug, isPublic } = req.body;
    const userId = req.user!.userId;

    // Validate required fields
    if (!title || !deviceId || !config || !slug) {
      res.status(400).json({ error: "title, deviceId, config, and slug are required" });
      return;
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      res.status(400).json({ error: "Slug must be lowercase alphanumeric with hyphens only" });
      return;
    }

    // Check slug uniqueness
    const existing = await prisma.customDisplay.findUnique({ where: { slug } });
    if (existing) {
      res.status(409).json({ error: "A display with this slug already exists" });
      return;
    }

    // Verify device exists
    const device = await prisma.device.findUnique({ where: { id: deviceId } });
    if (!device) {
      res.status(404).json({ error: "Device not found" });
      return;
    }

    const display = await prisma.customDisplay.create({
      data: {
        title,
        description: description || null,
        deviceId,
        config,
        slug,
        isPublic: isPublic !== false,
        createdBy: userId,
      },
      include: {
        device: { select: { id: true, name: true, location: true } },
        creator: { select: { id: true, fullName: true, email: true } },
      },
    });

    res.status(201).json({ success: true, data: display });
  } catch (error) {
    console.error("Error creating display:", error);
    res.status(500).json({ error: "Failed to create display" });
  }
};

/**
 * Update a display
 */
export const updateDisplay = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, deviceId, config, slug, isPublic } = req.body;

    // Check display exists
    const existing = await prisma.customDisplay.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Display not found" });
      return;
    }

    // Check slug uniqueness if changed
    if (slug && slug !== existing.slug) {
      const slugExists = await prisma.customDisplay.findUnique({ where: { slug } });
      if (slugExists) {
        res.status(409).json({ error: "A display with this slug already exists" });
        return;
      }
    }

    const display = await prisma.customDisplay.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(deviceId !== undefined && { deviceId }),
        ...(config !== undefined && { config }),
        ...(slug !== undefined && { slug }),
        ...(isPublic !== undefined && { isPublic }),
      },
      include: {
        device: { select: { id: true, name: true, location: true } },
        creator: { select: { id: true, fullName: true, email: true } },
      },
    });

    res.json({ success: true, data: display });
  } catch (error) {
    console.error("Error updating display:", error);
    res.status(500).json({ error: "Failed to update display" });
  }
};

/**
 * Delete a display
 */
export const deleteDisplay = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await prisma.customDisplay.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Display not found" });
      return;
    }

    await prisma.customDisplay.delete({ where: { id } });

    res.json({ success: true, message: "Display deleted" });
  } catch (error) {
    console.error("Error deleting display:", error);
    res.status(500).json({ error: "Failed to delete display" });
  }
};
