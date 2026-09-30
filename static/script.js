const searchButton = document.getElementById("search-button");
const cityInput = document.getElementById("city-input");

const cityName = document.getElementById("city-name");
const temperature = document.getElementById("temperature");
const condition = document.getElementById("condition");
const feelsLike = document.getElementById("feels-like");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const pressure = document.getElementById("pressure");
const visibility = document.getElementById("visibility");

const expandedPanel = document.getElementById("expanded-panel");
const expandedContent = document.getElementById("expanded-content");
const closePanel = document.getElementById("close-panel");

const activityTitle = document.getElementById("activity-title");
const activityText = document.getElementById("activity-text");

const hourlyContainer = document.getElementById("hourly-container");
const forecastContainer = document.getElementById("forecast-container");
const locationsContainer = document.getElementById("locations-container");

const weatherCanvas = document.getElementById("weather-canvas");

let currentWeatherState = "clear";
let currentWeatherIcon = "01d";
let animationFrame = null;
let particles = [];
let environmentClouds = [];
let stars = [];

function byId(id) {
    return document.getElementById(id);
}

function safeText(element, value) {
    if (element) {
        element.textContent = value ?? "--";
    }
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/* =========================================================
   SKYCAST BRANDING + LOGO
========================================================= */

function setSkyCastBranding() {
    document.title = "SkyCast";

    document
        .querySelectorAll(
            ".logo h1, .logo-text, .brand-name, .app-name, .site-name"
        )
        .forEach(element => {
            element.textContent = "SkyCast";
        });

    const logoMark = document.querySelector(".logo span");

    if (logoMark) {
        logoMark.innerHTML = `
            <svg viewBox="0 0 64 64" role="img" aria-label="SkyCast logo">
                <defs>
                    <linearGradient
                        id="skycast-logo-gradient"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="1"
                    >
                        <stop
                            offset="0%"
                            stop-color="#ffd36b"
                        ></stop>

                        <stop
                            offset="48%"
                            stop-color="#ff75b7"
                        ></stop>

                        <stop
                            offset="100%"
                            stop-color="#a978ff"
                        ></stop>
                    </linearGradient>
                </defs>

                <circle
                    cx="32"
                    cy="32"
                    r="11"
                    fill="url(#skycast-logo-gradient)"
                ></circle>

                <ellipse
                    cx="32"
                    cy="32"
                    rx="26"
                    ry="11"
                    fill="none"
                    stroke="url(#skycast-logo-gradient)"
                    stroke-width="3"
                    transform="rotate(-18 32 32)"
                ></ellipse>

                <path
                    d="M32 4v7M32 53v7M4 32h7M53 32h7"
                    stroke="url(#skycast-logo-gradient)"
                    stroke-width="3"
                    stroke-linecap="round"
                ></path>

                <circle
                    cx="49"
                    cy="14"
                    r="2.5"
                    fill="#ffd36b"
                ></circle>
            </svg>
        `;
    }
}

/* =========================================================
   CURRENT LOCATION BUTTON
========================================================= */

function disableLightMode() {
    document.body.classList.remove("light-mode");

    const toggle = document.getElementById("theme-toggle");

    if (toggle) {
        toggle.remove();
    }

    try {
        localStorage.removeItem("weatherTheme");
    }
    catch (_) { }
}

function moveCurrentLocationButton() {
    const topBar = document.querySelector(".top-bar");

    if (!topBar) {
        return;
    }

    let locationButton =
        document.querySelector(".location-btn");

    if (!locationButton) {
        locationButton =
            [...document.querySelectorAll("button")]
                .find(button => {
                    const text =
                        button.textContent.toLowerCase();

                    return (
                        text.includes("current location") ||
                        text.includes("use my location")
                    );
                });
    }

    if (!locationButton) {
        return;
    }

    locationButton.classList.add(
        "main-location-button"
    );

    locationButton.setAttribute(
        "aria-label",
        "Use current location"
    );

    locationButton.setAttribute(
        "title",
        "Use current location"
    );

    locationButton.textContent =
        "📍 Use Current Location";

    let actions =
        topBar.querySelector(".top-actions");

    if (!actions) {
        actions =
            document.createElement("div");

        actions.className =
            "top-actions";

        topBar.appendChild(actions);
    }

    if (
        locationButton.parentElement !==
        actions
    ) {
        actions.appendChild(locationButton);
    }

    const locationsSection =
        document.getElementById(
            "locations-section"
        );

    if (locationsSection) {
        locationsSection
            .querySelectorAll("button")
            .forEach(button => {
                if (button === locationButton) {
                    return;
                }

                const label =
                    button.textContent.toLowerCase();

                if (
                    label.includes("current location") ||
                    label.includes("use my location")
                ) {
                    button.remove();
                }
            });
    }
}

/* =========================================================
   SAVED LOCATIONS
========================================================= */

function getSavedLocations() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(
                "weatherLocations"
            ) || "[]"
        );

        if (!Array.isArray(saved)) {
            return [];
        }

        return saved
            .map(item => {
                if (typeof item === "string") {
                    return item;
                }

                if (
                    item &&
                    typeof item === "object"
                ) {
                    return (
                        item.city ||
                        item.name ||
                        item.location ||
                        null
                    );
                }

                return null;
            })
            .filter(Boolean);
    }
    catch {
        return [];
    }
}

function saveLocations(locations) {
    const unique = [
        ...new Set(
            locations
                .map(String)
                .map(city => city.trim())
                .filter(Boolean)
        )
    ].slice(0, 6);

    localStorage.setItem(
        "weatherLocations",
        JSON.stringify(unique)
    );

    renderLocations();
}

function addLocation(city) {
    const cleanCity =
        String(city || "").trim();

    if (!cleanCity) {
        return;
    }

    const locations =
        getSavedLocations();

    const exists =
        locations.some(
            saved =>
                saved.toLowerCase() ===
                cleanCity.toLowerCase()
        );

    if (!exists) {
        locations.unshift(cleanCity);
        saveLocations(locations);
    }
    else {
        renderLocations();
    }
}

function removeLocation(city) {
    const updated =
        getSavedLocations().filter(
            saved =>
                saved.toLowerCase() !==
                String(city).toLowerCase()
        );

    saveLocations(updated);
}

function placeLocationsSection() {
    const section =
        byId("locations-section");

    const sidebar =
        document.querySelector(".sidebar");

    const mainContent =
        document.querySelector(".main-content");

    const searchSection =
        document.querySelector(".search-section");

    if (
        !section ||
        !sidebar ||
        !mainContent
    ) {
        return;
    }

    const isMobile =
        window.innerWidth <= 800;

    if (isMobile) {
        if (
            section.parentElement !==
            mainContent
        ) {
            if (
                searchSection &&
                searchSection.parentElement ===
                mainContent
            ) {
                searchSection.insertAdjacentElement(
                    "afterend",
                    section
                );
            }
            else {
                mainContent.prepend(section);
            }
        }
    }
    else if (
        section.parentElement !== sidebar
    ) {
        sidebar.appendChild(section);
    }
}

function renderLocations() {
    if (!locationsContainer) {
        return;
    }

    placeLocationsSection();

    const locations =
        getSavedLocations();

    locationsContainer.innerHTML = "";

    if (locations.length === 0) {
        locationsContainer.innerHTML = `
            <div class="empty-state">
                Search a city to save it here.
            </div>
        `;

        return;
    }

    locations.forEach(city => {
        const card =
            document.createElement("div");

        card.className =
            "location-card";

        const cityButton =
            document.createElement("button");

        cityButton.type = "button";

        cityButton.className =
            "location-city-button";

        cityButton.innerHTML = `
            <span class="location-card-name">
                ${escapeHtml(city)}
            </span>

            <span class="location-card-arrow">
                →
            </span>
        `;

        cityButton.addEventListener(
            "click",
            () => {
                cityInput.value = city;
                searchWeather();
            }
        );

        const removeButton =
            document.createElement("button");

        removeButton.type = "button";

        removeButton.className =
            "remove-location";

        removeButton.textContent = "×";

        removeButton.setAttribute(
            "aria-label",
            `Remove ${city}`
        );

        removeButton.setAttribute(
            "title",
            `Remove ${city}`
        );

        removeButton.addEventListener(
            "click",
            event => {
                event.stopPropagation();
                removeLocation(city);
            }
        );

        card.appendChild(cityButton);
        card.appendChild(removeButton);

        locationsContainer.appendChild(card);
    });
}

/* =========================================================
   WEATHER ENVIRONMENT
========================================================= */

function getWeatherState(weatherCondition) {
    const text =
        String(weatherCondition || "")
            .toLowerCase();

    if (text.includes("thunder")) {
        return "thunder";
    }

    if (
        text.includes("rain") ||
        text.includes("drizzle")
    ) {
        return "rain";
    }

    if (text.includes("snow")) {
        return "snow";
    }

    if (
        text.includes("mist") ||
        text.includes("fog") ||
        text.includes("haze")
    ) {
        return "mist";
    }

    if (text.includes("cloud")) {
        return "clouds";
    }

    return "clear";
}

function setWeatherScene(
    weatherCondition,
    icon
) {
    currentWeatherState =
        getWeatherState(weatherCondition);

    currentWeatherIcon =
        icon || "01d";

    document.body.classList.remove(
        "clear",
        "clouds",
        "rain",
        "snow",
        "mist",
        "thunder",
        "night"
    );

    if (
        currentWeatherIcon.endsWith("n")
    ) {
        document.body.classList.add(
            "night"
        );
    }

    document.body.classList.add(
        currentWeatherState
    );

    createEnvironmentObjects();

    drawWeatherEnvironment();
}

function resizeWeatherCanvas() {
    if (!weatherCanvas) {
        return null;
    }

    const ratio =
        Math.min(
            window.devicePixelRatio || 1,
            2
        );

    weatherCanvas.width =
        Math.floor(
            window.innerWidth * ratio
        );

    weatherCanvas.height =
        Math.floor(
            window.innerHeight * ratio
        );

    weatherCanvas.style.width = "100%";
    weatherCanvas.style.height = "100%";

    const ctx =
        weatherCanvas.getContext("2d");

    ctx.setTransform(
        ratio,
        0,
        0,
        ratio,
        0,
        0
    );

    return ctx;
}

function createEnvironmentObjects() {
    environmentClouds = [
        {
            x: window.innerWidth * 0.08,
            y: window.innerHeight * 0.16,
            scale: 1.0,
            speed: 0.20
        },

        {
            x: window.innerWidth * 0.52,
            y: window.innerHeight * 0.30,
            scale: 0.72,
            speed: 0.15
        },

        {
            x: window.innerWidth * 0.86,
            y: window.innerHeight * 0.10,
            scale: 1.25,
            speed: 0.24
        }
    ];

    stars = [];

    for (let i = 0; i < 90; i++) {
        stars.push({
            x:
                Math.random() *
                window.innerWidth,

            y:
                Math.random() *
                window.innerHeight *
                0.70,

            size:
                0.6 +
                Math.random() * 1.8,

            alpha:
                0.25 +
                Math.random() * 0.75
        });
    }

    particles = [];

    if (
        currentWeatherState !== "rain" &&
        currentWeatherState !== "thunder" &&
        currentWeatherState !== "snow" &&
        currentWeatherState !== "mist"
    ) {
        return;
    }

    const count =
        currentWeatherState === "snow"
            ? 100
            : currentWeatherState === "mist"
                ? 28
                : 150;

    for (let i = 0; i < count; i++) {
        particles.push({
            x:
                Math.random() *
                window.innerWidth,

            y:
                Math.random() *
                window.innerHeight,

            speed:
                currentWeatherState === "snow"
                    ? 0.7 +
                    Math.random() * 1.5
                    : 5 +
                    Math.random() * 8,

            size:
                currentWeatherState === "snow"
                    ? 1.5 +
                    Math.random() * 3
                    : 1 +
                    Math.random() * 1.5
        });
    }
}

function drawCloud(
    ctx,
    x,
    y,
    scale,
    opacity
) {
    ctx.save();

    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const lightMode = false;

    const bodyGradient =
        ctx.createLinearGradient(
            0,
            -45,
            0,
            65
        );

    if (lightMode) {
        bodyGradient.addColorStop(
            0,
            `rgba(250,248,255,${Math.min(
                opacity + 0.20,
                0.78
            )})`
        );

        bodyGradient.addColorStop(
            0.55,
            `rgba(166,156,190,${Math.min(
                opacity + 0.16,
                0.66
            )})`
        );

        bodyGradient.addColorStop(
            1,
            `rgba(82,72,104,${Math.min(
                opacity + 0.12,
                0.48
            )})`
        );
    }
    else {
        bodyGradient.addColorStop(
            0,
            `rgba(250,248,255,${Math.min(
                opacity + 0.15,
                0.72
            )})`
        );

        bodyGradient.addColorStop(
            0.55,
            `rgba(172,168,194,${Math.min(
                opacity + 0.08,
                0.54
            )})`
        );

        bodyGradient.addColorStop(
            1,
            `rgba(57,53,76,${Math.min(
                opacity + 0.10,
                0.42
            )})`
        );
    }

    ctx.shadowBlur = 26;

    ctx.shadowColor = lightMode
        ? "rgba(93,70,126,0.18)"
        : "rgba(0,0,0,0.34)";

    ctx.fillStyle =
        bodyGradient;

    ctx.beginPath();

    ctx.roundRect(
        -112,
        2,
        224,
        46,
        28
    );

    ctx.fill();

    const puffs = [
        [-58, 2, 36],
        [-6, -22, 50],
        [46, 1, 40]
    ];

    puffs.forEach(
        ([px, py, radius], index) => {
            const g =
                ctx.createRadialGradient(
                    px - radius * 0.25,
                    py - radius * 0.32,
                    radius * 0.12,
                    px,
                    py,
                    radius
                );

            if (lightMode) {
                g.addColorStop(
                    0,
                    `rgba(255,255,255,${Math.min(
                        opacity + 0.28,
                        0.92
                    )})`
                );

                g.addColorStop(
                    0.55,
                    `rgba(206,198,221,${Math.min(
                        opacity + 0.22,
                        0.78
                    )})`
                );

                g.addColorStop(
                    1,
                    `rgba(105,94,127,${Math.min(
                        opacity + 0.10,
                        0.54
                    )})`
                );
            }
            else {
                g.addColorStop(
                    0,
                    `rgba(255,255,255,${Math.min(
                        opacity + 0.24,
                        0.86
                    )})`
                );

                g.addColorStop(
                    0.55,
                    `rgba(200,197,218,${Math.min(
                        opacity + 0.15,
                        0.68
                    )})`
                );

                g.addColorStop(
                    1,
                    `rgba(76,72,96,${Math.min(
                        opacity + 0.10,
                        0.46
                    )})`
                );
            }

            ctx.fillStyle = g;

            ctx.beginPath();

            ctx.arc(
                px,
                py,
                radius,
                0,
                Math.PI * 2
            );

            ctx.fill();

            if (index === 1) {
                ctx.strokeStyle =
                    lightMode
                        ? "rgba(255,255,255,0.32)"
                        : "rgba(255,255,255,0.20)";

                ctx.lineWidth = 2;

                ctx.beginPath();

                ctx.arc(
                    px - 2,
                    py - 2,
                    radius - 5,
                    Math.PI * 1.08,
                    Math.PI * 1.88
                );

                ctx.stroke();
            }
        }
    );

    ctx.restore();
}

function drawSun(ctx) {
    const x =
        window.innerWidth * 0.80;

    const y =
        window.innerHeight * 0.17;

    const glow =
        ctx.createRadialGradient(
            x,
            y,
            8,
            x,
            y,
            230
        );

    glow.addColorStop(
        0,
        "rgba(255,249,190,0.72)"
    );

    glow.addColorStop(
        0.25,
        "rgba(255,210,92,0.42)"
    );

    glow.addColorStop(
        0.62,
        "rgba(255,165,72,0.13)"
    );

    glow.addColorStop(
        1,
        "rgba(255,165,72,0)"
    );

    ctx.fillStyle =
        glow;

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        230,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.save();

    ctx.translate(x, y);

    ctx.strokeStyle =
        "rgba(255,210,105,0.34)";

    ctx.lineWidth = 4;
    ctx.lineCap = "round";

    for (let i = 0; i < 16; i++) {
        const angle =
            (Math.PI * 2 * i) /
            16;

        const inner = 74;
        const outer = 108;

        ctx.beginPath();

        ctx.moveTo(
            Math.cos(angle) *
            inner,
            Math.sin(angle) *
            inner
        );

        ctx.lineTo(
            Math.cos(angle) *
            outer,
            Math.sin(angle) *
            outer
        );

        ctx.stroke();
    }

    const sphere =
        ctx.createRadialGradient(
            -18,
            -22,
            8,
            0,
            0,
            64
        );

    sphere.addColorStop(
        0,
        "rgba(255,255,220,1)"
    );

    sphere.addColorStop(
        0.34,
        "rgba(255,226,126,1)"
    );

    sphere.addColorStop(
        0.75,
        "rgba(255,170,67,1)"
    );

    sphere.addColorStop(
        1,
        "rgba(231,111,38,0.96)"
    );

    ctx.shadowBlur = 32;

    ctx.shadowColor =
        "rgba(255,184,70,0.72)";

    ctx.fillStyle =
        sphere;

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        58,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.shadowBlur = 0;

    const highlight =
        ctx.createRadialGradient(
            -18,
            -25,
            2,
            -18,
            -25,
            28
        );

    highlight.addColorStop(
        0,
        "rgba(255,255,255,0.62)"
    );

    highlight.addColorStop(
        1,
        "rgba(255,255,255,0)"
    );

    ctx.fillStyle =
        highlight;

    ctx.beginPath();

    ctx.arc(
        -18,
        -25,
        28,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();
}

function drawMoon(ctx) {
    const x =
        window.innerWidth * 0.80;

    const y =
        window.innerHeight * 0.17;

    const glow =
        ctx.createRadialGradient(
            x,
            y,
            10,
            x,
            y,
            135
        );

    glow.addColorStop(
        0,
        "rgba(220,210,255,0.36)"
    );

    glow.addColorStop(
        0.45,
        "rgba(174,154,255,0.14)"
    );

    glow.addColorStop(
        1,
        "rgba(174,154,255,0)"
    );

    ctx.fillStyle =
        glow;

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        135,
        0,
        Math.PI * 2
    );

    ctx.fill();

    const sphere =
        ctx.createRadialGradient(
            x - 15,
            y - 18,
            5,
            x,
            y,
            52
        );

    sphere.addColorStop(
        0,
        "rgba(255,255,255,1)"
    );

    sphere.addColorStop(
        0.48,
        "rgba(222,218,244,0.98)"
    );

    sphere.addColorStop(
        0.78,
        "rgba(163,153,191,0.95)"
    );

    sphere.addColorStop(
        1,
        "rgba(92,84,116,0.96)"
    );

    ctx.shadowBlur = 24;

    ctx.shadowColor =
        "rgba(188,170,255,0.45)";

    ctx.fillStyle =
        sphere;

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        48,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.shadowBlur = 0;

    ctx.fillStyle =
        "rgba(25,21,47,0.70)";

    [
        [-14, -10, 7],
        [12, -4, 5],
        [-2, 17, 8]
    ].forEach(
        ([cx, cy, r]) => {
            ctx.beginPath();

            ctx.arc(
                x + cx,
                y + cy,
                r,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }
    );
}

function drawStars(ctx) {
    stars.forEach(star => {
        const pulse =
            0.74 +
            Math.sin(
                performance.now() / 700 +
                star.x
            ) *
            0.26;

        ctx.fillStyle =
            `rgba(255,255,255,${Math.max(
                0.15,
                star.alpha * pulse
            )})`;

        ctx.beginPath();

        ctx.arc(
            star.x,
            star.y,
            star.size,
            0,
            Math.PI * 2
        );

        ctx.fill();
    });
}

function drawFog(ctx) {
    const gradient =
        ctx.createRadialGradient(
            window.innerWidth / 2,
            window.innerHeight / 2,
            50,
            window.innerWidth / 2,
            window.innerHeight / 2,
            window.innerWidth * 0.85
        );

    gradient.addColorStop(
        0,
        "rgba(235,230,250,0.22)"
    );

    gradient.addColorStop(
        1,
        "rgba(235,230,250,0)"
    );

    ctx.fillStyle =
        gradient;

    ctx.fillRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
    );
}

let nextLightning = 0;
let lightningFlash = 0;

function drawWeatherEnvironment() {
    if (!weatherCanvas) {
        return;
    }

    cancelAnimationFrame(
        animationFrame
    );

    const ctx =
        resizeWeatherCanvas();

    if (!ctx) {
        return;
    }

    createEnvironmentObjects();

    function animate(timestamp) {
        ctx.clearRect(
            0,
            0,
            window.innerWidth,
            window.innerHeight
        );

        const isNight =
            document.body.classList.contains(
                "night"
            );

        if (isNight) {
            drawStars(ctx);
            drawMoon(ctx);
        }
        else if (
            currentWeatherState === "clear" ||
            currentWeatherState === "clouds"
        ) {
            drawSun(ctx);
        }

        if (
            currentWeatherState ===
            "clouds"
        ) {
            environmentClouds.forEach(
                cloud => {
                    drawCloud(
                        ctx,
                        cloud.x,
                        cloud.y,
                        cloud.scale,
                        0.20
                    );

                    cloud.x +=
                        cloud.speed;

                    if (
                        cloud.x >
                        window.innerWidth +
                        250
                    ) {
                        cloud.x = -250;
                    }
                }
            );
        }

        if (
            currentWeatherState === "rain" ||
            currentWeatherState === "thunder"
        ) {
            environmentClouds.forEach(
                cloud => {
                    drawCloud(
                        ctx,
                        cloud.x,
                        cloud.y,
                        cloud.scale,
                        0.34
                    );

                    cloud.x +=
                        cloud.speed * 0.75;

                    if (
                        cloud.x >
                        window.innerWidth +
                        250
                    ) {
                        cloud.x = -250;
                    }
                }
            );

            particles.forEach(p => {
                const lightMode = false;

                const dropGradient =
                    ctx.createLinearGradient(
                        p.x,
                        p.y,
                        p.x - 4,
                        p.y + 20
                    );

                dropGradient.addColorStop(
                    0,
                    lightMode
                        ? "rgba(255,255,255,0.75)"
                        : "rgba(220,232,255,0.68)"
                );

                dropGradient.addColorStop(
                    0.30,
                    lightMode
                        ? "rgba(99,120,175,0.68)"
                        : "rgba(126,159,220,0.56)"
                );

                dropGradient.addColorStop(
                    1,
                    lightMode
                        ? "rgba(85,72,130,0.22)"
                        : "rgba(93,116,176,0.16)"
                );

                ctx.strokeStyle =
                    dropGradient;

                ctx.lineWidth = 1.8;

                ctx.lineCap =
                    "round";

                ctx.beginPath();

                ctx.moveTo(
                    p.x,
                    p.y
                );

                ctx.lineTo(
                    p.x - 4,
                    p.y + 20
                );

                ctx.stroke();

                p.y += p.speed;
                p.x -= 1.2;

                if (
                    p.y >
                    window.innerHeight
                ) {
                    p.y = -20;

                    p.x =
                        Math.random() *
                        window.innerWidth;
                }
            });
        }

        if (
            currentWeatherState ===
            "thunder"
        ) {
            if (
                !nextLightning ||
                timestamp >
                nextLightning
            ) {
                lightningFlash = 1;

                nextLightning =
                    timestamp +
                    1800 +
                    Math.random() * 3000;
            }

            if (lightningFlash > 0) {
                ctx.fillStyle =
                    `rgba(255,255,255,${lightningFlash *
                    0.28})`;

                ctx.fillRect(
                    0,
                    0,
                    window.innerWidth,
                    window.innerHeight
                );

                const bx =
                    window.innerWidth * 0.68;

                const by =
                    window.innerHeight * 0.20;

                ctx.save();

                ctx.shadowBlur = 28;

                ctx.shadowColor =
                    "rgba(195,180,255,0.95)";

                ctx.fillStyle =
                    "rgba(244,240,255,0.98)";

                ctx.beginPath();

                ctx.moveTo(
                    bx,
                    by - 5
                );

                ctx.lineTo(
                    bx - 28,
                    by + 58
                );

                ctx.lineTo(
                    bx - 5,
                    by + 50
                );

                ctx.lineTo(
                    bx - 35,
                    by + 112
                );

                ctx.lineTo(
                    bx + 18,
                    by + 40
                );

                ctx.lineTo(
                    bx - 7,
                    by + 47
                );

                ctx.closePath();

                ctx.fill();

                ctx.fillStyle =
                    "rgba(150,123,255,0.42)";

                ctx.beginPath();

                ctx.moveTo(
                    bx + 1,
                    by + 2
                );

                ctx.lineTo(
                    bx - 6,
                    by + 48
                );

                ctx.lineTo(
                    bx + 7,
                    by + 43
                );

                ctx.lineTo(
                    bx - 10,
                    by + 82
                );

                ctx.lineTo(
                    bx + 9,
                    by + 42
                );

                ctx.lineTo(
                    bx - 1,
                    by + 45
                );

                ctx.closePath();

                ctx.fill();

                ctx.restore();

                lightningFlash *=
                    0.75;

                if (
                    lightningFlash <
                    0.02
                ) {
                    lightningFlash = 0;
                }
            }
        }

        if (
            currentWeatherState ===
            "snow"
        ) {
            environmentClouds.forEach(
                cloud => {
                    drawCloud(
                        ctx,
                        cloud.x,
                        cloud.y,
                        cloud.scale,
                        0.25
                    );

                    cloud.x +=
                        cloud.speed * 0.6;

                    if (
                        cloud.x >
                        window.innerWidth +
                        250
                    ) {
                        cloud.x = -250;
                    }
                }
            );

            ctx.fillStyle =
                "rgba(255,255,255,0.88)";

            particles.forEach(p => {
                ctx.beginPath();

                ctx.arc(
                    p.x,
                    p.y,
                    p.size,
                    0,
                    Math.PI * 2
                );

                ctx.fill();

                p.y += p.speed;

                p.x +=
                    Math.sin(
                        p.y * 0.01
                    ) * 0.55;

                if (
                    p.y >
                    window.innerHeight
                ) {
                    p.y = -10;

                    p.x =
                        Math.random() *
                        window.innerWidth;
                }
            });
        }

        if (
            currentWeatherState ===
            "mist"
        ) {
            drawFog(ctx);
        }

        const vignette =
            ctx.createRadialGradient(
                window.innerWidth / 2,
                window.innerHeight / 2,
                Math.min(
                    window.innerWidth,
                    window.innerHeight
                ) * 0.18,
                window.innerWidth / 2,
                window.innerHeight / 2,
                Math.max(
                    window.innerWidth,
                    window.innerHeight
                ) * 0.78
            );

        vignette.addColorStop(
            0,
            "rgba(0,0,0,0)"
        );

        vignette.addColorStop(
            1,
            "rgba(0,0,0,0.10)"
        );

        ctx.fillStyle =
            vignette;

        ctx.fillRect(
            0,
            0,
            window.innerWidth,
            window.innerHeight
        );

        animationFrame =
            requestAnimationFrame(
                animate
            );
    }

    animationFrame =
        requestAnimationFrame(
            animate
        );
}

window.addEventListener(
    "resize",
    () => {
        createEnvironmentObjects();
        drawWeatherEnvironment();
        placeLocationsSection();
    }
);

/* =========================================================
   SEARCH + CURRENT LOCATION
========================================================= */

if (searchButton) {
    searchButton.addEventListener(
        "click",
        searchWeather
    );
}

if (cityInput) {
    cityInput.addEventListener(
        "keydown",
        event => {
            if (event.key === "Enter") {
                searchWeather();
            }
        }
    );
}

async function searchWeather() {
    const city =
        cityInput?.value.trim();

    if (!city) {
        return;
    }

    try {
        setLoadingState(true);

        const response =
            await fetch(
                `/weather?city=${encodeURIComponent(
                    city
                )}`
            );

        const data =
            await response.json();

        if (!response.ok) {
            alert(
                data.error ||
                "Unable to get weather."
            );

            return;
        }

        showWeather(data);

        addLocation(data.city);

        await Promise.allSettled([
            loadForecast(data.city),
            loadAirQuality(data)
        ]);
    }
    catch (error) {
        console.error(error);

        alert(
            "Unable to connect to the weather service."
        );
    }
    finally {
        setLoadingState(false);
    }
}

function setLoadingState(loading) {
    if (!searchButton) {
        return;
    }

    searchButton.disabled =
        loading;

    searchButton.textContent =
        loading
            ? "Loading..."
            : "Search";
}

function getCurrentLocation() {
    if (!navigator.geolocation) {
        alert(
            "Location is not supported by this browser."
        );

        return;
    }

    navigator.geolocation.getCurrentPosition(
        async position => {
            try {
                setLoadingState(true);

                const {
                    latitude,
                    longitude
                } = position.coords;

                const response =
                    await fetch(
                        `/weather/location?lat=${encodeURIComponent(
                            latitude
                        )}&lon=${encodeURIComponent(
                            longitude
                        )}`
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    alert(
                        data.error ||
                        "Unable to get your location weather."
                    );

                    return;
                }

                cityInput.value =
                    data.city;

                showWeather(data);

                addLocation(
                    data.city
                );

                await Promise.allSettled([
                    loadForecast(
                        data.city
                    ),
                    loadAirQuality(
                        data
                    )
                ]);
            }
            catch (error) {
                console.error(error);

                alert(
                    "Unable to get weather for your current location."
                );
            }
            finally {
                setLoadingState(false);
            }
        },

        error => {
            console.error(error);

            alert(
                "Please allow location access to use your current location."
            );
        },

        {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000
        }
    );
}

document
    .querySelectorAll("button")
    .forEach(button => {
        const text =
            button.textContent.toLowerCase();

        if (
            text.includes("current location") ||
            text.includes("use my location")
        ) {
            button.addEventListener(
                "click",
                getCurrentLocation
            );
        }
    });

/* =========================================================
   CURRENT WEATHER
========================================================= */

function showWeather(data) {
    safeText(
        cityName,
        `${data.city}, ${data.country}`
    );

    safeText(
        temperature,
        data.temperature
    );

    safeText(
        condition,
        data.description
    );

    safeText(
        feelsLike,
        `${data.feels_like}°`
    );

    safeText(
        humidity,
        `${data.humidity}%`
    );

    safeText(
        wind,
        `${data.wind_speed} km/h`
    );

    safeText(
        pressure,
        `${data.pressure} hPa`
    );

    safeText(
        visibility,
        `${data.visibility} km`
    );

    setWeatherScene(
        data.condition,
        data.icon
    );

    updateActivity(data);

    const sunrise =
        byId("sunrise");

    const sunset =
        byId("sunset");

    const moonrise =
        byId("moonrise");

    const moonset =
        byId("moonset");

    if (sunrise) {
        safeText(
            sunrise,
            data.sunrise || "--"
        );
    }

    if (sunset) {
        safeText(
            sunset,
            data.sunset || "--"
        );
    }

    if (moonrise) {
        safeText(
            moonrise,
            data.moonrise || "--"
        );
    }

    if (moonset) {
        safeText(
            moonset,
            data.moonset || "--"
        );
    }
}

/* =========================================================
   ACTIVITY
========================================================= */

function updateActivity(data) {
    if (
        !activityTitle ||
        !activityText
    ) {
        return;
    }

    const temp =
        Number(data.temperature);

    const weather =
        String(
            data.condition || ""
        ).toLowerCase();

    if (
        weather.includes("thunder") ||
        weather.includes("rain") ||
        weather.includes("drizzle")
    ) {
        activityTitle.textContent =
            "Better stay indoors ☔";

        activityText.textContent =
            "Rainy weather is expected. Perfect time for a movie, gaming, studying, or a cozy indoor workout.";
    }
    else if (
        weather.includes("snow")
    ) {
        activityTitle.textContent =
            "Winter day ❄️";

        activityText.textContent =
            "Bundle up before heading outside. A short walk can be great if conditions are safe.";
    }
    else if (temp >= 30) {
        activityTitle.textContent =
            "Keep it cool 🧊";

        activityText.textContent =
            "It is warm outside. Consider indoor activities or go out during the cooler parts of the day.";
    }
    else if (
        temp >= 18 &&
        temp < 30
    ) {
        activityTitle.textContent =
            "Great time to go outside ✨";

        activityText.textContent =
            "The temperature looks comfortable. A walk, cycling session, outdoor study session, or photography trip could be nice.";
    }
    else {
        activityTitle.textContent =
            "A little chilly 🧥";

        activityText.textContent =
            "You can still head outside, but consider taking a light jacket.";
    }
}

/* =========================================================
   DETAIL CARDS
========================================================= */

document
    .querySelectorAll(".weather-card")
    .forEach(card => {
        card.addEventListener(
            "click",
            () => {
                showDetail(
                    card.dataset.detail
                );
            }
        );
    });

function showDetail(type) {
    if (
        !expandedPanel ||
        !expandedContent
    ) {
        return;
    }

    let title = "";
    let content = "";

    if (type === "humidity") {
        title = "💧 Humidity";

        content = `
            <h3>Humidity Details</h3>

            <p>
                Current humidity:
                <strong>
                    ${escapeHtml(
            humidity?.textContent ||
            "--"
        )}
                </strong>
            </p>

            <p>
                Humidity describes the amount of
                moisture present in the air.
            </p>
        `;
    }
    else if (type === "wind") {
        title = "💨 Wind";

        content = `
            <h3>Wind Details</h3>

            <p>
                Current wind speed:
                <strong>
                    ${escapeHtml(
            wind?.textContent ||
            "--"
        )}
                </strong>
            </p>

            <p>
                Wind can influence how warm or
                cool the air feels.
            </p>
        `;
    }
    else if (type === "pressure") {
        title =
            "🌡️ Atmospheric Pressure";

        content = `
            <h3>Pressure Details</h3>

            <p>
                Current pressure:
                <strong>
                    ${escapeHtml(
            pressure?.textContent ||
            "--"
        )}
                </strong>
            </p>

            <p>
                Atmospheric pressure is the force
                exerted by the surrounding air.
            </p>
        `;
    }
    else if (type === "visibility") {
        title = "👁️ Visibility";

        content = `
            <h3>Visibility Details</h3>

            <p>
                Current visibility:
                <strong>
                    ${escapeHtml(
            visibility?.textContent ||
            "--"
        )}
                </strong>
            </p>

            <p>
                Visibility can decrease during fog,
                haze, rain, or other conditions.
            </p>
        `;
    }

    if (!title) {
        return;
    }

    expandedContent.innerHTML = `
        <h2>${title}</h2>
        ${content}
    `;

    expandedPanel.classList.add(
        "show"
    );

    expandedPanel.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}

if (closePanel) {
    closePanel.addEventListener(
        "click",
        () => {
            expandedPanel?.classList.remove(
                "show"
            );
        }
    );
}

/* =========================================================
   FORECAST
========================================================= */

async function loadForecast(city) {
    if (
        !forecastContainer &&
        !hourlyContainer
    ) {
        return;
    }

    const response =
        await fetch(
            `/forecast?city=${encodeURIComponent(
                city
            )}`
        );

    const data =
        await response.json();

    if (!response.ok) {
        throw new Error(
            data.error ||
            "Forecast unavailable."
        );
    }

    if (hourlyContainer) {
        showHourly(
            data.hourly || []
        );
    }

    if (forecastContainer) {
        showDaily(
            data.daily || []
        );
    }
}

function showHourly(hourly) {
    hourlyContainer.innerHTML = "";

    if (!hourly.length) {
        hourlyContainer.innerHTML = `
            <div class="empty-state">
                Forecast unavailable.
            </div>
        `;

        return;
    }

    hourly.forEach(item => {
        const card =
            document.createElement("div");

        card.className =
            "hour-card";

        card.innerHTML = `
            <span>
                ${escapeHtml(item.time)}
            </span>

            <strong>
                ${item.temperature}°
            </strong>

            <span>
                ${item.rain_probability}% rain
            </span>
        `;

        hourlyContainer.appendChild(card);
    });
}

function showDaily(daily) {
    forecastContainer.innerHTML = "";

    if (!daily.length) {
        forecastContainer.innerHTML = `
            <div class="empty-state">
                Forecast unavailable.
            </div>
        `;

        return;
    }

    daily.forEach(item => {
        const card =
            document.createElement("button");

        card.type = "button";

        card.className =
            "forecast-card";

        card.setAttribute(
            "aria-expanded",
            "false"
        );

        card.innerHTML = `
            <span class="forecast-summary">

                <span class="forecast-date">
                    ${formatDate(item.date)}
                </span>

                <span class="forecast-condition">
                    ${escapeHtml(
            item.condition
        )}
                </span>

                <span class="forecast-temp">
                    ${item.temperature}°
                </span>

            </span>

            <span class="forecast-details">

                <span>
                    🌡️ Temperature:
                    <strong>
                        ${item.temperature}°C
                    </strong>
                </span>

                <span>
                    🌡️ Feels like:
                    <strong>
                        ${item.feels_like}°C
                    </strong>
                </span>

                <span>
                    ☁️ Condition:
                    <strong>
                        ${escapeHtml(
            item.description
        )}
                    </strong>
                </span>

                <span>
                    💧 Humidity:
                    <strong>
                        ${item.humidity}%
                    </strong>
                </span>

                <span>
                    💨 Wind:
                    <strong>
                        ${item.wind_speed} km/h
                    </strong>
                </span>

                <span>
                    ☔ Rain probability:
                    <strong>
                        ${item.rain_probability}%
                    </strong>
                </span>

                <span>
                    👁️ Visibility:
                    <strong>
                        ${item.visibility} km
                    </strong>
                </span>

                <span>
                    🌡️ Pressure:
                    <strong>
                        ${item.pressure} hPa
                    </strong>
                </span>

            </span>
        `;

        card.addEventListener(
            "click",
            () => {
                const isExpanded =
                    card.classList.contains(
                        "expanded"
                    );

                const nextState =
                    !isExpanded;

                card.classList.toggle(
                    "expanded",
                    nextState
                );

                card.setAttribute(
                    "aria-expanded",
                    String(nextState)
                );
            }
        );

        forecastContainer.appendChild(
            card
        );
    });
}

function formatDate(dateString) {
    const date =
        new Date(
            `${dateString}T12:00:00`
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return dateString;
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            weekday: "short",
            month: "short",
            day: "numeric"
        }
    );
}

/* =========================================================
   AIR QUALITY
========================================================= */

async function loadAirQuality(data) {
    const aqiValue =
        byId("aqi-value");

    const aqiCategory =
        byId("aqi-category");

    const pm25 =
        byId("pm25");

    const pm10 =
        byId("pm10");

    const co =
        byId("co");

    const no2 =
        byId("no2");

    const o3 =
        byId("o3");

    if (
        !aqiValue &&
        !aqiCategory
    ) {
        return;
    }

    if (
        data.lat == null ||
        data.lon == null
    ) {
        return;
    }

    const response =
        await fetch(
            `/air-quality?lat=${encodeURIComponent(
                data.lat
            )}&lon=${encodeURIComponent(
                data.lon
            )}`
        );

    const result =
        await response.json();

    if (!response.ok) {
        throw new Error(
            result.error ||
            "Air quality unavailable."
        );
    }

    safeText(
        aqiValue,
        result.aqi ?? "--"
    );

    safeText(
        aqiCategory,
        result.category ?? "--"
    );

    safeText(
        pm25,
        result.pm2_5 != null
            ? result.pm2_5
            : "--"
    );

    safeText(
        pm10,
        result.pm10 != null
            ? result.pm10
            : "--"
    );

    safeText(
        co,
        result.co != null
            ? result.co
            : "--"
    );

    safeText(
        no2,
        result.no2 != null
            ? result.no2
            : "--"
    );

    safeText(
        o3,
        result.o3 != null
            ? result.o3
            : "--"
    );
}

/* =========================================================
   INITIAL STATE
========================================================= */

disableLightMode();

setSkyCastBranding();

moveCurrentLocationButton();

placeLocationsSection();

renderLocations();

createEnvironmentObjects();

setWeatherScene(
    "clear",
    "01d"
);