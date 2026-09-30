# Weatherly 🌦️

A responsive weather dashboard built with Flask, JavaScript, HTML and CSS.

## Features

- Search weather by city
- Current temperature and condition
- Feels-like temperature
- Humidity
- Wind speed
- Visibility
- Atmospheric pressure
- Sunrise and sunset
- 5-day forecast
- Celsius/Fahrenheit toggle
- Responsive design

## Tech Stack

- Python
- Flask
- Requests
- HTML
- CSS
- JavaScript
- OpenWeather API

## Setup

### 1. Create and activate a virtual environment

```bash
python -m venv venv
source venv/Scripts/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure your API key

Git Bash:

```bash
export WEATHER_API_KEY="YOUR_API_KEY"
```

PowerShell:

```powershell
$env:WEATHER_API_KEY="YOUR_API_KEY"
```

### 4. Run

```bash
python app.py
```

Open `http://127.0.0.1:5000`.
