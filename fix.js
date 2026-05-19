const fs = require('fs');
const file = 'node_modules/@capacitor/assets/dist/platforms/ios/index.js';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/\(p\) => \{ try \{ require\('fs'\)\.rmSync\(p, \{force: true\}\) \} catch\(e\) \{\} \}/g, '((p) => { try { require("fs").rmSync(p, {force: true}) } catch(e) {} })');
fs.writeFileSync(file, content);
