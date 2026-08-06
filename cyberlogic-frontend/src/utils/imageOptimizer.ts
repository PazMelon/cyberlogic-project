/**
 * Client-Side Image Optimizer
 * Validates, compresses, and converts uploaded images to WebP format (except GIFs).
 */

export interface OptimizationResult {
  dataUrl: string;
  originalName: string;
  originalSize: number;
  optimizedSize: number;
}

export function optimizeAndConvertToWebP(
  file: File,
  quality = 0.82,
  maxDimension = 1600
): Promise<OptimizationResult> {
  return new Promise((resolve, reject) => {
    // 1. Validation: Format Checks (including GIF)
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return reject(new Error("Invalid file type. Only JPG, JPEG, PNG, GIF, and WEBP files are allowed."));
    }

    // 2. Validation: Size Checks (5MB Limit)
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return reject(new Error("File size exceeds 5MB limit. Please choose a smaller picture."));
    }

    // 3. GIF Handling: Bypass canvas pipeline to preserve animation frames
    if (file.type === "image/gif") {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        resolve({
          dataUrl: reader.result as string,
          originalName: file.name,
          originalSize: file.size,
          optimizedSize: file.size,
        });
      };
      reader.onerror = () => {
        reject(new Error("Failed to read GIF image."));
      };
      return;
    }

    // 4. Canvas Optimization Pipeline (for JPEGs, PNGs, WEBPs)
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      // Clean up object URL memory leak
      URL.revokeObjectURL(objectUrl);

      // Determine dimensions (constrain long edge to maxDimension e.g. 1600px to optimize storage)
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      // Create browser canvas
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return reject(new Error("Failed to get 2D canvas context."));
      }

      // Draw the image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert canvas content to WebP blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return reject(new Error("Failed to compress canvas to blob."));
          }

          // Convert WebP Blob to base64 DataURL
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => {
            const dataUrl = reader.result as string;
            resolve({
              dataUrl,
              originalName: file.name,
              originalSize: file.size,
              optimizedSize: blob.size
            });
          };
          reader.onerror = () => {
            reject(new Error("Failed to read compressed image blob."));
          };
        },
        "image/webp",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load the image file."));
    };

    img.src = objectUrl;
  });
}

export function dataUrlToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/webp";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  const cleanName = filename.replace(/\.[^/.]+$/, "") + ".webp";
  return new File([u8arr], cleanName, { type: mime });
}
