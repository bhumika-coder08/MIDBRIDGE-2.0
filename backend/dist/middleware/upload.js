import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const uniqueName = `${Date.now()}-${uuidv4()}${ext}`;
        cb(null, uniqueName);
    },
});
const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
];
export const uploadMiddleware = multer({
    storage,
    limits: {
        fileSize: 15 * 1024 * 1024, // 15MB maximum
    },
    fileFilter: (_req, file, cb) => {
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Unsupported file type. Only PDF, JPG, and PNG documents are supported.'));
        }
    },
});
