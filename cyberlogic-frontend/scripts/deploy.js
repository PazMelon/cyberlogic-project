import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.resolve(__dirname, '../dist');
const destDir = path.resolve(__dirname, '../../cyberlogic-backend/public');

console.log(`Syncing frontend assets from: ${srcDir} \nto: ${destDir}...`);

try {
  if (!fs.existsSync(srcDir)) {
    console.error("Error: dist/ folder does not exist. Please run 'npm run build' first.");
    process.exit(1);
  }

  // Copy dist files recursively into the backend public folder
  fs.cpSync(srcDir, destDir, { recursive: true });
  console.log("Success! Compiled frontend assets copied to Laravel backend public/ folder.");
} catch (err) {
  console.error("Error copying assets:", err);
  process.exit(1);
}
