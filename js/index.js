const dataStorage = {};
let timeInterval;
const languageData = {
  EN: {
    humidity: "humidity",
    windspeed: "Wind speed",
    feels_like: "Feels like",
  },
  RU: {
    humidity: "Влажность",
    windspeed: "Скорость ветра",
    feels_like: "Ощущается",
  },
};
const imageArray = ["1", "2", "3", "4", "5"];
const radios = document.querySelectorAll('input[type=radio][name="tempreture"]');

function getCurrentGeolocation() {
  return new Promise(resolve => navigator.geolocation.getCurrentPosition(pos => resolve(pos)));
}

function createURL(geoData) {
  if (geoData.coords) {
    return `http://api.openweathermap.org/data/2.5/weather?lat=${geoData.coords.latitude}&lon=${geoData.coords.longitude}&units=metric&appid=238dedc7aeddec93e824d40434d3bfb9`;
  } else if (geoData.city) {
    return `http://api.openweathermap.org/data/2.5/weather?q=${geoData.city}&units=metric&appid=56a23fbb5471c446e61df4da49c6eb43`;
  }
}

function buildPageByCoords(coords) {
  getCurrentGeolocation()
    .then(result => {
      const geoData = {
        coords: {
          latitude: result.coords.latitude,
          longitude: result.coords.longitude,
        },
      };
      return geoData;
    })
    .then(geoData => buildPage(geoData));
}

function buildPageByCity(city) {
  const geoData = { city };
  if (document.querySelector(".geolocation__search-input").value === "") {
    alert("Введите название города");
    return;
  }
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
        alert("Проблемы с определением геоположения");
        clearInterval(timeInterval);
        return;
      }
      return response.json();
    })
    .then(result => {
      dataStorage.weather = result;
    });
}

function collectLocationData() {
  return fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${dataStorage.weather.coord.lat}&longitude=${dataStorage.weather.coord.lon}&localityLanguage=ru`
  )
    .then(response => response.json())
    .then(result => {
      dataStorage.geo = result;
    });
}

function renderPageValues() {
  document.querySelector(".forecast__tempreture").textContent =
    Math.round(dataStorage.weather.main.temp).toFixed(1) + "°";
  document.querySelector(".extra__feels-tempreture-value").textContent =
    Math.round(dataStorage.weather.main.feels_like).toFixed(1) + "°";
  document.querySelector(".extra__wind-speed-value").textContent =
    dataStorage.weather.wind.speed + "м/с";
  document.querySelector(".extra__humidity-value").textContent =
    dataStorage.weather.main.humidity + "%";
  document.querySelector(".calendar__date").textContent = collectDateData();
  timeInterval = setInterval(() => {
    document.querySelector(".calendar__clock").textContent = collectTimeData();
  }, 1000);
  switch (true) {
    case dataStorage.weather.clouds.all <= 10:
      document.querySelector(
        ".forecast__extra_cloudness"
      ).innerHTML = `<i class="fas fa-sun"style="color:gold"></i>`;
      break;
    case dataStorage.weather.clouds.all > 10 && dataStorage.weather.clouds.all <= 70:
      document.querySelector(
        ".forecast__extra_cloudness"
      ).innerHTML = `<i class="fas fa-cloud-sun" style="color:rgb(107, 102, 102)"></i>`;
      break;
    case dataStorage.weather.clouds.all > 70 && dataStorage.weather.clouds.all <= 100:
      document.querySelector(
        ".forecast__extra_cloudness"
      ).innerHTML = `<i class="fas fa-cloud" style="color:rgb(107, 102, 102)"></i>`;
      break;
  }
  initMap();
}

function renderPageParameters() {
  if (document.querySelector(".settings__language").value == "RU") {
    document.querySelector(".extra__feels-tempreture").textContent =
      languageData.RU.feels_like + ": ";
    document.querySelector(".extra__wind-speed").textContent = languageData.RU.windspeed + ": ";
    document.querySelector(".extra__humidity").textContent = languageData.RU.humidity + ": ";
    document.querySelector(".location").textContent =
      dataStorage.geo.countryName + ", " + dataStorage.geo.city;
    document.querySelector(".calendar__date").textContent = collectDateData();
  } else if (document.querySelector(".settings__language").value == "EN") {
    document.querySelector(".extra__feels-tempreture").textContent =
      languageData.EN.feels_like + ": ";
    document.querySelector(".extra__wind-speed").textContent = languageData.EN.windspeed + ": ";
    document.querySelector(".extra__humidity").textContent = languageData.EN.humidity + ": ";
    document.querySelector(".location").textContent =
      dataStorage.geo.localityInfo.administrative[0].isoName +
      ", " +
      dataStorage.geo.localityInfo.administrative[1].isoName;
    document.querySelector(".calendar__date").textContent = collectDateData();
  }
}

function collectDateData() {
  let date =
    +Date.now() + new Date().getTimezoneOffset() * 60 * 1000 + dataStorage.weather.timezone * 1000;
  if (document.querySelector(".settings__language").value == "RU") {
    let formatterRU = new Intl.DateTimeFormat("ru", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
    return formatterRU.format(date);
  } else if (document.querySelector(".settings__language").value == "EN") {
    let formatterRU = new Intl.DateTimeFormat("eng-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
    return formatterRU.format(date);
  }
}

function collectTimeData() {
  let time =
    +Date.now() + new Date().getTimezoneOffset() * 60 * 1000 + dataStorage.weather.timezone * 1000;
  let formatter = new Intl.DateTimeFormat("ru", {
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  });
  return formatter.format(time);
}

function initMap() {
  let map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: dataStorage.weather.coord.lat, lng: dataStorage.weather.coord.lon },
    zoom: 10,
  });
}

function changeTempretureUnits() {
  if (document.getElementById("C").checked) {
    document.querySelector(".forecast__tempreture").textContent =
      Math.round(dataStorage.weather.main.temp).toFixed(1) + "°";
    document.querySelector(".extra__feels-tempreture-value").textContent =
      Math.round(dataStorage.weather.main.feels_like).toFixed(1) + "°";
  }
  if (document.getElementById("F").checked) {
    document.querySelector(".forecast__tempreture").textContent =
      Math.round((dataStorage.weather.main.temp * 9) / 5 + 32).toFixed(1) + "°";
    document.querySelector(".extra__feels-tempreture-value").textContent =
      Math.round((dataStorage.weather.main.feels_like * 9) / 5 + 32).toFixed(1) + "°";
  }
}

function changeImage() {
  let random = Math.floor(Math.random() * 5);
  document.body.style = `
  background:linear-gradient( rgba(0, 0, 0, 0.6) 100%, rgba(0, 0, 0, 0.6)100%),url("./assets/${imageArray[random]}.jpg");
  
  `;
}

buildPageByCoords();
document.querySelector(".settings__language").addEventListener("change", renderPageParameters);
document.querySelector(".geolocation__search-button").addEventListener("click", buildPageByCity);
document.querySelector(".settings__background-image").addEventListener("click", changeImage);
radios.forEach(radio => radio.addEventListener("click", changeTempretureUnits));
