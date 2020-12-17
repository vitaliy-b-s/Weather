const data = {};
const WEATHER_API = `http://api.openweathermap.org/data/2.5/weather?`;
const GEO_API = `https://api.bigdatacloud.net/data/reverse-geocode-client?`;

let timeInterval;

function getCurrentGeolocation() {
  return new Promise(resolve => navigator.geolocation.getCurrentPosition(pos => resolve(pos)));
}

function createURL(geoData) {
  if (geoData.coords) {
    return `${WEATHER_API}lat=${geoData.coords.latitude}&lon=${geoData.coords.longitude}&units=metric&appid=238dedc7aeddec93e824d40434d3bfb9`;
  } else if (geoData.city) {
    return `${WEATHER_API}q=${geoData.city}&units=metric&appid=56a23fbb5471c446e61df4da49c6eb43`;
  }
}

function buildPageByCoords(coords) {
  getCurrentGeolocation()
    .then(result => ({
      coords: {
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
      },
    }))
    .then(geoData => buildPage(geoData));
}

function buildPageByCity(city) {
  const geoData = { city };
  geoData.city = document.querySelector(".geolocation__search-input").value;
  buildPage(geoData);
}

function buildPage(geoData) {
  collectData(geoData).then(() => {
    renderPageParameters();
    renderPageValues();
  });
}

function collectData(geoData) {
  return collectWeatherData(createURL(geoData)).then(() => collectLocationData());
}

function collectWeatherData(url) {
  return fetch(url)
    .then(response => {
      if (response.status !== 200) {
        // так-то у промисов есть не только resolve, но и reject
        // и реджект нужен как раз для обработки ошибок
        alert("Проблемы с определением геоположения");
        clearInterval(timeInterval);
        return;
      }
      return response.json();
    })
    .then(result => (data.weather = result));
}

function collectLocationData() {
  return fetch(
    `${GEO_API}latitude=${data.weather.coord.lat}&longitude=${data.weather.coord.lon}&localityLanguage=ru`
  )
    .then(response => response.json())
    .then(result => (data.geo = result));
}

function renderPageValues() {
  document.querySelector(".forecast__tempreture").textContent =
    Math.round(data.weather.main.temp).toFixed(1) + "°";
  document.querySelector(".extra__feels-tempreture-value").textContent =
    Math.round(data.weather.main.feels_like).toFixed(1) + "°";
  document.querySelector(".extra__wind-speed-value").textContent = data.weather.wind.speed + "м/с";
  document.querySelector(".extra__humidity-value").textContent = data.weather.main.humidity + "%";
  document.querySelector(".calendar__date").textContent = collectDateData();
  timeInterval = setInterval(() => {
    document.querySelector(".calendar__clock").textContent = collectTimeData();
  }, 1000);
  if (data.weather.clouds.all <= 10) {
    document.querySelector(
      ".forecast__extra_cloudness"
    ).innerHTML = `<i class="fas fa-sun"style="color:gold"></i>`;
  } else if (data.weather.clouds.all > 10 && data.weather.clouds.all <= 70) {
    document.querySelector(
      ".forecast__extra_cloudness"
    ).innerHTML = `<i class="fas fa-cloud-sun" style="color:rgb(107, 102, 102)"></i>`;
  } else if (data.weather.clouds.all > 70 && data.weather.clouds.all <= 100) {
    document.querySelector(
      ".forecast__extra_cloudness"
    ).innerHTML = `<i class="fas fa-cloud" style="color:rgb(107, 102, 102)"></i>`;
  }
  initMap();
}

// Я правильно понимаю, что ты хранишь настройки своей страницы не в коде, а эмм? в html-е?
function renderPageParameters() {
  let languageSetting = document.querySelector(".settings__language").value;
  document.querySelector(".extra__feels-tempreture").textContent =
    languageSetting === "RU" ? `Ощущается как: ` : `Feels like: `;
  document.querySelector(".extra__wind-speed").textContent =
    languageSetting === "RU" ? `Скорость ветра: ` : `Wind speed: `;
  document.querySelector(".extra__humidity").textContent =
    languageSetting === "RU" ? `Влажность: ` : `Humidity: `;
  document.querySelector(".location").textContent =
    languageSetting === "RU"
      ? `${data.geo.countryName}, ${data.geo.city}`
      : `${data.geo.localityInfo.administrative[0].isoName}, ${data.geo.localityInfo.administrative[1].isoName}`;
  document.querySelector(".calendar__date").textContent = collectDateData();
}

function collectDateData() {
  let date =
    +Date.now() + new Date().getTimezoneOffset() * 60 * 1000 + data.weather.timezone * 1000;
  if (document.querySelector(".settings__language").value == "RU") {
    let formatterRU = new Intl.DateTimeFormat("ru", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
    return formatterRU.format(date);
  } else if (document.querySelector(".settings__language").value == "EN") {
    let formatterENG = new Intl.DateTimeFormat("eng-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
    return formatterENG.format(date);
  }
}

function collectTimeData() {
  let time =
    +Date.now() + new Date().getTimezoneOffset() * 60 * 1000 + data.weather.timezone * 1000;
  let formatter = new Intl.DateTimeFormat("ru", {
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  });
  return formatter.format(time);
}

function initMap() {
  let map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: data.weather.coord.lat, lng: data.weather.coord.lon },
    zoom: 10,
  });
}

function changeTempretureUnits() {
  // опять тот же вопрос про хранение параметров в html-е
  if (document.getElementById("C").checked) {
    document.querySelector(".forecast__tempreture").textContent =
      Math.round(data.weather.main.temp).toFixed(1) + "°";
    document.querySelector(".extra__feels-tempreture-value").textContent =
      Math.round(data.weather.main.feels_like).toFixed(1) + "°";
  }
  if (document.getElementById("F").checked) {
    document.querySelector(".forecast__tempreture").textContent =
      Math.round((data.weather.main.temp * 9) / 5 + 32).toFixed(1) + "°";
    document.querySelector(".extra__feels-tempreture-value").textContent =
      Math.round((data.weather.main.feels_like * 9) / 5 + 32).toFixed(1) + "°";
  }
}

function changeImage() {
  let random = Math.ceil(Math.random() * 4);
  document.body.style = `
  background:linear-gradient( rgba(0, 0, 0, 0.6) 100%, rgba(0, 0, 0, 0.6)100%),url("./assets/${random}.jpg")
  `;
}

function checkSearchInput() {
  if (document.querySelector(".geolocation__search-input").value === "") {
    alert("Введите название города");
    return;
  }
}

buildPageByCoords();
document.querySelector(".settings__language").addEventListener("change", renderPageParameters);
document.querySelector(".geolocation__search-button").addEventListener("click", () => {
  checkSearchInput();
  buildPageByCity();
});
document.querySelector(".settings__background-image").addEventListener("click", changeImage);
document
  .querySelectorAll('input[type=radio][name="tempreture"]')
  .forEach(radio => radio.addEventListener("click", changeTempretureUnits));
