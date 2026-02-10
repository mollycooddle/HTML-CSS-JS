const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.once('line', (line) => {
    const s = line.trim();
    const n = s.length;
    const t1 = "tbank";
    const t2 = "study";
    
    const c1 = new Array(n - 4).fill(0);
    const c2 = new Array(n - 4).fill(0);
    
    for (let i = 0; i <= n - 5; i++) {
        let cost1 = 0;
        let cost2 = 0;
        for (let k = 0; k < 5; k++) {
            if (s[i + k] !== t1[k]) cost1++;
            if (s[i + k] !== t2[k]) cost2++;
        }
        c1[i] = cost1;
        c2[i] = cost2;
    }
    
    const m = n - 4;
    const INF = 1e9;
    
    const prefMin = new Array(m).fill(INF);
    for (let i = 5; i < m; i++) {
        prefMin[i] = Math.min(prefMin[i - 1], c2[i - 5]);
    }

    const suffMin = new Array(m).fill(INF);
    for (let i = m - 6; i >= 0; i--) {
        suffMin[i] = Math.min(suffMin[i + 1], c2[i + 5]);
    }
    
    let ans = INF;
    
    for (let pos1 = 0; pos1 <= n - 5; pos1++) {
        if (pos1 >= 5 && prefMin[pos1] < INF) {
            ans = Math.min(ans, c1[pos1] + prefMin[pos1]);
        }
        if (pos1 + 5 <= m && suffMin[pos1] < INF) {
            ans = Math.min(ans, c1[pos1] + suffMin[pos1]);
        }
        
        const startPos2 = Math.max(0, pos1 - 4);
        const endPos2 = Math.min(n - 5, pos1 + 4);
        
        for (let pos2 = startPos2; pos2 <= endPos2; pos2++) {
            let compatible = true;
            for (let i = 0; i < 5; i++) {
                const idx1 = pos1 + i;
                if (idx1 >= pos2 && idx1 < pos2 + 5) {
                    const j = idx1 - pos2;
                    if (t1[i] !== t2[j]) {
                        compatible = false;
                        break;
                    }
                }
            }
            if (!compatible) continue;
            
            const covered = new Array(n).fill(false);
            for (let i = 0; i < 5; i++) {
                covered[pos1 + i] = true;
                covered[pos2 + i] = true;
            }
            
            let cost = 0;
            let valid = true;
            for (let idx = 0; idx < n; idx++) {
                if (!covered[idx]) continue;
                
                let requiredChar = null;
                let conflict = false;
                
                if (idx >= pos1 && idx < pos1 + 5) {
                    requiredChar = t1[idx - pos1];
                }
                
                if (idx >= pos2 && idx < pos2 + 5) {
                    const req2 = t2[idx - pos2];
                    if (requiredChar !== null && requiredChar !== req2) {
                        conflict = true;
                    }
                    requiredChar = req2;
                }
                
                if (conflict) {
                    valid = false;
                    break;
                }
                
                if (s[idx] !== requiredChar) {
                    cost++;
                }
            }
            
            if (valid) {
                ans = Math.min(ans, cost);
            }
        }
    }
    
    console.log(ans);
    rl.close();
});