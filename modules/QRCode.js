const QRCode = require('@webpart/server-qrcode');





module.exports = {

    start(app, config, { host, port, }) {
        let opt = config.qrcode;

        if (!opt) {
            return;
        }


        let qrcode = QRCode.start(app, {
            host,
            port,
            ...opt,
        });

        return qrcode;

    },
};