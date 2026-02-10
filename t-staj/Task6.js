const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let input = [];
let lineCount = 0;
let n, q, s;
let ops = [];

rl.on('line', line => {
    input.push(line.trim());
    lineCount++;

    if (lineCount === 1) {
        [n, q] = input[0].split(' ').map(Number);
    }
    if (lineCount === 2) {
        s = input[1];
    }
    if (lineCount === 2 + q) {
        processInput();
        rl.close();
    }
});

function processInput() {
    let currentLength = n;

    for (let i = 2; i < input.length; i++) {
        let parts = input[i].split(' ');
        let type = +parts[0];

        if (type === 1) {
            let l = +parts[1] - 1;
            let r = +parts[2] - 1;
            let len = r - l + 1;

            ops.push({ l, r, start: currentLength, length: len });
            currentLength += len;
        } else {
            let idx = +parts[1] - 1;
            let pos = idx;

            for (let j = ops.length - 1; j >= 0; j--) {
                let op = ops[j];
                let len = op.length;

                if (pos >= op.start && pos < op.start + len) {
                    pos = op.l + (pos - op.start);
                } else if (pos >= op.l && pos < op.l + len) {
                    pos = pos;
                }
            }

            console.log(s[pos]);
        }
    }
}
