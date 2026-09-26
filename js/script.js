(function () {
  'use strict';

  const DATA_URL = 'dbHeroes.json';
  const grid = document.getElementById('heroes-grid');
  const loadingEl = document.getElementById('loading');
  const errorEl = document.getElementById('error');
  const filterSelect = document.getElementById('movie-filter');
  const clearButton = document.getElementById('clear-filter');

  let allHeroes = [];
  let allMovies = [];

  // ===== AJAX-запрос (XMLHttpRequest) =====
  function fetchData(url) {
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.setRequestHeader('Content-Type', 'application/json');

      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            var data = JSON.parse(xhr.responseText);
            resolve(data);
          } catch (e) {
            reject(new Error('Ошибка парсинга JSON: ' + e.message));
          }
        } else {
          reject(new Error('Ошибка загрузки: ' + xhr.status + ' ' + xhr.statusText));
        }
      };

      xhr.onerror = function () {
        reject(new Error('Сетевая ошибка: невозможно выполнить запрос'));
      };

      xhr.send();
    });
  }

  // ===== Сбор уникальных фильмов =====
  function collectMovies(heroes) {
    var moviesSet = {};
    for (var i = 0; i < heroes.length; i++) {
      var hero = heroes[i];
      if (hero.movies && Array.isArray(hero.movies)) {
        for (var j = 0; j < hero.movies.length; j++) {
          var movie = hero.movies[j];
          if (!moviesSet[movie]) {
            moviesSet[movie] = true;
          }
        }
      }
    }
    return Object.keys(moviesSet).sort();
  }

  // ===== Заполнение выпадающего списка фильтра =====
  function populateFilter(movies) {
    for (var i = 0; i < movies.length; i++) {
      var option = document.createElement('option');
      option.value = movies[i];
      option.textContent = movies[i];
      filterSelect.appendChild(option);
    }
  }

  // ===== Получить метку статуса =====
  function getStatusLabel(status) {
    var labels = {
      'alive': 'Жив',
      'deceased': 'Умер',
      'destroyed': 'Уничтожен',
      'unknown': 'Неизвестен'
    };
    return labels[status] || status;
  }

  // ===== Получить CSS-класс статуса =====
  function getStatusClass(status) {
    if (status === 'alive') return 'alive';
    if (status === 'deceased') return 'deceased';
    if (status === 'destroyed') return 'destroyed';
    return 'unknown';
  }

  // ===== Создание HTML карточки героя =====
  function createHeroCard(hero, index) {
    var card = document.createElement('div');
    card.className = 'hero-card';
    card.style.animationDelay = (index * 0.05) + 's';

    // Изображение
    var imageWrapper = document.createElement('div');
    imageWrapper.className = 'hero-card__image-wrapper';

    if (hero.photo) {
      var img = document.createElement('img');
      img.className = 'hero-card__image';
      img.src = hero.photo;
      img.alt = hero.name;
      img.loading = 'lazy';
      img.onerror = function () {
        this.style.display = 'none';
        var fallback = document.createElement('div');
        fallback.className = 'hero-card__image-fallback';
        fallback.textContent = hero.name.charAt(0).toUpperCase();
        imageWrapper.appendChild(fallback);
      };
      imageWrapper.appendChild(img);
    } else {
      var fallback = document.createElement('div');
      fallback.className = 'hero-card__image-fallback';
      fallback.textContent = hero.name.charAt(0).toUpperCase();
      imageWrapper.appendChild(fallback);
    }

    // Бейдж статуса
    if (hero.status) {
      var badge = document.createElement('span');
      badge.className = 'hero-card__status hero-card__status--' + getStatusClass(hero.status);
      badge.textContent = getStatusLabel(hero.status);
      imageWrapper.appendChild(badge);
    }

    card.appendChild(imageWrapper);

    // Тело карточки
    var body = document.createElement('div');
    body.className = 'hero-card__body';

    // Имя
    var nameEl = document.createElement('h3');
    nameEl.className = 'hero-card__name';
    nameEl.textContent = hero.name;
    body.appendChild(nameEl);

    // Актёр / Настоящее имя
    if (hero.actors) {
      var infoEl = document.createElement('p');
      infoEl.className = 'hero-card__actor';
      infoEl.innerHTML = '<strong>Актёр:</strong> ' + escapeHtml(hero.actors);
      body.appendChild(infoEl);
    }

    // Фильмы
    if (hero.movies && hero.movies.length > 0) {
      var moviesLabel = document.createElement('p');
      moviesLabel.className = 'hero-card__movies-label';
      moviesLabel.textContent = 'Фильмы:';
      body.appendChild(moviesLabel);

      var moviesList = document.createElement('ul');
      moviesList.className = 'hero-card__movies';

      for (var i = 0; i < hero.movies.length; i++) {
        var li = document.createElement('li');
        var tag = document.createElement('span');
        tag.className = 'hero-card__movie-tag';
        tag.textContent = hero.movies[i];
        li.appendChild(tag);
        moviesList.appendChild(li);
      }

      body.appendChild(moviesList);
    } else {
      var noMovies = document.createElement('p');
      noMovies.className = 'hero-card__no-movies';
      noMovies.textContent = 'Фильмы отсутствуют';
      body.appendChild(noMovies);
    }

    card.appendChild(body);
    return card;
  }

  // ===== Экранирование HTML =====
  function escapeHtml(text) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
  }

  // ===== Отрисовка героев =====
  function renderHeroes(heroes) {
    grid.innerHTML = '';

    if (heroes.length === 0) {
      var noResults = document.createElement('div');
      noResults.className = 'no-results';
      noResults.innerHTML = '<div class="no-results__icon">\uD83D\uDD0D</div><p class="no-results__text">Герои не найдены</p>';
      grid.appendChild(noResults);
      return;
    }

    for (var i = 0; i < heroes.length; i++) {
      var card = createHeroCard(heroes[i], i);
      grid.appendChild(card);
    }
  }

  // ===== Фильтрация героев по фильму =====
  function filterByMovie(movieName) {
    if (movieName === 'all') {
      renderHeroes(allHeroes);
      clearButton.disabled = true;
      return;
    }

    var filtered = [];
    for (var i = 0; i < allHeroes.length; i++) {
      var hero = allHeroes[i];
      if (hero.movies && Array.isArray(hero.movies)) {
        for (var j = 0; j < hero.movies.length; j++) {
          if (hero.movies[j] === movieName) {
            filtered.push(hero);
            break;
          }
        }
      }
    }

    renderHeroes(filtered);
    clearButton.disabled = false;
  }

  // ===== Обработчики событий =====
  filterSelect.addEventListener('change', function () {
    var selectedValue = filterSelect.value;
    filterByMovie(selectedValue);
  });

  clearButton.addEventListener('click', function () {
    filterSelect.value = 'all';
    filterByMovie('all');
  });

  // ===== Инициализация =====
  function init() {
    fetchData(DATA_URL)
      .then(function (data) {
        allHeroes = data;
        allMovies = collectMovies(data);
        populateFilter(allMovies);
        loadingEl.style.display = 'none';
        renderHeroes(allHeroes);
      })
      .catch(function (error) {
        loadingEl.style.display = 'none';
        errorEl.style.display = 'block';
        errorEl.textContent = 'Ошибка: ' + error.message;
        console.error(error);
      });
  }

  init();
})();
