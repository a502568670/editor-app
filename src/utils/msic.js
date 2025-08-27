function getid(e) {
  for (var t = "", i = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", n = 0; e > n; n++)t += i.charAt(Math.floor(Math.random() * i.length));
  return t;
}

export function gen_unique_id() {
  return `${getid(8)}-${getid(6)}`
}