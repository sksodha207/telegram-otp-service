const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');
const rawServers = require('./servers.json');
const uniqueServers = [];
const seenUrls = new Set();
rawServers.forEach(srv => {
    if (srv.type === 'std' && !seenUrls.has(srv.url)) {
        seenUrls.add(srv.url);
        uniqueServers.push(srv);
    }
});
const server = uniqueServers[0];
const app = initializeApp({ databaseURL: server.url }, 'test');
const db = getDatabase(app);
get(ref(db, server.path + '/Sms')).then(snap => {
    if (snap.exists()) {
        const val = snap.val();
        const devices = Object.keys(val);
        const msgs = val[devices[0]];
        console.log('Sample Msg:', msgs[Object.keys(msgs)[0]]);
    }
    process.exit();
}).catch(e => { console.log(e); process.exit(); });
