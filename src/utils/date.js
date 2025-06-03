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
    year = d.getFullYear(),
    hour = '' + d.getHours(),
    minute = '' + d.getMinutes(),
    second = '' + d.getSeconds()
    ;


  if (month.length < 2)
    month = '0' + month;
  if (day.length < 2)
    day = '0' + day;
  if (hour.length < 2)
    hour = '0' + hour;
  if (minute.length < 2)
    minute = '0' + minute;
  if (second.length < 2)
    second = '0' + second;
  if (fmt === "yyyyMMdd") {
    return [year, month, day].join('');
  } else if (fmt) {
    return fmt.replace(/yyyy|MM|dd|HH|mm/g, match => {
      switch (match) {
        case 'yyyy': return year;
        case 'MM': return month;
        case 'dd': return day;
        case 'HH': return hour;
        case 'mm': return minute;
        default: return match;
      }
    });
  }
  return [year, month, day].join('-');
}