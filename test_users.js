const fs = require('fs');
let usersDB = { adminId: '6799525497', users: {} };
const data = require('./users.json');
for (let row of data) {
    if (row.is_admin) {
        usersDB.adminId = row.chat_id;
    }
    usersDB.users[row.chat_id] = {
        expiry: parseInt(row.expiry),
        activeServerMode: row.active_server_mode || 'ALL'
    };
}
console.log(usersDB.users['6799525497']);

