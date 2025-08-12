const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(cors()); // 使用 cors 中间件
const port = 3001;

// 确保 uploads 文件夹存在
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// 设置 multer 用于文件存储
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, `${uploadDir}/`); // 文件将保存在 'uploads/' 目录下
  },
  filename(req, file, cb) {
    // 使用原始文件名加上时间戳以避免重名
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// 静态文件服务，用于访问上传的视频
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 处理文件上传的路由
app.post('/upload', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  // 返回成功信息和文件访问路径
  res.json({
    message: 'File uploaded successfully!',
    filePath: `/uploads/${req.file.filename}`,
  });
});

// 获取已上传文件列表的路由
app.get('/files', (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Unable to scan directory' });
    }
    const fileList = files
      .filter((file) => fs.statSync(path.join(uploadDir, file)).isFile())
      .map((file) => ({
        name: file,
        url: `/uploads/${file}`,
      }));
    res.json(fileList);
  });
});

app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
