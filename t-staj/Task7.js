const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const MOD = 1000000007n;

function solve() {
    rl.once('line', (line) => {
        const [n, k] = line.split(' ').map(Number);
        
        const whiteArr = [];
        const blackArr = [];
        
        for (let d = -(n - 1); d <= n - 1; d++) {
            const absD = Math.abs(d);
            const value = n - absD;
            if (d % 2 === 0) {
                whiteArr.push(value);
            } else {
                blackArr.push(value);
            }
        }
        
        whiteArr.sort((a, b) => a - b);
        blackArr.sort((a, b) => a - b);
        
        const dpWhite = new Array(k + 1).fill(0n);
        dpWhite[0] = 1n;
        for (const val of whiteArr) {
            for (let j = k; j >= 0; j--) {
                if (dpWhite[j] === 0n) continue;
                if (j + 1 <= k) {
                    const add = dpWhite[j] * BigInt(val - j);
                    dpWhite[j + 1] = (dpWhite[j + 1] + add) % MOD;
                }
            }
        }
        
        const dpBlack = new Array(k + 1).fill(0n);
        dpBlack[0] = 1n;
        for (const val of blackArr) {
            for (let j = k; j >= 0; j--) {
                if (dpBlack[j] === 0n) continue;
                if (j + 1 <= k) {
                    const add = dpBlack[j] * BigInt(val - j);
                    dpBlack[j + 1] = (dpBlack[j + 1] + add) % MOD;
                }
            }
        }
        
        let ans = 0n;
        for (let i = 0; i <= k; i++) {
            ans = (ans + dpWhite[i] * dpBlack[k - i]) % MOD;
        }
        
        console.log(Number(ans));
        rl.close();
    });
}

solve();