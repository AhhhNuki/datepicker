(function (global) {
  "use strict";

  const DEFAULT_OPTIONS = {
    format: "DD-MM-YYYY",
    language: "en",
    theme: "auto",
    colors: {},
    defaultDate: null,
    minDate: null,
    maxDate: null,
    weekStartsOn: 1,
    closeOnSelect: true,
    appendTo: null,
    locale: undefined,
    onSelect: null,
  };

  const DEFAULT_LANGUAGE = {
    name: "English",
    locale: "en",
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

  function monthNames(locale, style) {
    const formatter = new Intl.DateTimeFormat(locale, { month: style });
    return Array.from({ length: 12 }, (_, month) => formatter.format(localDate(2024, month, 1)));
  }

  function weekdayNames(locale, weekStartsOn) {
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

  function parseDate(value, format, locale) {
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

    const longMonths = monthNames(locale, "long").map((month) => month.toLocaleLowerCase());
    const shortMonths = monthNames(locale, "short").map((month) => month.toLocaleLowerCase().replace(/\.$/, ""));
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

  function formatDate(date, format, locale) {
    const longMonths = monthNames(locale, "long");
    const shortMonths = monthNames(locale, "short");
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

  function dateFromOption(value, format, locale) {
    if (!value) return null;
    if (isValidDate(value)) return stripTime(value);
    return parseDate(String(value), format, locale);
  }

  function mergeLanguage(language) {
    return {
      ...DEFAULT_LANGUAGE,
      ...(language || {}),
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
      this.options.weekStartsOn = normalizeWeekStart(this.options.weekStartsOn);
      this.options.appendTo = this.options.appendTo || document.body;
      this.minDate = dateFromOption(this.options.minDate, this.options.format, this.options.locale);
      this.maxDate = dateFromOption(this.options.maxDate, this.options.format, this.options.locale);
      this.selectedDate = null;
      this.activeDate = stripTime(new Date());
      this.viewDate = stripTime(new Date());
      this.view = VIEW_DAY;
      this.yearStart = null;
      this.isOpen = false;
      this.closeTimer = null;
      this.lastViewDate = stripTime(this.viewDate);
      this.lastView = this.view;
      this.previousReadOnly = this.input.readOnly;

      const initial = dateFromOption(this.options.defaultDate, this.options.format, this.options.locale) || parseDate(this.input.value, this.options.format, this.options.locale);
      if (initial) {
        this.selectedDate = clampDate(initial, this.minDate, this.maxDate);
        this.activeDate = stripTime(this.selectedDate);
        this.viewDate = stripTime(this.selectedDate);
        if (this.options.defaultDate && !this.input.value) this.input.value = this.format(this.selectedDate);
      }

      this.handleInputFocus = this.open.bind(this);
      this.handleInputClick = this.open.bind(this);
      this.handleInputKeydown = this.onInputKeydown.bind(this);
      this.handlePopoverKeydown = this.onInputKeydown.bind(this);
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
      return formatDate(date, this.options.format, this.options.locale);
    }

    parse(value) {
      return parseDate(value, this.options.format, this.options.locale);
    }

    setDate(value, silent) {
      const parsed = dateFromOption(value, this.options.format, this.options.locale);
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
      }, 170);
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
      this.applyThemeAndColors();

      this.header = document.createElement("div");
      this.header.className = "msdp-header";

      this.titleButton = this.button("msdp-button msdp-title", "", () => this.cycleView());
      this.prevButton = this.button("msdp-button msdp-nav", "<", () => this.moveView(-1));
      this.nextButton = this.button("msdp-button msdp-nav", ">", () => this.moveView(1));
      this.prevButton.type = "button";
      this.nextButton.type = "button";
      this.prevButton.setAttribute("aria-label", this.language.labels.previous);
      this.nextButton.setAttribute("aria-label", this.language.labels.next);

      this.header.append(this.titleButton, this.prevButton, this.nextButton);

      this.weekdays = document.createElement("div");
      this.weekdays.className = "msdp-weekdays";

      this.body = document.createElement("div");
      this.footer = document.createElement("div");
      this.footer.className = "msdp-footer";

      this.todayButton = this.button("msdp-button", this.language.labels.today, () => this.selectDate(stripTime(new Date())));
      this.clearButton = this.button("msdp-button", this.language.labels.clear, () => this.clearDate());
      this.footer.append(this.todayButton, this.clearButton);

      this.popover.append(this.header, this.weekdays, this.body, this.footer);
      (this.options.appendTo || document.body).appendChild(this.popover);
    }

    applyThemeAndColors() {
      if (this.options.theme !== "auto") {
        this.popover.classList.add(`msdp-theme-${this.options.theme}`);
      }

      const colors = this.options.colors || {};
      const selectedBackground = colors.selectedBackground || colors.selectedDateBackground || colors.selectedBackgroundColor;
      const selectedText = colors.selectedText || colors.selectedDateText || colors.selectedTextColor;

      if (selectedBackground) this.popover.style.setProperty("--msdp-active", selectedBackground);
      if (selectedText) this.popover.style.setProperty("--msdp-active-text", selectedText);
    }

    button(className, text, onClick) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = className;
      button.textContent = text;
      button.addEventListener("click", onClick);
      return button;
    }

    render() {
      this.todayButton.disabled = this.isDisabled(stripTime(new Date()));
      if (this.view === VIEW_DAY) this.renderDays();
      if (this.view === VIEW_MONTH) this.renderMonths();
      if (this.view === VIEW_YEAR) this.renderYears();
      this.lastViewDate = stripTime(this.viewDate);
      this.lastView = this.view;
    }

    renderDays() {
      const monthFormatter = new Intl.DateTimeFormat(this.options.locale, { month: "long", year: "numeric" });
      this.titleButton.textContent = monthFormatter.format(this.viewDate);
      this.titleButton.setAttribute("aria-label", this.language.labels.chooseMonthYear);
      this.weekdays.hidden = false;
      this.weekdays.replaceChildren(...weekdayNames(this.options.locale, this.options.weekStartsOn).map((name) => {
        const day = document.createElement("div");
        day.textContent = name;
        return day;
      }));

      const grid = document.createElement("div");
      grid.className = `msdp-days msdp-view ${this.transitionClass()}`;
      grid.setAttribute("role", "grid");

      const firstOfMonth = localDate(this.viewDate.getFullYear(), this.viewDate.getMonth(), 1);
      const offset = (firstOfMonth.getDay() - this.options.weekStartsOn + 7) % 7;
      const start = addDays(firstOfMonth, -offset);

      for (let index = 0; index < 42; index += 1) {
        const date = addDays(start, index);
        const day = this.button("msdp-day", String(date.getDate()), () => this.selectDate(date));
        day.setAttribute("role", "gridcell");
        day.setAttribute("aria-label", new Intl.DateTimeFormat(this.options.locale, { dateStyle: "full" }).format(date));
        day.disabled = this.isDisabled(date);
        if (!sameMonth(date, this.viewDate)) day.classList.add("is-outside");
        if (sameDay(date, new Date())) day.classList.add("is-today");
        if (sameDay(date, this.selectedDate)) day.classList.add("is-selected");
        if (sameDay(date, this.activeDate)) day.tabIndex = 0;
        else day.tabIndex = -1;
        grid.appendChild(day);
      }

      this.body.replaceChildren(grid);
      this.prevButton.disabled = this.monthStepDisabled(-1);
      this.nextButton.disabled = this.monthStepDisabled(1);
    }

    renderMonths() {
      this.titleButton.textContent = String(this.viewDate.getFullYear());
      this.titleButton.setAttribute("aria-label", this.language.labels.chooseYear);
      this.weekdays.hidden = true;

      const names = monthNames(this.options.locale, "short");
      const grid = document.createElement("div");
      grid.className = `msdp-grid msdp-view ${this.transitionClass()}`;

      names.forEach((name, month) => {
        const date = localDate(this.viewDate.getFullYear(), month, 1);
        const tile = this.button("msdp-tile", name, () => {
          this.viewDate = date;
          this.view = VIEW_DAY;
          this.render();
        });
        if (this.selectedDate && this.selectedDate.getFullYear() === date.getFullYear() && this.selectedDate.getMonth() === month) {
          tile.classList.add("is-selected");
        }
        tile.disabled = this.monthDisabled(date);
        grid.appendChild(tile);
      });

      this.body.replaceChildren(grid);
      this.prevButton.disabled = this.yearStepDisabled(-1);
      this.nextButton.disabled = this.yearStepDisabled(1);
    }

    renderYears() {
      const currentYear = this.viewDate.getFullYear();
      this.yearStart = currentYear - (currentYear % 12);
      this.titleButton.textContent = `${this.yearStart} - ${this.yearStart + 11}`;
      this.titleButton.setAttribute("aria-label", this.language.labels.chooseDate);
      this.weekdays.hidden = true;

      const grid = document.createElement("div");
      grid.className = `msdp-grid msdp-view ${this.transitionClass()}`;

      for (let index = 0; index < 12; index += 1) {
        const year = this.yearStart + index;
        const date = localDate(year, 0, 1);
        const tile = this.button("msdp-tile", String(year), () => {
          this.viewDate = localDate(year, this.viewDate.getMonth(), 1);
          this.view = VIEW_MONTH;
          this.render();
        });
        if (this.selectedDate && this.selectedDate.getFullYear() === year) tile.classList.add("is-selected");
        tile.disabled = this.yearDisabled(date);
        grid.appendChild(tile);
      }

      this.body.replaceChildren(grid);
      this.prevButton.disabled = this.yearRangeStepDisabled(-1);
      this.nextButton.disabled = this.yearRangeStepDisabled(1);
    }

    cycleView() {
      if (this.view === VIEW_DAY) this.view = VIEW_MONTH;
      else if (this.view === VIEW_MONTH) this.view = VIEW_YEAR;
      else this.view = VIEW_DAY;
      this.render();
    }

    moveView(direction) {
      if (this.view === VIEW_DAY) this.viewDate = addMonths(this.viewDate, direction);
      if (this.view === VIEW_MONTH) this.viewDate = localDate(this.viewDate.getFullYear() + direction, this.viewDate.getMonth(), 1);
      if (this.view === VIEW_YEAR) this.viewDate = localDate(this.viewDate.getFullYear() + direction * 12, this.viewDate.getMonth(), 1);
      this.render();
    }

    transitionClass() {
      if (this.view !== this.lastView) return "msdp-view-zoom";
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
        this.activeDate = clampDate(addMonths(this.activeDate, event.shiftKey ? -12 : -1), this.minDate, this.maxDate);
        this.viewDate = stripTime(this.activeDate);
        this.render();
        this.focusActiveDay();
      } else if (event.key === "PageDown") {
        event.preventDefault();
        this.activeDate = clampDate(addMonths(this.activeDate, event.shiftKey ? 12 : 1), this.minDate, this.maxDate);
        this.viewDate = stripTime(this.activeDate);
        this.render();
        this.focusActiveDay();
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

    onDocumentPointerDown(event) {
      if (event.target === this.input || this.popover.contains(event.target)) return;
      this.close();
    }

    moveActiveDate(days) {
      const next = clampDate(addDays(this.activeDate, days), this.minDate, this.maxDate);
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

    isDisabled(date) {
      return (this.minDate && date < this.minDate) || (this.maxDate && date > this.maxDate);
    }

    monthDisabled(date) {
      const first = localDate(date.getFullYear(), date.getMonth(), 1);
      const last = localDate(date.getFullYear(), date.getMonth() + 1, 0);
      return (this.maxDate && first > this.maxDate) || (this.minDate && last < this.minDate);
    }

    yearDisabled(date) {
      const first = localDate(date.getFullYear(), 0, 1);
      const last = localDate(date.getFullYear(), 11, 31);
      return (this.maxDate && first > this.maxDate) || (this.minDate && last < this.minDate);
    }

    monthStepDisabled(direction) {
      return this.monthDisabled(localDate(this.viewDate.getFullYear(), this.viewDate.getMonth() + direction, 1));
    }

    yearStepDisabled(direction) {
      const target = localDate(this.viewDate.getFullYear() + direction, 0, 1);
      return this.yearDisabled(target);
    }

    yearRangeStepDisabled(direction) {
      const start = (this.yearStart ?? this.viewDate.getFullYear()) + direction * 12;
      const first = localDate(start, 0, 1);
      const last = localDate(start + 11, 11, 31);
      return (this.maxDate && first > this.maxDate) || (this.minDate && last < this.minDate);
    }
  }

  global.MSDatePicker = MSDatePicker;
})(window);
