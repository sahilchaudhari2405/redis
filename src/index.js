import express from 'express';
import { createClient } from 'redis';

const app = express();
const port = 3000;

// Redis client configuration
const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

// Connect to Redis
await redisClient.connect();
console.log('Connected to Redis');

// Simple route to test Redis
app.get('/', async (req, res) => {
  try {
    // Increment visit counter
    const visits = await redisClient.incr('visits');
    res.send(`Hello World! This page has been visited ${visits} times.`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Something went wrong');
  }
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});