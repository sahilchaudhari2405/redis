import express from 'express';
import { createClient } from 'redis';
import cors from 'cors';
import dotenv from 'dotenv';
import cluster from 'cluster';
import os from 'os';

dotenv.config({ path: './env' });

const totalCPUs = os.cpus().length;
const test = process.env.CORS_ALLOWED_ORIGINS;
const PORT = 4004;

// Database connection function placeholder
function connectDB() {
  console.log('DB Connected'); // Replace with actual DB connection
}

connectDB();

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);

  for (let i = 0; i < totalCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
  });
} else {
  const app = express();

  // Redis client configuration
  const redisClient = createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  });

  redisClient.on('error', (err) => console.error('Redis Client Error', err));

  await redisClient.connect();
  console.log('✅ Redis connected successfully!');

  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost',
    'http://client:80',
    'http://apalabajar.shop',
    'https://apalabajar.shop',
    'http://www.apalabajar.shop',
    'https://www.apalabajar.shop',
    'http://65.0.98.146',
    test,
  ];

  app.use(cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('CORS policy does not allow this origin'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }));

  app.use(express.json({ limit: '100mb' }));
  app.use(cookieParser());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  // Set request timeout
  app.use((req, res, next) => {
    res.setTimeout(5000);
    next();
  });

  // Test route
  app.get('/', async (req, res) => {
    try {
      const visits = await redisClient.incr('visits');
      res.send(`Hello World! This page has been visited ${visits} times.`);
    } catch (err) {
      console.error(err);
      res.status(500).send('Redis error');
    }
  });

  app.listen(PORT, () => {
    console.log(`🚀 Worker ${process.pid} listening on port ${PORT}`);
  });
}
