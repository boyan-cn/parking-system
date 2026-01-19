import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Modal, Form, Upload, message, Row, Col } from 'antd';
import { SearchOutlined, CameraOutlined, UploadOutlined, CarOutlined } from '@ant-design/icons';
import { getUser, getToken } from '../utils/auth';
import { useMobile } from '../utils/responsive';
import { formatLicensePlateInput, formatLicensePlate, getLicensePlateHint, handleMobileLicensePlateInput, finalizeLicensePlateInput } from '../utils/licensePlate';
import api from '../utils/api';
import '../styles/mobile.css';

const { TextArea } = Input;

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const [vehicleInfo, setVehicleInfo] = useState(null);
  const [licensePlate, setLicensePlate] = useState('');
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportForm] = Form.useForm();

  // 移动端检测
  const isMobile = useMobile();

  // 调试信息
  useEffect(() => {
    const user = getUser();
    const token = getToken();
    console.log('当前用户信息:', user);
    console.log('当前token:', token ? 'exists' : 'missing');
    
    // 检查token是否有效
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token payload:', payload);
        console.log('Token expires at:', new Date(payload.exp * 1000));
        console.log('Current time:', new Date());
        console.log('Token valid:', payload.exp * 1000 > Date.now());
      } catch (error) {
        console.error('Token解析错误:', error);
      }
    }
  }, []);

  const searchVehicle = async () => {
    const formattedPlate = formatLicensePlate(licensePlate);
    if (!formattedPlate.trim()) {
      message.warning('请输入车牌号');
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/vehicles/check/${formattedPlate}`);
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
    reportForm.setFieldsValue({ license_plate: formatLicensePlate(licensePlate) });
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
      <Card title="车辆查询" style={{ marginBottom: 24 }}>
        <div style={{ 
          marginBottom: 16, 
          padding: 12, 
          background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%)', 
          border: '1px solid #91d5ff', 
          borderRadius: 8 
        }}>
          <p style={{ margin: 0, color: '#1890ff', fontSize: isMobile ? '12px' : '14px' }}>
            💡 提示：系统支持查询共享车位的多个车牌号
            {isMobile && <span style={{ display: 'block', marginTop: 4 }}>📱 移动端请使用中文输入法输入汉字</span>}
          </p>
        </div>
        
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={18}>
            <div>
              <Input
                placeholder="请输入车牌号，如：京A12345"
                value={licensePlate}
                onChange={(e) => {
                  const newValue = isMobile 
                    ? handleMobileLicensePlateInput(e.target.value, true)
                    : formatLicensePlateInput(e.target.value, licensePlate);
                  setLicensePlate(newValue);
                }}
                onBlur={(e) => {
                  // 输入完成时最终格式化
                  if (isMobile) {
                    const finalValue = finalizeLicensePlateInput(e.target.value);
                    setLicensePlate(finalValue);
                  }
                }}
                onPressEnter={searchVehicle}
                size={isMobile ? 'large' : 'middle'}
                className="mobile-input"
                style={{
                  borderRadius: 8,
                  fontSize: isMobile ? '16px' : '14px'
                }}
                maxLength={8}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
              />
              {licensePlate && (
                <div style={{ 
                  fontSize: '12px', 
                  color: licensePlate.length >= 6 ? '#52c41a' : '#faad14',
                  marginTop: 4 
                }}>
                  {getLicensePlateHint(licensePlate)}
                </div>
              )}
            </div>
          </Col>
          <Col xs={24} sm={6}>
            <Button 
              type="primary" 
              icon={<SearchOutlined />}
              onClick={searchVehicle}
              loading={loading}
              size={isMobile ? 'large' : 'middle'}
              block={isMobile}
              className="mobile-button"
              style={{
                borderRadius: 8,
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                border: 'none'
              }}
            >
              查询
            </Button>
          </Col>
        </Row>

        {vehicleInfo && (
          <div>
            {vehicleInfo.isOwner ? (
              <>
                {/* 业主车辆状态卡片 */}
                <div className="mobile-vehicle-card gradient-bg" style={{
                  background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 16,
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    width: 80,
                    height: 80,
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '50%'
                  }} />
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 8
                    }}>
                      <span style={{ color: '#52c41a', fontSize: '14px' }}>✓</span>
                    </div>
                    <span style={{ fontSize: '18px', fontWeight: 'bold' }}>业主车辆</span>
                  </div>
                  <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: 12 }}>
                    该车辆属于业主，违停次数：{vehicleInfo.violationCount}次
                  </div>
                  {vehicleInfo.hasReportedToday && (
                    <div style={{
                      background: 'rgba(255,193,7,0.2)',
                      padding: '6px 12px',
                      borderRadius: 20,
                      fontSize: '12px',
                      display: 'inline-block',
                      marginBottom: 12
                    }}>
                      ⚠️ 您今天已经举报过该车辆
                    </div>
                  )}
                  <Button 
                    type="primary"
                    ghost
                    icon={<CameraOutlined />}
                    onClick={handleReport}
                    disabled={vehicleInfo.hasReportedToday}
                    size="large"
                    className="mobile-button"
                    style={{
                      borderColor: 'white',
                      color: 'white',
                      fontWeight: 'bold',
                      borderRadius: 8,
                      width: '100%'
                    }}
                  >
                    {vehicleInfo.hasReportedToday ? '今日已举报' : '举报违停'}
                  </Button>
                </div>

                {/* 车辆详细信息卡片 */}
                <Card 
                  className="mobile-vehicle-card"
                  title={
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <CarOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                      <span>车辆信息</span>
                    </div>
                  }
                  style={{ borderRadius: 12, overflow: 'hidden' }}
                  bodyStyle={{ padding: isMobile ? 16 : 24 }}
                >
                  <div style={{ display: 'grid', gap: 16 }}>
                    {/* 车牌号 - 突出显示 */}
                    <div style={{
                      background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                      borderRadius: 8,
                      padding: 16,
                      textAlign: 'center'
                    }}>
                      <div style={{ color: 'white', fontSize: '12px', opacity: 0.8, marginBottom: 4 }}>
                        车牌号码
                      </div>
                      <div style={{ 
                        color: 'white', 
                        fontSize: isMobile ? '24px' : '20px', 
                        fontWeight: 'bold',
                        letterSpacing: '2px'
                      }}>
                        {vehicleInfo.vehicle.license_plate}
                      </div>
                    </div>

                    {/* 车主信息 */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                      gap: 16
                    }}>
                      <div style={{
                        background: '#f8f9fa',
                        borderRadius: 8,
                        padding: 12,
                        border: '1px solid #e9ecef'
                      }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>车主姓名</div>
                        <div style={{ fontSize: '16px', fontWeight: '500', color: '#333' }}>
                          {vehicleInfo.vehicle.owner_name}
                        </div>
                      </div>

                      <div style={{
                        background: '#f8f9fa',
                        borderRadius: 8,
                        padding: 12,
                        border: '1px solid #e9ecef'
                      }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>联系电话</div>
                        <div style={{ fontSize: '16px', fontWeight: '500', color: '#333' }}>
                          {vehicleInfo.vehicle.phone}
                        </div>
                      </div>

                      <div style={{
                        background: '#f8f9fa',
                        borderRadius: 8,
                        padding: 12,
                        border: '1px solid #e9ecef'
                      }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>楼号单元</div>
                        <div style={{ fontSize: '16px', fontWeight: '500', color: '#333' }}>
                          {vehicleInfo.vehicle.building_number}栋{vehicleInfo.vehicle.unit_number}单元
                        </div>
                      </div>

                      <div style={{
                        background: '#f8f9fa',
                        borderRadius: 8,
                        padding: 12,
                        border: '1px solid #e9ecef'
                      }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>车位号</div>
                        <div style={{ fontSize: '16px', fontWeight: '500', color: '#333' }}>
                          {vehicleInfo.vehicle.parking_space}
                        </div>
                      </div>
                    </div>

                    {/* 违停统计 */}
                    <div style={{
                      background: vehicleInfo.violationCount > 0 ? '#fff2e8' : '#f6ffed',
                      borderRadius: 8,
                      padding: 16,
                      border: `1px solid ${vehicleInfo.violationCount > 0 ? '#ffbb96' : '#b7eb8f'}`,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: 8 }}>违停次数</div>
                      <div className={vehicleInfo.violationCount > 0 ? "violation-count" : ""} style={{
                        fontSize: '32px',
                        fontWeight: 'bold',
                        color: vehicleInfo.violationCount > 0 ? '#fa8c16' : '#52c41a'
                      }}>
                        {vehicleInfo.violationCount}
                      </div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        {vehicleInfo.violationCount === 0 ? '暂无违停记录' : '次违停记录'}
                      </div>
                    </div>
                  </div>
                </Card>
              </>
            ) : (
              <div className="mobile-vehicle-card" style={{
                background: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)',
                borderRadius: 12,
                padding: 20,
                textAlign: 'center',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: -30,
                  right: -30,
                  width: 100,
                  height: 100,
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '50%'
                }} />
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  fontSize: '24px'
                }}>
                  ⚠️
                </div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: 8 }}>
                  非业主车辆
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>
                  该车牌不属于业主车辆
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      <Modal
        title="举报违停"
        open={reportModalVisible}
        onCancel={() => setReportModalVisible(false)}
        footer={null}
        width={600}
      >
        <div style={{ marginBottom: 16, padding: 12, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
          <p style={{ margin: 0, color: '#52c41a' }}>
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
            <Input disabled />
          </Form.Item>

          <Form.Item
            name="location"
            label="违停位置"
            rules={[{ required: true, message: '请输入违停位置' }]}
          >
            <Input placeholder="如：小区门口、消防通道等" />
          </Form.Item>

          <Form.Item
            name="description"
            label="违停描述"
          >
            <TextArea 
              rows={3} 
              placeholder="请描述违停情况（可选）" 
            />
          </Form.Item>

          <Form.Item
            name="photo"
            label="违停照片"
            rules={[{ required: true, message: '请上传违停照片' }]}
          >
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>选择照片</Button>
            </Upload>
          </Form.Item>

          <Form.Item>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button onClick={() => setReportModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                提交举报
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Dashboard;