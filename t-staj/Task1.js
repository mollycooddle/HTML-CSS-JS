const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on("line", (line) => {
  const s = line.trim().split('');
  s.sort();

  let firstNonZeroIndex = s.findIndex(ch => ch !== '0');

  const firstDigit = s[firstNonZeroIndex];
  s.splice(firstNonZeroIndex, 1);
  const result = firstDigit + s.join('');

  console.log(result);

  rl.close();
});
