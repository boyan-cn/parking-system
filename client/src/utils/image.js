// 获取完整的图片URL
export const getImageUrl = (path) => {
  if (!path) return null;
  
  // 如果已经是完整URL，直接返回
  if (path.startsWith('http')) {
    return path;
  }
  
  // 获取API基础URL
  const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  // 拼接完整URL
  return `${apiBaseUrl}${path}`;
};