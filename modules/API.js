
const api = require('@webpart/server-api');

module.exports = {
    
    start(app, port, config) {
        if (!config) {
            return;
        }


        let url = api.start(app, {
            'url': `http://localhost:${port}`,
            'stat': config.stat,
            'allowCrossOrigin': config.allowCrossOrigin,
        });

        return url;
    },
};