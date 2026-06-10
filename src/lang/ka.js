(function (global) {
  "use strict";

  const langConfig = {
    name: "Georgian",
    locale: "ka",
    months: {
      long: [
        "იანვარი",
        "თებერვალი",
        "მარტი",
        "აპრილი",
        "მაისი",
        "ივნისი",
        "ივლისი",
        "აგვისტო",
        "სექტემბერი",
        "ოქტომბერი",
        "ნოემბერი",
        "დეკემბერი"
      ],
      short: [
        "იან",
        "თებ",
        "მარ",
        "აპრ",
        "მაი",
        "ივნ",
        "ივლ",
        "აგვ",
        "სექ",
        "ოქტ",
        "ნოე",
        "დეკ"
      ]
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
  };

  if (global.MSDatePicker) {
    global.MSDatePicker.registerLanguage("ka", langConfig);
  } else {
    global.MSDatePickerQueue = global.MSDatePickerQueue || [];
    global.MSDatePickerQueue.push({ code: "ka", language: langConfig });
  }
})(window);
