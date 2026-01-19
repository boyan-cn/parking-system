import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Drawer } from 'antd';
import { UserOutlined, CarOutlined, FileTextOutlined, LogoutOutlined, MenuOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUser, logout } from '../utils/auth';
import { useMobile } from '../utils/responsive';

const { Header, Sider, Content } = Layout;

const AppLayout = ({ children }) => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const isMobile = useMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <CarOutlined />,
      label: '车辆查询',
    },
    {
      key: '/violations',
      icon: <FileTextOutlined />,
      label: '违停记录',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '个人设置',
    },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
    setDrawerVisible(false); // 移动端点击菜单后关闭抽屉
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '个人设置',
      onClick: () => navigate('/settings'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 桌面端侧边栏 */}
      {!isMobile && (
        <Sider theme="dark" width={200} breakpoint="lg" collapsedWidth="0">
          <div className="logo">
            违停管理
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
          />
        </Sider>
      )}

      {/* 移动端抽屉菜单 */}
      {isMobile && (
        <Drawer
          title="菜单"
          placement="left"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          bodyStyle={{ padding: 0 }}
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            style={{ border: 'none' }}
          />
        </Drawer>
      )}

      <Layout>
        <Header style={{ 
          background: '#fff', 
          padding: isMobile ? '0 16px' : '0 24px', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {/* 移动端菜单按钮 */}
            {isMobile && (
              <Button 
                type="text" 
                icon={<MenuOutlined />} 
                onClick={() => setDrawerVisible(true)}
                style={{ marginRight: 16 }}
              />
            )}
            <h2 style={{ 
              margin: 0, 
              fontSize: isMobile ? '16px' : '20px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {isMobile ? '违停管理' : '小区车辆违停管理系统'}
            </h2>
          </div>
          
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Button type="text" style={{ display: 'flex', alignItems: 'center' }}>
              <Avatar size="small" icon={<UserOutlined />} />
              {!isMobile && <span style={{ marginLeft: 8 }}>{user?.username}</span>}
            </Button>
          </Dropdown>
        </Header>
        <Content style={{ 
          margin: isMobile ? '16px' : '24px', 
          background: '#fff', 
          padding: isMobile ? '16px' : '24px',
          borderRadius: '8px'
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;