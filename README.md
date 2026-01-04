# distributed-caching-node-patterns
This project demonstrates production-grade integration of Redis within a Node.js microservice architecture. It focuses on optimizing API performance via the Cache-Aside pattern and protecting system resources through Distributed Rate Limiting.

# Distributed Weather API with Redis Caching

A high-performance Node.js microservice that implements a **Cache-Aside pattern** and **Distributed Rate Limiting** using Redis. This project is designed to showcase production-grade system design principles for low-latency applications.

---

## 🚀 Key Features
* **Cache-Aside Pattern:** Reduces external API dependency and cuts latency by over 95%.
* **Distributed Rate Limiting:** Global request throttling using Redis atomic operations (`INCR`).
* **Dockerized Infrastructure:** One-command setup for the entire stack (Node.js + Redis).
* **Resilience:** Implements "Fail-Open" strategies to ensure the API stays up even if the cache layer fails.

---

## 🏗️ System Architecture



1.  **Client** sends a request to the Node.js server.
2.  **Rate Limiter Middleware** checks Redis for user request counts.
3.  **Controller** checks Redis for cached weather data.
    * **Cache Hit:** Returns data instantly (<10ms).
    * **Cache Miss:** Fetches from OpenWeather API, populates Redis with a 1-hour TTL, and returns data.

---

## 📊 Performance Benchmarks
| Metric | Direct API Call | With Redis Cache | Improvement |
| :--- | :--- | :--- | :--- |
| **Latency** | ~500ms - 800ms | **< 15ms** | **~50x Faster** |
| **Network Cost** | 1 External Call/Req | 0 External Calls (Hit) | **100% Saving** |

---

## 🛠️ Setup & Installation

### 1. Prerequisites
* [Docker](https://www.docker.com/products/docker-desktop/) and [Docker Compose](https://docs.docker.com/compose/) installed.
* An [OpenWeatherMap API Key](https://home.openweathermap.org/users/sign_up).

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
WEATHER_API_KEY=your_api_key_here
REDIS_URL=redis://redis-cache:6379

Launch the Application
Bash

docker-compose up --build
The API will be available at http://localhost:3000/weather/bangalore.

🧠 Technical Trade-offs (Interview Deep Dive)
Why Redis?
Unlike an in-memory local cache (JS Object), Redis is distributed. This means if we scale our Node.js app to 10 instances, they all share the same cache and rate-limit data.

Fixed Window vs. Sliding Window
Currently, we use a Fixed Window rate limiter for simplicity. While efficient, it is susceptible to "bursts" at the edge of the window. In a higher-scale production environment, I would transition to a Sliding Window Log using Redis Sorted Sets (ZSET).

Data Consistency
We prioritize Availability over Strict Consistency by using a 1-hour TTL. This means weather data may be up to 1 hour old, but the API remains blazingly fast and reduces costs.

📁 Project Structure
├── src/
│   ├── index.js           # Server entry point & Redis connection
│   ├── services/
│   │   └── weather.js     # External API communication
│   └── middleware/
│       └── rateLimiter.js # Redis-based request throttling
├── .env.example           # Template for environment variables
├── Dockerfile             # Container configuration
└── docker-compose.yml     # Service orchestration