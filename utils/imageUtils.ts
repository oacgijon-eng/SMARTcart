
/**
 * Resizes and compresses a base64 or URL image.
 * @param dataUrl The image source (base64 or URL).
 * @param maxWidth Max width in pixels.
 * @param maxHeight Max height in pixels.
 * @param quality Compression quality (0 to 1).
 * @returns A promise that resolves to the resized base64 string.
 */
export async function resizeImage(
    dataUrl: string,
    maxWidth: number = 600, // Reduced from 800 for safety on tablets
    maxHeight: number = 600,
    quality: number = 0.7
): Promise<string> {
    return new Promise((resolve, reject) => {
        console.log("Starting image resize. Input length:", dataUrl.length);
        const img = new Image();
        // img.crossOrigin = "anonymous"; // Removed for local base64 consistency

        img.onload = () => {
            let width = img.width;
            let height = img.height;
            console.log("Original dimensions:", width, "x", height);

            // Calculate new dimensions while maintaining aspect ratio
            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }

            console.log("New dimensions:", width, "x", height);

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
                reject(new Error("Could not get canvas context"));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            // Convert to base64 with quality compression
            const resizedDataUrl = canvas.toDataURL("image/jpeg", quality);
            console.log("Resizing complete. Output length:", resizedDataUrl.length);
            resolve(resizedDataUrl);
        };

        img.onerror = (e) => {
            console.error("Image loading error for resize", e);
            reject(new Error("Error loading image for resizing"));
        };

        img.src = dataUrl;
    });
}
