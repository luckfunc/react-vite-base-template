import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { Button, message, List, Card, Tag } from 'antd';
import { UploadOutlined, PaperClipOutlined } from '@ant-design/icons';
import FileCenterModal from './components/FileCenterModal';
import type { UploadFile } from 'antd';
import type { RadioChangeEvent } from 'antd';
import './App.less';

const MAX_CONCURRENT_UPLOADS = 4;

interface UploadedFile {
  name: string;
  url: string;
}

interface ListItem {
  id: number;
  name: string;
  video: UploadedFile | null;
}

const App: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadLists, setUploadLists] = useState<Record<number, UploadFile[]>>({});
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [mode, setMode] = useState('list');
  const [currentItemId, setCurrentItemId] = useState<number | null>(null);
  const [items, setItems] = useState<ListItem[]>([
    { id: 1, name: '视频任务一', video: null },
    { id: 2, name: '视频任务二', video: null },
    { id: 3, name: '视频任务三', video: null },
  ]);

  const uploadQueue = useRef<any[]>([]);
  const activeUploads = useRef(0);

  const processQueue = useCallback(() => {
    while (activeUploads.current < MAX_CONCURRENT_UPLOADS && uploadQueue.current.length > 0) {
      const task = uploadQueue.current.shift();
      if (task) {
        activeUploads.current++;

        performUpload(task);
      }
    }
  }, []);

  const handleUploadSuccess = (fileInfo: UploadedFile, itemId: number) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        (item.id === itemId ? { ...item, video: fileInfo } : item)));
    if (itemId === currentItemId) {
      setMode('list');
      fetchUploadedFiles();
    }
  };

  const performUpload = useCallback((task: any) => {
    const { file, onSuccess, onError, onProgress, itemId } = task;
    const formData = new FormData();
    formData.append('video', file as File);

    axios.post('http://localhost:3001/upload', formData).then((response) => {
      activeUploads.current--;
      onProgress?.({ percent: 100 });
      onSuccess?.(response.data, file);
      handleUploadSuccess(response.data, itemId);
      processQueue();
    }).catch((error) => {
      activeUploads.current--;
      onError?.(new Error(error.message || '网络错误或其他上传错误'));
      processQueue();
    });
  }, [processQueue, currentItemId]);

  const customUploadRequest = (options: any) => {
    const taskWithOptions = { ...options, itemId: currentItemId };
    uploadQueue.current.push(taskWithOptions);
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

  const handleModalOpen = (id: number) => {
    setCurrentItemId(id);
    setIsModalOpen(true);
    const currentItem = items.find((item) => item.id === id);
    setMode(currentItem?.video ? 'list' : 'upload');
    fetchUploadedFiles();
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setCurrentItemId(null);
  };

  const handleFileListChange = (newFileList: UploadFile[]) => {
    if (currentItemId === null) return;
    setUploadLists((prevLists) => ({
      ...prevLists,
      [currentItemId]: newFileList,
    }));
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card title="视频任务列表">
        <List
          dataSource={items}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button
                  icon={<UploadOutlined />}
                  onClick={() => handleModalOpen(item.id)}
                >
                  上传/管理视频
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={item.name}
                description={
                  item.video ? (
                    <Tag icon={<PaperClipOutlined />} color="blue">
                      {item.video.name}
                    </Tag>
                  ) : (
                    '暂未上传视频'
                  )
                }
              />
            </List.Item>
          )}
        />
      </Card>

      <FileCenterModal
        open={isModalOpen}
        onClose={handleModalClose}
        mode={mode}
        handleModeChange={handleModeChange}
        fileList={currentItemId ? uploadLists[currentItemId] || [] : []}
        onFileListChange={handleFileListChange}
        uploadedFiles={uploadedFiles}
        customUploadRequest={customUploadRequest}
        uploadQueue={uploadQueue}
        maxConcurrentUploads={MAX_CONCURRENT_UPLOADS}
        associatedVideo={items.find((item) => item.id === currentItemId)?.video}
      />
    </div>
  );
};

export default App;
