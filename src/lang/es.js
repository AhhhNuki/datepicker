(function (global) {
  "use strict";

  const langConfig = {
    name: "Spanish",
    locale: "es",
    months: {
      long: [
        "enero",
        "febrero",
        "marzo",
        "abril",
        "mayo",
        "junio",
        "julio",
        "agosto",
        "septiembre",
        "octubre",
        "noviembre",
        "diciembre"
      ],
      short: [
        "ene",
        "feb",
        "mar",
        "abr",
        "may",
        "jun",
        "jul",
        "ago",
        "sep",
        "oct",
        "nov",
        "dic"
      ]
    },
    weekdays: {
      short: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"]
    },
    labels: {
      today: "Hoy",
      clear: "Borrar",
      previous: "Anterior",
      next: "Siguiente",
      chooseMonthYear: "Elegir mes o año",
      chooseYear: "Elegir año",
      chooseDate: "Elegir fecha",
    },
  };

  if (global.MSDatePicker) {
    global.MSDatePicker.registerLanguage("es", langConfig);
  } else {
    global.MSDatePickerQueue = global.MSDatePickerQueue || [];
    global.MSDatePickerQueue.push({ code: "es", language: langConfig });
  }
})(window);
