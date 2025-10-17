import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import routes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Allow requests from Electron app
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'QMS Knowledge Base API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      standards: '/api/standards',
      regulations: '/api/regulations',
      regulationById: '/api/regulations/:id',
    },
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 QMS Knowledge Base API Server');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`🔍 API endpoints available at http://localhost:${PORT}/api`);
  console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
});
