import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.resolve(__dirname, '../dist');
const destDir = path.resolve(__dirname, '../../cyberlogic-backend/public');
const assetsDestDir = path.join(destDir, 'assets');

console.log(`Syncing frontend assets from: ${srcDir} \nto: ${destDir}...`);

try {
  if (!fs.existsSync(srcDir)) {
    console.error("Error: dist/ folder does not exist. Please run 'npm run build' first.");
    process.exit(1);
  }

  // Clean old compiled assets folder to prevent accumulation of hashed files
  if (fs.existsSync(assetsDestDir)) {
    console.log("Cleaning old frontend assets from backend public/assets...");
    fs.rmSync(assetsDestDir, { recursive: true, force: true });
  }

  // Copy dist files recursively into the backend public folder
  fs.cpSync(srcDir, destDir, { recursive: true });
  console.log("Success! Compiled frontend assets copied to Laravel backend public/ folder.");
} catch (err) {
  console.error("Error copying assets:", err);
  process.exit(1);
}

