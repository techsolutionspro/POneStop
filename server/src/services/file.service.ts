import { env } from '../config/env';
import { v4 as uuid } from 'uuid';
import path from 'path';
import fs from 'fs';

export class FileService {
  // Upload file — uses S3 in production, local filesystem in dev
  static async upload(buffer: Buffer, originalName: string, folder: string): Promise<string> {
    const ext = path.extname(originalName);
    const key = `${folder}/${uuid()}${ext}`;

    if (env.NODE_ENV === 'development' || !env.AWS_S3_BUCKET) {
      // Local filesystem
      const uploadDir = path.join(process.cwd(), 'uploads', folder);
      fs.mkdirSync(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, `${uuid()}${ext}`);
      fs.writeFileSync(filePath, buffer);
      console.log(`[File] Saved locally: ${filePath}`);
      return `/uploads/${key}`;
    }

    // Production: S3
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    const s3 = new S3Client({ region: env.AWS_REGION });
    await s3.send(new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: this.getMimeType(ext),
    }));
    return `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
  }

  // Delete file
  static async delete(url: string): Promise<void> {
    if (url.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return;
    }
    // S3 deletion
    if (env.AWS_S3_BUCKET) {
      const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
      const s3 = new S3Client({ region: env.AWS_REGION });
      const key = url.split('.amazonaws.com/')[1];
      if (key) await s3.send(new DeleteObjectCommand({ Bucket: env.AWS_S3_BUCKET, Key: key }));
    }
  }

  private static getMimeType(ext: string): string {
    const types: Record<string, string> = {
      '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml',
      '.webp': 'image/webp', '.doc': 'application/msword',
    };
    return types[ext.toLowerCase()] || 'application/octet-stream';
  }
}
