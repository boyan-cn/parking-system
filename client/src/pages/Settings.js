import React, { useState } from 'react';
import { Card, Form, Input, Button, message, Divider, Descriptions } from 'antd';
import { LockOutlined, UserOutlined, PhoneOutlined, HomeOutlined } from '@ant-design/icons';
import { getUser } from '../utils/auth';
import { useMobile } from '../utils/responsive';
import api from '../utils/api';
import '../styles/mobile.css';

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [passwordForm] = Form.useForm();
  const isMobile = useMobile();
  const user = getUser();

  const handleChangePassword = async (values) => {
    const { oldPassword, newPassword, confirmPassword } = values;

    if (newPassword !== confirmPassword) {
      message.error('两次输入的新密码不一致');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        oldPassword,
        newPassword
      });

      message.success('密码修改成功');
      passwordForm.resetFields();
    } catch (error) {
      console.error('修改密码失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* 用户信息卡片 */}
      <Card 
        className="settings-card mobile-vehicle-card"
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <UserOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            <span>个人信息</span>
          </div>
        }
        style={{ 
          marginBottom: isMobile ? 16 : 24,
          borderRadius: 12,
          overflow: 'hidden'
        }}
        bodyStyle={{ padding: isMobile ? 16 : 24 }}
      >
        <div style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          borderRadius: 8,
          padding: 16,
          marginBottom: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <div className="settings-avatar" style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16,
              color: 'white',
              fontSize: '20px',
              fontWeight: 'bold'
            }}>
              {user?.username?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
                {user?.username}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                用户账号
              </div>
            </div>
          </div>
        </div>

        <Descriptions 
          column={isMobile ? 1 : 2}
          size={isMobile ? 'small' : 'default'}
        >
          <Descriptions.Item 
            label={
              <span>
                <PhoneOutlined style={{ marginRight: 4, color: '#52c41a' }} />
                联系电话
              </span>
            }
          >
            {user?.phone || '未设置'}
          </Descriptions.Item>
          <Descriptions.Item 
            label={
              <span>
                <HomeOutlined style={{ marginRight: 4, color: '#fa8c16' }} />
                楼号单元
              </span>
            }
          >
            {user?.building_number && user?.unit_number 
              ? `${user.building_number}栋${user.unit_number}单元`
              : '未设置'
            }
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 修改密码卡片 */}
      <Card 
        className="settings-card mobile-vehicle-card"
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <LockOutlined style={{ marginRight: 8, color: '#fa541c' }} />
            <span>修改密码</span>
          </div>
        }
        style={{ 
          borderRadius: 12,
          overflow: 'hidden'
        }}
        bodyStyle={{ padding: isMobile ? 16 : 24 }}
      >
        <div style={{
          background: '#fff7e6',
          border: '1px solid #ffd591',
          borderRadius: 8,
          padding: 12,
          marginBottom: 24
        }}>
          <p style={{ margin: 0, color: '#fa8c16', fontSize: isMobile ? '12px' : '14px' }}>
            🔒 为了账户安全，请定期更换密码。新密码长度至少6位。
          </p>
        </div>

        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
          autoComplete="off"
        >
          <Form.Item
            className="settings-form-item"
            name="oldPassword"
            label="当前密码"
            rules={[
              { required: true, message: '请输入当前密码' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入当前密码"
              size={isMobile ? 'large' : 'middle'}
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度至少6位' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入新密码（至少6位）"
              size={isMobile ? 'large' : 'middle'}
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请再次输入新密码"
              size={isMobile ? 'large' : 'middle'}
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size={isMobile ? 'large' : 'middle'}
              block={isMobile}
              className="mobile-button"
              style={{
                borderRadius: 8,
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #fa541c 0%, #ff7a45 100%)',
                border: 'none'
              }}
            >
              修改密码
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Settings;