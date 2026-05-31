const fs = require('fs');
let code = fs.readFileSync('bot.js', 'utf8');

// 1. Auth Message
code = code.replace(/bot\.sendMessage\(chatId, .?\s*<b>Aapka access band ho gaya hai ya aap naye user hain\.<\\/b>\\nAccess kharidne ke liye contact karein: @SHADOW_SELLER07., \{ parse_mode: 'HTML' \}\);/g, 
  'bot.sendMessage(chatId, "🚫 <b>ACCESS DENIED</b>\\n━━━━━━━━━━━━━━━━━━\\nAapka subscription active nahi hai ya aap naye user hain.\\n\\n💎 <b>Premium Access ke liye contact karein:</b>\\n👉 @SHADOW_SELLER07", { parse_mode: \\'HTML\\' });');

// 2. Claim Admin Success
code = code.replace(/bot\.sendMessage\(chatId, .*?<b>Congratulations! You are now the Admin\.<\\/b>\\n\\n<b>Admin Commands:<\\/b>\\n`\\/adduser <telegram_id> <time>` - e\.g\., `\\/adduser 123 2d` \(2 days\) or `\\/adduser 123 12h` \(12 hours\)\\n`\\/deluser <telegram_id>` - Remove a user\\n`\\/users` - List all active users., \{ parse_mode: 'HTML' \}\);/g,
  'bot.sendMessage(chatId, "👑 <b>ADMIN ACCESS GRANTED</b>\\n━━━━━━━━━━━━━━━━━━\\nWelcome back, Admin.\\n\\n🛠 <b>COMMAND PANEL:</b>\\n<code>/adduser <id> <time></code> ➜ Grant access (e.g., 2d, 12h)\\n<code>/deluser <id></code> ➜ Revoke access\\n<code>/users</code> ➜ Active User List\\n<code>/all</code> ➜ Global OTP Mode", { parse_mode: \\'HTML\\' });');

// 3. Invalid Secret
code = code.replace(/bot\.sendMessage\(chatId, .*?Invalid secret!.\);/g,
  'bot.sendMessage(chatId, "❌ <b>Error:</b> Invalid Secret Key!");');

// 4. Add User Success
code = code.replace(/bot\.sendMessage\(chatId, .*?User <code>\$\{targetId\}<\\/code> added successfully for \$\{amount\} \$\{unitName\}\.., \{ parse_mode: 'HTML' \}\);/g,
  'bot.sendMessage(chatId, `✅ <b>USER ADDED</b>\\n━━━━━━━━━━━━━━━━━━\\n👤 <b>ID:</b> <code>${targetId}</code>\\n⏳ <b>Duration:</b> ${amount} ${unitName}`, { parse_mode: \\'HTML\\' });');

code = code.replace(/bot\.sendMessage\(targetId, .*?<b>Aapki subscription chalu kar di gayi hai!<\\/b>\\nAapko \$\{amount\} \$\{unitName\} ka access mil gaya hai\. Use \\/start to begin\.., \{ parse_mode: 'HTML' \}\)\.catch\(e=>\{\}\);/g,
  'bot.sendMessage(targetId, `🎉 <b>SUBSCRIPTION ACTIVATED</b>\\n━━━━━━━━━━━━━━━━━━\\nWelcome to Premium! Aapka access <b>${amount} ${unitName}</b> ke liye activate ho gaya hai.\\n\\n🚀 Click /start to begin.`, { parse_mode: \\'HTML\\' }).catch(e=>{});');

// 5. Del User
code = code.replace(/bot\.sendMessage\(chatId, .*?User <code>\$\{targetId\}<\\/code> removed\.., \{ parse_mode: 'HTML' \}\);/g,
  'bot.sendMessage(chatId, `🗑 <b>USER REMOVED</b>\\n━━━━━━━━━━━━━━━━━━\\n👤 <b>ID:</b> <code>${targetId}</code> has been revoked.`, { parse_mode: \\'HTML\\' });');

code = code.replace(/bot\.sendMessage\(targetId, .*?Aapka access band kar diya gaya hai\. Access ke liye @SHADOW_SELLER07 se contact karein\.., \{ parse_mode: 'HTML' \}\)\.catch\(e=>\{\}\);/g,
  'bot.sendMessage(targetId, `🚫 <b>ACCESS EXPIRED</b>\\n━━━━━━━━━━━━━━━━━━\\nAapka premium access band kar diya gaya hai.\\n\\n💎 <b>Renew karne ke liye contact karein:</b>\\n👉 @SHADOW_SELLER07`, { parse_mode: \\'HTML\\' }).catch(e=>{});');

// 6. Users List
code = code.replace(/let reply = .<b>.*?Active Users:<\\/b>\\n\\n.;/g, 'let reply = "📊 <b>USER DASHBOARD</b>\\n━━━━━━━━━━━━━━━━━━\\n";');
code = code.replace(/reply \+= .*?<b>Admin:<\\/b> <code>\$\{uid\}<\\/code>\\n.;/g, 'reply += `👑 <b>Admin:</b> <code>${uid}</code>\\n\\n`;');
code = code.replace(/const status = \(data\.expiry && Date\.now\(\) > data\.expiry\) \? .*?Expired. : .*?Active.;/g, 'const status = (data.expiry && Date.now() > data.expiry) ? \\'❌ Expired\\' : \\'✅ Active\\';');
code = code.replace(/reply \+= .*?<b>User:<\\/b> <code>\$\{uid\}<\\/code>\\n.*?<b>Expires:<\\/b> \$\{expStr\} \(\$\{status\}\)\\n\\n.;/g, 'reply += `👤 <b>User:</b> <code>${uid}</code>\\n⏳ <b>Expiry:</b> ${expStr} [${status}]\\n\\n`;');

// 7. Start Message
code = code.replace(/bot\.sendMessage\(chatId, .<b>.*?Welcome to Mega OTP Bot .*?<\\/b>\\n\\nKripya ek server select karein, ya 'ALL' chunein:.,/g,
  'bot.sendMessage(chatId, "⚡️ <b>SHADOW OTP SYSTEM</b> ⚡️\\n━━━━━━━━━━━━━━━━━━\\nWelcome to the premium dashboard. Please select a server to monitor, or choose <b>ALL SHADOWS</b> for global interception.",');

// 8. All Mode / Server Mode in callbacks
code = code.replace(/bot\.sendMessage\(chatId, .*?Fetching all numbers across all servers, please wait\.\.\.., \{ parse_mode: 'HTML' \}\);/g,
  'bot.sendMessage(chatId, "⏳ <i>Initializing Global Intercept Mode...</i>", { parse_mode: \\'HTML\\' });');
code = code.replace(/bot\.sendMessage\(chatId, .*?<b>ALL SERVERS MODE ACTIVATED!<\\/b>\\nAapko sabhi servers ke live OTPs milenge\.., \{ parse_mode: 'HTML' \}\);/g,
  'bot.sendMessage(chatId, "🌐 <b>GLOBAL MODE ACTIVATED</b>\\n━━━━━━━━━━━━━━━━━━\\nAapko sabhi servers ke live OTPs real-time mein milenge.", { parse_mode: \\'HTML\\' });');
code = code.replace(/sendChunkedKeyboards\(chatId, allButtons, .<b>.*?ALL NUMBERS:<\\/b>.\);/g,
  'sendChunkedKeyboards(chatId, allButtons, "📱 <b>AVAILABLE TARGETS:</b>");');

code = code.replace(/bot\.sendMessage\(chatId, .*?Fetching numbers for <b>\$\{server\.name\}<\\/b>\.\.\.., \{ parse_mode: 'HTML' \}\);/g,
  'bot.sendMessage(chatId, `⏳ <i>Connecting to ${server.name}...</i>`, { parse_mode: \\'HTML\\' });');
code = code.replace(/bot\.sendMessage\(chatId, .*?<b>\$\{server\.name\} SELECTED!<\\/b>\\nAb aapko sirf \$\{server\.name\} ke live OTPs milenge\.., \{ parse_mode: 'HTML' \}\);/g,
  'bot.sendMessage(chatId, `🎯 <b>TARGET LOCKED: ${server.name}</b>\\n━━━━━━━━━━━━━━━━━━\\nAb aapko sirf ${server.name} ke live OTPs milenge.`, { parse_mode: \\'HTML\\' });');

// 9. New OTP Alert
code = code.replace(/const alertMsg = `.*?<b>New OTP \\[\$\{server\.name\}\\]<\\/b>.*?\\n\\n<b>To Number:<\\/b> <code>\$\{escapeHtml\(deviceNum\)\}<\\/code>\\n<b>From:<\\/b> \$\{escapeHtml\(msgData\.ph\)\}\\n<b>Time:<\\/b> \$\{escapeHtml\(dt\)\}\\n\\n<b>Message:<\\/b>\\n\$\{escapeHtml\(msgData\.msg\)\}`;/g,
  'const alertMsg = `🔔 <b>NEW OTP INTERCEPTED</b> 🔔\\n━━━━━━━━━━━━━━━━━━\\n📡 <b>Source:</b> <code>${server.name}</code>\\n🎯 <b>Target:</b> <code>${escapeHtml(deviceNum)}</code>\\n📨 <b>Sender:</b> <code>${escapeHtml(msgData.ph)}</code>\\n🕒 <b>Time:</b> <i>${escapeHtml(dt)}</i>\\n\\n💬 <b>Message Content:</b>\\n<code>${escapeHtml(msgData.msg)}</code>\\n━━━━━━━━━━━━━━━━━━`;');

fs.writeFileSync('bot.js', code);
console.log('UI updated successfully!');
