# SkyCast 🌦️

SkyCast is a weather web app I built using Flask, JavaScript, HTML, and CSS.

It uses the OpenWeather API to get weather information for different cities and also supports using the user's current location.

## Screenshots

### Home
![SkyCast Home](screenshots/01-home.png)

### Current Location
![SkyCast Location](screenshots/02-location.png)

### Features
![SkyCast Features](screenshots/03-features.png)

### 5-Day Forecast
![SkyCast 5-Day Forecast](screenshots/04-5_day_forecast.png)

### Search
![SkyCast Search](screenshots/05-searches.png)

## Features

- Search weather by city
- Use current location
- Current temperature and weather condition
- Feels-like temperature
- Humidity
- Wind speed
- Atmospheric pressure
- Visibility
- Sunrise and sunset
- Moonrise and moonset
- Hourly weather forecast
- Rain probability
- 5-day forecast
- Air Quality Index (AQI)
- Save frequently searched locations
- Responsive design
- Weather-based animated background
- Dark mode

## Tech Stack

**Backend**
- Python
- Flask
- Requests

**Frontend**
- HTML
- CSS
- JavaScript

**API**
- OpenWeather API

## Project Structure

```text
weather_app/
│
├── app.py
├── README.md
├── requirements.txt
├── .gitignore
│
├── static/
│   ├── script.js
│   └── style.css
│
├── templates/
│   └── index.html
│
└── screenshots/
    ├── 01-home.png
    ├── 02-location.png
    ├── 03-features.png
    ├── 04-5-day-forecast.png
    └── 05-searches.png