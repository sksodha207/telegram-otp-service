const { initializeApp } = require('firebase/app');
const { getDatabase, ref, query, limitToLast, onChildAdded, push, set } = require('firebase/database');
const rawServers = require('./servers.json');
const uniqueServers = [];
const seenUrls = new Set();
rawServers.forEach(srv => { if (srv.type === 'std' && !seenUrls.has(srv.url)) { seenUrls.add(srv.url); uniqueServers.push(srv); }});
const server = uniqueServers[0];
const app = initializeApp({ databaseURL: server.url }, 'test');
const db = getDatabase(app);

const msgsRef = ref(db, server.path + '/Sms/test_device');
const q = query(msgsRef, limitToLast(1));
let count = 0;
onChildAdded(q, snap => {
    console.log('Received:', snap.key, snap.val());
    count++;
    if(count === 2) process.exit();
});

setTimeout(() => {
    console.log('Pushing new message...');
    const newRef = push(msgsRef);
    set(newRef, { msg: 'Test live', date: Date.now(), ph: 'TEST' });
}, 3000);

