import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Descriptions, Alert, Badge, Modal, Form, Upload, message, Row, Col } from 'antd';
import { SearchOutlined, CameraOutlined, UploadOutlined } from '@ant-design/icons';
import { getUser, getToken } from '../utils/auth';
import api from '../utils/api';

const { TextArea } = Input;

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const [vehicleInfo, setVehicleInfo] = useState(null);
  const [licensePlate, setLicensePlate] = useState('');
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportForm] = Form.useForm();

  // 移动端检测
  const isMobile = window.innerWidth <= 768;

  // 调试信息
  useEffect(() => {
    const user = getUser();
    const token = getToken();
    console.log('当前用户信息:', user);
    console.log('当前token:', token ? 'exists' : 'missing');
  }, []);

  const searchVehicle = async () => {
    if (!licensePlate.trim()) {
      message.warning('请输入车牌号');
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/vehicles/check/${licensePlate}`);
      setVehicleInfo(response.data);
    } catch (error) {
      console.error('查询失败:', error);
      setVehicleInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReport = () => {
    if (!vehicleInfo?.isOwner) {
      message.warning('只能举报业主车辆');
      return;
    }
    
    if (vehicleInfo?.hasReportedToday) {
      message.warning('您今天已经举报过该车辆，每天只能举报同一车辆一次');
      return;
    }
    
    setReportModalVisible(true);
    reportForm.setFieldsValue({ license_plate: licensePlate });
  };

  const submitReport = async (values) => {
    try {
      const formData = new FormData();
      Object.keys(values).forEach(key => {
        if (key === 'photo' && values[key]?.fileList?.length > 0) {
          formData.append('photo', values[key].fileList[0].originFileObj);
        } else if (values[key] !== undefined && values[key] !== null && values[key] !== '') {
          formData.append(key, values[key]);
        }
      });

      // 确保必填字段存在
      if (!formData.has('license_plate')) {
        formData.append('license_plate', licensePlate);
      }
      if (!formData.has('location')) {
        message.error('请填写违停位置');
        return;
      }
      
      // 描述字段可选，如果为空则设置为空字符串
      if (!formData.has('description')) {
        formData.append('description', '');
      }

      console.log('提交的表单数据:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const response = await api.post('/violations/report', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      message.success('违停记录上传成功');
      setReportModalVisible(false);
      reportForm.resetFields();
      // 重新查询车辆信息以更新违停次数
      searchVehicle();
    } catch (error) {
      console.error('上传失败:', error);
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('上传失败，请重试');
      }
    }
  };

  const uploadProps = {
    beforeUpload: () => false, // 阻止自动上传
    maxCount: 1,
    accept: 'image/*',
  };

  return (
    <div>
      <Card 
        title="车辆查询" 
        style={{ marginBottom: isMobile ? 16 : 24 }}
        bodyStyle={{ padding: isMobile ? 16 : 24 }}
      >
        <div style={{ 
          marginBottom: 16, 
          padding: 12, 
          background: '#f0f9ff', 
          border: '1px solid #91d5ff', 
          borderRadius: 6 
        }}>
          <p style={{ margin: 0, color: '#1890ff', fontSize: isMobile ? '12px' : '14px' }}>
            💡 提示：系统支持查询共享车位的多个车牌号
          </p>
        </div>
        
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={18}>
            <Input
              placeholder="请输入车牌号"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
              onPressEnter={searchVehicle}
              size={isMobile ? 'large' : 'middle'}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Button 
              type="primary" 
              icon={<SearchOutlined />}
              onClick={searchVehicle}
              loading={loading}
              size={isMobile ? 'large' : 'middle'}
              block={isMobile}
            >
              查询
            </Button>
          </Col>
        </Row>

        {vehicleInfo && (
          <div style={{ marginTop: 16 }}>
            {vehicleInfo.isOwner ? (
              <Alert
                message="业主车辆"
                description={
                  <div>
                    <div>该车辆属于业主，违停次数：{vehicleInfo.violationCount}次</div>
                    {vehicleInfo.hasReportedToday && (
                      <div style={{ color: '#faad14', marginTop: 4 }}>
                        ⚠️ 您今天已经举报过该车辆
                      </div>
                    )}
                  </div>
                }
                type="success"
                showIcon
                style={{ marginBottom: 16 }}
                action={
                  <Button 
                    size={isMobile ? 'large' : 'small'}
                    type="primary" 
                    icon={<CameraOutlined />}
                    onClick={handleReport}
                    disabled={vehicleInfo.hasReportedToday}
                  >
                    {vehicleInfo.hasReportedToday ? '今日已举报' : '举报违停'}
                  </Button>
                }
              />
            ) : (
              <Alert
                message="非业主车辆"
                description="该车牌不属于业主车辆"
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            {vehicleInfo.isOwner && (
              <Card title="车辆信息" size="small">
                <Descriptions 
                  column={isMobile ? 1 : 2}
                  size={isMobile ? 'small' : 'default'}
                >
                  <Descriptions.Item label="车牌号">{vehicleInfo.vehicle.license_plate}</Descriptions.Item>
                  <Descriptions.Item label="车主姓名">{vehicleInfo.vehicle.owner_name}</Descriptions.Item>
                  <Descriptions.Item label="联系电话">{vehicleInfo.vehicle.phone}</Descriptions.Item>
                  <Descriptions.Item label="楼号">{vehicleInfo.vehicle.building_number}</Descriptions.Item>
                  <Descriptions.Item label="单元号">{vehicleInfo.vehicle.unit_number}</Descriptions.Item>
                  <Descriptions.Item label="车位号">{vehicleInfo.vehicle.parking_space}</Descriptions.Item>
                  <Descriptions.Item label="违停次数">
                    <Badge count={vehicleInfo.violationCount} showZero />
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}
          </div>
        )}
      </Card>

      <Modal
        title="举报违停"
        open={reportModalVisible}
        onCancel={() => setReportModalVisible(false)}
        footer={null}
        width={isMobile ? '90%' : 600}
        style={isMobile ? { top: 20 } : {}}
      >
        <div style={{ 
          marginBottom: 16, 
          padding: 12, 
          background: '#f6ffed', 
          border: '1px solid #b7eb8f', 
          borderRadius: 6 
        }}>
          <p style={{ margin: 0, color: '#52c41a', fontSize: isMobile ? '12px' : '14px' }}>
            📋 温馨提示：每天只能举报同一车辆一次违停行为
          </p>
        </div>
        
        <Form
          form={reportForm}
          layout="vertical"
          onFinish={submitReport}
        >
          <Form.Item
            name="license_plate"
            label="车牌号"
          >
            <Input disabled size={isMobile ? 'large' : 'middle'} />
          </Form.Item>

          <Form.Item
            name="location"
            label="违停位置"
            rules={[{ required: true, message: '请输入违停位置' }]}
          >
            <Input 
              placeholder="如：小区门口、消防通道等" 
              size={isMobile ? 'large' : 'middle'}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="违停描述"
          >
            <TextArea 
              rows={3} 
              placeholder="请描述违停情况（可选）" 
              size={isMobile ? 'large' : 'middle'}
            />
          </Form.Item>

          <Form.Item
            name="photo"
            label="违停照片"
            rules={[{ required: true, message: '请上传违停照片' }]}
          >
            <Upload {...uploadProps}>
              <Button 
                icon={<UploadOutlined />}
                size={isMobile ? 'large' : 'middle'}
                block={isMobile}
              >
                选择照片
              </Button>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Row gutter={[8, 8]}>
              <Col xs={12} sm={12}>
                <Button 
                  onClick={() => setReportModalVisible(false)}
                  size={isMobile ? 'large' : 'middle'}
                  block
                >
                  取消
                </Button>
              </Col>
              <Col xs={12} sm={12}>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  size={isMobile ? 'large' : 'middle'}
                  block
                >
                  提交举报
                </Button>
              </Col>
            </Row>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Dashboard;