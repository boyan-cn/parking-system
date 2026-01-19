// 获取存储的token
export const getToken = () => {
  return localStorage.getItem('token');
};

// 存储token
export const setToken = (token) => {
  localStorage.setItem('token', token);
};

// 移除token
export const removeToken = () => {
  localStorage.removeItem('token');
};

// 获取用户信息
export const getUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

// 存储用户信息
export const setUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

// 移除用户信息
export const removeUser = () => {
  localStorage.removeItem('user');
};

// 检查是否已登录
export const isAuthenticated = () => {
  return !!getToken();
};

// 检查token是否即将过期并刷新
export const checkAndRefreshToken = async () => {
  const token = getToken();
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();
    const timeUntilExpiry = expirationTime - currentTime;

    // 如果token在30分钟内过期，提醒用户重新登录
    if (timeUntilExpiry < 30 * 60 * 1000) {
      console.warn('Token即将过期，请重新登录');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Token验证失败:', error);
    return false;
  }
};

// 登出
export const logout = () => {
  removeToken();
  removeUser();
};