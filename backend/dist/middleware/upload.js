"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMiddleware = exports.uploadDir = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const isServerless = Boolean(process.env.VERCEL ||
    process.env.VERCEL_ENV ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.NOW_REGION);
exports.uploadDir = isServerless
    ? path_1.default.resolve('/tmp', 'midbridge', 'uploads')
    : path_1.default.resolve(process.cwd(), 'uploads');
try {
    if (!fs_1.default.existsSync(exports.uploadDir)) {
        fs_1.default.mkdirSync(exports.uploadDir, { recursive: true });
    }
}
catch (err) {
    // Gracefully ignore filesystem permissions error in read-only serverless runtimes
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, exports.uploadDir);
    },
    filename: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        const uniqueName = `${Date.now()}-${(0, uuid_1.v4)()}${ext}`;
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
exports.uploadMiddleware = (0, multer_1.default)({
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
