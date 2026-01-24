
/**
 * Resizes and compresses a base64 or URL image.
 * @param dataUrl The image source (base64 or URL) OR Blob/File.
 * @param maxWidth Max width in pixels.
 * @param maxHeight Max height in pixels.
 * @param quality Compression quality (0 to 1).
 * @returns A promise that resolves to the resized base64 string.
 */
export async function resizeImage(
    source: string | Blob | File,
    maxWidth: number = 600,
    maxHeight: number = 600,
    quality: number = 0.7
): Promise<string> {
    // (Native implementation removed to prevent usage)

    // Legacy / String Fallback
    return new Promise((resolve, reject) => {
        const dataUrl = (typeof source === 'string')
            ? source
            : URL.createObjectURL(source);

        console.log("Starting legacy image resize. Input type:", typeof source);
        const img = new Image();

        img.onload = () => {
            let width = img.width;
            let height = img.height;
            // console.log("Original dimensions:", width, "x", height);

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

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");

            if (!ctx) {
                reject(new Error("Could not get canvas context"));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);
            const resizedDataUrl = canvas.toDataURL("image/jpeg", quality);

            // Clean up if we created a URL
            if (typeof source !== 'string') {
                URL.revokeObjectURL(dataUrl);
            }

            resolve(resizedDataUrl);
        };

        img.onerror = (e) => {
            console.error("Image loading error", e);
            reject(new Error("Error loading image for resizing"));
        };

        img.src = dataUrl;
    });
}
