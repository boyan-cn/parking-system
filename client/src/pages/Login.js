import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Tabs, message } from 'antd';
import { UserOutlined, LockOutlined, PhoneOutlined, HomeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { setToken, setUser } from '../utils/auth';
import { useMobile } from '../utils/responsive';
import api from '../utils/api';

const { TabPane } = Tabs;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const isMobile = useMobile();
  const navigate = useNavigate();

  const onLogin = async (values) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', values);
      const { token, user } = response.data;
      
      setToken(token);
      setUser(user);
      message.success('登录成功');
      navigate('/dashboard');
    } catch (error) {
      console.error('登录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (values) => {
    setLoading(true);
    try {
      await api.post('/auth/register', values);
      message.success('注册成功，请登录');
    } catch (error) {
      console.error('注册失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: isMobile ? '20px' : '0'
    }}>
      <Card style={{ 
        width: isMobile ? '100%' : 400, 
        maxWidth: 400,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)' 
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ 
            fontSize: isMobile ? '18px' : '24px',
            margin: 0
          }}>
            小区违停管理系统
          </h1>
        </div>
        
        <Tabs defaultActiveKey="login" centered>
          <TabPane tab="登录" key="login">
            <Form
              name="login"
              onFinish={onLogin}
              autoComplete="off"
              layout="vertical"
            >
              <Form.Item
                name="username"
                rules={[{ required: true, message: '请输入用户名!' }]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="用户名" 
                  size={isMobile ? 'large' : 'middle'}
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入密码!' }]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="密码" 
                  size={isMobile ? 'large' : 'middle'}
                />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  size={isMobile ? 'large' : 'middle'}
                  block
                >
                  登录
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane tab="注册" key="register">
            <Form
              name="register"
              onFinish={onRegister}
              autoComplete="off"
              layout="vertical"
            >
              <Form.Item
                name="username"
                rules={[{ required: true, message: '请输入用户名!' }]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="用户名" 
                  size={isMobile ? 'large' : 'middle'}
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入密码!' }]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="密码" 
                  size={isMobile ? 'large' : 'middle'}
                />
              </Form.Item>

              <Form.Item
                name="phone"
                rules={[{ required: true, message: '请输入手机号!' }]}
              >
                <Input 
                  prefix={<PhoneOutlined />} 
                  placeholder="手机号" 
                  size={isMobile ? 'large' : 'middle'}
                />
              </Form.Item>

              <Form.Item
                name="building_number"
                rules={[{ required: true, message: '请输入楼号!' }]}
              >
                <Input 
                  prefix={<HomeOutlined />} 
                  placeholder="楼号" 
                  size={isMobile ? 'large' : 'middle'}
                />
              </Form.Item>

              <Form.Item
                name="unit_number"
                rules={[{ required: true, message: '请输入单元号!' }]}
              >
                <Input 
                  prefix={<HomeOutlined />} 
                  placeholder="单元号" 
                  size={isMobile ? 'large' : 'middle'}
                />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  size={isMobile ? 'large' : 'middle'}
                  block
                >
                  注册
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default Login;