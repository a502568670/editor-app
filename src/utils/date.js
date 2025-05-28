export function createDateByDays(rawDate, days) {
  let date = new Date(rawDate.valueOf());
  date.setDate(date.getDate() + days);
  return date;
}

export function parseDate(dateStr, fmt) {
  if (fmt === "yyyyMMdd") {
    let year = dateStr.substring(0, 4);
    let month = dateStr.substring(4, 6);
    let day = dateStr.substring(6, 8);

    return new Date(year, month - 1, day);
  }
}

export function formatDate(date, fmt) {
  let d = new Date(date),
    month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2)
    month = '0' + month;
  if (day.length < 2)
    day = '0' + day;
  if (fmt === "yyyyMMdd") {
    return [year, month, day].join('');
  }
  return [year, month, day].join('-');
}