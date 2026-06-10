(function (global) {
  "use strict";

  const langConfig = {
    name: "English",
    locale: "en",
    months: {
      long: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
      ],
      short: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"
      ]
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

  if (global.MSDatePicker) {
    global.MSDatePicker.registerLanguage("en", langConfig);
  } else {
    global.MSDatePickerQueue = global.MSDatePickerQueue || [];
    global.MSDatePickerQueue.push({ code: "en", language: langConfig });
  }
})(window);
