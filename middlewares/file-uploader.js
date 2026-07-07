import multer from 'multer';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MIMETYPES = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/webp',
    'image/avif',
];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const sanitizeFolder = (folder) => {
    return folder
        .replace(/&/g, 'and')
        .replace(/[<>"']/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9_\-\/]/g, '')
        .replace(/\/+/g, '/')
        .replace(/^\/|\/$/g, '');
};

const createCloudinaryUploader = (folder) => {
    const safeFolder = sanitizeFolder(folder);
    const storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: (req, file) => {
            const fileExt = extname(file.originalname);
            const baseName = file.originalname.replace(fileExt, '');
            const safeBase = baseName
                .toLowerCase()
                .replace(/[^a-z0-9]+/gi, '-')
                .replace(/^-+|-+$/g, '');

            const shortUuid = uuidv4().substring(0, 8);
            const publicId = `${safeBase}-${shortUuid}`;

            return {
                folder: safeFolder,
                public_id: publicId,
                allowed_formats: ['jpeg', 'jpg', 'png', 'webp', 'avif'],
                transformation: [{ width: 500, height: 500, crop: 'limit' }],
                resource_type: 'image',
            };
        },
    });

    return multer({
        storage: storage,
        fileFilter: (req, file, cb) => {
            if (MIMETYPES.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error(`Solo se permiten imágenes: ${MIMETYPES.join(', ')}`));
            }
        },
        limits: {
            fileSize: MAX_FILE_SIZE,
        },
    });
};

export const uploadProfileImage = createCloudinaryUploader(
    process.env.CLOUDINARY_PROFILES_FOLDER || 'user/profiles'
);

export { cloudinary };
