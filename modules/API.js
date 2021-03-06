const API = require('@webpart/server-api');


module.exports = {

    start(app, config, { host, port, }) {
        let opt = config.api;

        if (!opt) {
            return;
        }

        let api = API.start(app, {
            host,
            port,
            ...opt,
        });


        return api;

    },
};