(function (global) {
  "use strict";

  const DEFAULT_OPTIONS = {
    format: "DD-MM-YYYY",
    language: "en",
    theme: "auto",
    colors: {},
    showTodayButton: true,
    scrollNavigation: {
      enabled: true,
      wheel: true,
      touch: true,
      threshold: 45,
      wheelThrottle: 160,
    },
    animations: {
      enabled: true,
      openDuration: 180,
      closeDuration: 170,
      viewDuration: 180,
      zoomDuration: 160,
      fadeDuration: 120,
      selectDuration: 160,
      easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    },
    defaultDate: null,
    minDate: null,
    maxDate: null,
    disableFutureDates: false,
    scrollBackLimitYears: null,
    weekStartsOn: 1,
    closeOnSelect: true,
    icons: {
      prev: null,
      next: null,
    },
    appendTo: null,
    locale: undefined,
    onSelect: null,
  };

  const DEFAULT_LANGUAGE = {
    name: "English",
    locale: "en",
    months: {
      long: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      short: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    },
    weekdays: {
      short: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    },
    labels: {
      today: "Today",
      clear: "Clear",
      previous: "Previous",
      next: "Next",
      chooseMonthYear: "Choose month or year",
      chooseYear: "Choose year",
      chooseDate: "Choose date",
    },
  };

  const LANGUAGE_REGISTRY = {
    en: DEFAULT_LANGUAGE,
  };

  const VIEW_DAY = "day";
  const VIEW_MONTH = "month";
  const VIEW_YEAR = "year";

  const VIEW_LEVELS = {
    [VIEW_DAY]: 0,
    [VIEW_MONTH]: 1,
    [VIEW_YEAR]: 2
  };

  function pad(value, length) {
    return String(value).padStart(length, "0");
  }

  function localDate(year, month, day) {
    return new Date(year, month, day);
  }

  function stripTime(date) {
    if (!date) return null;
    return localDate(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function isValidDate(value) {
    return value instanceof Date && !Number.isNaN(value.getTime());
  }

  function sameDay(a, b) {
    return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function sameMonth(a, b) {
    return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
  }

  function clampDate(date, minDate, maxDate) {
    if (!date) return null;
    if (minDate && date < minDate) return stripTime(minDate);
    if (maxDate && date > maxDate) return stripTime(maxDate);
    return stripTime(date);
  }

  function addDays(date, amount) {
    return localDate(date.getFullYear(), date.getMonth(), date.getDate() + amount);
  }

  function addMonths(date, amount) {
    const day = date.getDate();
    const target = localDate(date.getFullYear(), date.getMonth() + amount, 1);
    const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    target.setDate(Math.min(day, lastDay));
    return target;
  }

  function monthNames(locale, style, language) {
    if (language && language.months && language.months[style]) {
      return language.months[style];
    }
    const formatter = new Intl.DateTimeFormat(locale, { month: style });
    return Array.from({ length: 12 }, (_, month) => formatter.format(localDate(2024, month, 1)));
  }

  function weekdayNames(locale, weekStartsOn, language) {
    if (language && language.weekdays && language.weekdays.short) {
      const names = language.weekdays.short;
      return Array.from({ length: 7 }, (_, index) => {
        const offset = (weekStartsOn + index) % 7;
        return names[offset];
      });
    }
    const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
    const baseSunday = localDate(2024, 0, 7);
    return Array.from({ length: 7 }, (_, index) => {
      const offset = (weekStartsOn + index) % 7;
      return formatter.format(addDays(baseSunday, offset));
    });
  }

  function normalizeWeekStart(value) {
    const number = Number(value);
    return Number.isInteger(number) && number >= 0 && number <= 6 ? number : 1;
  }

  function normalizeTheme(value) {
    return value === "light" || value === "dark" ? value : "auto";
  }

  function duration(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : fallback;
  }

  function normalizeAnimations(value) {
    const defaults = DEFAULT_OPTIONS.animations;
    if (value === false) return { ...defaults, enabled: false };
    if (value === true || value == null) return { ...defaults };
    return {
      ...defaults,
      ...value,
      enabled: value.enabled !== false,
      openDuration: duration(value.openDuration, defaults.openDuration),
      closeDuration: duration(value.closeDuration, defaults.closeDuration),
      viewDuration: duration(value.viewDuration, defaults.viewDuration),
      zoomDuration: duration(value.zoomDuration, defaults.zoomDuration),
      fadeDuration: duration(value.fadeDuration, defaults.fadeDuration),
      selectDuration: duration(value.selectDuration, defaults.selectDuration),
      easing: value.easing || defaults.easing,
    };
  }

  function normalizeScrollNavigation(value) {
    const defaults = DEFAULT_OPTIONS.scrollNavigation;
    if (value === false) return { ...defaults, enabled: false };
    if (value === true || value == null) return { ...defaults };
    return {
      ...defaults,
      ...value,
      enabled: value.enabled !== false,
      wheel: value.wheel !== false,
      touch: value.touch !== false,
      threshold: duration(value.threshold, defaults.threshold),
      wheelThrottle: duration(value.wheelThrottle, defaults.wheelThrottle),
    };
  }

  function parseDate(value, format, locale, language) {
    if (!value) return null;
    if (isValidDate(value)) return stripTime(value);
    if (typeof value !== "string") return null;

    const text = value.trim();
    if (!text) return null;

    const tokenPattern = /(?:YYYY|MMMM|MMM|YY|DD|MM|D|M)/g;
    const tokens = [];
    let pattern = "^";
    let lastIndex = 0;

    format.replace(tokenPattern, (token, offset) => {
      pattern += escapeRegExp(format.slice(lastIndex, offset));
      tokens.push(token);
      if (token === "MMMM" || token === "MMM") {
        pattern += "([\\p{L}.]+)";
      } else if (token === "YYYY") {
        pattern += "(\\d{4})";
      } else if (token === "YY") {
        pattern += "(\\d{2})";
      } else {
        pattern += "(\\d{1,2})";
      }
      lastIndex = offset + token.length;
      return token;
    });

    pattern += escapeRegExp(format.slice(lastIndex)) + "$";

    const match = text.match(new RegExp(pattern, "iu"));
    if (!match) return null;

    const longMonths = monthNames(locale, "long", language).map((month) => month.toLocaleLowerCase());
    const shortMonths = monthNames(locale, "short", language).map((month) => month.toLocaleLowerCase().replace(/\.$/, ""));
    const dateParts = { day: 1, month: 0, year: null };

    tokens.forEach((token, index) => {
      const raw = match[index + 1];
      if (token === "DD" || token === "D") dateParts.day = Number(raw);
      if (token === "MM" || token === "M") dateParts.month = Number(raw) - 1;
      if (token === "YYYY") dateParts.year = Number(raw);
      if (token === "YY") dateParts.year = Number(raw) + (Number(raw) >= 70 ? 1900 : 2000);
      if (token === "MMMM" || token === "MMM") {
        const normalized = raw.toLocaleLowerCase().replace(/\.$/, "");
        let monthIndex = longMonths.indexOf(normalized);
        if (monthIndex === -1) monthIndex = shortMonths.indexOf(normalized);
        dateParts.month = monthIndex;
      }
    });

    if (dateParts.year === null || dateParts.month < 0 || dateParts.month > 11) return null;

    const parsed = localDate(dateParts.year, dateParts.month, dateParts.day);
    if (parsed.getFullYear() !== dateParts.year || parsed.getMonth() !== dateParts.month || parsed.getDate() !== dateParts.day) return null;
    return parsed;
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function formatDate(date, format, locale, language) {
    const longMonths = monthNames(locale, "long", language);
    const shortMonths = monthNames(locale, "short", language);
    const replacements = {
      YYYY: String(date.getFullYear()),
      YY: pad(date.getFullYear() % 100, 2),
      MMMM: longMonths[date.getMonth()],
      MMM: shortMonths[date.getMonth()],
      MM: pad(date.getMonth() + 1, 2),
      M: String(date.getMonth() + 1),
      DD: pad(date.getDate(), 2),
      D: String(date.getDate()),
    };

    return format.replace(/YYYY|MMMM|MMM|YY|DD|MM|D|M/g, (token) => replacements[token]);
  }

  function dateFromOption(value, format, locale, language) {
    if (!value) return null;
    if (value === "today") return stripTime(new Date());
    if (isValidDate(value)) return stripTime(value);
    return parseDate(String(value), format, locale, language);
  }

  function mergeLanguage(language) {
    return {
      ...DEFAULT_LANGUAGE,
      ...(language || {}),
      months: {
        ...DEFAULT_LANGUAGE.months,
        ...((language && language.months) || {}),
      },
      weekdays: {
        ...DEFAULT_LANGUAGE.weekdays,
        ...((language && language.weekdays) || {}),
      },
      labels: {
        ...DEFAULT_LANGUAGE.labels,
        ...((language && language.labels) || {}),
      },
    };
  }

  function resolveLanguage(option) {
    if (option && typeof option === "object") return mergeLanguage(option);
    return mergeLanguage(LANGUAGE_REGISTRY[option] || LANGUAGE_REGISTRY.en);
  }

  function nextFrame(callback) {
    if (typeof global.requestAnimationFrame === "function") {
      global.requestAnimationFrame(callback);
    } else {
      global.setTimeout(callback, 0);
    }
  }

  class MSDatePicker {
    constructor(input, options) {
      if (!(input instanceof HTMLInputElement)) {
        throw new TypeError("MSDatePicker requires an HTML input element.");
      }

      this.input = input;
      this.options = { ...DEFAULT_OPTIONS, ...(options || {}) };
      this.language = resolveLanguage(this.options.language);
      this.options.locale = this.options.locale || this.language.locale || "en";
      this.options.theme = normalizeTheme(this.options.theme);
      this.options.animations = normalizeAnimations(this.options.animations);
      this.options.scrollNavigation = normalizeScrollNavigation(this.options.scrollNavigation);
      this.options.weekStartsOn = normalizeWeekStart(this.options.weekStartsOn);
      this.options.appendTo = this.options.appendTo || document.body;
      this.minDate = dateFromOption(this.options.minDate, this.options.format, this.options.locale, this.language);
      this.maxDate = dateFromOption(this.options.maxDate, this.options.format, this.options.locale, this.language);
      this.disableFutureDates = this.options.disableFutureDates === true;
      this.selectedDate = null;
      this.activeDate = stripTime(new Date());
      this.viewDate = stripTime(new Date());
      this.view = VIEW_DAY;
      this.yearStart = null;
      this.isOpen = false;
      this.closeTimer = null;
      this.lastWheelNavigation = 0;
      this.touchStart = null;
      this.lastViewDate = stripTime(this.viewDate);
      this.lastView = this.view;
      this.previousReadOnly = this.input.readOnly;

      const initial = dateFromOption(this.options.defaultDate, this.options.format, this.options.locale, this.language) || parseDate(this.input.value, this.options.format, this.options.locale, this.language);
      if (initial) {
        let selected = clampDate(initial, this.minDate, this.maxDate);
        if (selected && this.isDisabled(selected)) {
          selected = null;
        }
        this.selectedDate = selected;
        if (this.selectedDate) {
          this.activeDate = stripTime(this.selectedDate);
          this.viewDate = stripTime(this.selectedDate);
          if (this.options.defaultDate && !this.input.value) this.input.value = this.format(this.selectedDate);
        }
      }

      this.handleInputFocus = this.open.bind(this);
      this.handleInputClick = this.open.bind(this);
      this.handleInputKeydown = this.onInputKeydown.bind(this);
      this.handlePopoverKeydown = this.onInputKeydown.bind(this);
      this.handlePopoverWheel = this.onPopoverWheel.bind(this);
      this.handleTouchStart = this.onTouchStart.bind(this);
      this.handleTouchMove = this.onTouchMove.bind(this);
      this.handleTouchEnd = this.onTouchEnd.bind(this);
      this.handleDocumentPointerDown = this.onDocumentPointerDown.bind(this);
      this.handleWindowChange = this.position.bind(this);

      this.build();
      this.bindInput();
    }

    static attach(selectorOrInputs, options) {
      let inputs;
      if (typeof selectorOrInputs === "string") {
        inputs = document.querySelectorAll(selectorOrInputs);
      } else if (selectorOrInputs instanceof HTMLInputElement) {
        inputs = [selectorOrInputs];
      } else {
        inputs = selectorOrInputs;
      }

      return Array.from(inputs || [], (input) => new MSDatePicker(input, options));
    }

    static registerLanguage(code, language) {
      if (!code || typeof code !== "string") {
        throw new TypeError("MSDatePicker.registerLanguage requires a language code.");
      }
      LANGUAGE_REGISTRY[code] = mergeLanguage(language);
    }

    static get languages() {
      return LANGUAGE_REGISTRY;
    }

    format(date) {
      return formatDate(date, this.options.format, this.options.locale, this.language);
    }

    parse(value) {
      return parseDate(value, this.options.format, this.options.locale, this.language);
    }

    setDate(value, silent) {
      const parsed = dateFromOption(value, this.options.format, this.options.locale, this.language);
      this.selectedDate = parsed ? clampDate(parsed, this.minDate, this.maxDate) : null;
      if (this.selectedDate) {
        this.activeDate = stripTime(this.selectedDate);
        this.viewDate = stripTime(this.selectedDate);
        this.input.value = this.format(this.selectedDate);
      } else {
        this.input.value = "";
      }
      this.render();
      if (!silent && typeof this.options.onSelect === "function") {
        this.options.onSelect(this.selectedDate, this.input.value, this);
      }
    }

    getDate() {
      return this.selectedDate ? stripTime(this.selectedDate) : null;
    }

    open() {
      if (this.isOpen) {
        this.position();
        return;
      }

      const typedDate = this.parse(this.input.value);
      if (typedDate) {
        this.selectedDate = clampDate(typedDate, this.minDate, this.maxDate);
        this.activeDate = stripTime(this.selectedDate);
        this.viewDate = stripTime(this.selectedDate);
      }

      this.isOpen = true;
      this.popover.classList.remove("is-closing");
      this.popover.hidden = false;
      this.view = VIEW_DAY;
      this.render();
      this.position();
      nextFrame(() => {
        if (this.isOpen) this.popover.classList.add("is-open");
      });
      document.addEventListener("pointerdown", this.handleDocumentPointerDown, true);
      window.addEventListener("resize", this.handleWindowChange);
      window.addEventListener("scroll", this.handleWindowChange, true);
    }

    close() {
      if (!this.isOpen) return;
      this.isOpen = false;
      window.clearTimeout(this.closeTimer);
      this.popover.classList.remove("is-open");
      this.popover.classList.add("is-closing");
      this.closeTimer = window.setTimeout(() => {
        if (!this.isOpen) {
          this.popover.hidden = true;
          this.popover.classList.remove("is-closing");
        }
      }, this.options.animations.enabled ? this.options.animations.closeDuration : 0);
      document.removeEventListener("pointerdown", this.handleDocumentPointerDown, true);
      window.removeEventListener("resize", this.handleWindowChange);
      window.removeEventListener("scroll", this.handleWindowChange, true);
    }

    destroy() {
      this.close();
      this.input.removeEventListener("focus", this.handleInputFocus);
      this.input.removeEventListener("click", this.handleInputClick);
      this.input.removeEventListener("keydown", this.handleInputKeydown);
      this.popover.removeEventListener("keydown", this.handlePopoverKeydown);
      this.popover.removeEventListener("wheel", this.handlePopoverWheel);
      this.popover.removeEventListener("touchstart", this.handleTouchStart);
      this.popover.removeEventListener("touchmove", this.handleTouchMove);
      this.popover.removeEventListener("touchend", this.handleTouchEnd);
      this.input.readOnly = this.previousReadOnly;
      this.popover.remove();
      delete this.input.msDatePicker;
    }

    bindInput() {
      this.input.autocomplete = this.input.autocomplete || "off";
      this.input.readOnly = true;
      this.input.setAttribute("aria-haspopup", "dialog");
      this.input.addEventListener("focus", this.handleInputFocus);
      this.input.addEventListener("click", this.handleInputClick);
      this.input.addEventListener("keydown", this.handleInputKeydown);
      this.input.msDatePicker = this;
    }

    build() {
      this.popover = document.createElement("div");
      this.popover.className = "msdp-popover";
      this.popover.hidden = true;
      this.popover.setAttribute("role", "dialog");
      this.popover.setAttribute("aria-modal", "false");
      this.popover.addEventListener("keydown", this.handlePopoverKeydown);
      this.popover.addEventListener("wheel", this.handlePopoverWheel, { passive: false });
      this.popover.addEventListener("touchstart", this.handleTouchStart, { passive: true });
      this.popover.addEventListener("touchmove", this.handleTouchMove, { passive: false });
      this.popover.addEventListener("touchend", this.handleTouchEnd);
      this.applyAppearanceOptions();

      this.header = document.createElement("div");
      this.header.className = "msdp-header";

      const prevIcon = this.options.icons?.prev || "<";
      const nextIcon = this.options.icons?.next || ">";

      this.titleButton = this.button("msdp-button msdp-title", "", () => this.cycleView());
      this.prevButton = this.button("msdp-button msdp-nav", prevIcon, () => this.moveView(-1), true);
      this.nextButton = this.button("msdp-button msdp-nav", nextIcon, () => this.moveView(1), true);
      this.prevButton.type = "button";
      this.nextButton.type = "button";
      this.prevButton.setAttribute("aria-label", this.language.labels.previous);
      this.nextButton.setAttribute("aria-label", this.language.labels.next);

      this.header.append(this.titleButton, this.prevButton, this.nextButton);

      this.weekdays = document.createElement("div");
      this.weekdays.className = "msdp-weekdays";

      this.body = document.createElement("div");
      this.body.className = "msdp-body msdp-view";
      this.body.addEventListener("scroll", () => this.handleScroll());
      this.footer = document.createElement("div");
      this.footer.className = "msdp-footer";

      this.clearButton = this.button("msdp-button", this.language.labels.clear, () => this.clearDate());
      if (this.options.showTodayButton !== false) {
        this.todayButton = this.button("msdp-button", this.language.labels.today, () => this.selectDate(stripTime(new Date())));
        this.footer.appendChild(this.todayButton);
      }
      this.footer.appendChild(this.clearButton);

      this.popover.append(this.header, this.weekdays, this.body, this.footer);
      (this.options.appendTo || document.body).appendChild(this.popover);
    }

    applyAppearanceOptions() {
      if (this.options.theme !== "auto") {
        this.popover.classList.add(`msdp-theme-${this.options.theme}`);
      }

      const colors = this.options.colors || {};
      const selectedBackground = colors.selectedBackground || colors.selectedDateBackground || colors.selectedBackgroundColor;
      const selectedText = colors.selectedText || colors.selectedDateText || colors.selectedTextColor;
      const calendarBackground = colors.background || colors.calendarBackground || colors.calendarBackgroundColor;
      const buttonHover = colors.hover || colors.buttonHover || colors.hoverBackground || colors.buttonHoverBackground;
      const outsideText = colors.outsideText || colors.outsideTextColor || colors.outsideColor || colors.outsideDaysText || colors.outsideDaysColor;
      const outsideOpacity = colors.outsideOpacity !== undefined && colors.outsideOpacity !== null ? colors.outsideOpacity : colors.outsideDaysOpacity;

      if (selectedBackground) this.popover.style.setProperty("--msdp-active", selectedBackground);
      if (selectedText) this.popover.style.setProperty("--msdp-active-text", selectedText);
      if (calendarBackground) {
        if (typeof calendarBackground === "object") {
          if (calendarBackground.light) this.popover.style.setProperty("--msdp-bg-light", calendarBackground.light);
          if (calendarBackground.dark) this.popover.style.setProperty("--msdp-bg-dark", calendarBackground.dark);
        } else {
          this.popover.style.setProperty("--msdp-bg-light", calendarBackground);
          this.popover.style.setProperty("--msdp-bg-dark", calendarBackground);
        }
      }
      if (buttonHover) {
        if (typeof buttonHover === "object") {
          if (buttonHover.light) this.popover.style.setProperty("--msdp-hover-light", buttonHover.light);
          if (buttonHover.dark) this.popover.style.setProperty("--msdp-hover-dark", buttonHover.dark);
        } else {
          this.popover.style.setProperty("--msdp-hover-light", buttonHover);
          this.popover.style.setProperty("--msdp-hover-dark", buttonHover);
        }
      }
      if (outsideText) {
        if (typeof outsideText === "object") {
          if (outsideText.light) this.popover.style.setProperty("--msdp-outside-text-light", outsideText.light);
          if (outsideText.dark) this.popover.style.setProperty("--msdp-outside-text-dark", outsideText.dark);
        } else {
          this.popover.style.setProperty("--msdp-outside-text-light", outsideText);
          this.popover.style.setProperty("--msdp-outside-text-dark", outsideText);
        }
      }
      if (outsideOpacity !== undefined && outsideOpacity !== null) {
        this.popover.style.setProperty("--msdp-outside-opacity", outsideOpacity);
      }

      if (!this.options.animations.enabled) {
        this.popover.classList.add("msdp-no-animation");
      }

      this.popover.style.setProperty("--msdp-open-duration", `${this.options.animations.openDuration}ms`);
      this.popover.style.setProperty("--msdp-close-duration", `${this.options.animations.closeDuration}ms`);
      this.popover.style.setProperty("--msdp-view-duration", `${this.options.animations.viewDuration}ms`);
      this.popover.style.setProperty("--msdp-zoom-duration", `${this.options.animations.zoomDuration}ms`);
      this.popover.style.setProperty("--msdp-fade-duration", `${this.options.animations.fadeDuration}ms`);
      this.popover.style.setProperty("--msdp-select-duration", `${this.options.animations.selectDuration}ms`);
      this.popover.style.setProperty("--msdp-animation-easing", this.options.animations.easing);
    }

    button(className, content, onClick, isIcon = false) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = className;

      if (isIcon && typeof content === "string") {
        if (content.trim().startsWith("<")) {
          button.innerHTML = content;
        } else if (content === ">" || content === "<") {
          button.textContent = content;
        } else {
          // Treat as class names for <i> tag font icon
          const icon = document.createElement("i");
          icon.className = content;
          button.appendChild(icon);
        }
      } else if (content instanceof HTMLElement) {
        button.appendChild(content);
      } else {
        button.textContent = String(content);
      }

      button.addEventListener("click", onClick);
      return button;
    }

    updateOutsideDays() {
      if (this.view !== VIEW_DAY) return;
      const currentMonth = this.viewDate.getMonth();
      const currentYear = this.viewDate.getFullYear();
      const dayButtons = this.body.querySelectorAll(".msdp-day");
      dayButtons.forEach((btn) => {
        const y = parseInt(btn.dataset.year, 10);
        const m = parseInt(btn.dataset.month, 10);
        if (y === currentYear && m === currentMonth) {
          btn.classList.remove("is-outside");
        } else {
          btn.classList.add("is-outside");
        }
      });
    }

    updateOutsideMonths() {
      if (this.view !== VIEW_MONTH) return;
      const currentYear = this.viewDate.getFullYear();
      const monthTiles = this.body.querySelectorAll(".msdp-tile");
      monthTiles.forEach((tile) => {
        const y = parseInt(tile.dataset.year, 10);
        if (y === currentYear) {
          tile.classList.remove("is-outside");
        } else {
          tile.classList.add("is-outside");
        }
      });
    }

    updateOutsideYears() {
      if (this.view !== VIEW_YEAR) return;
      const decadeStart = this.viewDate.getFullYear() - (this.viewDate.getFullYear() % 10);
      const yearTiles = this.body.querySelectorAll(".msdp-tile");
      yearTiles.forEach((tile) => {
        const y = parseInt(tile.dataset.year, 10);
        if (y >= decadeStart && y < decadeStart + 10) {
          tile.classList.remove("is-outside");
        } else {
          tile.classList.add("is-outside");
        }
      });
    }

    getMonthWeeks(year, month) {
      const weeks = [];
      const first = localDate(year, month, 1);
      const offset = (first.getDay() - this.options.weekStartsOn + 7) % 7;
      let currentWeekStart = addDays(first, -offset);
      
      const thursdayOffset = (4 - this.options.weekStartsOn + 7) % 7;
      const firstThursday = addDays(currentWeekStart, thursdayOffset);
      if (firstThursday.getMonth() !== month) {
        currentWeekStart = addDays(currentWeekStart, 7);
      }
      
      while (true) {
        const thursday = addDays(currentWeekStart, thursdayOffset);
        if (thursday.getMonth() !== month) {
          break;
        }
        weeks.push(new Date(currentWeekStart));
        currentWeekStart = addDays(currentWeekStart, 7);
      }
      return weeks;
    }

    render() {
      if (this.todayButton) this.todayButton.disabled = this.isDisabled(stripTime(new Date()));
      
      this.popover.classList.remove("msdp-view-day", "msdp-view-month", "msdp-view-year");
      if (this.view === VIEW_DAY) this.popover.classList.add("msdp-view-day");
      if (this.view === VIEW_MONTH) this.popover.classList.add("msdp-view-month");
      if (this.view === VIEW_YEAR) this.popover.classList.add("msdp-view-year");

      const animClass = this.transitionClass();

      if (this.view === VIEW_DAY) this.renderDays();
      if (this.view === VIEW_MONTH) this.renderMonths();
      if (this.view === VIEW_YEAR) this.renderYears();

      // Trigger animation on body
      this.body.classList.remove("msdp-view-zoom-in", "msdp-view-zoom-out", "msdp-view-fade", "msdp-view-forward", "msdp-view-back");
      void this.body.offsetWidth; // Force reflow
      this.body.classList.add(animClass);

      this.lastViewDate = stripTime(this.viewDate);
      this.lastView = this.view;
    }

    getScrollLimits() {
      let maxLimit = this.maxDate ? new Date(this.maxDate) : null;
      if (this.disableFutureDates) {
        const today = stripTime(new Date());
        if (!maxLimit || today < maxLimit) {
          maxLimit = today;
        }
      }

      let minLimit = this.minDate ? new Date(this.minDate) : null;
      if (this.options.scrollBackLimitYears !== null && this.options.scrollBackLimitYears !== undefined) {
        const today = new Date();
        const limitYear = today.getFullYear() - this.options.scrollBackLimitYears;
        const limitDate = localDate(limitYear, 0, 1);
        if (!minLimit || limitDate > minLimit) {
          minLimit = limitDate;
        }
      }

      return { minLimit, maxLimit };
    }

    renderDays() {
      // Clear body
      this.body.replaceChildren();

      this.weekdays.replaceChildren(...weekdayNames(this.options.locale, this.options.weekStartsOn, this.language).map((name) => {
        const day = document.createElement("div");
        day.textContent = name;
        return day;
      }));

      // We will render months from this.renderedStart to this.renderedEnd
      // Initialize them if they are not set, or if the viewDate is outside the range
      if (!this.renderedStart || !this.renderedEnd || this.viewDate < this.renderedStart || this.viewDate > this.renderedEnd) {
        this.renderedStart = addMonths(this.viewDate, -6);
        this.renderedEnd = addMonths(this.viewDate, 6);
      }

      const { minLimit, maxLimit } = this.getScrollLimits();
      if (minLimit) {
        const firstOfMinLimit = new Date(minLimit.getFullYear(), minLimit.getMonth(), 1);
        if (this.renderedStart < firstOfMinLimit) this.renderedStart = firstOfMinLimit;
      }
      if (maxLimit) {
        const firstOfMaxLimit = new Date(maxLimit.getFullYear(), maxLimit.getMonth(), 1);
        if (this.renderedEnd > firstOfMaxLimit) this.renderedEnd = firstOfMaxLimit;
      }
      if (this.renderedStart > this.renderedEnd) {
        this.renderedStart = this.renderedEnd;
      }

      let currentDate = new Date(this.renderedStart.getFullYear(), this.renderedStart.getMonth(), 1);
      const endDate = new Date(this.renderedEnd.getFullYear(), this.renderedEnd.getMonth(), 1);

      this.monthElements = [];

      while (currentDate <= endDate) {
        const monthSection = this.createMonthSection(currentDate);
        this.body.appendChild(monthSection);
        this.monthElements.push({
          date: new Date(currentDate),
          element: monthSection
        });
        currentDate = addMonths(currentDate, 1);
      }

      // Now scroll to the active viewDate month
      this.scrollToMonth(this.viewDate, false);

      // Disable/enable next/prev buttons based on minDate/maxDate
      this.prevButton.disabled = this.monthStepDisabled(-1);
      this.nextButton.disabled = this.monthStepDisabled(1);
    }

    createMonthSection(date) {
      const section = document.createElement("div");
      section.className = "msdp-month-section";
      section.dataset.year = date.getFullYear();
      section.dataset.month = date.getMonth();

      const grid = document.createElement("div");
      grid.className = "msdp-days";
      grid.setAttribute("role", "grid");

      const weeks = this.getMonthWeeks(date.getFullYear(), date.getMonth());

      const { minLimit, maxLimit } = this.getScrollLimits();
      weeks.forEach((weekStart) => {
        for (let i = 0; i < 7; i++) {
          const d = addDays(weekStart, i);
          const day = this.button("msdp-day", String(d.getDate()), () => this.selectDate(d));
          day.setAttribute("role", "gridcell");
          day.setAttribute("aria-label", new Intl.DateTimeFormat(this.options.locale, { dateStyle: "full" }).format(d));
          day.disabled = this.isDisabled(d);
          day.dataset.year = d.getFullYear();
          day.dataset.month = d.getMonth();
          if (sameDay(d, new Date())) day.classList.add("is-today");
          if (sameDay(d, this.selectedDate)) day.classList.add("is-selected");
          if (sameDay(d, this.activeDate)) day.tabIndex = 0;
          else day.tabIndex = -1;
          if ((minLimit && d < minLimit) || (maxLimit && d > maxLimit)) {
            day.classList.add("is-hidden");
          }
          grid.appendChild(day);
        }
      });

      section.appendChild(grid);
      return section;
    }

    scrollToMonth(date, smooth = true) {
      const match = this.monthElements.find(item => item.date.getFullYear() === date.getFullYear() && item.date.getMonth() === date.getMonth());
      if (match) {
        this.viewDate = new Date(date);
        this.isProgrammaticScrolling = true;
        const doScroll = () => {
          this.body.scrollTo({
            top: match.element.offsetTop,
            behavior: smooth ? "smooth" : "auto"
          });
          setTimeout(() => {
            this.isProgrammaticScrolling = false;
          }, smooth ? 300 : 50);
        };
        if (!smooth) {
          nextFrame(doScroll);
        } else {
          doScroll();
        }
        this.updateHeaderTitle(date);
        this.prevButton.disabled = this.monthStepDisabled(-1);
        this.nextButton.disabled = this.monthStepDisabled(1);
        this.updateOutsideDays();
      }
    }

    updateHeaderTitle(date) {
      let monthName = "";
      if (this.language && this.language.months && this.language.months.long) {
        monthName = this.language.months.long[date.getMonth()];
      } else {
        const monthFormatter = new Intl.DateTimeFormat(this.options.locale, { month: "long" });
        monthName = monthFormatter.format(date);
      }
      this.titleButton.textContent = `${monthName} ${date.getFullYear()}`;
      this.titleButton.setAttribute("aria-label", this.language.labels.chooseMonthYear);
    }

    handleScroll() {
      if (this.isProgrammaticScrolling) return;

      if (this.view === VIEW_DAY) {
        this.handleScrollDays();
      } else if (this.view === VIEW_MONTH) {
        this.handleScrollMonths();
      } else if (this.view === VIEW_YEAR) {
        this.handleScrollYears();
      }
    }

    handleScrollDays() {
      const bodyRect = this.body.getBoundingClientRect();
      const bodyTop = bodyRect.top;
      
      let bestMatch = null;

      const isAtBottom = this.body.scrollTop + this.body.clientHeight >= this.body.scrollHeight - 5;
      const isAtTop = this.body.scrollTop === 0;

      if (isAtBottom && this.monthElements.length > 0) {
        bestMatch = this.monthElements[this.monthElements.length - 1];
      } else if (isAtTop && this.monthElements.length > 0) {
        bestMatch = this.monthElements[0];
      } else {
        let minDiff = Infinity;
        this.monthElements.forEach(item => {
          const rect = item.element.getBoundingClientRect();
          const diff = Math.abs(rect.top - bodyTop);
          if (diff < minDiff) {
            minDiff = diff;
            bestMatch = item;
          }
        });
      }

      if (bestMatch && (this.viewDate.getFullYear() !== bestMatch.date.getFullYear() || this.viewDate.getMonth() !== bestMatch.date.getMonth())) {
        this.viewDate = new Date(bestMatch.date);
        this.updateHeaderTitle(this.viewDate);
        this.prevButton.disabled = this.monthStepDisabled(-1);
        this.nextButton.disabled = this.monthStepDisabled(1);
        this.updateOutsideDays();
      }

      const scrollTop = this.body.scrollTop;
      const scrollHeight = this.body.scrollHeight;
      const clientHeight = this.body.clientHeight;

      if (scrollTop < 150) {
        const { minLimit } = this.getScrollLimits();
        const newStart = addMonths(this.renderedStart, -6);
        let currentDate = new Date(newStart.getFullYear(), newStart.getMonth(), 1);
        const endDate = addMonths(this.renderedStart, -1);

        if (minLimit) {
          const firstOfMinLimit = new Date(minLimit.getFullYear(), minLimit.getMonth(), 1);
          if (currentDate < firstOfMinLimit) {
            currentDate = firstOfMinLimit;
          }
        }

        if (currentDate <= endDate) {
          const fragment = document.createDocumentFragment();
          const prependedElements = [];

          while (currentDate <= endDate) {
            const section = this.createMonthSection(currentDate);
            fragment.appendChild(section);
            prependedElements.push({
              date: new Date(currentDate),
              element: section
            });
            currentDate = addMonths(currentDate, 1);
          }

          const oldScrollHeight = this.body.scrollHeight;

          this.body.insertBefore(fragment, this.body.firstChild);
          this.monthElements = [...prependedElements, ...this.monthElements];
          this.renderedStart = prependedElements[0].date;

          const newScrollHeight = this.body.scrollHeight;
          this.body.scrollTop = scrollTop + (newScrollHeight - oldScrollHeight);
        }

      } else if (scrollHeight - scrollTop - clientHeight < 150) {
        const { maxLimit } = this.getScrollLimits();
        const newEnd = addMonths(this.renderedEnd, 6);
        let currentDate = addMonths(this.renderedEnd, 1);
        let endDate = new Date(newEnd.getFullYear(), newEnd.getMonth(), 1);

        if (maxLimit) {
          const firstOfMaxLimit = new Date(maxLimit.getFullYear(), maxLimit.getMonth(), 1);
          if (endDate > firstOfMaxLimit) {
            endDate = firstOfMaxLimit;
          }
        }

        if (currentDate <= endDate) {
          while (currentDate <= endDate) {
            const section = this.createMonthSection(currentDate);
            this.body.appendChild(section);
            this.monthElements.push({
              date: new Date(currentDate),
              element: section
            });
            currentDate = addMonths(currentDate, 1);
          }
          this.renderedEnd = endDate;
        }
      }
    }

    handleScrollMonths() {
      const bodyRect = this.body.getBoundingClientRect();
      const bodyTop = bodyRect.top;
      
      let bestMatch = null;

      const isAtBottom = this.body.scrollTop + this.body.clientHeight >= this.body.scrollHeight - 5;
      const isAtTop = this.body.scrollTop === 0;

      if (isAtBottom && this.yearElements.length > 0) {
        bestMatch = this.yearElements[this.yearElements.length - 1];
      } else if (isAtTop && this.yearElements.length > 0) {
        bestMatch = this.yearElements[0];
      } else {
        let minDiff = Infinity;
        this.yearElements.forEach(item => {
          const rect = item.element.getBoundingClientRect();
          const diff = Math.abs(rect.top - bodyTop);
          if (diff < minDiff) {
            minDiff = diff;
            bestMatch = item;
          }
        });
      }

      if (bestMatch && this.viewDate.getFullYear() !== bestMatch.year) {
        this.viewDate = localDate(bestMatch.year, this.viewDate.getMonth(), 1);
        this.updateHeaderTitleMonths(this.viewDate);
        this.prevButton.disabled = this.yearStepDisabled(-1);
        this.nextButton.disabled = this.yearStepDisabled(1);
        this.updateOutsideMonths();
      }

      const scrollTop = this.body.scrollTop;
      const scrollHeight = this.body.scrollHeight;
      const clientHeight = this.body.clientHeight;

      if (scrollTop < 150) {
        const { minLimit } = this.getScrollLimits();
        const newStart = this.renderedYearsStart - 4;
        let currentYear = newStart;
        const endYear = this.renderedYearsStart - 1;

        if (minLimit) {
          const limitYear = minLimit.getFullYear();
          if (currentYear < limitYear) {
            currentYear = limitYear;
          }
        }

        if (currentYear <= endYear) {
          const fragment = document.createDocumentFragment();
          const prependedElements = [];

          while (currentYear <= endYear) {
            const section = this.createYearSection(currentYear);
            fragment.appendChild(section);
            prependedElements.push({
              year: currentYear,
              element: section
            });
            currentYear++;
          }

          const oldScrollHeight = this.body.scrollHeight;

          this.body.insertBefore(fragment, this.body.firstChild);
          this.yearElements = [...prependedElements, ...this.yearElements];
          this.renderedYearsStart = prependedElements[0].year;

          const newScrollHeight = this.body.scrollHeight;
          this.body.scrollTop = scrollTop + (newScrollHeight - oldScrollHeight);
        }

      } else if (scrollHeight - scrollTop - clientHeight < 150) {
        const { maxLimit } = this.getScrollLimits();
        const newEnd = this.renderedYearsEnd + 4;
        let currentYear = this.renderedYearsEnd + 1;
        let endYear = newEnd;

        if (maxLimit) {
          const limitYear = maxLimit.getFullYear();
          if (endYear > limitYear) {
            endYear = limitYear;
          }
        }

        if (currentYear <= endYear) {
          while (currentYear <= endYear) {
            const section = this.createYearSection(currentYear);
            this.body.appendChild(section);
            this.yearElements.push({
              year: currentYear,
              element: section
            });
            currentYear++;
          }
          this.renderedYearsEnd = endYear;
        }
      }
    }

    handleScrollYears() {
      const bodyRect = this.body.getBoundingClientRect();
      const bodyTop = bodyRect.top;
      
      let bestMatch = null;

      const isAtBottom = this.body.scrollTop + this.body.clientHeight >= this.body.scrollHeight - 5;
      const isAtTop = this.body.scrollTop === 0;

      if (isAtBottom && this.rangeElements.length > 0) {
        bestMatch = this.rangeElements[this.rangeElements.length - 1];
      } else if (isAtTop && this.rangeElements.length > 0) {
        bestMatch = this.rangeElements[0];
      } else {
        let minDiff = Infinity;
        this.rangeElements.forEach(item => {
          const rect = item.element.getBoundingClientRect();
          const diff = Math.abs(rect.top - bodyTop);
          if (diff < minDiff) {
            minDiff = diff;
            bestMatch = item;
          }
        });
      }

      if (bestMatch) {
        this.yearStart = bestMatch.startYear;
      }

      let closestTile = null;
      const tiles = Array.from(this.body.querySelectorAll(".msdp-tile")).filter(tile => !tile.classList.contains("is-hidden"));

      if (isAtBottom && tiles.length > 0) {
        closestTile = tiles[tiles.length - 1];
      } else if (isAtTop && tiles.length > 0) {
        closestTile = tiles[0];
      } else {
        let minTileDiff = Infinity;
        const bodyCenter = bodyRect.top + bodyRect.height / 2;
        tiles.forEach((tile) => {
          const rect = tile.getBoundingClientRect();
          const tileCenter = rect.top + rect.height / 2;
          const diff = Math.abs(tileCenter - bodyCenter);
          if (diff < minTileDiff) {
            minTileDiff = diff;
            closestTile = tile;
          }
        });
      }

      if (closestTile) {
        const centerYear = parseInt(closestTile.dataset.year, 10);
        const currentDecadeStart = this.viewDate.getFullYear() - (this.viewDate.getFullYear() % 10);
        const targetDecadeStart = centerYear - (centerYear % 10);

        if (currentDecadeStart !== targetDecadeStart) {
          this.viewDate = localDate(targetDecadeStart, this.viewDate.getMonth(), 1);
          this.updateHeaderTitleYears();
          this.prevButton.disabled = this.yearRangeStepDisabled(-1);
          this.nextButton.disabled = this.yearRangeStepDisabled(1);
          this.updateOutsideYears();
        }
      }

      const scrollTop = this.body.scrollTop;
      const scrollHeight = this.body.scrollHeight;
      const clientHeight = this.body.clientHeight;

      if (scrollTop < 150) {
        const { minLimit } = this.getScrollLimits();
        const newStart = this.renderedRangesStart - 36;
        let currentStart = newStart;
        const endStart = this.renderedRangesStart - 12;

        if (minLimit) {
          const limitYear = minLimit.getFullYear();
          const limitRangeStart = this.getYearRangeStart(limitYear);
          if (currentStart < limitRangeStart) {
            currentStart = limitRangeStart;
          }
        }

        if (currentStart <= endStart) {
          const fragment = document.createDocumentFragment();
          const prependedElements = [];

          while (currentStart <= endStart) {
            const section = this.createYearRangeSection(currentStart);
            fragment.appendChild(section);
            prependedElements.push({
              startYear: currentStart,
              element: section
            });
            currentStart += 12;
          }

          const oldScrollHeight = this.body.scrollHeight;

          this.body.insertBefore(fragment, this.body.firstChild);
          this.rangeElements = [...prependedElements, ...this.rangeElements];
          this.renderedRangesStart = prependedElements[0].startYear;

          const newScrollHeight = this.body.scrollHeight;
          this.body.scrollTop = scrollTop + (newScrollHeight - oldScrollHeight);
        }

      } else if (scrollHeight - scrollTop - clientHeight < 150) {
        const { maxLimit } = this.getScrollLimits();
        const newEnd = this.renderedRangesEnd + 36;
        let currentStart = this.renderedRangesEnd + 12;
        let endStart = newEnd;

        if (maxLimit) {
          const limitYear = maxLimit.getFullYear();
          const limitRangeStart = this.getYearRangeStart(limitYear);
          if (endStart > limitRangeStart) {
            endStart = limitRangeStart;
          }
        }

        if (currentStart <= endStart) {
          while (currentStart <= endStart) {
            const section = this.createYearRangeSection(currentStart);
            this.body.appendChild(section);
            this.rangeElements.push({
              startYear: currentStart,
              element: section
            });
            currentStart += 12;
          }
          this.renderedRangesEnd = endStart;
        }
      }
    }

    renderMonths() {
      this.body.replaceChildren();
      this.titleButton.textContent = String(this.viewDate.getFullYear());
      this.titleButton.setAttribute("aria-label", this.language.labels.chooseYear);

      this.renderedYearsStart = this.viewDate.getFullYear() - 4;
      this.renderedYearsEnd = this.viewDate.getFullYear() + 4;

      const { minLimit, maxLimit } = this.getScrollLimits();
      if (minLimit) {
        const limitYear = minLimit.getFullYear();
        if (this.renderedYearsStart < limitYear) this.renderedYearsStart = limitYear;
      }
      if (maxLimit) {
        const limitYear = maxLimit.getFullYear();
        if (this.renderedYearsEnd > limitYear) this.renderedYearsEnd = limitYear;
      }
      if (this.renderedYearsStart > this.renderedYearsEnd) {
        this.renderedYearsStart = this.renderedYearsEnd;
      }

      let currentYear = this.renderedYearsStart;
      const endYear = this.renderedYearsEnd;

      this.yearElements = [];

      while (currentYear <= endYear) {
        const yearSection = this.createYearSection(currentYear);
        this.body.appendChild(yearSection);
        this.yearElements.push({
          year: currentYear,
          element: yearSection
        });
        currentYear++;
      }

      this.scrollToYear(this.viewDate.getFullYear(), false);

      this.prevButton.disabled = this.yearStepDisabled(-1);
      this.nextButton.disabled = this.yearStepDisabled(1);
    }

    createYearSection(year) {
      const section = document.createElement("div");
      section.className = "msdp-year-section";
      section.dataset.year = year;

      const grid = document.createElement("div");
      grid.className = "msdp-grid";

      const { minLimit, maxLimit } = this.getScrollLimits();
      const names = monthNames(this.options.locale, "short", this.language);
      names.forEach((name, month) => {
        const date = localDate(year, month, 1);
        const tile = this.button("msdp-tile", name, () => {
          this.viewDate = date;
          this.view = VIEW_DAY;
          this.render();
        });
        tile.dataset.year = year;
        tile.dataset.month = month;
        if (this.selectedDate && this.selectedDate.getFullYear() === year && this.selectedDate.getMonth() === month) {
          tile.classList.add("is-selected");
        }
        tile.disabled = this.monthDisabled(date);
        if (minLimit) {
          const firstOfMinLimit = localDate(minLimit.getFullYear(), minLimit.getMonth(), 1);
          if (date < firstOfMinLimit) {
            tile.classList.add("is-hidden");
          }
        }
        if (maxLimit) {
          const firstOfMaxLimit = localDate(maxLimit.getFullYear(), maxLimit.getMonth(), 1);
          if (date > firstOfMaxLimit) {
            tile.classList.add("is-hidden");
          }
        }
        grid.appendChild(tile);
      });

      section.appendChild(grid);
      return section;
    }

    scrollToYear(year, smooth = true) {
      const match = this.yearElements.find(item => item.year === year);
      if (match) {
        this.viewDate = localDate(year, this.viewDate.getMonth(), 1);
        this.isProgrammaticScrolling = true;
        const doScroll = () => {
          this.body.scrollTo({
            top: match.element.offsetTop,
            behavior: smooth ? "smooth" : "auto"
          });
          setTimeout(() => {
            this.isProgrammaticScrolling = false;
          }, smooth ? 300 : 50);
        };
        if (!smooth) {
          nextFrame(doScroll);
        } else {
          doScroll();
        }
        this.updateHeaderTitleMonths(this.viewDate);
        this.prevButton.disabled = this.yearStepDisabled(-1);
        this.nextButton.disabled = this.yearStepDisabled(1);
        this.updateOutsideMonths();
      }
    }

    updateHeaderTitleMonths(date) {
      this.titleButton.textContent = String(date.getFullYear());
      this.titleButton.setAttribute("aria-label", this.language.labels.chooseYear);
    }

    renderYears() {
      this.body.replaceChildren();
      const currentYear = this.viewDate.getFullYear();
      this.yearStart = this.getYearRangeStart(currentYear);
      this.updateHeaderTitleYears();

      const currentRangeStart = this.yearStart;
      this.renderedRangesStart = currentRangeStart - 36;
      this.renderedRangesEnd = currentRangeStart + 36;

      const { minLimit, maxLimit } = this.getScrollLimits();
      if (minLimit) {
        const limitYear = minLimit.getFullYear();
        const limitRangeStart = this.getYearRangeStart(limitYear);
        if (this.renderedRangesStart < limitRangeStart) this.renderedRangesStart = limitRangeStart;
      }
      if (maxLimit) {
        const limitYear = maxLimit.getFullYear();
        const limitRangeStart = this.getYearRangeStart(limitYear);
        if (this.renderedRangesEnd > limitRangeStart) this.renderedRangesEnd = limitRangeStart;
      }
      if (this.renderedRangesStart > this.renderedRangesEnd) {
        this.renderedRangesStart = this.renderedRangesEnd;
      }

      let currentStart = this.renderedRangesStart;
      const endStart = this.renderedRangesEnd;

      this.rangeElements = [];

      while (currentStart <= endStart) {
        const rangeSection = this.createYearRangeSection(currentStart);
        this.body.appendChild(rangeSection);
        this.rangeElements.push({
          startYear: currentStart,
          element: rangeSection
        });
        currentStart += 12;
      }

      this.scrollToYearRange(currentRangeStart, false);

      this.prevButton.disabled = this.yearRangeStepDisabled(-1);
      this.nextButton.disabled = this.yearRangeStepDisabled(1);
    }

    createYearRangeSection(startYear) {
      const section = document.createElement("div");
      section.className = "msdp-year-range-section";
      section.dataset.startYear = startYear;

      const grid = document.createElement("div");
      grid.className = "msdp-grid";

      const { minLimit, maxLimit } = this.getScrollLimits();
      for (let index = 0; index < 12; index += 1) {
        const year = startYear + index;
        const date = localDate(year, this.viewDate.getMonth(), 1);
        const tile = this.button("msdp-tile", String(year), () => {
          this.viewDate = date;
          this.view = VIEW_MONTH;
          this.render();
        });
        tile.dataset.year = year;
        if (this.selectedDate && this.selectedDate.getFullYear() === year) {
          tile.classList.add("is-selected");
        }
        tile.disabled = this.yearDisabled(date);
        if ((minLimit && year < minLimit.getFullYear()) || (maxLimit && year > maxLimit.getFullYear())) {
          tile.classList.add("is-hidden");
        }
        grid.appendChild(tile);
      }

      section.appendChild(grid);
      return section;
    }

    scrollToYearRange(startYear, smooth = true) {
      const match = this.rangeElements.find(item => item.startYear === startYear);
      if (match) {
        this.yearStart = startYear;
        if (this.viewDate.getFullYear() < startYear || this.viewDate.getFullYear() >= startYear + 12) {
          this.viewDate = localDate(startYear, this.viewDate.getMonth(), 1);
        }
        this.isProgrammaticScrolling = true;
        const doScroll = () => {
          this.body.scrollTo({
            top: match.element.offsetTop,
            behavior: smooth ? "smooth" : "auto"
          });
          setTimeout(() => {
            this.isProgrammaticScrolling = false;
          }, smooth ? 300 : 50);
        };
        if (!smooth) {
          nextFrame(doScroll);
        } else {
          doScroll();
        }
        this.updateHeaderTitleYears();
        this.prevButton.disabled = this.yearRangeStepDisabled(-1);
        this.nextButton.disabled = this.yearRangeStepDisabled(1);
        this.updateOutsideYears();
      }
    }

    updateHeaderTitleYears() {
      const decadeStart = this.viewDate.getFullYear() - (this.viewDate.getFullYear() % 10);
      let start = decadeStart;
      let end = decadeStart + 9;

      const { minLimit, maxLimit } = this.getScrollLimits();
      if (minLimit) {
        const minYear = minLimit.getFullYear();
        if (start < minYear) {
          start = minYear;
        }
      }
      if (maxLimit) {
        const maxYear = maxLimit.getFullYear();
        if (end > maxYear) {
          end = maxYear;
        }
      }

      this.titleButton.textContent = `${start} - ${end}`;
      this.titleButton.setAttribute("aria-label", this.language.labels.chooseDate);
    }

    cycleView() {
      if (this.view === VIEW_DAY) this.view = VIEW_MONTH;
      else if (this.view === VIEW_MONTH) this.view = VIEW_YEAR;
      else this.view = VIEW_DAY;
      this.render();
    }

    moveView(direction) {
      if (this.view === VIEW_DAY && this.monthStepDisabled(direction)) return;
      if (this.view === VIEW_MONTH && this.yearStepDisabled(direction)) return;
      if (this.view === VIEW_YEAR && this.yearRangeStepDisabled(direction)) return;
      if (this.view === VIEW_DAY) {
        this.viewDate = addMonths(this.viewDate, direction);
        if (!this.renderedStart || !this.renderedEnd || this.viewDate < this.renderedStart || this.viewDate > this.renderedEnd) {
          this.renderedStart = addMonths(this.viewDate, -6);
          this.renderedEnd = addMonths(this.viewDate, 6);
          this.renderDays();
        } else {
          this.scrollToMonth(this.viewDate, true);
        }
      } else if (this.view === VIEW_MONTH) {
        this.viewDate = localDate(this.viewDate.getFullYear() + direction, this.viewDate.getMonth(), 1);
        if (!this.renderedYearsStart || !this.renderedYearsEnd || this.viewDate.getFullYear() < this.renderedYearsStart || this.viewDate.getFullYear() > this.renderedYearsEnd) {
          this.renderedYearsStart = this.viewDate.getFullYear() - 4;
          this.renderedYearsEnd = this.viewDate.getFullYear() + 4;
          this.renderMonths();
        } else {
          this.scrollToYear(this.viewDate.getFullYear(), true);
        }
      } else if (this.view === VIEW_YEAR) {
        this.viewDate = localDate(this.viewDate.getFullYear() + direction * 10, this.viewDate.getMonth(), 1);
        const currentRangeStart = this.getYearRangeStart(this.viewDate.getFullYear());
        if (!this.renderedRangesStart || !this.renderedRangesEnd || currentRangeStart < this.renderedRangesStart || currentRangeStart > this.renderedRangesEnd) {
          this.renderedRangesStart = currentRangeStart - 36;
          this.renderedRangesEnd = currentRangeStart + 36;
          this.renderYears();
        } else {
          this.scrollToYearRange(currentRangeStart, true);
        }
      }
    }

    transitionClass() {
      if (this.view !== this.lastView) {
        if (!this.lastView) return "msdp-view-zoom-in";
        const currentLevel = VIEW_LEVELS[this.view] ?? 0;
        const lastLevel = VIEW_LEVELS[this.lastView] ?? 0;
        return currentLevel < lastLevel ? "msdp-view-zoom-in" : "msdp-view-zoom-out";
      }
      if (!this.lastViewDate) return "msdp-view-forward";
      if (this.viewDate > this.lastViewDate) return "msdp-view-forward";
      if (this.viewDate < this.lastViewDate) return "msdp-view-back";
      return "msdp-view-fade";
    }

    selectDate(date) {
      const selected = clampDate(date, this.minDate, this.maxDate);
      if (!selected || this.isDisabled(selected)) return;
      this.selectedDate = selected;
      this.activeDate = stripTime(selected);
      this.viewDate = stripTime(selected);
      this.input.value = this.format(selected);
      this.input.dispatchEvent(new Event("input", { bubbles: true }));
      this.input.dispatchEvent(new Event("change", { bubbles: true }));
      if (typeof this.options.onSelect === "function") {
        this.options.onSelect(stripTime(selected), this.input.value, this);
      }
      this.render();
      if (this.options.closeOnSelect) this.close();
    }

    clearDate() {
      this.selectedDate = null;
      this.input.value = "";
      this.input.dispatchEvent(new Event("input", { bubbles: true }));
      this.input.dispatchEvent(new Event("change", { bubbles: true }));
      if (typeof this.options.onSelect === "function") {
        this.options.onSelect(null, "", this);
      }
      this.render();
      this.close();
    }

    onInputKeydown(event) {
      if ((event.key === "ArrowDown" || event.key === "Enter") && !this.isOpen) {
        event.preventDefault();
        this.open();
        this.focusActiveDay();
        return;
      }

      if (!this.isOpen || this.view !== VIEW_DAY) return;

      const moves = {
        ArrowLeft: -1,
        ArrowRight: 1,
        ArrowUp: -7,
        ArrowDown: 7,
      };

      if (event.key in moves) {
        event.preventDefault();
        this.moveActiveDate(moves[event.key]);
      } else if (event.key === "PageUp") {
        event.preventDefault();
        let next = clampDate(addMonths(this.activeDate, event.shiftKey ? -12 : -1), this.minDate, this.maxDate);
        if (next && this.isDisabled(next)) {
          const today = stripTime(new Date());
          next = clampDate(today, this.minDate, this.maxDate);
          if (next && this.isDisabled(next)) next = null;
        }
        if (next) {
          this.activeDate = next;
          this.viewDate = stripTime(this.activeDate);
          this.render();
          this.focusActiveDay();
        }
      } else if (event.key === "PageDown") {
        event.preventDefault();
        let next = clampDate(addMonths(this.activeDate, event.shiftKey ? 12 : 1), this.minDate, this.maxDate);
        if (next && this.isDisabled(next)) {
          const today = stripTime(new Date());
          next = clampDate(today, this.minDate, this.maxDate);
          if (next && this.isDisabled(next)) next = null;
        }
        if (next) {
          this.activeDate = next;
          this.viewDate = stripTime(this.activeDate);
          this.render();
          this.focusActiveDay();
        }
      } else if (event.key === "Home") {
        event.preventDefault();
        this.moveActiveDate(-((this.activeDate.getDay() - this.options.weekStartsOn + 7) % 7));
      } else if (event.key === "End") {
        event.preventDefault();
        this.moveActiveDate(6 - ((this.activeDate.getDay() - this.options.weekStartsOn + 7) % 7));
      } else if (event.key === "Enter") {
        event.preventDefault();
        this.selectDate(this.activeDate);
      } else if (event.key === "Escape") {
        event.preventDefault();
        this.close();
      }
    }

    onPopoverWheel(event) {
      // Bypassed completely as all views (day, month, year) are now vertically scrollable.
    }

    onTouchStart(event) {
      // Bypassed completely as all views are now vertically scrollable.
    }

    onTouchMove(event) {
      // Bypassed completely as all views are now vertically scrollable.
    }

    onTouchEnd(event) {
      this.touchStart = null;
    }

    onDocumentPointerDown(event) {
      if (event.target === this.input || this.popover.contains(event.target)) return;
      this.close();
    }

    moveActiveDate(days) {
      let next = clampDate(addDays(this.activeDate, days), this.minDate, this.maxDate);
      if (next && this.isDisabled(next)) {
        const today = stripTime(new Date());
        next = clampDate(today, this.minDate, this.maxDate);
        if (next && this.isDisabled(next)) next = null;
      }
      if (!next) return;
      this.activeDate = next;
      this.viewDate = stripTime(next);
      this.render();
      this.focusActiveDay();
    }

    focusActiveDay() {
      const button = this.popover.querySelector(".msdp-day[tabindex='0']");
      if (button) button.focus();
    }

    position() {
      if (!this.isOpen) return;
      const rect = this.input.getBoundingClientRect();
      const popoverRect = this.popover.getBoundingClientRect();
      const gap = 4;
      let top = rect.bottom + window.scrollY + gap;
      let left = rect.left + window.scrollX;

      if (rect.bottom + popoverRect.height + gap > window.innerHeight && rect.top > popoverRect.height) {
        top = rect.top + window.scrollY - popoverRect.height - gap;
      }

      if (left + popoverRect.width > window.scrollX + window.innerWidth - 8) {
        left = window.scrollX + window.innerWidth - popoverRect.width - 8;
      }

      this.popover.style.top = `${Math.max(window.scrollY + 8, top)}px`;
      this.popover.style.left = `${Math.max(window.scrollX + 8, left)}px`;
    }

    getYearRangeStart(year) {
      const { minLimit } = this.getScrollLimits();
      if (minLimit) {
        const offset = minLimit.getFullYear();
        if (year < offset) return offset;
        return offset + Math.floor((year - offset) / 12) * 12;
      }
      return year - (year % 12);
    }

    isDisabled(date) {
      const { minLimit, maxLimit } = this.getScrollLimits();
      return (minLimit && date < minLimit) || (maxLimit && date > maxLimit);
    }

    monthDisabled(date) {
      const first = localDate(date.getFullYear(), date.getMonth(), 1);
      const last = localDate(date.getFullYear(), date.getMonth() + 1, 0);
      const { minLimit, maxLimit } = this.getScrollLimits();
      return (maxLimit && first > maxLimit) || (minLimit && last < minLimit);
    }

    yearDisabled(date) {
      const first = localDate(date.getFullYear(), 0, 1);
      const last = localDate(date.getFullYear(), 11, 31);
      const { minLimit, maxLimit } = this.getScrollLimits();
      return (maxLimit && first > maxLimit) || (minLimit && last < minLimit);
    }

    monthStepDisabled(direction) {
      return this.monthDisabled(localDate(this.viewDate.getFullYear(), this.viewDate.getMonth() + direction, 1));
    }

    yearStepDisabled(direction) {
      const target = localDate(this.viewDate.getFullYear() + direction, 0, 1);
      return this.yearDisabled(target);
    }

    yearRangeStepDisabled(direction) {
      const decadeStart = this.viewDate.getFullYear() - (this.viewDate.getFullYear() % 10);
      const targetDecadeStart = decadeStart + direction * 10;
      const first = localDate(targetDecadeStart, 0, 1);
      const last = localDate(targetDecadeStart + 9, 11, 31);
      const { minLimit, maxLimit } = this.getScrollLimits();
      return (maxLimit && first > maxLimit) || (minLimit && last < minLimit);
    }
  }

  global.MSDatePicker = MSDatePicker;

  // Process any queued languages registered before the core script loaded
  if (global.MSDatePickerQueue && Array.isArray(global.MSDatePickerQueue)) {
    global.MSDatePickerQueue.forEach(function (item) {
      MSDatePicker.registerLanguage(item.code, item.language);
    });
    delete global.MSDatePickerQueue;
  }
})(window);
