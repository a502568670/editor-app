import { isReactive, toRaw } from 'vue'

export function isObject (value) {
  return value !== null && !Array.isArray(value) && typeof value === 'object'
}

export function getRawData (data) {
  return isReactive(data) ? toRaw(data) : data
}

export function toDeepRaw (data) {
  const rawData = getRawData(data)

  for (const key in rawData) {
    const value = rawData[key]

    if (!isObject(value) && !Array.isArray(value)) {
      continue
    }

    rawData[key] = toDeepRaw(value)
  }

  return rawData // much better: structuredClone(rawData)
}

export function rgbObj(hex) {
  if (!/^#([0-9A-F]{3}|[0-9A-F]{6})$/i.test(hex)) {
    throw new Error("Invalid HEX color.");
  }
  let value = hex.slice(1);
  if (value.length === 3) {
    value = value.split("").map((char) => char + char).join("");
  }
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return { r, g, b };
}
function strHex(s){
  return s.toString(16).padStart(2,0)
}
export function toPicPageInfo(o,from=0) {
  if(from){
    return o.map(v=>({
      url:v.url,
      cdn_url:v.url,
      width:300,height:400,
      theme_color:rgbObj(v.bg),
    }))
  }
  return o.map(v=>({
    url:v.cdn_url,
    bg:'#'+`${strHex(v.theme_color.r)}${strHex(v.theme_color.g)}${strHex(v.theme_color.b)}`
  }));
}
