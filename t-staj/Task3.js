const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let t = null;
let tests = [];
let lineCount = 0;

rl.on('line', (line) => {
    lineCount++;
    if (lineCount === 1) {
        t = parseInt(line.trim());
    } else {
        tests.push(line.trim());
        if (tests.length === t) {
            rl.close();
        }
    }
}).on('close', () => {
    const results = [];
    
    for (let testIdx = 0; testIdx < t; testIdx++) {
        const s = tests[testIdx];
        const n = s.length;
        
        const isOne = new Array(n).fill(false);
        for (let d = 0; d < n; d++) {
            if (s[d] === '1') {
                isOne[d] = true;
            }
        }
        
        let maxLen = 0;
        
        const doubled = isOne.concat(isOne);
        
        let currentLen = 0;
        for (let i = 0; i < doubled.length; i++) {
            if (doubled[i]) {
                currentLen++;
                if (currentLen > maxLen) {
                    maxLen = currentLen;
                }
            } else {
                currentLen = 0;
            }
        }
        
        if (maxLen > n) maxLen = n;
        
        let answer;
        if (maxLen === n) {
            answer = n * n;
        } else if (maxLen === 0) {
            answer = 0;
        } else if (maxLen === 1) {
            answer = 1;
        } else {
            const L = maxLen;
            let maxArea = 0;
            for (let h = 1; h <= L; h++) {
                const w = L - h + 1;
                if (w < 1) break;
                const area = h * w;
                if (area > maxArea) {
                    maxArea = area;
                }
            }
            answer = maxArea;
        }
        
        results.push(answer.toString());
    }
    
    console.log(results.join('\n'));
    process.exit(0);
});