const fs = require('fs');
const p = 'lib/page-content.js';
let s = fs.readFileSync(p, 'utf8');
let orig = s;
function removeBetween(text, a, b) {
  let i = text.indexOf(a);
  while (i !== -1) {
    const j = text.indexOf(b, i + a.length);
    if (j === -1) break;
    text = text.slice(0, i) + a + text.slice(j + b.length);
    i = text.indexOf(a, i + a.length);
  }
  return text;
}
// Remove unescaped figcaption HTML block
// Remove figcaption HTML block inside the bodyHtml string (uses escaped quotes)
s = removeBetween(s, '<figcaption class=\\"hero-overlay\\">', '</figcaption>');
if (s !== orig) {
  fs.writeFileSync(p, s, 'utf8');
  console.log('patched', p);
} else {
  console.log('no changes');
}
