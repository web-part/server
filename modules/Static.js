const console = require('@webpart/console');
const Static = require('@webpart/server-static');


function print(host, port, dests) {
    console.log(`webpart server is running at`.bold.green);

    console.log('local:'.bold);
    dests.forEach((dest) => {
        console.log(`    http://localhost:${port}${dest}`.underline.cyan);
    });

    if (host) {
        console.log('network:'.bold);
        dests.forEach((dest) => {
            console.log(`    http://${host}:${port}${dest}`.underline.cyan);
        });
    }
}



module.exports = {

    use(app, config, { host, port, }) {
        let opt = config.statics || {};

        opt['/'] = opt['/'] || `../${__dirname}/htdocs/`;

        let dests = Static.use(app, opt); //设置静态的虚拟目录。
        
        print(host, port, dests);

        return dests;

        
    },
};