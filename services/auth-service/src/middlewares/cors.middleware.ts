import cors from 'cors';
import { config } from '../config';

const allowedOrigins = config.ALLOWED_ORIGINS.split(',');

export const corsMiddleware = cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like curl or mobile apps)
    
    console.log('Request origin:', origin);
    console.log('Allowed origins:', allowedOrigins);
    
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error(`CORS not allowed for origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
  ],
});
