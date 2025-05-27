// Image URL formatting utility
export const formatImageUrl = (imagePath, defaultImage = "/default-profile.jpg") => {
  if (!imagePath) return defaultImage;
  
  const API_BASE_URL = "https://gordonconnect-production-f2bd.up.railway.app";
  
  // If it's already a full URL, return it
  if (imagePath.startsWith('http')) return imagePath;
  
  // If it has /upload/ prefix but no domain
  if (imagePath.startsWith('/upload/')) {
    return `${API_BASE_URL}${imagePath}`;
  }
  
  // If it's just a filename (no slashes)
  if (!imagePath.includes('/')) {
    return `${API_BASE_URL}/upload/${imagePath}`;
  }
  
  // If it has upload/ without leading slash
  if (imagePath.startsWith('upload/')) {
    return `${API_BASE_URL}/${imagePath}`;
  }
  
  // For any other format
  return `${API_BASE_URL}${imagePath.startsWith('/') ? imagePath : `/${imagePath}`}`;
};