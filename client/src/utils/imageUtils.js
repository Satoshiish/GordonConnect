const API_BASE_URL = process.env.REACT_APP_API_URL || "https://gordonconnect-production-f2bd.up.railway.app/api";

/**
 * Formats an image URL to ensure it's properly displayed
 * @param {string} imagePath - The image path from the database
 * @param {string} defaultImage - Default image to use if no image is provided
 * @returns {string} - Properly formatted image URL
 */
export const formatImageUrl = (imagePath, defaultImage = "/default-profile.jpg") => {
  if (!imagePath) return defaultImage;
  
  // If it's already a full URL, return it
  if (imagePath.startsWith('http')) return imagePath;
  
  // If it already has the API base URL, return it
  if (imagePath.startsWith(API_BASE_URL)) return imagePath;
  
  // If it's a path with /upload/ prefix, add the API base URL
  if (imagePath.startsWith('/upload/')) {
    return `${API_BASE_URL}${imagePath}`;
  }
  
  // If it's just a filename, add the /upload/ prefix and API base URL
  if (!imagePath.includes('/')) {
    return `${API_BASE_URL}/upload/${imagePath}`;
  }
  
  // For any other format, add the API base URL
  return `${API_BASE_URL}${imagePath.startsWith('/') ? imagePath : `/${imagePath}`}`;
};