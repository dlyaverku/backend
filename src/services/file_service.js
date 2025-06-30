const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');

// Настройка хранилища для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads');
    
    // Создаем папку, если она не существует
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Генерируем уникальное имя файла
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Проверка типов файлов
const fileFilter = (req, file, cb) => {
  // Разрешенные типы файлов
  const allowedTypes = /jpeg|jpg|png|gif|pdf|gpx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Неподдерживаемый формат файла. Разрешены только изображения, PDF и GPX файлы.'));
  }
};

// Настройка multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 МБ
  fileFilter: fileFilter
});

// Удаление файла
const deleteFile = (filePath) => {
  const fullPath = path.join(__dirname, '../../', filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    return true;
  }
  return false;
};

const s3 = new AWS.S3({
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: process.env.S3_REGION
});

const S3_BUCKET = process.env.S3_BUCKET_NAME;
const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL;

// Загрузка файла в S3
const uploadS3 = async (file) => {
  const fileContent = fs.readFileSync(file.path);
  const params = {
    Bucket: S3_BUCKET,
    Key: file.filename,
    Body: fileContent,
    ContentType: file.mimetype,
    ACL: 'public-read'
  };
  await s3.upload(params).promise();
  return getS3FileUrl(file.filename);
};

const getS3FileUrl = (filename) => {
  if (!filename) return '';
  return `${S3_PUBLIC_URL}/${filename}`;
};

// Обновляю getFileUrl для поддержки S3 и локального режима
const getFileUrl = (req, filename) => {
  if (!filename) return '';
  if (process.env.USE_S3 === 'true') {
    return getS3FileUrl(filename);
  }
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}/uploads/${filename}`;
};

module.exports = {
  upload,
  deleteFile,
  getFileUrl,
  uploadS3,
  getS3FileUrl
};