const API = require('@webpart/server-api');


module.exports = {

    start(app, config, { server, statics, qrcode, session, }) {
        let opt = config.api;

        if (!opt) {
            return;
        }

        let api = API.start(app, {
            ...server,
            ...opt,

            statics,
            qrcode,
            session,
        });


        return api;

    },
};