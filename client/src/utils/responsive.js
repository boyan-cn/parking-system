import React from 'react';

// 响应式工具函数

// 检测是否为移动设备
export const isMobile = () => {
  return window.innerWidth <= 768;
};

// 检测是否为平板设备
export const isTablet = () => {
  return window.innerWidth > 768 && window.innerWidth <= 1024;
};

// 检测是否为桌面设备
export const isDesktop = () => {
  return window.innerWidth > 1024;
};

// 获取设备类型
export const getDeviceType = () => {
  if (isMobile()) return 'mobile';
  if (isTablet()) return 'tablet';
  return 'desktop';
};

// 响应式Hook
export const useResponsive = () => {
  const [deviceType, setDeviceType] = React.useState(getDeviceType());

  React.useEffect(() => {
    const handleResize = () => {
      setDeviceType(getDeviceType());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    deviceType
  };
};

// 移动端检测Hook
export const useMobile = () => {
  const [isMobileDevice, setIsMobileDevice] = React.useState(isMobile());

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobileDevice(isMobile());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobileDevice;
};

// 获取响应式的组件尺寸
export const getResponsiveSize = () => {
  if (isMobile()) return 'large';
  return 'middle';
};

// 获取响应式的栅格配置
export const getResponsiveGrid = () => {
  return {
    xs: 24,
    sm: 12,
    md: 8,
    lg: 6,
    xl: 4,
    xxl: 3
  };
};