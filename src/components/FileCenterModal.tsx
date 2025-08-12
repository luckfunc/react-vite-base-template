import React from 'react';
import { Modal, Button, Upload, message, Tag, Radio, List } from 'antd';
import { UploadOutlined, VideoCameraOutlined, PlayCircleOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import type { RadioChangeEvent } from 'antd';

interface UploadedFile {
  name: string;
  url: string;
}

interface FileCenterModalProps {
  open: boolean;
  onClose: () => void;
  mode: string;
  handleModeChange: (e: RadioChangeEvent) => void;
  fileList: UploadFile[];
  onFileListChange: (fileList: UploadFile[]) => void;
  uploadedFiles: UploadedFile[];
  customUploadRequest: (options: any) => void;
  uploadQueue: React.MutableRefObject<any[]>;
  maxConcurrentUploads: number;
  onUploadSuccess?: (fileInfo: UploadedFile) => void;
  associatedVideo: UploadedFile | null | undefined;
}

const FileCenterModal: React.FC<FileCenterModalProps> = ({
  open,
  onClose,
  mode,
  handleModeChange,
  fileList,
  onFileListChange,
  customUploadRequest,
  uploadQueue,
  maxConcurrentUploads,
  onUploadSuccess,
  associatedVideo,
}) => {
  const renderUploadMode = () => (
    <>
      <Upload.Dragger
        multiple
        accept="video/*"
        customRequest={customUploadRequest}
        showUploadList={false}
        onChange={(info) => {
          onFileListChange(info.fileList);

          if (info.file.status === 'done') {
            message.success(`${info.file.name} 上传成功`);
            if (onUploadSuccess) {
              onUploadSuccess(info.file.response);
            }
          } else if (info.file.status === 'error') {
            message.error(`${info.file.name} 上传失败`);
          }
        }}
        fileList={fileList}
        onRemove={(file) => {
          const newFileList = fileList.filter((item) => item.uid !== file.uid);
          onFileListChange(newFileList);
          uploadQueue.current = uploadQueue.current.filter((task) => task.file !== file);
        }}
      >
        <p className="ant-upload-drag-icon"><UploadOutlined /></p>
        <p className="ant-upload-text">点击或拖拽视频文件到此区域进行上传</p>
        <p className="ant-upload-hint">支持多个文件，并发上传数为 {maxConcurrentUploads}。关闭弹窗不会中断上传。</p>
      </Upload.Dragger>

      <h3 style={{ marginTop: '24px' }}>上传任务列表</h3>
      <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid #f0f0f0', padding: '16px', borderRadius: '8px', marginTop: '16px' }}>
        {fileList.length === 0 ? (
          <p>暂无上传任务</p>
        ) : (
          fileList.map((file) => (
            <div key={file.uid} style={{ marginBottom: '12px' }}>
              <div>
                <VideoCameraOutlined style={{ marginRight: '8px' }} />
                <span>{file.name}</span>
                <span style={{ marginLeft: '16px' }}>
                  {file.status === 'uploading' && <Tag color="processing">上传中</Tag>}
                  {file.status === 'done' && <Tag color="success">成功</Tag>}
                  {file.status === 'error' && <Tag color="error">失败</Tag>}
                  {file.status === 'waiting' && <Tag color="default">等待中</Tag>}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );

  const renderListMode = () => (
    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
      <List
        header={<div>已关联的视频</div>}
        bordered
        dataSource={associatedVideo ? [associatedVideo] : []}
        renderItem={(item) => (
          <List.Item
            actions={[
              <a href={`http://localhost:3001${item.url}`} target="_blank" rel="noopener noreferrer">
                <PlayCircleOutlined /> 播放
              </a>,
            ]}
          >
            {item.name}
          </List.Item>
        )}
        locale={{ emptyText: '当前任务暂未关联视频' }}
      />
    </div>
  );

  return (
    <Modal
      title="文件中心"
      open={open}
      onCancel={onClose}
      footer={[<Button key="close" onClick={onClose}>关闭</Button>]} // 保持只有关闭按钮
      width={600}
    >
      <Radio.Group onChange={handleModeChange} value={mode} style={{ marginBottom: 16 }}>
        <Radio.Button value="list">查看已上传</Radio.Button>
        <Radio.Button value="upload">上传新文件</Radio.Button>
      </Radio.Group>

      {mode === 'upload' ? renderUploadMode() : renderListMode()}
    </Modal>
  );
};

export default FileCenterModal;
