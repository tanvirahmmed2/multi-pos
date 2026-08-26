export const CLOUDINARY_NAME = process.env.CLOUDINARY_NAME;
export const CLOUDINARY_API = process.env.CLOUDINARY_API;
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;


export const PG_USER=process.env.PG_USER
export const PG_PASSWORD=process.env.PG_PASSWORD
export const PG_HOST=process.env.PG_HOST
export const PG_PORT=process.env.PG_PORT
export const PG_DATABASE=process.env.PG_DB || process.env.PG_DATABASE


export const JWT_SECRET = process.env.JWT_SECRET;


export const NODE_ENV = process.env.NODE_ENV || "production"


export const BREVO_SENDER_EMAIL=process.env.BREVO_SENDER_EMAIL
export const BREVO_SENDER_NAME=process.env.BREVO_SENDER_NAME
export const BREVO_API_KEY=process.env.BREVO_API_KEY

export const STORE_NAME = "Point of Sale";
export const STORE_TAGLINE = "Super Fast POS system For multiple branches";

export function getBaseUrl(req) {
  if (req) {
    const origin = req.headers?.get('origin');
    if (origin && origin !== 'null' && origin !== 'undefined') {
      return origin.replace(/\/$/, '');
    }

    const host = req.headers?.get('x-forwarded-host') || req.headers?.get('host');
    if (host) {
      const proto = req.headers?.get('x-forwarded-proto') || (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https');
      return `${proto}://${host}`.replace(/\/$/, '');
    }

    if (req.nextUrl?.origin) {
      return req.nextUrl.origin.replace(/\/$/, '');
    }
  }

  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_API_URL || process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }

  return 'http://localhost:3000';
}