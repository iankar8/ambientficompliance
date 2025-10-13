import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    flash?: {
      type: 'error' | 'success';
      message: string;
    };
  }
}
