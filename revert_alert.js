const fs = require('fs');
let code = fs.readFileSync('bot.js', 'utf8');
code = code.replace(/const alertMsg = [\s\S]*?;/, 'const alertMsg = ?? <b>New OTP []</b> ??\\n\\n<b>To Number:</b> <code></code>\\n<b>From:</b> \\n<b>Time:</b> \\n\\n<b>Message:</b>\\n;');
fs.writeFileSync('bot.js', code);
