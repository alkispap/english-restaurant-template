export function slugify(value: string) {
  return transliterateGreek(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function transliterateGreek(value: string) {
  const map: Record<string, string> = {
    "\u03b1": "a",
    "\u03b2": "v",
    "\u03b3": "g",
    "\u03b4": "d",
    "\u03b5": "e",
    "\u03b6": "z",
    "\u03b7": "i",
    "\u03b8": "th",
    "\u03b9": "i",
    "\u03ba": "k",
    "\u03bb": "l",
    "\u03bc": "m",
    "\u03bd": "n",
    "\u03be": "x",
    "\u03bf": "o",
    "\u03c0": "p",
    "\u03c1": "r",
    "\u03c3": "s",
    "\u03c2": "s",
    "\u03c4": "t",
    "\u03c5": "y",
    "\u03c6": "f",
    "\u03c7": "ch",
    "\u03c8": "ps",
    "\u03c9": "o"
  };

  return value
    .toLowerCase()
    .replace(/\u03bf\u03c5/g, "ou")
    .replace(/\u03b1\u03b9/g, "ai")
    .replace(/\u03b5\u03b9/g, "ei")
    .replace(/\u03bf\u03b9/g, "oi")
    .replace(/\u03b1\u03c5/g, "av")
    .replace(/\u03b5\u03c5/g, "ev")
    .replace(/[\u03b1-\u03c9\u03ac\u03ad\u03ae\u03af\u03cc\u03cd\u03ce\u03ca\u03cb\u0390\u03b0\u03c2]/g, (char) => {
      const normalized = char.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return map[normalized] ?? "";
    });
}
