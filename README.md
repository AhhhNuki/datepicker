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
  colors: {
    selectedBackground: null,
    selectedText: null,
  },
  defaultDate: null,
  minDate: null,
  maxDate: null,
  weekStartsOn: 1,
  closeOnSelect: true,
  locale: undefined,
  appendTo: document.body,
  onSelect(date, formattedValue, picker) {
    console.log(date, formattedValue, picker);
  },
});
```

Supported format tokens are `D`, `DD`, `M`, `MM`, `MMM`, `MMMM`, `YY`, and `YYYY`.

`theme` can be `"auto"`, `"light"`, or `"dark"`. Auto follows the user's system color scheme.

Set selected date colors with `colors.selectedBackground` and `colors.selectedText`:

```js
new MSDatePicker(input, {
  theme: "dark",
  colors: {
    selectedBackground: "#16a34a",
    selectedText: "#ffffff",
  },
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
