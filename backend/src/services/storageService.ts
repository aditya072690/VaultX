import fs from 'fs';
import path from 'path';
import { env } from '../config/env';

class StorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve(env.LOCAL_UPLOAD_DIR);
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(
    key: string,
    buffer: Buffer,
    mimeType: string
  ): Promise<string> {
    if (env.STORAGE_MODE === 's3') {
      return this.uploadToS3(key, buffer, mimeType);
    }
    return this.uploadToLocal(key, buffer);
  }

  async downloadFile(key: string): Promise<Buffer> {
    if (env.STORAGE_MODE === 's3') {
      return this.downloadFromS3(key);
    }
    return this.downloadFromLocal(key);
  }

  async deleteFile(key: string): Promise<void> {
    if (env.STORAGE_MODE === 's3') {
      return this.deleteFromS3(key);
    }
    return this.deleteFromLocal(key);
  }

  // ─── Local Storage ───────────────────────────────────────────

  private async uploadToLocal(key: string, buffer: Buffer): Promise<string> {
    const filePath = path.join(this.uploadDir, key);
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, buffer);
    return key;
  }

  private async downloadFromLocal(key: string): Promise<Buffer> {
    const filePath = path.join(this.uploadDir, key);

    if (!fs.existsSync(filePath)) {
      throw new Error('File not found in local storage');
    }

    return fs.readFileSync(filePath);
  }

  private async deleteFromLocal(key: string): Promise<void> {
    const filePath = path.join(this.uploadDir, key);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  // ─── S3 Storage ──────────────────────────────────────────────

  private getS3Client() {
    // Lazy-load AWS SDK only when needed
    const AWS = require('aws-sdk');
    return new AWS.S3({
      region: env.AWS_REGION,
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    });
  }

  private async uploadToS3(
    key: string,
    buffer: Buffer,
    mimeType: string
  ): Promise<string> {
    const s3 = this.getS3Client();
    await s3.putObject({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    }).promise();

    return key;
  }

  private async downloadFromS3(key: string): Promise<Buffer> {
    const s3 = this.getS3Client();
    const result = await s3.getObject({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
    }).promise();

    return result.Body as Buffer;
  }

  private async deleteFromS3(key: string): Promise<void> {
    const s3 = this.getS3Client();
    await s3.deleteObject({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
    }).promise();
  }
}

export default new StorageService();
