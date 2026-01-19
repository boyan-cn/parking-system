import React, { useState } from 'react';
import { Input, Card } from 'antd';

const MobileInputTest = () => {
  const [value, setValue] = useState('');

  return (
    <Card title="移动端输入测试" style={{ margin: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <label>原生输入框（无处理）：</label>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="请输入车牌号，如：京A12345"
          style={{ marginTop: 8 }}
        />
        <div style={{ marginTop: 4, fontSize: '12px', color: '#666' }}>
          当前值：{value}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label>移动端优化输入框：</label>
        <Input
          value={value}
          onChange={(e) => {
            const newValue = e.target.value.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').substring(0, 8);
            setValue(newValue);
          }}
          placeholder="请输入车牌号，如：京A12345"
          style={{ marginTop: 8 }}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
          inputMode="text"
        />
        <div style={{ marginTop: 4, fontSize: '12px', color: '#666' }}>
          处理后值：{value}
        </div>
      </div>

      <div style={{ fontSize: '12px', color: '#999' }}>
        <p>测试说明：</p>
        <ul>
          <li>请尝试输入汉字（如：京、沪、粤）</li>
          <li>请尝试输入字母（如：A、B、C）</li>
          <li>请尝试输入数字（如：1、2、3）</li>
          <li>请尝试输入特殊字符（应该被过滤）</li>
        </ul>
      </div>
    </Card>
  );
};

export default MobileInputTest;