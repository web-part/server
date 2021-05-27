const Core = require('@webpart/server-core');

module.exports = {


    start(config, done) {
        let opt = {
            'port': config.port,
            'beginPort': config.beginPort,
        };


        Core.start(opt, done);
    },
};