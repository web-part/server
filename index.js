
require('colors');

const API = require('./modules/API');
const Core = require('./modules/Core');
const Proxy = require('./modules/Proxy');
const QRCode = require('./modules/QRCode');
const Session = require('./modules/Session');
const Static = require('./modules/Static');


module.exports = {


    start(config, done) {

        Core.start(config, function (app, server) {
            Static.use(app, config, server);
            Proxy.use(app, config);
           
            let api = API.start(app, config, server);
            let session = Session.start(app, config, server);
            let qrcode = QRCode.start(app, config, server);

            done && done(app, {
                server,
                api,
                session,
                qrcode,
            });
        });


    },
};