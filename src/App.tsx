import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import FileCenterModal from './components/FileCenterModal';
import type { UploadFile } from 'antd';
import type { RadioChangeEvent } from 'antd';
import './App.less';

const MAX_CONCURRENT_UPLOADS = 4;

interface UploadedFile {
  name: string;
  url: string;
}

const App: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [mode, setMode] = useState('list');

  const uploadQueue = useRef<any[]>([]);
  const activeUploads = useRef(0);

  const processQueue = useCallback(() => {
    while (activeUploads.current < MAX_CONCURRENT_UPLOADS && uploadQueue.current.length > 0) {
      const task = uploadQueue.current.shift();
      if (task) {
        activeUploads.current++;
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        performUpload(task);
      }
    }
  }, []);

  const performUpload = useCallback((task: any) => {
    const { file, onSuccess, onError, onProgress } = task;
    const formData = new FormData();
    formData.append('video', file as File);

    // The onUploadProgress handler is removed to stop tracking progress.
    axios.post('http://localhost:3001/upload', formData).then(response => {
      activeUploads.current--;
      // Manually set progress to 100% on success for AntD's internal state
      onProgress?.({ percent: 100 });
      onSuccess?.(response.data);
      processQueue();
    }).catch(error => {
      activeUploads.current--;
      onError?.(new Error(error.message || '网络错误或其他上传错误'));
      processQueue();
    });
  }, [processQueue]);

  const customUploadRequest = (options: any) => {
    uploadQueue.current.push(options);
    processQueue();
  };

  const fetchUploadedFiles = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:3001/files');
      setUploadedFiles(response.data);
    } catch (error) {
      message.error((error as Error).message || '获取文件列表失败');
    }
  }, []);

  const handleModeChange = (e: RadioChangeEvent) => {
    const newMode = e.target.value;
    setMode(newMode);
    if (newMode === 'list') {
      fetchUploadedFiles();
    }
  };

  const handleModalOpen = () => {
    setIsModalOpen(true);
    setMode('list');
    fetchUploadedFiles();
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  return (
    <div style={{ padding: '24px' }}>
      <Button type="primary" icon={<UploadOutlined />} onClick={handleModalOpen}>
        打开上传弹框
      </Button>

      <FileCenterModal
        open={isModalOpen}
        onClose={handleModalClose}
        mode={mode}
        handleModeChange={handleModeChange}
        fileList={fileList}
        setFileList={setFileList}
        uploadedFiles={uploadedFiles}
        customUploadRequest={customUploadRequest}
        uploadQueue={uploadQueue}
        maxConcurrentUploads={MAX_CONCURRENT_UPLOADS}
      />
    </div>
  );
};

export default App;