const OneSignal = require('onesignal-node');

const client = new OneSignal.Client({
    app: {
        appAuthKey: 'M2FiZDg1YjItZGRkZi00MTNmLTk3NTAtODE4NTU0MTQ3NGJk', // REST API Key
        appId: '6a3de6ea-c64a-41cb-9c19-3ec913099e5f'
    }
});

module.exports = client;
