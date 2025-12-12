import { existsSync, statSync } from 'fs';

const execPath = "/usr/lib/chromium-browser/chromium-browser";

console.log("=== Environment Check ===");
console.log("Node version:", process.version);
console.log("Platform:", process.platform);
console.log("Arch:", process.arch);
console.log("CWD:", process.cwd());
console.log("User:", process.env.USER);
console.log("HOME:", process.env.HOME);
console.log("PATH:", process.env.PATH);

console.log("\n=== File Check ===");
console.log("execPath:", execPath);
console.log("File exists (existsSync):", existsSync(execPath));

if (existsSync(execPath)) {
  try {
    const stats = statSync(execPath);
    console.log("File stats:", {
      size: stats.size,
      mode: stats.mode.toString(8),
      isFile: stats.isFile(),
      uid: stats.uid,
      gid: stats.gid,
    });
  } catch (error: any) {
    console.error("Error getting stats:", error.message);
  }
}

console.log("\n=== Trying to import Playwright ===");
try {
  const { chromium } = await import('playwright');
  console.log("✓ Playwright imported successfully");
  console.log("Chromium object:", typeof chromium);
} catch (error: any) {
  console.error("✗ Failed to import Playwright:", error.message);
}
