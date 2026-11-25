// Geometric Hub: разделы по адресу, выбор темы, демонстрационная консоль запуска.
(function () {
  var THEME_KEY = "geometric-hub-theme";
  var LOG_KEY = "geometric-hub-show-log";
  var THEMES = ["dark", "light", "vhs"];
  var DEFAULT_THEME = "vhs";
  var USER_NAME = "guest";

  var TYPE_DELAY_MS = 45;
  var LINE_DELAY_MS = 220;
  var LOG_LINE_DELAY_MS = 350;
  var DEMO_LOG = ["Initializing renderer...", "Loading assets...", "Ready."];

  var root = document.documentElement;
  var themeSelect = document.getElementById("theme-select");
  var showLogCheckbox = document.getElementById("show-log");
  var navLinks = document.querySelectorAll(".nav-link");
  var pages = document.querySelectorAll(".page");
  var consoleBox = document.getElementById("console");
  var consoleOutput = document.getElementById("console-output");
  var consoleLink = document.getElementById("console-link");
  var consoleClose = document.getElementById("console-close");

  // Каждый запуск консоли получает свой номер. Закрытие увеличивает номер и отменяет анимацию.
  var runId = 0;
  var lastFocus = null;

  function storageGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      /* localStorage недоступен: настройка действует до перезагрузки */
    }
  }

  // ----- темы -----

  function applyTheme(name) {
    if (THEMES.indexOf(name) === -1) {
      name = DEFAULT_THEME;
    }
    root.setAttribute("data-theme", name);
    if (themeSelect) {
      themeSelect.value = name;
    }
    storageSet(THEME_KEY, name);
  }

  // ----- разделы -----

  function showPage(name) {
    var exists = false;
    pages.forEach(function (page) {
      if (page.id === name) {
        exists = true;
      }
    });
    if (!exists) {
      name = "home";
    }

    pages.forEach(function (page) {
      page.hidden = page.id !== name;
    });
    navLinks.forEach(function (link) {
      link.classList.toggle("active", link.getAttribute("data-page") === name);
    });
    window.scrollTo(0, 0);
  }

  function currentPage() {
    return window.location.hash.replace("#", "") || "home";
  }

  // ----- консоль запуска -----

  function sleep(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  // Ждёт паузу и говорит, не отменена ли анимация за это время.
  async function pause(run, ms) {
    await sleep(ms);
    return run === runId;
  }

  function write(text) {
    consoleOutput.textContent += text;
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
  }

  async function typeChars(run, text) {
    for (var i = 0; i < text.length; i++) {
      write(text.charAt(i));
      if (!(await pause(run, TYPE_DELAY_MS))) {
        return false;
      }
    }
    return true;
  }

  function readShowLog() {
    return storageGet(LOG_KEY) !== "0";
  }

  async function playLaunch(run, exeName, url, showLog) {
    var prompt = "C:\\Users\\" + USER_NAME + "\\GeometricHub>";

    write("Geometric Hub [версия 0.1]\n");
    if (!(await pause(run, LINE_DELAY_MS))) return;
    write("Введите команду, чтобы запустить игру.\n");
    if (!(await pause(run, LINE_DELAY_MS * 2))) return;
    write("\n");
    if (!(await pause(run, LINE_DELAY_MS))) return;

    write(prompt);
    if (!(await typeChars(run, exeName))) return;
    write("\n");
    if (!(await pause(run, LINE_DELAY_MS))) return;

    write("Поиск файла: " + exeName + "\n");
    if (!(await pause(run, LINE_DELAY_MS / 2))) return;
    write("Запуск процесса...\n");
    if (!(await pause(run, LINE_DELAY_MS))) return;
    write("Процесс запущен: " + exeName + "\n");

    if (showLog) {
      write("Лог игры (демонстрация):\n\n");
      for (var i = 0; i < DEMO_LOG.length; i++) {
        if (!(await pause(run, LOG_LINE_DELAY_MS))) return;
        write("│ " + DEMO_LOG[i] + "\n");
      }
    } else {
      write("Видимость лога выключена в настройках Geometric Hub.\n");
    }

    if (!(await pause(run, LINE_DELAY_MS))) return;
    write("\nОткрываем страницу игры на itch.io...\n");
    consoleLink.href = url;
    consoleLink.hidden = false;

    var opened = window.open(url, "_blank");
    if (opened) {
      opened.opener = null;
      write("Страница открыта в новой вкладке.\n");
    } else {
      write("Браузер заблокировал новую вкладку. Нажмите «Открыть на itch.io».\n");
    }
  }

  function openConsole(exeName, url) {
    runId += 1;
    lastFocus = document.activeElement;
    consoleOutput.textContent = "";
    consoleLink.hidden = true;
    consoleBox.hidden = false;
    consoleClose.focus();
    playLaunch(runId, exeName, url, readShowLog());
  }

  function closeConsole() {
    if (consoleBox.hidden) {
      return;
    }
    runId += 1;
    consoleBox.hidden = true;
    if (lastFocus && typeof lastFocus.focus === "function") {
      lastFocus.focus();
    }
  }

  // ----- запуск -----

  if (themeSelect) {
    themeSelect.addEventListener("change", function () {
      applyTheme(themeSelect.value);
    });
  }

  if (showLogCheckbox) {
    showLogCheckbox.checked = readShowLog();
    showLogCheckbox.addEventListener("change", function () {
      storageSet(LOG_KEY, showLogCheckbox.checked ? "1" : "0");
    });
  }

  document.querySelectorAll(".game-card").forEach(function (card) {
    card.addEventListener("click", function (event) {
      // Ctrl/Shift/средняя кнопка открывают ссылку обычным образом, без консоли.
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }
      event.preventDefault();
      openConsole(card.getAttribute("data-exe"), card.href);
    });
  });

  consoleClose.addEventListener("click", closeConsole);
  consoleBox.addEventListener("click", function (event) {
    if (event.target === consoleBox) {
      closeConsole();
    }
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeConsole();
    }
  });

  window.addEventListener("hashchange", function () {
    showPage(currentPage());
  });

  applyTheme(storageGet(THEME_KEY) || DEFAULT_THEME);
  showPage(currentPage());
})();
