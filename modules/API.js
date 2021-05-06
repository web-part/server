
const api = require('@webpart/server-api');

module.exports = {
    
    start(app, port, config) {
        if (!config) {
            return;
        }


        let url = api.start(app, {
            'url': `http://localhost:${port}`,
            'path': config.path,
            'allowCrossOrigin': config.allowCrossOrigin,
            'stat': config.stat,
        });

        return url;
    },
};