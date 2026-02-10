const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let input = [];
let lineNum = 0;
let n, m;
let adj = [];

rl.on('line', (line) => {
    input.push(line.trim());
    if (lineNum === 0) {
        [n, m] = input[0].split(' ').map(Number);
        adj = Array.from({ length: n + 1 }, () => []);
    } else if (lineNum <= m) {
        const [a, b] = input[lineNum].split(' ').map(Number);
        adj[a].push(b);
        adj[b].push(a);
    }
    lineNum++;
    if (lineNum > m) {
        rl.close();
    }
}).on('close', () => {
    const INF = 1e9;
    let ans = INF;
    
    const bfs = (start, end, u_skip, v_skip) => {
        const dist = Array(n + 1).fill(-1);
        const queue = [start];
        dist[start] = 0;
        
        let front = 0;
        while (front < queue.length) {
            const u = queue[front++];
            if (u === end) return dist[end];
            
            for (const v of adj[u]) {
                if ((u === u_skip && v === v_skip) || (u === v_skip && v === u_skip)) {
                    continue;
                }
                if (dist[v] === -1) {
                    dist[v] = dist[u] + 1;
                    queue.push(v);
                }
            }
        }
        return -1;
    };
    
    const edges = [];
    for (let u = 1; u <= n; u++) {
        for (const v of adj[u]) {
            if (u < v) {
                edges.push([u, v]);
            }
        }
    }
    
    for (const [a, b] of edges) {
        const dist = bfs(a, b, a, b);
        if (dist !== -1) {
            ans = Math.min(ans, dist + 1);
        }
    }
    
    if (ans === INF) {
        console.log(-1);
    } else {
        console.log(ans);
    }
});