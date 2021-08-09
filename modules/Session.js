const Session = require('@webpart/server-session');

module.exports = {

    start(app) {
        let session = Session.start(app);

        return session;
    },
};