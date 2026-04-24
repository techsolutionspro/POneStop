import 'express';

declare module 'express-serve-static-core' {
  interface Query {
    [key: string]: string | undefined;
  }
}
