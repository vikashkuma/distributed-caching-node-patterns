const RATE_LIMIT_THRESHOLD = 5;
const WINDOW_SIZE_IN_SECONDS = 60;

// src/middleware/rateLimiter.js
const rateLimiter = (redisClient) => {
    return async (req, res, next) => {
        const ip = req.ip;
        const key = `rate_limit:${ip}`;
        const LIMIT = 5;
        const WINDOW = 60; // seconds

        try {
            const current = await redisClient.incr(key);
            
            if (current === 1) {
                await redisClient.expire(key, WINDOW);
            }

            if (current > LIMIT) {
                return res.status(429).json({
                    error: 'Rate limit exceeded. Try again in a minute.',
                    limit: LIMIT
                });
            }
            next();
        } catch (err) {
            // Fail-open: If Redis fails, let the request through but log it
            console.error('Rate Limiter Error:', err);
            next();
        }
    };
};

module.exports = rateLimiter;
