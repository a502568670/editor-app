export const serializeCookie = (arr) => {
  const items = []
  arr.forEach((v) => {
    // items.push(`${encodeURIComponent(v["name"])}=${encodeURIComponent(v["value"])}`)
    items.push(`${encodeURIComponent(v["name"])}=${v["value"]}`)
  });
  // console.log("items=>", items)
  return items.join(";")
}