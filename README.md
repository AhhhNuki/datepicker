# MS Date Picker

A dependency-free JavaScript date picker for text inputs, styled after the compact Windows Calculator date selection experience.

## Files

- `src/ms-date-picker.js`
- `src/ms-date-picker.css`
- `index.html` demo

## Usage

```html
<link rel="stylesheet" href="src/ms-date-picker.css">
<input id="birthday" type="text" placeholder="DD-MM-YYYY">
<script src="src/ms-date-picker.js"></script>
<script>
  new MSDatePicker(document.querySelector("#birthday"));
</script>
```

The default format is `DD-MM-YYYY`.

The picker sets attached inputs to `readonly`, so users can open the calendar but cannot type arbitrary text into the field.

## Options

```js
new MSDatePicker(input, {
  format: "DD-MM-YYYY",                // Type: String (e.g. "MM/DD/YYYY", "D MMMM YYYY")
  language: "en",                     // Type: String (e.g. "ka", "es")
  theme: "auto",                      // Type: String ("auto" | "light" | "dark")
  showTodayButton: true,              // Type: Boolean (true | false)
  scrollNavigation: {                 // Type: Object | Boolean (false to disable)
    enabled: true,                    // Type: Boolean
    wheel: true,                      // Type: Boolean
    touch: true,                      // Type: Boolean
    threshold: 45,                    // Type: Number (scroll swipe threshold in pixels)
    wheelThrottle: 160,               // Type: Number (mouse wheel throttle in ms)
  },
  animations: {                       // Type: Object | Boolean (false to disable)
    enabled: true,                    // Type: Boolean
    openDuration: 180,                // Type: Number (open animation duration in ms)
    closeDuration: 170,               // Type: Number (close animation duration in ms)
    viewDuration: 180,                // Type: Number (view slide animation duration in ms)
    zoomDuration: 160,                // Type: Number (view zoom animation duration in ms)
    fadeDuration: 120,                // Type: Number (view fade animation duration in ms)
    selectDuration: 160,              // Type: Number (tile selection animation duration in ms)
    easing: "cubic-bezier(0.16, 1, 0.3, 1)", // Type: String (CSS transition timing function)
  },
  colors: {                           // Type: Object
    selectedBackground: null,         // Type: String (hex or CSS color, e.g. "#16a34a")
    selectedText: null,               // Type: String (hex or CSS color, e.g. "#ffffff")
    background: null,                 // Type: String | Object (e.g. "#ffffff" or { light: "#ffffff", dark: "#2b2b2b" })
    hover: null,                      // Type: String | Object (e.g. "#ececec" or { light: "#ececec", dark: "#3a3a3a" })
    outsideText: null,                // Type: String | Object (e.g. "#666666" or { light: "#666666", dark: "#b8b8b8" })
    outsideOpacity: 0.4,              // Type: Number (opacity for outside dates, e.g. 0.35)
  },
  defaultDate: null,                  // Type: Date | String | Number (initial date, e.g. new Date())
  minDate: null,                      // Type: Date | String (minimum selectable date or "today") '01-01-2000'
  maxDate: null,                      // Type: Date | String (maximum selectable date or "today") '01-01-2020'
  disableFutureDates: false,          // Type: Boolean (prevent selecting future dates)
  scrollBackLimitYears: null,         // Type: Number (limit history scrolling back in years, e.g. 10)
  weekStartsOn: 1,                    // Type: Number (start day of week, 0 = Sunday, 1 = Monday, etc.)
  closeOnSelect: true,                // Type: Boolean (automatically close popover on date select)
  icons: {                            // Type: Object
    prev: null,                       // Type: String | HTMLElement (e.g. "fa fa-chevron-left" or '<i class="fa fa-chevron-left"></i>')
    next: null,                       // Type: String | HTMLElement (e.g. "fa fa-chevron-right" or '<i class="fa fa-chevron-right"></i>')
  },
  locale: undefined,                  // Type: String (browser BCP 47 locale override, e.g. "ka-GE")
  appendTo: document.body,            // Type: HTMLElement (DOM container to append the popover)
  onSelect(date, formattedValue, picker) { // Type: Function (callback when date is selected)
    console.log(date, formattedValue, picker);
  },
});
```

Supported format tokens are:
- `D`: Day of month (e.g. `1`, `31`)
- `DD`: Day of month, zero-padded (e.g. `01`, `31`)
- `M`: Month number (e.g. `1`, `12`)
- `MM`: Month number, zero-padded (e.g. `01`, `12`)
- `MMM`: Short month name (e.g. `Jan`, `ივნ`)
- `MMMM`: Full month name (e.g. `January`, `ივნისი`)
- `YY`: Two-digit year (e.g. `26`)
- `YYYY`: Four-digit year (e.g. `2026`)

To use full month names in the input value, set the format to use `MMMM`, for example:
```js
new MSDatePicker(input, {
  language: "ka",
  format: "D MMMM YYYY", // Outputs "10 ივნისი 2026"
});
```

`theme` can be `"auto"`, `"light"`, or `"dark"`. Auto follows the user's system color scheme.

Set calendar colors using the `colors` option properties:

```js
new MSDatePicker(input, {
  theme: "auto",
  colors: {
    selectedBackground: "#16a34a",
    selectedText: "#ffffff",
    // Can be a string (applies to all themes) or a light/dark object
    background: {
      light: "#ffffff",
      dark: "#1e293b"
    },
    // Customize button/day hover colors (supports light and dark themes)
    hover: {
      light: "#e2e8f0",
      dark: "#334155"
    },
    // Customize color of adjacent/outside month days
    outsideText: {
      light: "#767676",
      dark: "#8a8a8a"
    },
    // Customize opacity of adjacent/outside month days (defaults to 0.4)
    outsideOpacity: 0.35
  },
});
```

Hide the Today button with `showTodayButton: false`:

```js
new MSDatePicker(input, {
  showTodayButton: false,
});
```

Disable selecting future dates by setting `disableFutureDates: true`:

```js
new MSDatePicker(input, {
  disableFutureDates: true,
});
```

Limit scrolling back in years (so that scrolling isn't infinite) by setting `scrollBackLimitYears`:

```js
new MSDatePicker(input, {
  scrollBackLimitYears: 10, // Stops scrolling back past 10 years ago
});
```

You can also use the string `"today"` for `minDate` or `maxDate` options:

```js
new MSDatePicker(input, {
  maxDate: "today", // Disables selecting any date after today
});
```

Customize or disable animations with `animations`:

```js
new MSDatePicker(input, {
  animations: {
    enabled: true,
    openDuration: 220,
    closeDuration: 140,
    viewDuration: 260,
    zoomDuration: 180,
    fadeDuration: 120,
    selectDuration: 220,
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
  },
});

new MSDatePicker(input, {
  animations: false,
});
```

Customize navigation arrow buttons with custom icons (e.g. FontAwesome class names or raw HTML `<i>` tags):

```js
new MSDatePicker(input, {
  icons: {
    prev: "fa fa-chevron-left",                // Sets icon using <i> tag class names
    next: '<i class="bi bi-chevron-right"></i>', // Or sets icon using raw HTML tags
  },
});
```

Wheel and touch swipe navigation are enabled by default. Scrolling down or swiping left moves forward; scrolling up or swiping right moves back.

```js
new MSDatePicker(input, {
  scrollNavigation: {
    enabled: true,
    wheel: true,
    touch: true,
    threshold: 45,
    wheelThrottle: 160,
  },
});

new MSDatePicker(input, {
  scrollNavigation: false,
});
```

## Languages

English is built into the plugin and is used by default. To use another language, load a language file after the plugin and pass its code in the init options:

```html
<script src="src/ms-date-picker.js"></script>
<script src="src/lang/es.js"></script>
<script>
  new MSDatePicker(input, {
    language: "es",
    format: "D MMMM YYYY",
  });
</script>
```

Georgian is included:

```html
<script src="src/ms-date-picker.js"></script>
<script src="src/lang/ka.js"></script>
<script>
  new MSDatePicker(input, {
    language: "ka",
  });
</script>
```

Create your own language file with `MSDatePicker.registerLanguage`:

```js
MSDatePicker.registerLanguage("ka", {
  name: "Georgian",
  locale: "ka",
  months: {
    long: ["იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი", "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"],
    short: ["იან", "თებ", "მარ", "აპრ", "მაი", "ივნ", "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ"]
  },
  weekdays: {
    short: ["კვი", "ორშ", "სამშ", "ოთხშ", "ხუთშ", "პარ", "შაბ"]
  },
  labels: {
    today: "დღეს",
    clear: "გასუფთავება",
    previous: "წინა",
    next: "შემდეგი",
    chooseMonthYear: "აირჩიეთ თვე ან წელი",
    chooseYear: "აირჩიეთ წელი",
    chooseDate: "აირჩიეთ თარიღი",
  },
});
```

You can also pass the same language object directly as `language` in the picker options.

## API

```js
const picker = new MSDatePicker(input);

picker.open();
picker.close();
picker.setDate("24-06-2026");
picker.getDate();
picker.destroy();
```

Attach to multiple inputs:

```js
const pickers = MSDatePicker.attach(".date-input", { format: "MM/DD/YYYY" });
```
