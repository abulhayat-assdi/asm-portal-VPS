import imageCompression from "browser-image-compression";

/**
 * Compresses an image and uploads it to the local cPanel storage via API.
 * @param file The image file to upload
 * @param path The sub-path in public/images/ (e.g., 'blog')
 * @param onProgress Callback function for upload progress (currently limited in native fetch)
 * @returns The relative path of the uploaded image (e.g., 'blog/filename.webp')
 */
export const uploadImage = async (
    file: File,
    path: string,
    onProgress?: (progress: number) => void
): Promise<string> => {
    try {
        // 1. Compress the image aggressively for fast web loading
        const options = {
            maxSizeMB: 0.2,          // Max 200KB per image
            maxWidthOrHeight: 1200,  // Slightly larger for better quality on cPanel
            useWebWorker: true,
            initialQuality: 0.7,     // 70% quality — good balance
            fileType: 'image/webp',  // Convert to WebP for best compression
        };
        const compressedFile = await imageCompression(file, options);

        // 2. Prepare FormData
        const formData = new FormData();
        formData.append("file", compressedFile);
        
        // Clean the path (remove leading/trailing slashes)
        const cleanPath = path.replace(/^\/|\/$/g, '').replace('images/', '');
        formData.append("path", cleanPath);

        if (onProgress) onProgress(10); // Start progress

        // 3. Upload to our local API route
        const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Upload failed");
        }

        if (onProgress) onProgress(100); // Complete progress

        const data = await response.json();
        
        // Return the full relative path that getImageUrl understands
        // e.g., 'blog/12345-image.webp'
        return data.path;

    } catch (error) {
        console.error("Error compressing or uploading image:", error);
        throw error;
    }
};
