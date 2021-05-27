const Proxy = require('@webpart/server-proxy');





module.exports = {

    use(app, config) {
        let opt = config.proxy;

        if (!opt) {
            return;
        }

        Proxy.use(app, opt);
        
    },
};