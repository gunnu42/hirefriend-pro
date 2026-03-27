const fs = require('fs');
const p = 'app/chat/[id].tsx';
const text = fs.readFileSync(p, 'utf8');
const stack = [];
let line = 0;
for (const ln of text.split(/\r?\n/)) {
  line++;
  for (const ch of ln) {
    if (ch === '{') stack.push({line, ch});
    else if (ch === '}') {
      if (stack.length === 0) {
        console.log('UNMATCHED } at line', line);
      } else {
        const pop = stack.pop();
      }
    }
  }
}
console.log('remaining open:', stack.length);
if (stack.length) {
  console.log('First remaining:', stack[0]);
  for (let i = 0; i < Math.min(5, stack.length); i++) {
    console.log('  ', stack[i]);
  }
}
