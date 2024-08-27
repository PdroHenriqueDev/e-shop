import {Spin} from 'antd';
import {LoadingOutlined} from '@ant-design/icons';

export default function Loading() {
  return (
    <Spin
      indicator={<LoadingOutlined spin />}
      tip="loading"
      className="text-secondary"
      size="large"
    />
  );
}
