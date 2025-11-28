import { chromium, Browser, Page } from "playwright";
import fs from "fs/promises";
import path from "path";
import { getDiscordClient } from "../discord-bot";
import { AttachmentBuilder } from "discord.js";

const ONEDRIVE_URL = "https://1drv.ms/f/c/7bb3497e23b33ef5/IgAXnKsjp-DTTYwKIwpB_I38Abckl4P1O9smarZsX6GgMOM?e=VQP2lk";
const CHATGPT_CHAT_URL = "https://chatgpt.com/share/6928df92-e4bc-8012-83e2-ac21515058ca";
const DISCORD_CHANNEL_ID = "1443741234106470493";
const BATCH_SIZE = 10;
const DOWNLOAD_DIR = "/tmp/onedrive-photos";

interface ProcessingStatus {
  isProcessing: boolean;
  currentBatch: number;
  totalPhotos: number;
  processedPhotos: number;
  status: string;
}

let processingStatus: ProcessingStatus = {
  isProcessing: false,
  currentBatch: 0,
  totalPhotos: 0,
  processedPhotos: 0,
  status: "idle",
};

export function getProcessingStatus(): ProcessingStatus {
  return { ...processingStatus };
}

function updateStatus(updates: Partial<ProcessingStatus>) {
  processingStatus = { ...processingStatus, ...updates };
  console.log("Status updated:", processingStatus);
}

/**
 * Download photos from OneDrive folder
 */
async function downloadPhotosFromOneDrive(browser: Browser): Promise<string[]> {
  console.log("Opening OneDrive folder...");
  const page = await browser.newPage();
  
  try {
    await page.goto(ONEDRIVE_URL, { waitUntil: "networkidle", timeout: 60000 });
    
    // Wait for the file list to load
    await page.waitForSelector('[role="row"]', { timeout: 30000 });
    
    // Get all file items
    const files = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('[role="row"]'));
      const fileData: Array<{ name: string; downloadUrl: string | null }> = [];
      
      for (const row of rows) {
        const nameElement = row.querySelector('[data-automationid="FieldRenderer-name"]');
        if (!nameElement) continue;
        
        const fileName = nameElement.textContent?.trim();
        if (!fileName) continue;
        
        // Check if it's an image file
        if (!/\.(jpg|jpeg|png|gif|webp)$/i.test(fileName)) continue;
        
        // Try to find download link
        const link = row.querySelector('a[href*="download"]');
        const downloadUrl = link?.getAttribute('href');
        
        fileData.push({ name: fileName, downloadUrl });
      }
      
      return fileData;
    });
    
    console.log(`Found ${files.length} photo(s) in OneDrive`);
    
    if (files.length === 0) {
      return [];
    }
    
    // Create download directory
    await fs.mkdir(DOWNLOAD_DIR, { recursive: true });
    
    // Download each file
    const downloadedPaths: string[] = [];
    
    for (const file of files) {
      try {
        console.log(`Downloading ${file.name}...`);
        
        // Click on the file to select it
        await page.evaluate((fileName) => {
          const rows = Array.from(document.querySelectorAll('[role="row"]'));
          for (const row of rows) {
            const nameElement = row.querySelector('[data-automationid="FieldRenderer-name"]');
            if (nameElement?.textContent?.trim() === fileName) {
              (row as HTMLElement).click();
              return;
            }
          }
        }, file.name);
        
        await page.waitForTimeout(1000);
        
        // Click download button
        const downloadButton = await page.$('[aria-label*="Download"]');
        if (downloadButton) {
          await downloadButton.click();
          await page.waitForTimeout(3000); // Wait for download to start
          
          // The file should be downloaded to the default downloads folder
          // We'll need to move it to our working directory
          const downloadPath = path.join(DOWNLOAD_DIR, file.name);
          downloadedPaths.push(downloadPath);
        }
      } catch (error) {
        console.error(`Failed to download ${file.name}:`, error);
      }
    }
    
    return downloadedPaths;
  } finally {
    await page.close();
  }
}

/**
 * Login to ChatGPT and upload photos in batches
 */
async function uploadToChatGPT(browser: Browser, photoPaths: string[]): Promise<string[]> {
  console.log("Opening ChatGPT...");
  const page = await browser.newPage();
  
  try {
    // Navigate to ChatGPT chat
    await page.goto(CHATGPT_CHAT_URL, { waitUntil: "networkidle", timeout: 60000 });
    
    // Check if we need to login
    const isLoginPage = await page.evaluate(() => {
      return document.body.textContent?.includes("Log in") || 
             document.body.textContent?.includes("Sign up");
    });
    
    if (isLoginPage) {
      console.log("ChatGPT login required. Waiting for user to login...");
      updateStatus({ status: "Waiting for ChatGPT login..." });
      
      // Wait for user to complete login (up to 5 minutes)
      await page.waitForLoadState("networkidle", { timeout: 300000 });
      console.log("Login completed");
    }
    
    // Process photos in batches
    const responses: string[] = [];
    const batches = [];
    
    for (let i = 0; i < photoPaths.length; i += BATCH_SIZE) {
      batches.push(photoPaths.slice(i, i + BATCH_SIZE));
    }
    
    updateStatus({ totalPhotos: photoPaths.length });
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      updateStatus({ 
        currentBatch: i + 1, 
        status: `Uploading batch ${i + 1}/${batches.length}` 
      });
      
      console.log(`Uploading batch ${i + 1}/${batches.length} (${batch.length} photos)...`);
      
      // Find the file input
      const fileInput = await page.$('input[type="file"]');
      
      if (!fileInput) {
        throw new Error("Could not find file upload input");
      }
      
      // Upload all files in the batch
      await fileInput.uploadFile(...batch);
      
      // Wait for upload to complete
      await page.waitForTimeout(2000);
      
      // Click send button
      const sendButton = await page.$('[data-testid="send-button"]');
      if (sendButton) {
        await sendButton.click();
      }
      
      // Wait for response
      await page.waitForTimeout(10000); // Wait for ChatGPT to process
      
      // Extract the response
      const response = await page.evaluate(() => {
        const messages = Array.from(document.querySelectorAll('[data-message-author-role="assistant"]'));
        if (messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          return lastMessage.textContent || "";
        }
        return "";
      });
      
      responses.push(response);
      updateStatus({ processedPhotos: (i + 1) * BATCH_SIZE });
      
      console.log(`Batch ${i + 1} response received`);
    }
    
    return responses;
  } finally {
    await page.close();
  }
}

/**
 * Delete photos from OneDrive after successful upload
 */
async function deletePhotosFromOneDrive(browser: Browser, photoNames: string[]): Promise<void> {
  console.log("Deleting photos from OneDrive...");
  const page = await browser.newPage();
  
  try {
    await page.goto(ONEDRIVE_URL, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForSelector('[role="row"]', { timeout: 30000 });
    
    for (const photoName of photoNames) {
      try {
        console.log(`Deleting ${photoName}...`);
        
        // Select the file
        await page.evaluate((fileName) => {
          const rows = Array.from(document.querySelectorAll('[role="row"]'));
          for (const row of rows) {
            const nameElement = row.querySelector('[data-automationid="FieldRenderer-name"]');
            if (nameElement?.textContent?.trim() === fileName) {
              (row as HTMLElement).click();
              return;
            }
          }
        }, photoName);
        
        await page.waitForTimeout(1000);
        
        // Click delete button
        await page.keyboard.press("Delete");
        await page.waitForTimeout(2000);
        
        // Confirm deletion if prompted
        const confirmButton = await page.$('[data-automationid="ConfirmButton"]');
        if (confirmButton) {
          await confirmButton.click();
          await page.waitForTimeout(1000);
        }
        
        console.log(`Deleted ${photoName}`);
      } catch (error) {
        console.error(`Failed to delete ${photoName}:`, error);
      }
    }
  } finally {
    await page.close();
  }
}

/**
 * Parse ChatGPT responses and generate CSV
 */
function parseResponsesAndGenerateCSV(responses: string[]): string {
  console.log("Generating CSV from responses...");
  
  // This is a placeholder - you'll need to customize based on the actual response format
  const csvLines = ["Player Name,Overall,Position,Team"];
  
  for (const response of responses) {
    // Parse the response and extract player data
    // This will depend on how ChatGPT formats the response
    const lines = response.split("\n");
    for (const line of lines) {
      if (line.trim()) {
        csvLines.push(line.trim());
      }
    }
  }
  
  return csvLines.join("\n");
}

/**
 * Main processing function
 */
export async function processOneDrivePhotos() {
  console.log("\n=== processOneDrivePhotos CALLED ===");
  console.log("Timestamp:", new Date().toISOString());
  console.log("Node version:", process.version);
  console.log("CWD:", process.cwd());
  
  if (processingStatus.isProcessing) {
    console.log("Already processing, throwing error");
    throw new Error("Processing already in progress");
  }
  
  console.log("Setting status to processing...");
  updateStatus({ isProcessing: true, status: "Starting..." });
  
  let browser: Browser | null = null;
  
  try {
    console.log("\n=== BROWSER LAUNCH SECTION ===");
    console.log("About to launch browser...");
    
    // Try to find chromium executable
    const execPath = "/usr/lib/chromium-browser/chromium-browser";
    console.log("Using chromium at:", execPath);
    
    // Verify the file exists before launching
    try {
      const stats = await fs.stat(execPath);
      console.log("✓ Browser executable found:", {
        path: execPath,
        size: stats.size,
        mode: stats.mode.toString(8),
        isFile: stats.isFile(),
      });
    } catch (error) {
      console.error("✗ Browser executable not found at:", execPath);
      throw new Error(`Browser executable not found at ${execPath}`);
    }
    
    console.log("Attempting to launch browser with Playwright...");
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
      executablePath: execPath,
    });
    
    console.log("Browser launched successfully!");
    
    // Step 1: Download photos from OneDrive
    updateStatus({ status: "Downloading photos from OneDrive..." });
    const photoPaths = await downloadPhotosFromOneDrive(browser);
    
    if (photoPaths.length === 0) {
      updateStatus({ isProcessing: false, status: "No photos found" });
      return {
        success: true,
        message: "No photos found in OneDrive folder",
        totalPhotos: 0,
        batches: 0,
      };
    }
    
    // Step 2: Upload to ChatGPT
    updateStatus({ status: "Uploading to ChatGPT..." });
    const responses = await uploadToChatGPT(browser, photoPaths);
    
    // Step 3: Delete from OneDrive
    updateStatus({ status: "Deleting photos from OneDrive..." });
    const photoNames = photoPaths.map((p) => path.basename(p));
    await deletePhotosFromOneDrive(browser, photoNames);
    
    // Step 4: Generate CSV
    updateStatus({ status: "Generating CSV..." });
    const csvContent = parseResponsesAndGenerateCSV(responses);
    const csvPath = path.join(DOWNLOAD_DIR, `player-data-${Date.now()}.csv`);
    await fs.writeFile(csvPath, csvContent);
    
    // Step 5: Send to Discord
    updateStatus({ status: "Sending CSV to Discord..." });
    const client = getDiscordClient();
    if (client && client.isReady()) {
      const channel = await client.channels.fetch(DISCORD_CHANNEL_ID);
      if (channel && channel.isTextBased()) {
        const attachment = new AttachmentBuilder(csvPath);
        await (channel as any).send({
          content: `Player data extracted from ${photoPaths.length} photos`,
          files: [attachment],
        });
      }
    }
    
    // Cleanup
    await fs.rm(DOWNLOAD_DIR, { recursive: true, force: true });
    
    updateStatus({ 
      isProcessing: false, 
      status: "Completed",
      processedPhotos: photoPaths.length,
    });
    
    return {
      success: true,
      totalPhotos: photoPaths.length,
      batches: Math.ceil(photoPaths.length / BATCH_SIZE),
      csvUrl: csvPath,
    };
  } catch (error) {
    console.error("\n=== PROCESSING ERROR ===");
    console.error("Error type:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    console.error("Full error object:", error);
    
    updateStatus({ 
      isProcessing: false, 
      status: `Error: ${error instanceof Error ? error.message : "Unknown error"}` 
    });
    throw error;
  } finally {
    console.log("\n=== CLEANUP ===");
    if (browser) {
      console.log("Closing browser...");
      await browser.close();
      console.log("Browser closed");
    } else {
      console.log("No browser to close");
    }
  }
}
