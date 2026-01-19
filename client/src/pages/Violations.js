import React, { useState, useEffect } from 'react';
import { Table, Card, Input, Button, Image, Popconfirm, message, Space, Row, Col } from 'antd';
import { SearchOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { getUser } from '../utils/auth';
import { getImageUrl } from '../utils/image';
import { useMobile } from '../utils/responsive';
import { formatLicensePlateInput, formatLicensePlate, getLicensePlateHint, handleMobileLicensePlateInput, finalizeLicensePlateInput } from '../utils/licensePlate';
import api from '../utils/api';

const Violations = () => {
  const [loading, setLoading] = useState(false);
  const [violations, setViolations] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchLicense, setSearchLicense] = useState('');
  const isMobile = useMobile();
  const user = getUser();

  const fetchViolations = async (page = 1, license = '') => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.pageSize,
      };
      if (license) {
        params.license_plate = license;
      }

      const response = await api.get('/violations/list', { params });
      const { violations, total } = response.data;

      setViolations(violations);
      setPagination(prev => ({
        ...prev,
        current: page,
        total,
      }));
    } catch (error) {
      console.error('获取违停记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViolations();
  }, []);

  const handleSearch = () => {
    const formattedPlate = formatLicensePlate(searchLicense);
    fetchViolations(1, formattedPlate);
  };

  const handleReset = () => {
    setSearchLicense('');
    fetchViolations(1, '');
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/violations/${id}`);
      message.success('删除成功');
      fetchViolations(pagination.current, searchLicense);
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const handleTableChange = (paginationInfo) => {
    const formattedPlate = formatLicensePlate(searchLicense);
    fetchViolations(paginationInfo.current, formattedPlate);
  };

  // 移动端卡片视图
  const renderMobileCard = (record) => (
    <Card 
      key={record.id}
      size="small"
      style={{ marginBottom: 16 }}
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{record.license_plate}</span>
          {record.reporter_name === user?.username && (
            <Popconfirm
              title="确定要删除这条记录吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button 
                type="text" 
                danger 
                size="small"
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          )}
        </div>
      }
    >
      <Row gutter={[16, 8]}>
        <Col span={12}>
          <div style={{ fontSize: '12px', color: '#666' }}>车主信息</div>
          <div>{record.owner_name || '未知'}</div>
          {record.building_number && record.unit_number && (
            <div style={{ fontSize: '12px', color: '#999' }}>
              {record.building_number}栋{record.unit_number}单元
            </div>
          )}
        </Col>
        <Col span={12}>
          <div style={{ fontSize: '12px', color: '#666' }}>违停位置</div>
          <div>{record.location}</div>
        </Col>
        {record.description && (
          <Col span={24}>
            <div style={{ fontSize: '12px', color: '#666' }}>违停描述</div>
            <div style={{ fontSize: '14px' }}>{record.description}</div>
          </Col>
        )}
        <Col span={12}>
          <div style={{ fontSize: '12px', color: '#666' }}>违停照片</div>
          {record.photo_url ? (
            <Image
              width={80}
              height={60}
              src={getImageUrl(record.photo_url)}
              style={{ objectFit: 'cover', borderRadius: 4, marginTop: 4 }}
              preview={{
                mask: <EyeOutlined />,
              }}
              onError={(e) => {
                console.error('图片加载失败:', getImageUrl(record.photo_url));
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <span style={{ color: '#ccc', fontSize: '12px' }}>无照片</span>
          )}
        </Col>
        <Col span={12}>
          <div style={{ fontSize: '12px', color: '#666' }}>举报信息</div>
          <div style={{ fontSize: '14px' }}>{record.reporter_name}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            {new Date(record.violation_time).toLocaleString('zh-CN')}
          </div>
        </Col>
      </Row>
    </Card>
  );

  const columns = [
    {
      title: '车牌号',
      dataIndex: 'license_plate',
      key: 'license_plate',
      width: 120,
    },
    {
      title: '车主信息',
      key: 'owner_info',
      width: 150,
      render: (_, record) => (
        <div>
          <div>{record.owner_name || '未知'}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.building_number && record.unit_number 
              ? `${record.building_number}栋${record.unit_number}单元`
              : ''}
          </div>
        </div>
      ),
    },
    {
      title: '违停位置',
      dataIndex: 'location',
      key: 'location',
      width: 120,
    },
    {
      title: '违停描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: 200,
    },
    {
      title: '违停照片',
      dataIndex: 'photo_url',
      key: 'photo_url',
      width: 100,
      render: (photo_url) => {
        const imageUrl = getImageUrl(photo_url);
        console.log('图片路径:', photo_url, '完整URL:', imageUrl);
        
        return photo_url ? (
          <Image
            width={60}
            height={40}
            src={imageUrl}
            style={{ objectFit: 'cover', borderRadius: 4 }}
            preview={{
              mask: <EyeOutlined />,
            }}
            onError={(e) => {
              console.error('图片加载失败:', imageUrl);
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <span style={{ color: '#ccc' }}>无照片</span>
        );
      },
    },
    {
      title: '举报人',
      dataIndex: 'reporter_name',
      key: 'reporter_name',
      width: 100,
    },
    {
      title: '举报时间',
      dataIndex: 'violation_time',
      key: 'violation_time',
      width: 150,
      render: (time) => new Date(time).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Space>
          {record.reporter_name === user?.username && (
            <Popconfirm
              title="确定要删除这条记录吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button 
                type="text" 
                danger 
                size="small"
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card title="违停记录管理">
      <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <div>
            <Input
              placeholder="输入车牌号搜索，如：京A12345"
              value={searchLicense}
              onChange={(e) => {
                const newValue = isMobile 
                  ? handleMobileLicensePlateInput(e.target.value, true)
                  : formatLicensePlateInput(e.target.value, searchLicense);
                setSearchLicense(newValue);
              }}
              onBlur={(e) => {
                // 输入完成时最终格式化
                if (isMobile) {
                  const finalValue = finalizeLicensePlateInput(e.target.value);
                  setSearchLicense(finalValue);
                }
              }}
              onPressEnter={handleSearch}
              size={isMobile ? 'large' : 'middle'}
              maxLength={8}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
            />
            {searchLicense && (
              <div style={{ 
                fontSize: '12px', 
                color: searchLicense.length >= 6 ? '#52c41a' : '#faad14',
                marginTop: 4 
              }}>
                {getLicensePlateHint(searchLicense)}
              </div>
            )}
          </div>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Button 
            type="primary" 
            icon={<SearchOutlined />}
            onClick={handleSearch}
            size={isMobile ? 'large' : 'middle'}
            block={isMobile}
          >
            搜索
          </Button>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Button 
            onClick={handleReset}
            size={isMobile ? 'large' : 'middle'}
            block={isMobile}
          >
            重置
          </Button>
        </Col>
      </Row>

      {isMobile ? (
        // 移动端卡片视图
        <div>
          {violations.map(renderMobileCard)}
          {violations.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
              暂无违停记录
            </div>
          )}
          {violations.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Button 
                onClick={() => handleTableChange({ current: pagination.current + 1 })}
                disabled={pagination.current * pagination.pageSize >= pagination.total}
                loading={loading}
              >
                加载更多
              </Button>
            </div>
          )}
        </div>
      ) : (
        // 桌面端表格视图
        <Table
          columns={columns}
          dataSource={violations}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
        />
      )}
    </Card>
  );
};

export default Violations;