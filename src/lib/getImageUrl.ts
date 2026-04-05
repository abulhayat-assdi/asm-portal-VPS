export const getImageUrl = (imagePath: string) => {
    if (!imagePath) {
        return '';
    }

    // If it's already a full external URL (e.g. old Firebase link), return as-is
    if (imagePath.startsWith('http')) {
        return imagePath;
    }

    // Normalize path (remove leading slash if present)
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    
    // If it already starts with images/, we just need the leading slash
    if (cleanPath.startsWith('images/')) {
        return `/${cleanPath}`;
    }

    // Return local static path from Next.js public/images/ folder
    return `/images/${cleanPath}`;
};
