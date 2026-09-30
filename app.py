from flask import Flask, render_template, request, jsonify
import requests
import os

app = Flask(__name__)

API_KEY = os.getenv("WEATHER_API_KEY")

CURRENT_WEATHER_URL = (
    "https://api.openweathermap.org/data/2.5/weather"
)

FORECAST_URL = (
    "https://api.openweathermap.org/data/2.5/forecast"
)

AIR_QUALITY_URL = (
    "https://api.openweathermap.org/data/2.5/air_pollution"
)


# =====================================================
# WEATHER DATA FORMAT
# =====================================================

def get_weather_data(data):

    return {
        "city": data["name"],
        "country": data["sys"]["country"],

        "temperature": round(data["main"]["temp"]),
        "feels_like": round(data["main"]["feels_like"]),

        "humidity": data["main"]["humidity"],
        "pressure": data["main"]["pressure"],

        "visibility": round(
            data.get("visibility", 0) / 1000,
            1
        ),

        "wind_speed": round(
            data["wind"]["speed"] * 3.6,
            1
        ),

        "condition": data["weather"][0]["main"],
        "description": data["weather"][0]["description"],
        "icon": data["weather"][0]["icon"],

        "sunrise": data["sys"]["sunrise"],
        "sunset": data["sys"]["sunset"],

        # Needed for AQI
        "lat": data["coord"]["lat"],
        "lon": data["coord"]["lon"]
    }


# =====================================================
# HOME
# =====================================================

@app.route("/")
def home():
    return render_template("index.html")


# =====================================================
# CURRENT WEATHER BY CITY
# =====================================================

@app.route("/weather")
def weather():

    city = request.args.get("city", "").strip()

    if not city:
        return jsonify({
            "error": "Please enter a city."
        }), 400

    if not API_KEY:
        return jsonify({
            "error": "WEATHER_API_KEY is not set."
        }), 500

    params = {
        "q": city,
        "appid": API_KEY,
        "units": "metric"
    }

    try:

        response = requests.get(
            CURRENT_WEATHER_URL,
            params=params,
            timeout=10
        )

        data = response.json()

        if response.status_code != 200:

            return jsonify({
                "error": data.get(
                    "message",
                    "Unable to get weather."
                )
            }), response.status_code

        return jsonify(
            get_weather_data(data)
        )

    except requests.RequestException:

        return jsonify({
            "error":
                "Could not connect to OpenWeather."
        }), 503

    except ValueError:

        return jsonify({
            "error":
                "Invalid response from weather service."
        }), 502


# =====================================================
# CURRENT LOCATION WEATHER
# =====================================================

@app.route("/weather/location")
def weather_location():

    lat = request.args.get("lat")
    lon = request.args.get("lon")

    if not lat or not lon:

        return jsonify({
            "error": "Location coordinates are required."
        }), 400

    if not API_KEY:

        return jsonify({
            "error": "WEATHER_API_KEY is not set."
        }), 500

    params = {
        "lat": lat,
        "lon": lon,
        "appid": API_KEY,
        "units": "metric"
    }

    try:

        response = requests.get(
            CURRENT_WEATHER_URL,
            params=params,
            timeout=10
        )

        data = response.json()

        if response.status_code != 200:

            return jsonify({
                "error":
                    data.get(
                        "message",
                        "Unable to find your location."
                    )
            }), response.status_code

        return jsonify(
            get_weather_data(data)
        )

    except requests.RequestException:

        return jsonify({
            "error":
                "Could not connect to OpenWeather."
        }), 503


# =====================================================
# 5-DAY FORECAST
# =====================================================

@app.route("/forecast")
def forecast():

    city = request.args.get("city", "").strip()

    if not city:

        return jsonify({
            "error": "Please enter a city."
        }), 400

    if not API_KEY:

        return jsonify({
            "error": "WEATHER_API_KEY is not set."
        }), 500

    params = {
        "q": city,
        "appid": API_KEY,
        "units": "metric"
    }

    try:

        response = requests.get(
            FORECAST_URL,
            params=params,
            timeout=10
        )

        data = response.json()

        if response.status_code != 200:

            return jsonify({
                "error":
                    data.get(
                        "message",
                        "Unable to get forecast."
                    )
            }), response.status_code


        # ---------------------------------------------
        # DAILY
        # ---------------------------------------------

        daily = []
        seen_dates = set()

        for item in data["list"]:

            date = item["dt_txt"].split(" ")[0]

            if date in seen_dates:
                continue

            seen_dates.add(date)

            daily.append({

                "date": date,

                "temperature":
                    round(item["main"]["temp"]),

                "feels_like":
                    round(item["main"]["feels_like"]),

                "condition":
                    item["weather"][0]["main"],

                "description":
                    item["weather"][0]["description"],

                "icon":
                    item["weather"][0]["icon"],

                "humidity":
                    item["main"]["humidity"],

                "pressure":
                    item["main"]["pressure"],

                "wind_speed":
                    round(
                        item["wind"]["speed"] * 3.6,
                        1
                    ),

                "visibility":
                    round(
                        item.get("visibility", 0) / 1000,
                        1
                    ),

                "rain_probability":
                    round(
                        item.get("pop", 0) * 100
                    )
            })


        # ---------------------------------------------
        # NEXT 8 × 3-HOUR FORECASTS
        # ---------------------------------------------

        hourly = []

        for item in data["list"][:8]:

            hourly.append({

                "time":
                    item["dt_txt"].split(" ")[1][:5],

                "temperature":
                    round(item["main"]["temp"]),

                "feels_like":
                    round(item["main"]["feels_like"]),

                "condition":
                    item["weather"][0]["main"],

                "description":
                    item["weather"][0]["description"],

                "icon":
                    item["weather"][0]["icon"],

                "rain_probability":
                    round(
                        item.get("pop", 0) * 100
                    )
            })


        return jsonify({
            "daily": daily[:5],
            "hourly": hourly
        })


    except requests.RequestException:

        return jsonify({
            "error":
                "Could not connect to OpenWeather."
        }), 503


# =====================================================
# AIR QUALITY
# =====================================================

@app.route("/air-quality")
def air_quality():

    lat = request.args.get("lat")
    lon = request.args.get("lon")

    if not lat or not lon:

        return jsonify({
            "error":
                "Location coordinates are required."
        }), 400

    if not API_KEY:

        return jsonify({
            "error":
                "WEATHER_API_KEY is not set."
        }), 500

    params = {
        "lat": lat,
        "lon": lon,
        "appid": API_KEY
    }

    try:

        response = requests.get(
            AIR_QUALITY_URL,
            params=params,
            timeout=10
        )

        data = response.json()

        if response.status_code != 200:

            return jsonify({
                "error":
                    "Unable to get air quality."
            }), response.status_code

        air = data["list"][0]

        aqi = air["main"]["aqi"]

        components =air["components"]

        categories = {
            1: "Good",
            2: "Fair",
            3: "Moderate",
            4: "Poor",
            5: "Very Poor"
        }

        return jsonify({

            "aqi": aqi,

            "category":
                categories.get(
                    aqi,
                    "Unknown"
                ),

            "pm2_5":
                round(
                    components.get("pm2_5", 0),
                    1
                ),

            "pm10":
                round(
                    components.get("pm10", 0),
                    1
                ),

            "co":
                round(
                    components.get("co", 0),
                    1
                ),

            "no2":
                round(
                    components.get("no2", 0),
                    1
                ),

            "o3":
                round(
                    components.get("o3", 0),
                    1
                )
        })

    except requests.RequestException:

        return jsonify({
            "error":
                "Could not connect to air quality service."
        }), 503


# =====================================================
# RUN
# =====================================================

if __name__ == "__main__":
    app.run(debug=True)