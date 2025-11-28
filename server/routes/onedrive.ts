import { Router } from "express";
import { processOneDrivePhotos, getProcessingStatus } from "../services/onedrive-processor";

const router = Router();

/**
 * POST /api/onedrive/process
 * Start processing photos from OneDrive
 */
router.post("/process", async (req, res) => {
  try {
    const result = await processOneDrivePhotos();
    res.json(result);
  } catch (error) {
    console.error("OneDrive processing error:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Processing failed",
    });
  }
});

/**
 * GET /api/onedrive/status
 * Get current processing status
 */
router.get("/status", async (req, res) => {
  try {
    const status = getProcessingStatus();
    res.json(status);
  } catch (error) {
    console.error("Status check error:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Status check failed",
    });
  }
});

export default router;
