const axios = require('axios');
// src/services/weatherService.js
require('dotenv').config(); // This loads the .env file

const apiKey = process.env.WEATHER_API_KEY;

/**
 * WeatherService handles direct communication with the external Weather API.
 * By isolating this, we can easily mock this service during unit testing.
 */
class WeatherService {
  constructor() {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.openweathermap.org/data/2.5/weather';
  }

  async fetchWeatherByCity(city) {
    try {
      console.log(`[WeatherService] Fetching real-time data for: ${city}`);
      
      const response = await axios.get(this.baseUrl, {
        params: {
          q: city,
          appid: this.apiKey,
          units: 'metric' // Returns Celsius
        }
      });

      // We only return the clean data the frontend actually needs
      return {
        temp: response.data.main.temp,
        description: response.data.weather[0].description,
        humidity: response.data.main.humidity,
        windSpeed: response.data.wind.speed,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (error.response && error.response.status === 404) {
        throw new Error('City not found');
      }
      throw new Error('Failed to fetch from OpenWeather API');
    }
  }
}

module.exports = new WeatherService();
