
require('colors');

const File = require('@definejs/file');
const API = require('./modules/API');
const Core = require('./modules/Core');
const Proxy = require('./modules/Proxy');
const QRCode = require('./modules/QRCode');
const Session = require('./modules/Session');
const Static = require('./modules/Static');


module.exports = {


    start(config, done) {

        Core.start(config, function (app, server) {
            Proxy.use(app, config);

            let session = Session.start(app);
            let statics = Static.use(app, config, server);
            let qrcode = QRCode.start(app, config, server);

            let api = API.start(app, config, { server, statics, qrcode, session, });

            let info = {
                ...server,
                statics,
                api,
                qrcode,
                session,
            };
           

            let { file, } = config;

            if (file) {
                File.writeJSON(file, info);
            }

            done && done(app, info);
        });


    },
};