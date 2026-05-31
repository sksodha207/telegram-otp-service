const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');
const rawServers = require('./servers.json');
const uniqueServers = [];
const seenUrls = new Set();
rawServers.forEach(srv => { if (srv.type === 'std' && !seenUrls.has(srv.url)) { seenUrls.add(srv.url); uniqueServers.push(srv); }});
const server = uniqueServers[0];
const app = initializeApp({ databaseURL: server.url }, 'test');
const db = getDatabase(app);
get(ref(db, server.path + '/Sms')).then(snap => {
    if (snap.exists()) {
        const val = snap.val();
        for (const deviceId of Object.keys(val).slice(0,2)) {
            const msgs = val[deviceId];
            for (const msgId of Object.keys(msgs)) {
                console.log(msgs[msgId].date);
            }
        }
    }
    process.exit();
});
