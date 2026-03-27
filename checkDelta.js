const fs = require('fs');
const p = 'app/chat/[id].tsx';
const text = fs.readFileSync(p, 'utf8');
const lines = text.split(/\r?\n/);
let braceCount = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let count = braceCount;
  for (const ch of line) {
    if (ch === '{') braceCount++;
    else if (ch === '}') braceCount--;
  }
  if (count !== braceCount || (i > 180 && i < 220) || (i > 480 && i < 500)) {
    const delta = braceCount-count;
    const preview = line.substring(0, 60);
    console.log('L' + (i+1) + ': braces=' + braceCount + ' (d=' + delta + ') ' + preview);
  }
}
console.log('Final ' + braceCount);
