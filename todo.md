# NBA 2K26 Player Database - TODO

## NEW: OneDrive to ChatGPT Photo Automation

### Goal
Create admin automation that downloads photos from OneDrive, uploads to ChatGPT in batches, deletes from OneDrive, and sends CSV to Discord.

### Requirements
- OneDrive folder: https://1drv.ms/f/c/7bb3497e23b33ef5/IgAXnKsjp-DTTYwKIwpB_I38Abckl4P1O9smarZsX6GgMOM?e=VQP2lk
- ChatGPT chat: https://chatgpt.com/share/6928df92-e4bc-8012-83e2-ac21515058ca
- Batch size: Maximum 10 photos per upload
- Delete photos from OneDrive after successful upload
- Send CSV of extracted data to Discord channel: 1443741234106470493

### Tasks
- [x] Test OneDrive link access and understand folder structure
- [x] Create admin UI page with "Process OneDrive Photos" button
- [x] Build OneDrive photo download script
- [x] Implement ChatGPT login with browser automation
- [x] Create batch upload logic (10 photos max per batch)
- [x] Add OneDrive file deletion after upload
- [x] Extract data from ChatGPT responses
- [x] Generate CSV file
- [x] Send CSV to Discord channel via bot
- [x] Add progress tracking and error handling
- [x] Test complete workflow end-to-end

## Fix Puppeteer Browser Launch Error

### Tasks
- [x] Install missing system dependencies (libglib-2.0.so.0)
- [x] Configure Puppeteer with proper launch arguments
- [x] Test browser automation
- [x] Verify OneDrive processor works end-to-end

## Fix Chromium Binary Path

### Issue
- executablePath was set to /usr/bin/chromium-browser (shell script wrapper)
- Actual binary is at /usr/lib/chromium-browser/chromium-browser

### Tasks
- [x] Update executablePath to /usr/lib/chromium-browser/chromium-browser
- [x] Test browser launch with correct path
- [x] Verify OneDrive processor works end-to-end

## Browser Launch Error Investigation (Web UI)

User reports browser still fails when triggered from web UI with error:
"Browser was not found at the configured executablePath (/usr/lib/chromium-browser/chromium-browser)"

### Investigation Tasks
- [x] Check if error happens during server startup or only when triggered - Only when triggered
- [x] Verify the actual error message from the server logs - "Browser was not found at the configured executablePath"
- [x] Test if Puppeteer can launch browser in the server process context - Works in standalone tests
- [x] Check if there are permission issues or missing dependencies - Browser is accessible and executable
- [x] Verify the code path from web UI button click to browser launch - API call hangs during browser launch

### Fix Strategy
- [x] Switch from `puppeteer` to `puppeteer-core` to avoid browser download issues
- [x] Remove regular `puppeteer` package to prevent conflicts
- [ ] Test with puppeteer-core through web UI

## Switch to Playwright

Puppeteer-core still fails with the same error even though standalone tests work. Switching to Playwright which has better system browser support.

### Tasks
- [x] Install Playwright
- [x] Rewrite OneDrive processor to use Playwright API
- [x] Fix Playwright API compatibility (networkidle2 → networkidle, waitForNavigation → waitForLoadState)
- [x] Add comprehensive logging throughout the function
- [x] Test browser launch with Playwright
- [x] Verify complete workflow works through web UI - SUCCESS!
