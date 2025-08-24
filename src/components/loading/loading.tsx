import {Spin} from 'antd';
import {LoadingOutlined} from '@ant-design/icons';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center">
      <Spin
        indicator={<LoadingOutlined spin />}
        className="text-secondary"
        size="large">
        <div className="mt-4 text-secondary">Loading...</div>
      </Spin>
    </div>
  );
}
