const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, set } = require('firebase/database');

const rawServers = require('./servers.json');

const uniqueServers = [];
const seenUrls = new Set();
rawServers.forEach(srv => {
    if (srv.type === 'std' && !seenUrls.has(srv.url)) {
        seenUrls.add(srv.url);
        uniqueServers.push(srv);
    }
});

const servers = uniqueServers.map((srv, i) => {
    return {
        id: `S_${i + 1}`,
        name: srv.label,
        url: srv.url,
        path: srv.path
    };
});

async function resetAll() {
    console.log("Starting Call Forwarding Reset...");
    
    for (const server of servers) {
        try {
            const app = initializeApp({ databaseURL: server.url }, server.id);
            const db = getDatabase(app);
            
            const callForRef = ref(db, `${server.path}/Call_For`);
            const snapshot = await get(callForRef);
            
            if (snapshot.exists()) {
                const devices = snapshot.val();
                let resetCount = 0;
                
                const promises = Object.keys(devices).map(async (deviceId) => {
                    const current = devices[deviceId];
                    // Only reset if it looks like it's active or forwarded to some number
                    if (current.Status === 'Yes' || current.Type === 'Active' || current.PhoneNumber !== '1234567890' || current.PhoneNumber !== '') {
                        
                        let subId = current.SubID || "5225225";
                        
                        await set(ref(db, `${server.path}/Call_For/${deviceId}`), {
                            PhoneNumber: "1234567890",
                            Status: "No",
                            SubID: subId,
                            Type: "Deactive"
                        });
                        resetCount++;
                    }
                });
                
                await Promise.allSettled(promises);
                if (resetCount > 0) {
                    console.log(`Reset ${resetCount} devices in ${server.name}`);
                }
            }
        } catch (e) {
            console.error(`Error processing ${server.name}:`, e.message);
        }
    }
    
    console.log("Reset Complete!");
    process.exit(0);
}

resetAll();
