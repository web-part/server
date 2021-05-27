const Session = require('@webpart/server-session');

module.exports = {
    
    start(app, config, server) {
        let opt = config.session;

        if (!opt) {
            return;
        }

        let { file, } = opt;
        let session = Session.start(app, file, server);

        return session;

        
    },
};