import { badRequest } from '../utils/httpError.js';
export function uploadAvatar(req, res) {
    if (!req.file)
        throw badRequest('No file uploaded. Send an image in the "avatar" field.');
    res.status(201).json({
        data: {
            url: `/uploads/${req.file.filename}`,
            originalName: req.file.originalname,
            size: req.file.size,
            mimeType: req.file.mimetype,
        },
    });
}
