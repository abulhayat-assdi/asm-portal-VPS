export const getImageUrl = (imagePath: string) => {
    if (!imagePath) {
        return '';
    }

    // If it's already a full URL (e.g. Firebase Storage upload from dashboard), return as-is
    if (imagePath.startsWith('http')) {
        return imagePath;
    }

    // Normalize path (remove leading slash if present)
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;

    // Return local static path from Next.js public/images/ folder
    return `/images/${cleanPath}`;
};
