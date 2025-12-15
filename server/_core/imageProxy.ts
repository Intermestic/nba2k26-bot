import { Router } from "express";

const router = Router();

// Image proxy endpoint to fetch external images and serve them with proper CORS headers
router.get("/image-proxy", async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL parameter is required" });
    }

    // Fetch the image from the external URL
    const response = await fetch(url);
    
    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch image" });
    }

    // Get the image buffer
    const buffer = await response.arrayBuffer();
    
    // Get content type from the response
    const contentType = response.headers.get("content-type") || "image/png";
    
    // Set CORS headers and content type
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache for 1 year
    
    // Send the image buffer
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("Image proxy error:", error);
    res.status(500).json({ error: "Failed to proxy image" });
  }
});

export default router;
