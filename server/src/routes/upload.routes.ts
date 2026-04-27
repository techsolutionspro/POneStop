import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { FileService } from '../services/file.service';
import { authenticate } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// POST /api/upload/logo — Upload pharmacy logo
router.post('/logo', authenticate, upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) { res.status(400).json({ success: false, error: 'No file uploaded' }); return; }
    const url = await FileService.upload(req.file.buffer, req.file.originalname, 'logos');
    res.json({ success: true, data: { url } });
  } catch (err) { next(err); }
});

// POST /api/upload/idv — Upload ID verification document
router.post('/idv', authenticate, upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) { res.status(400).json({ success: false, error: 'No file uploaded' }); return; }
    const url = await FileService.upload(req.file.buffer, req.file.originalname, 'idv-documents');
    res.json({ success: true, data: { url } });
  } catch (err) { next(err); }
});

// POST /api/upload/prescription — Upload prescription PDF
router.post('/prescription', authenticate, upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) { res.status(400).json({ success: false, error: 'No file uploaded' }); return; }
    const url = await FileService.upload(req.file.buffer, req.file.originalname, 'prescriptions');
    res.json({ success: true, data: { url } });
  } catch (err) { next(err); }
});

// POST /api/upload/general — General file upload
router.post('/general', authenticate, upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) { res.status(400).json({ success: false, error: 'No file uploaded' }); return; }
    const folder = (req.body.folder as string) || 'general';
    const url = await FileService.upload(req.file.buffer, req.file.originalname, folder);
    res.json({ success: true, data: { url } });
  } catch (err) { next(err); }
});

export default router;
