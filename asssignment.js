const fs = require("fs");

function parseInBase(str, base) {
  const digits = "0123456789abcdefghijklmnopqrstuvwxyz";
  str = str.toLowerCase();
  let value = 0n;
  for (const c of str) {
    if (c === "_" || c === " ") continue;
    const d = BigInt(digits.indexOf(c));
    if (d < 0n || d >= BigInt(base)) {
      throw new Error(`Invalid digit '${c}' for base ${base}`);
    }
    value = value * BigInt(base) + d;
  }
  return value;
}

function gcdExtended(a, b) {
  if (b === 0n) return [a, 1n, 0n];
  const [g, x1, y1] = gcdExtended(b, a % b);
  return [g, y1, x1 - (a / b) * y1];
}

function reduceFraction(num, den) {
  const g = gcd(absBig(num), absBig(den));
  if (den < 0n) {
    num = -num;
    den = -den;
  }
  return [num / g, den / g];
}

function gcd(a, b) {
  a = absBig(a);
  b = absBig(b);
  while (b !== 0n) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

function absBig(a) {
  return a < 0n ? -a : a;
}

function lagrangeAtZero(points) {
  let num = 0n; // numerator
  let den = 1n; // denominator

  const k = points.length;

  for (let i = 0; i < k; i++) {
    let [xi, yi] = points[i];
    let termNum = yi; // numerator
    let termDen = 1n; // denominator
    for (let j = 0; j < k; j++) {
      if (i === j) continue;
      let [xj, _] = points[j];
      termNum *= (-xj);
      termDen *= (xi - xj);
    }

    num = num * termDen + termNum * den;
    den = den * termDen;

    [num, den] = reduceFraction(num, den);
  }

  return [num, den];
}

// Main
function main() {
  if (process.argv.length < 3) {
    console.error("Usage: node reconstruct_secret.js <testcase.json>");
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
  const n = data.keys.n;
  const k = data.keys.k;

  let points = [];
  for (const key of Object.keys(data)) {
    if (key === "keys") continue;
    const x = BigInt(key);
    const base = parseInt(data[key].base, 10);
    const val = data[key].value;
    const y = parseInBase(val, base);
    points.push([x, y]);
  }

  // Use first k shares
  points = points.slice(0, k);

  const [num, den] = lagrangeAtZero(points);

  if (den === 1n) {
    console.log("Secret (C):", num.toString());
  } else {
    console.log("Secret (C) rational:", num.toString(), "/", den.toString());
    if (num % den === 0n) {
      console.log("Secret (C) integer:", (num / den).toString());
    } else {
      console.warn("Warning: secret is not integer with chosen shares.");
    }
  }
}

main();
