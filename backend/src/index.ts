import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const port = Number(process.env.BACKEND_PORT || 3001);
const host = process.env.BACKEND_HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');

// CORS configuration
const frontendUrl = process.env.FRONTEND_URL || '';
const allowedOrigins = new Set([
  frontendUrl,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    // Allow any Vercel preview URL
    if (origin.endsWith('.vercel.app')) {
      callback(null, true);
      return;
    }

    if (!frontendUrl) {
      console.warn(`FRONTEND_URL is not configured; allowing origin ${origin} for CORS.`);
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
}));

// Request parsing middleware
app.use(express.json());

// Import routers
import authRouter from './routes/auth';
import userRouter from './routes/user';
import recommendationsRouter from './routes/recommendations';
import feedbackRouter from './routes/feedback';
import playlistRouter from './routes/playlists';

// Mount API routers
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/playlists', playlistRouter);

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

app.listen(port, host, () => {
  console.log(`Backend server is running at http://${host}:${port}`);
});
