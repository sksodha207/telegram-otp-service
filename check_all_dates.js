const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');
const rawServers = require('./servers.json');
const uniqueServers = [];
const seenUrls = new Set();
rawServers.forEach(srv => { if (srv.type === 'std' && !seenUrls.has(srv.url)) { seenUrls.add(srv.url); uniqueServers.push(srv); }});
let maxDate = 0;
let promises = uniqueServers.map(server => {
    const app = initializeApp({ databaseURL: server.url }, 'app_'+server.id);
    const db = getDatabase(app);
    return get(ref(db, server.path + '/Sms')).then(snap => {
        if (snap.exists()) {
            const val = snap.val();
            for (const deviceId of Object.keys(val)) {
                const msgs = val[deviceId];
                if(msgs) {
                    for (const msgId of Object.keys(msgs)) {
                        const d = parseInt(msgs[msgId].date || 0);
                        if (d > maxDate) maxDate = d;
                    }
                }
            }
        }
    }).catch(e => {});
});
Promise.all(promises).then(() => {
    console.log('Most recent OTP date across ALL servers:', maxDate);
    console.log('Current System Time:', Date.now());
    console.log('Difference in minutes:', (Date.now() - maxDate) / 60000);
    process.exit();
});
