import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // 修改为你想要的端口
    open: true, // 启动时自动在浏览器打开
  },
});
