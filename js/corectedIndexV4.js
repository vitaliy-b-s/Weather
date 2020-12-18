const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/weather?&units=metric&appid=56a23fbb5471c446e61df4da49c6eb43&`;
const GEO_API_URL = `https://api.bigdatacloud.net/data/reverse-geocode-client?&units=metric&appid=56a23fbb5471c446e61df4da49c6eb43&`;
const FORMATS = {
  date: {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  },
  time: {
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  },
};

const data = {};
const settings = {
  language: "RU",
  units: "C",
};

let timeInterval;

function buldPageByCurrentGeolocation() {
  getCurrentGeolocation()
    .then(result => ({
      coords: {
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
      },
    }))
    .then(geoData => buildPage(geoData));
}

function getCurrentGeolocation() {
  return new Promise(resolve => navigator.geolocation.getCurrentPosition(pos => resolve(pos)));
}

function buildPageByCity(foundCity) {
  const geoData = {};
  geoData.city = foundCity;
  buildPage(geoData);
}

function buildPage(geoData) {
  collectData(geoData).then(() => {
    renderPageParameters();
    renderPageValues();
  });
}

function collectData(geoData) {
  const weatherRequest = buildWeatherRequest(geoData);
  return collectWeatherData(weatherRequest).then(() => collectLocationData());
}

function buildWeatherRequest(geoData) {
  if (geoData.coords) {
    return `${WEATHER_API_URL}lat=${geoData.coords.latitude}&lon=${geoData.coords.longitude}`;
  } else if (geoData.city) {
    return `${WEATHER_API_URL}q=${geoData.city}`;
  }
}

function collectWeatherData(url) {
  return fetch(url)
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error("Something went wrong");
      }
    })
    .then(result => {
      data.weather = result;
    })
    .catch(error => {
      alert("Проблемы с определением геоположения", error);
      clearInterval(timeInterval);
    });
}

function collectLocationData() {
  return fetch(
    `${GEO_API_URL}latitude=${data.weather.coord.lat}&longitude=${data.weather.coord.lon}&localityLanguage=ru`
  )
    .then(response => response.json())
    .then(result => (data.geo = result));
}

function renderPageParameters() {
  const feelsLikeTempretue = document.querySelector(".extra__feels-tempreture ");
  const windSpeed = document.querySelector(".extra__wind-speed");
  const humidity = document.querySelector(".extra__humidity");
  const locationValue = document.querySelector(".location");
  const date = document.querySelector(".calendar__date");

  feelsLikeTempretue.textContent = settings.language === "RU" ? `Ощущается как: ` : `Feels like: `;
  windSpeed.textContent = settings.language === "RU" ? `Скорость ветра: ` : `Wind speed: `;
  humidity.textContent = settings.language === "RU" ? `Влажность: ` : `Humidity: `;
  locationValue.textContent =
    settings.language === "RU"
      ? `${data.geo.countryName}, ${data.geo.city}`
      : `${data.geo.localityInfo.administrative[0].isoName}, ${data.geo.localityInfo.administrative[1].isoName}`;
  date.textContent = getCurrentDate();

  initMap();
}

function renderPageValues() {
  const windSpeedValue = document.querySelector(".extra__wind-speed-value");
  const humiidtyValue = document.querySelector(".extra__humidity-value");
  const date = document.querySelector(".calendar__date");
  const time = document.querySelector(".calendar__clock");
  const cloud = document.getElementById("cloud");
  const cloudWrap = document.querySelector(".forecast__extra_cloudness");

  buildTempretureValues();
  humiidtyValue.textContent = `${data.weather.main.humidity}%`;
  windSpeedValue.textContent = `${data.weather.wind.speed}м/с`;
  date.textContent = getCurrentDate();

  timeInterval = setInterval(() => {
    time.textContent = getCurrentTime();
  }, 1000);

  const cloudness = data.weather.clouds.all;

  if (cloudness <= 10) {
    cloud.className = "fas fa-sun";
    cloud.style.color = "gold";
  } else if (cloudness > 10 && cloudness <= 70) {
    cloud.className = "fas fa-cloud-sun";
  } else if (cloudness > 70 && cloudness <= 100) {
    cloud.classList.add("fas fa-cloud");
  }
}

function getCurrentDate() {
  if (settings.language == "RU") {
    return new Intl.DateTimeFormat("ru", FORMATS.date).format(getUTCTime());
  } else if (settings.value == "EN") {
    return new Intl.DateTimeFormat("eng-GB", FORMATS.date).format(getUTCTime());
  }
}

function getCurrentTime() {
  return new Intl.DateTimeFormat("ru", FORMATS.time).format(getUTCTime());
}

// К времени по UTC добавляем разницу с часовым поясом запрашиваемого города
function getUTCTime() {
  return +Date.now() + new Date().getTimezoneOffset() * 60 * 1000 + data.weather.timezone * 1000;
}

function initMap() {
  new google.maps.Map(document.getElementById("map"), {
    center: { lat: data.weather.coord.lat, lng: data.weather.coord.lon },
    zoom: 10,
  });
}

function buildTempretureValues() {
  const tempreture = document.querySelector(".forecast__tempreture");
  const feelsLikeTempretueValue = document.querySelector(".extra__feels-tempreture-value");

  if (settings.units === "C") {
    tempreture.textContent = `${Math.round(data.weather.main.temp).toFixed(1)}°`;
    feelsLikeTempretueValue.textContent = `${Math.round(data.weather.main.feels_like).toFixed(1)}°`;
  }
  if (settings.units === "F") {
    tempreture.textContent = `${Math.round((data.weather.main.temp * 9) / 5 + 32).toFixed(1)}°`;
    feelsLikeTempretueValue.textContent = `${Math.round(
      (data.weather.main.feels_like * 9) / 5 + 32
    ).toFixed(1)}°`;
  }
}

function changeImage() {
  const random = Math.floor(Math.random() * Math.floor(4));
  document.body.style = `
  background:linear-gradient( rgba(0, 0, 0, 0.6) 100%, rgba(0, 0, 0, 0.6)100%),url("./assets/${random}.jpg");
  background-size: cover;
  background-repeat: no-repeat;
  `;
}

function getCityFromSearch() {
  return document.querySelector(".geolocation__search-input").value;
}

function changeLanguageSettings(event) {
  settings.language = event.target.value;
}

function changeTempretureUnits(event) {
  settings.units = event.target.value;
}

function init() {
  document.querySelector(".settings__language").addEventListener("change", event => {
    changeLanguageSettings(event);
    renderPageParameters();
  });
  document.querySelector(".geolocation__search-button").addEventListener("click", () => {
    buildPageByCity(getCityFromSearch());
    getCityFromSearch();
  });
  document.querySelector(".settings__background-image").addEventListener("click", changeImage);
  document.querySelectorAll(".settings__radio").forEach(item =>
    item.addEventListener("click", event => {
      changeTempretureUnits(event);
      buildTempretureValues();
    })
  );
  buldPageByCurrentGeolocation();
}

init();
