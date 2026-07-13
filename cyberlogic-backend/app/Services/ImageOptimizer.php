<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ImageOptimizer
{
    /**
     * Optimize an uploaded image file, convert non-GIFs to WebP, resize if large, and store it.
     *
     * @param UploadedFile $file The uploaded file object
     * @param string $directory Storage subdirectory (e.g. 'avatars', 'announcements')
     * @param string $disk Storage disk (default 'public')
     * @param int $maxDimension Maximum width or height constraint
     * @param int $quality WebP quality factor (1-100)
     * @return string Relative storage file path
     * @throws ValidationException
     */
    public static function optimize(
        UploadedFile $file,
        string $directory,
        string $disk = 'public',
        int $maxDimension = 1200,
        int $quality = 80
    ): string {
        // 1. Double check validation limits
        $allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        $mime = $file->getMimeType();

        if (!in_array($mime, $allowedMimes)) {
            throw ValidationException::withMessages([
                'image' => ['Invalid image type. Supported formats are: JPG, JPEG, PNG, GIF, WEBP.']
            ]);
        }

        $maxSize = 5 * 1024 * 1024; // 5MB
        if ($file->getSize() > $maxSize) {
            throw ValidationException::withMessages([
                'image' => ['The image file size must not exceed 5MB.']
            ]);
        }

        // 2. GIF Handlers: Bypass optimization and WebP conversion to preserve frames
        if ($mime === 'image/gif') {
            $filename = Str::random(40) . '.gif';
            return $file->storeAs($directory, $filename, $disk);
        }

        // 3. Native GD Optimization pipeline
        $filePath = $file->getRealPath();
        $image = null;

        try {
            if ($mime === 'image/jpeg' || $mime === 'image/jpg') {
                $image = @imagecreatefromjpeg($filePath);
                
                // Rotate based on EXIF Orientation metadata (for mobile camera portrait photos)
                if ($image && function_exists('exif_read_data')) {
                    try {
                        $exif = @exif_read_data($filePath);
                        if (!empty($exif['Orientation'])) {
                            switch ($exif['Orientation']) {
                                case 3:
                                    $image = imagerotate($image, 180, 0);
                                    break;
                                case 6:
                                    $image = imagerotate($image, -90, 0);
                                    break;
                                case 8:
                                    $image = imagerotate($image, 90, 0);
                                    break;
                            }
                        }
                    } catch (\Throwable $e) {
                        // Fail silently if EXIF reading is not supported or fails
                    }
                }
            } elseif ($mime === 'image/png') {
                $image = @imagecreatefrompng($filePath);
            } elseif ($mime === 'image/webp') {
                $image = @imagecreatefromwebp($filePath);
            }

            if (!$image) {
                // If GD failed to open, fallback to store original
                $extension = $file->getClientOriginalExtension() ?: 'webp';
                $filename = Str::random(40) . '.' . $extension;
                return $file->storeAs($directory, $filename, $disk);
            }

            // Get original width and height
            $width = imagesx($image);
            $height = imagesy($image);

            // Scale maintaining aspect ratio if bounds exceeded
            if ($width > $maxDimension || $height > $maxDimension) {
                if ($width > $height) {
                    $newHeight = (int) round(($height * $maxDimension) / $width);
                    $newWidth = $maxDimension;
                } else {
                    $newWidth = (int) round(($width * $maxDimension) / $height);
                    $newHeight = $maxDimension;
                }

                $resized = imagecreatetruecolor($newWidth, $newHeight);

                // Preserve alpha channel transparency for PNG/WebP
                imagealphablending($resized, false);
                imagesavealpha($resized, true);

                imagecopyresampled(
                    $resized,
                    $image,
                    0, 0, 0, 0,
                    $newWidth,
                    $newHeight,
                    $width,
                    $height
                );

                imagedestroy($image);
                $image = $resized;
            }

            // Capture output stream into memory variable
            ob_start();
            imagewebp($image, null, $quality);
            $webpData = ob_get_clean();
            
            imagedestroy($image);

            // Save binary stream as .webp
            $filename = Str::random(40) . '.webp';
            $targetPath = $directory . '/' . $filename;
            
            Storage::disk($disk)->put($targetPath, $webpData);

            return $targetPath;

        } catch (\Throwable $e) {
            // Hard fallback: Store the original file on GD library failure
            $extension = $file->getClientOriginalExtension() ?: 'webp';
            $filename = Str::random(40) . '.' . $extension;
            return $file->storeAs($directory, $filename, $disk);
        }
    }
}
