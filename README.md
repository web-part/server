# @webpart/server

用于开发阶段的本地 web 服务器。

## 安装
``` bash
npm install @webpart/server
```

## 示例
``` javascript

const server = require('@webpart/server');

const config = {
    port: 'auto',       //必选，端口号。
    beginPort: 3001,    //当 port 为 `auto` 时，开始搜索的端口号。

    //可选。
    //要映射生成的静态虚拟目录。
    //支持一对多的关系，会根据目录的添加顺序查找所需的文件。
    statics: {
        '/': './htdocs/',
        '/htdocs': './htdocs/',
        '/build': './output/build/htdocs/',
        // '/test': [
        //     './a/',
        //     './b/',
        // ],
    },

    session: {
        file: './output/session.json',
    },

    api: {
        api: '/api',
        sse: '/api/sse',
        allowCrossOrigin: true,
        stat: require('./stat'),
    },

    //可选。
    //生成对应的二维码页面。
    qrcode: {
        path: '/qrcode',    //二维码页面的虚拟地址。
        size: 10,           //二维码图片的大小。
    },

    //可选。
    //代理规则。
    proxy: {
        '/api/': {
            target: 'http://your.target.com/',
            changeOrigin: true,
            pathRewrite: {
                '^/api/': '/',
            },
        },
    },
};


//创建服务器并开启。
server.start(config, function (app, info) {
    console.log('done.  info=', info);
});

```