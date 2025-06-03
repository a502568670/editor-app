export const serializeCookie = (arr) => {
  const items = []
  arr.forEach((v) => {
    items.push(`${encodeURIComponent(v["name"])}=${encodeURIComponent(v["value"])}`)
  });
  // console.log("items=>", items)
  return items.join(";")
}