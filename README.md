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
  format: "DD-MM-YYYY",
  language: "en",
  theme: "auto",
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
  colors: {
    selectedBackground: null,
    selectedText: null,
    background: null,
  },
  defaultDate: null,
  minDate: null,
  maxDate: null,
  disableFutureDates: false,
  scrollBackLimitYears: null,
  weekStartsOn: 1,
  closeOnSelect: true,
  locale: undefined,
  appendTo: document.body,
  onSelect(date, formattedValue, picker) {
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
    }
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
