
const colors = require('colors');
const $Object = require('@definejs/object');
const Server = require('@webpart/server-core');
const API = require('./modules/API');
const Web = require('./modules/Web');



module.exports = {


    start(config, done) {

        let core = $Object.filter(config, [
            'port',
            'beginPort',
            'open',
            'qr',
            'statics',
            'proxy',
        ]);

        let api = config.api;
        let statics = core.statics = core.statics || {};
        let htdocs = statics['/'] = statics['/'] || `${__dirname}/htdocs/`;


        Server.start(core, function (app, server) {
            let { port, } = server;
            let url = API.start(app, port, api);

            if (url) {
                Web.start(htdocs, url);
            }
           
            done && done(app, server);
            
        });


    },
};