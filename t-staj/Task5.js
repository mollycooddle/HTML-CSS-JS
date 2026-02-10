const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function solve() {
    rl.once('line', (line) => {
        const n = parseInt(line);
        rl.once('line', (line2) => {
            const a = line2.split(' ').map(Number);
            
            const minVal = Math.min(...a);
            const maxVal = Math.max(...a);
            
            const freq = new Map();
            for (const val of a) {
                freq.set(val, (freq.get(val) || 0) + 1);
            }
            
            const posMap = new Map();
            for (let i = 0; i < n; i++) {
                const val = a[i];
                if (!posMap.has(val)) posMap.set(val, []);
                posMap.get(val).push(i);
            }
            
            const ans = new Array(n);
            
            const hasRepeatWithoutX = (x) => {
                for (const [val, cnt] of freq) {
                    if (val !== x && cnt >= 2) return true;
                }
                return false;
            };
            
            for (const [x, positions] of posMap) {
                const m = positions.length;
                
                if (m === n) {
                    for (const idx of positions) ans[idx] = 0;
                    continue;
                }
                
                let base = n - m;
                
                let extra = 0;
                if (x !== minVal && x !== maxVal && !hasRepeatWithoutX(x)) {
                    extra = 1;
                }
                
                const result = base + extra;
                for (const idx of positions) {
                    ans[idx] = result;
                }
            }
            
            console.log(ans.join(' '));
            rl.close();
        });
    });
}

solve();