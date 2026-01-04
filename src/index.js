const express = require('express');
const redis = require('redis');
require('dotenv').config();

// Import our modular service and middleware
const weatherService = require('./services/weatherService');
const rateLimiter = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * REDIS SETUP
 * In Docker, 'localhost' won't work. We use the service name 'redis-cache' 
 * defined in docker-compose.yml, provided via the REDIS_URL env var.
 */
const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

client.on('error', (err) => console.error('Redis Client Error', err));

// Immediate Invoked Function Expression (IIFE) to connect Redis
(async () => {
    try {
        await client.connect();
        console.log('✅ Connected to Redis successfully');
    } catch (err) {
        console.error('❌ Failed to connect to Redis:', err);
    }
})();

/**
 * ROUTE: Get Weather
 * Pattern: Cache-Aside
 * Middleware: Rate Limiter (to protect our API)
 */
app.get('/weather/:city', rateLimiter(client), async (req, res) => {
    const city = req.params.city.toLowerCase();

    try {
        // 1. Check Redis Cache
        const cachedData = await client.get(city);

        if (cachedData) {
            console.log(`[CACHE HIT] Serving ${city} from Redis`);
            return res.json({
                source: 'cache',
                data: JSON.parse(cachedData)
            });
        }

        // 2. Cache Miss - Fetch from Service
        console.log(`[CACHE MISS] Fetching ${city} from External API`);
        const freshData = await weatherService.fetchWeatherByCity(city);

        // 3. Save to Redis with a TTL (Time To Live)
        // 3600 seconds = 1 hour. This prevents stale data and saves memory.
        await client.set(city, JSON.stringify(freshData), {
            EX: 3600
        });

        return res.json({
            source: 'api',
            data: freshData
        });

    } catch (error) {
        console.error('Route Error:', error.message);
        
        if (error.message === 'City not found') {
            return res.status(404).json({ error: 'City not found' });
        }
        
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Health check endpoint (Standard practice in distributed systems)
app.get('/health', (req, res) => {
    res.json({ status: 'OK', redis: client.isOpen ? 'Connected' : 'Disconnected' });
});

app.listen(PORT, () => {
    console.log(`🚀 Weather API running on http://localhost:${PORT}`);
});
