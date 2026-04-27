// Override Express query string types to be string-only (we never use arrays)
import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    query: { [key: string]: string | undefined };
  }
}

// Stub type declarations for optional dependencies
declare module 'nodemailer' {
  export function createTransport(options: any): { sendMail(opts: any): Promise<any> };
}

declare module 'twilio' {
  function twilio(sid: string, token: string): { messages: { create(opts: any): Promise<any> } };
  export default twilio;
}

declare module '@aws-sdk/client-s3' {
  export class S3Client { constructor(config: any); send(command: any): Promise<any>; }
  export class PutObjectCommand { constructor(params: any); }
  export class DeleteObjectCommand { constructor(params: any); }
}
