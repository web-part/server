
;( function (
    top,
    parent,
    window, 
    document,
    location,
    localStorage,
    sessionStorage,
    console,
    history,
    setTimeout,
    setInterval,

    definejs,
    define, //注意这里

    Array, 
    Boolean,
    Date,
    Error,
    Function,
    Math,
    Number,
    Object,
    RegExp,
    String,
    undefined
) {

; (function (definejs) {
    let AppModule = definejs.require('AppModule');
    let define = window.define = AppModule.define;
    
    Object.assign(define, {
        'panel': definejs.panel,
        'view': definejs.view,
        'module': definejs.define,
        'data': definejs.data,
        'route': definejs.route,
        'proxy': definejs.proxy,
    });


    //业务端模块的默认配置。
    define.data([
        '/ModuleTree/Tree/Data',
        '/ModuleTree/Main/ModuleInfo/Base',
        '/ModuleTree/Main/Tree/Main',
        '/ModuleTree/Main/List/GridView',
    ], {
        none: '(launch)',
    });

    define.data({
        'Settings.Header': 'hide',
        'Settings.Language': 'chinese',
        'Settings.Theme': 'light',
    });


    // definejs 内部模块所需要的默认配置
    definejs.config({
        'API': {
            /**
            * API 接口 Url 的主体部分。
            */
            // url: 'http://localhost:8000/api/',
            // url: `http://localhost:${location.port}/api/`,
            url: `${location.origin}/api/`,
            base: 'api/',
        },

        'App': {
            name: `webpart-server-${location.port}`,
        },


        'Masker': {
            fadeIn: 200,
            fadeOut: 200,
        },

    });
    

})(window.definejs);





define('data.Sidebar', function (require, module, exports) {

    let list = [
        { language$name: { chinese: '首页', english: 'Home', }, icon: 'fas fa-home', view: 'Home', args: [], },
        { language$name: { chinese: '文件资源', english: 'Files', }, icon: 'fa fa-folder-open', view: 'FileList', args: [], },
        // { language$name: { chinese: '模块系统', english: 'Module Tree', }, icon: 'fa fa-sitemap', view: 'ModuleTree', args: [], },
        { language$name: { chinese: '模块系统', english: 'Module Tree', }, icon: 'fab fa-connectdevelop', view: 'ModuleTree', args: [], },
        { language$name: { chinese: 'html 系统', english: 'HTML Tree', }, icon: 'fa fa-sitemap', view: 'HtmlTree', args: [], },
        { language$name: { chinese: '日志', english: 'Logs', }, icon: 'fas fa-comment-dots', view: 'Log', args: [], },
        { language$name: { chinese: '写文档', english: 'Markdoc' }, icon: 'fa fa-edit', view: 'DocAdd', },
        { language$name: { chinese: '终端', english: 'Terminal', }, icon: 'fas fa-terminal', view: 'Terminal', args: [], },
        { language$name: { chinese: '常用工具', english: 'Tools', }, icon: 'fas fa-tools', view: 'Tool', args: [], },
        { language$name: { chinese: '代理', english: 'Proxy', }, icon: 'fas fa-network-wired', view: 'Proxy', args: [], },
        { language$name: { chinese: '偏好设置', english: 'Settings', }, icon: 'fas fa-cogs', view: 'Setting', args: [], },
        { language$name: { chinese: '帮助手册', english: 'Help', }, icon: 'fa fa-question-circle', view: 'Help', args: [], },
    ];

    
    return list;


    
});



define('GridView/Panel/Data', function (require, module, exports) {
    

    return {
        //对总列表数据进行分页。
        //仅用于组件内部分页的情况。
        get(list, { no, size, }) {
            no = no - 1;  //此处的页码从 0 开始。

            let beginIndex = no * size;
            let endIndex = beginIndex + size;
            let items = list.slice(beginIndex, endIndex);

            return items;
        },
    };
    

});





define('GridView/Panel/Header', function (require, module, exports) {
    const Panel = require('@definejs/panel');
    const Table = require('Table');
    const TableResizer = require('TableResizer');


    return function (meta) {
        let panel = new Panel(`[data-panel="${meta.id}/Header"]`);
        let table = null;
        let resizer = null;
        
        panel.on('init', function () {

            table = exports.table = new Table({
                'container': panel.$,
                'fields': meta.fields,
                'class': '',    //去掉默认的 Table 类名，可避免一些样式冲突。
            });

            resizer = exports.resizer = new TableResizer({
                'container': `#${table.id}`,
                'fields': meta.fields,
            });

            
            table.on('process', {
                'caption': function (column, info) {
                    column.class += column.field.sort ? ' sortable' : '';

                    let values0 = meta.emitter.fire('process', 'caption', column.name, [column, info]);
                    let values1 = meta.emitter.fire('process', 'caption', [column, info]);

                    let html0 = values0.slice(-1)[0]; //以最后一个为准。
                    let html1 = values1.slice(-1)[0]; //以最后一个为准。

                    if (html0 !== undefined) {
                        return html0;
                    }

                    if (html1 !== undefined) {
                        return html1;
                    }
                },
            });
            

            table.on('click', {
                'caption': function (column, info) {
                    meta.emitter.fire('click', 'caption', column.name, [column, info]);
                    meta.emitter.fire('click', 'caption', [column, info]);
                    
                    meta.Sort.render(column, info);
                },
            });
           


            resizer.on({
                'dblclick': function (column, info) {
                    resizer.set(info.index, column.field.width);
                },

                'change': function (column, info) {
                    panel.fire('resize', [column, info]);
                },
            });

        });


        /**
        * 渲染。
        */
        panel.on('render', function () {
            table.render([]);
            resizer.render();
        });

        return panel.wrap({
            exports,

            get() {
                let w = table.$.width();
                return w + 15;
            },

        });
    };



});


define('GridView/Panel/Main', function (require, module, exports) {
    const Panel = require('@definejs/panel');
    const Table = require('Table');
    const TableResizer = require('TableResizer');

    return function (meta) {
        let panel = new Panel(`[data-panel="${meta.id}/Main"]`);
        let table = null;
        let resizer = null;

        function make(item, info) {
          
            let args = [item, {
                ...info,
                'page': meta.page,
            }];

            return args;
        }


        //初始阶段适合用来绑定事件。
        panel.on('init', function () {

            let fields = meta.fields.map((field) => {
                return {
                    ...field,
                    dragable: false, //表体不需要生成用于拖拽的 html。
                };
            });

            tpl = panel.template();

            table = exports.table = new Table({
                'container': panel.$,
                'fields': fields,
                'header': false,
                'meta': true,
            });

            resizer = exports.resizer = new TableResizer({
                'container': `#${table.id}`,
                'fields': fields,
                'class': '',  //这里要去掉默认的 `TableResizer` 类名，可避免一些样式冲突。
            });


            table.on('process', {
                'row': function (row, info) {
                    let args = make(row, info);
                    meta.emitter.fire('process', 'row', args);
                },
                'cell': {
                    '': function (cell, info) {
                        let args = make(cell, info);
                        let values0 = meta.emitter.fire('process', 'cell', cell.name, args);
                        let values1 = meta.emitter.fire('process', 'cell', args);
                        let html0 = values0.slice(-1)[0]; //以最后一个为准。
                        let html1 = values1.slice(-1)[0]; //以最后一个为准。

                        if (html0 !== undefined) {
                            return html0;
                        }

                        if (html1 !== undefined) {
                            return html1;
                        }
                    },
                },
            });

            table.on('click', {
                '': function (info) {
                    let args = make(table, info);
                    meta.emitter.fire('click', 'table', args);
                },

                'body': function (info) {
                    let args = make(table, info);
                    meta.emitter.fire('click', 'body', args);
                },

                'row': function (row, info) {
                    let args = make(row, info);
                    meta.emitter.fire('click', 'row', `${info.no}`, args);
                    meta.emitter.fire('click', 'row', args);
                },

                'cell': function (cell, info) {
                    let args = make(cell, info);
                    let { element, event, } = info;
                    let { click, } = cell.column.field; //如 { click: '[data-cmd]', }

                    if (click) {
                        let target = $(element).find(click).get(0); //可能为空。

                        //单元格里面的子元素触发的。
                        //符合监听的元素选择规则，则触发。
                        if (target && target.contains(event.target)) {
                            meta.emitter.fire('click', 'cell', cell.name, click, args);
                        }
                    }


                    meta.emitter.fire('click', 'cell', cell.name, args);
                    meta.emitter.fire('click', 'cell', args);
                },
            });

        });



        //渲染。
        panel.on('render', function (list) {
            table.render(list);
            if (list.length > 0) {
                resizer.render();
            }
        });


        return panel.wrap({
            exports,

            setWidth(index, width) {
                resizer.set(index, width);
            },
        });
    };
});


define('GridView/Panel/Pager', function (require, module, exports) {
    const Panel = require('@definejs/panel');
    const Pager = require('Pager');

    return function (meta) {
        let panel = new Panel(`[data-panel="${meta.id}/Pager"]`);
        let pager = null;


        //初始阶段适合用来绑定事件。
        panel.on('init', function () {
            pager = exports.pager = new Pager({
                'container': panel.$,
            });

            pager.on({
                'change': function (info) {
                    panel.fire('change', [info]);
                },
            });

        });



        //渲染。
        panel.on('render', function (data) {
            pager.render(data);
            panel.show();
        });


        return panel.wrap({
            exports,
        });
    };

});


define('GridView/Template/Class', function (require, module, exports) {
    
    return {
        stringify(data) {
            if (Array.isArray(data)) {
                data = data.join(' ');
            }

            if (!data) {
                return '';
            }

            return `class="${data}"`;
        },
    };
});
define('GridView/Template/DataSet', function (require, module, exports) {

    return {
        stringify(data) {
            if (!data) {
                return '';
            }

            let list = Object.keys(data).map((key) => {
                let value = data[key];

                return `data-${key}="${value}"`;
            });

            return list.join(' ');
        },
    };
});
define('GridView/Template/Style', function (require, module, exports) {
    const Style = require('@definejs/style');

    return {
        stringify(data) {
            if (!data) {
                return '';
            }

            data = Style.stringify(data);
            
            if (!data) {
                return '';
            }

            return `style="${data}"`;
        },
    };
});

/**
* 
*/
define('GridView/Meta', function (require, module, exports) {
    const IDMaker = require('@definejs/id-maker');
   

    let idmaker = new IDMaker('GridView');




    return {

        create: function (config, others) {
            let id = config.id || idmaker.next();

            let meta = {
                'id': id,                           //会生成到 DOM 中。
                'container': config.container,      //容器。
                'template': config.template,        //使用的 html 模板的对应的 DOM 节点选择器。
                'class': config.class,              //css 类名。
                'style': config.style,              //css 样式。
                'dataset': config.dataset,          //自定义数据集，会在 html 中生成 `data-` 的自定义属性。
                'nodata': config.nodata,
                'fields': config.fields,

                'this': null,
                'emitter': null,
                'tpl': null,
                'panel': null,
                'page': null,   //如果有值，则表示分页。 为了方便在 `process` 事件中传出去，以让外界知道当前的分页信息。
                'list': [],     //调用 render 时传入的数据列表。

                'Sort': null,

            };


            Object.assign(meta, others);



            return meta;

        },


    };

});





define('GridView/Panel', function (require, module, exports) {
    const Panel = require('@definejs/panel');

    return {
        create(meta) {
            const Header = module.require('Header')(meta);
            const Main = module.require('Main')(meta);
            const Pager = module.require('Pager')(meta);
            const Data = module.require('Data');

            let panel = new Panel(`[data-panel="${meta.id}"]`);

            let $meta = {
                page: null, //分页信息。 如果指定，则进行分页。
                all: null,  //全部列表数据。 如果指定，则在组件内部进行分页。
            };


            //初始阶段适合用来绑定事件。
            panel.on('init', function () {

                Header.on({
                    'resize': function (column, info) {
                        let width = info.sum + 15;
                        let args = [column, info];

                        panel.$.width(width);
                        Main.setWidth(info.index, column.width);

                        meta.emitter.fire('resize', column.name, args);
                        meta.emitter.fire('resize', args);
                    },
                });


                Pager.on({
                    'change': function (page) {
                        //为了方便在 `process` 事件中传出去，以让外界知道当前的分页信息。
                        meta.page = page; 

                        if ($meta.all) { //内部分页。
                            let values = meta.emitter.fire('page', [page, $meta.all]);
                            let list = values.slice(-1)[0] || Data.get($meta.all, page);

                            Main.render(list);
                        }
                        else { //外部分页。
                            //方便外部重新 render() 时可以不传参数 page。
                            $meta.page = page;    
                            panel.fire('page', [page, null]);
                        }
                    },
                });

                //表头只需要渲染一次，放此处即可。
                Header.render();

            });



            //渲染。
            panel.on('render', function (list, page) {
                //第二个是方便在分页时可以不传参数 page。
                page = page || $meta.page;

                //重置一下，避免受上次 render() 的影响。
                $meta.page = null;
                $meta.all = null;

                //指定了 page，则进行分页。
                //未指定 total，则在组件内部进行分页。
                if (page && page.total === undefined) {
                    page = { ...page, };
                    $meta.all = list;            //此时 list 就是全部的列表数据。
                    page.total = list.length;   //        
                    list = Data.get(list, page);//截取分页对应的列表片段。
                }

               
                meta.page = page;
                Main.render(list);
                Main.$.toggleClass('no-pager', !page);
                panel.$.toggleClass('no-data', !list.length);

                //只有指定了才分页。
                if (page) {
                    Pager.render(page);
                }
                


                let width = Header.get();
                panel.$.width(width);

                meta.emitter.fire('render');
            });


            return panel.wrap({
                Header,
                Main,
                Pager,
            });

        },
    };

});


define('GridView/Sort', function (require, module, exports) {
    const $ = require('$');

    function switchStatus(status) {
        //未设定 --> 降序
        if (!status) { 
            return 'down';
        }

        //降序 --> 升序
        if (status == 'down') { 
            return 'up';
        }
        
        //升序 --> 未设定
        return '';
    }

    
    return {
        create(meta) {

            let exports = {
                column: null,   //当前处于排序的列。
                id$status: {},  //每一列对应的排序状态。

                sort(column, status, list) {
                    let value = status == 'down' ? -1 : 1;
                    let { name, } = column;

                    //复制一份。
                    list = [...list];

                    list.sort(function (a, b) {
                        let args = [{ status, column, a, b, list, }];
                        let values0 = meta.emitter.fire('sort', name, args);
                        let v0 = values0.slice(-1)[0]; //以最后一个为准。

                        if (typeof v0 == 'number') {
                            return v0;
                        }
                        
                        //v0 = { a, b, };
                        if (typeof v0 == 'object') {
                            a = v0.a;
                            b = v0.b;
                        }
                        else {
                            a = a[name];
                            b = b[name];
                        }
                        
                        return a > b ? value : (a < b ? -value : 0);
                    });

                    let values1 = meta.emitter.fire('sort', [{ status, column, list, }]);
                    let v1 = values1.slice(-1)[0]; //以最后一个为准。

                    if (Array.isArray(v1)) {
                        list = v1;
                    }

                    return list;
                },


                init(list) {
                    let { column, } = exports;

                    if (column) {
                        let status = exports.id$status[column.id];
                        list = exports.sort(column, status, list);
                    }

                    return list;
                },

                render(column, info) {
                    if (!column.field.sort) {
                        return;
                    }

                    console.log(column, info);

                    let { id, } = column;
                    let { event, columns, } = info;

                    if (event.target.id != id) {
                        return;
                    }

                    let { list, } = meta;
                    let status = switchStatus(exports.id$status[id]);

                    columns.forEach(({ id, }) => {
                        $(`#${id}`).removeClass('sort-up sort-down');
                    });

                    if (status) {
                        $(`#${id}`).addClass(`sort-${status}`);
                        list = exports.sort(column, status, list);
                        exports.column = column;
                    }
                    else { 
                        exports.column = null;
                    }

                    exports.id$status[id] = status;

                    meta.panel.render(list);
                },
            };

            return exports;
        },
    };



});


define('GridView/Template', function (require, module, exports) {
    const Template = require('@definejs/template');
    const Class = module.require('Class');
    const DataSet = module.require('DataSet');
    const Style = module.require('Style');



    return {
        create(meta) {
            let tpl = new Template(meta.template);

            tpl.process({
                //填充表格。
                '': function () {
                    this.fix(['class', 'dataset', 'style',]);

                    let cssClass = Class.stringify(meta.class);
                    let dataset = DataSet.stringify(meta.dataset);
                    let style = Style.stringify(meta.style);

                    return {
                        'id': meta.id,
                        'class': cssClass,
                        'dataset': dataset,
                        'style': style,
                        'nodata': meta.nodata,
                    };
                },
               
            });

            return tpl;

        },

    };
});

define('GridView.defaults', {
    //组件的 id，会生成到 DOM 元素中。
    //一般情况下不需要指定，组件内部会自动生成一个随机的。
    //如果自行指定，请保证在整个 DOM 树中是唯一的。
    id: '',

    container: '',
    template: '#tpl-GridView', //
    class: 'GridView',         //css 类名。
    style: {},
    dataset: {},
    nodata: '暂无数据',
    fields: [],                 


    //是否公开 meta 对象。
    //如果指定为 true，则外部可以通过 this.meta 来访问。
    //在某些场合需要用到 meta 对象，但要注意不要乱动里面的成员。
    meta: false,
  

    
});



/**
* 带有翻页、固定表头的列表表格展示器组件。
*/
define('GridView', function (require, module, exports) {
    const $ = require('$');
    const Emitter = require('@definejs/emitter');
    
    const Meta = module.require('Meta');
    const Template = module.require('Template');
    const Panel = module.require('Panel');
    const Sort = module.require('Sort');
    



    let mapper = new Map();


    class GridView {
        constructor(config) {
            config = Object.assign({}, exports.defaults, config);

            let emitter = new Emitter(this);
            
            let meta = Meta.create(config, {
                'emitter': emitter,         //
                'this': this,               //方便内部使用。
            });

            meta.tpl = Template.create(meta);
            meta.Sort = Sort.create(meta);
            
            mapper.set(this, meta);

            //指定了公开 meta 对象。
            if (config.meta) {
                this.meta = meta;
            }

            this.id = meta.id;
            this.$ = meta.$;
        }


        /**
        * 渲染 HTML 到容器中以生成 DOM 节点。
        * @param {Array} list 要渲染的列表数据。 
        * @param {Object} page 分页信息。 
        *   首次如果指定，则进行分页；否则不生成分页器。
        *   page = {
        *       no: 1,          //当前页码。
        *       size: 20,       //每页大小，即每页显示多少条记录。
        *       total: 1250,    //总的记录数。 如果不指定此字段，则参数 list 就当作是全部列表数据，并在组件内部进地分页。
        *   };
        * @returns 
        */
        render(list, page) {
            let meta = mapper.get(this);

            //首次渲染。
            if (!meta.panel) {
                let html = meta.tpl.fill({});

                $(meta.container).html(html);
                meta.panel = Panel.create(meta);

                this.$ = meta.panel.$;
            }

            list = meta.Sort.init(list);

            meta.list = list;
            meta.panel.render(list, page);
           
        }

        /**
        * 绑定事件。
        */
        on(...args) {
            let meta = mapper.get(this);
            meta.emitter.on(...args);
        }




    }




    module.exports = exports = GridView;
    exports.defaults = require('GridView.defaults');

    
});




define('$', function (require, module, exports) {
    return window.jQuery;
});


define('MenuTree/Files/Init', function (require, module, exports) {
    const Tree = require('@definejs/tree');

    function add(id$list, id, value) {
        let list = id$list[id] || new Set();

        if (value !== undefined) {
            list.add(value);
        }

        id$list[id] = list;
    }


    function parseFiles(files, { dir$dirs ,dir$files,}) { 

        let tree = new Tree(files, '/');

        tree.each(function (node, index) {
            let { nodes, keys, parent, } = node;
            let id = keys.join('/');
            let pid = parent.isRoot ? '' : parent.keys.join('/');
            let name = keys.slice(-1)[0];

            //父节点。
            pid = pid + '/';

            //当前节点是一个文件。
            if (nodes.length == 0) {
                add(dir$files, pid, name);
                return;
            }

            //当前节点是一个目录。
            id = id + '/';
            add(dir$files, id); //要给每个目录都创建对应的列表，即使为空。
            add(dir$dirs, id);  //要给每个目录都创建对应的列表，即使为空。
            add(dir$dirs, pid, name);
        });


    }

    function parseDirs(dirs, { dir$dirs, dir$files, }) {

        //标准化。
        dirs = dirs.map((dir) => {
            dir = dir.replace(/\\/g, '/');  //把 '\' 换成 '/'。
            dir = dir.replace(/\/+/g, '/'); //把多个 '/' 合成一个。
            
            //此处需要去掉后缀 `/`。
            if (dir.endsWith('/')) {
                dir = dir.slice(0, -1);
            }

            return dir;
        });
        

        let tree = new Tree(dirs, '/');

        tree.each(function (node, index) {
            let { nodes, keys, parent, } = node;
            let id = keys.join('/');
            let pid = parent.isRoot ? '' : parent.keys.join('/');
            let name = keys.slice(-1)[0];

            pid = pid + '/';
            id = id + '/';

            add(dir$files, id);
            add(dir$dirs, id);
            add(dir$dirs, pid, name);
        });

    }
  



    return {
        parse({ dirs, files, }) {
            dirs = dirs || [];
            files = files || [];

            let dir$dirs = {};
            let dir$files = {};

            parseFiles(files, { dir$dirs, dir$files, });
            parseDirs(dirs, { dir$dirs, dir$files, });


            Object.entries(dir$dirs).forEach(function ([dir, dirs]) {
                dir$dirs[dir] = [...dirs].sort(); //让外面排序。
            });

            Object.entries(dir$files).forEach(function ([dir, files]) {
                dir$files[dir] = [...files].sort(); //让外面排序。
            });


            return { dir$dirs, dir$files, };
        },
    };

});


define('MenuTree/Files/List', function (require, module, exports) {


    return exports = {
        /**
        * 根据给定的目录名，递归搜索子目录和文件列表，组装成符合菜单树的数据结构。
        *   dir: '',            //要组装的目录名称。 须以 `/` 结尾。
        *   opt = {
        *       dir$files: {},  //某个目录对应的文件列表（仅当前层级，不包括子目录的）。
        *       dir$dirs: {},   //某个目录对应的子目录列表（仅当前层级，不包括子目录的）。
        *   };
        */
        make(dir, { dir$dirs, dir$files, }) {
            let dirs = dir$dirs[dir];   //目录短名称列表。

            let list = dirs.map(function (item) {
                let sdir = `${dir == '/' ? '' : dir}${item}/`;
                let list = exports.make(sdir, { dir$dirs, dir$files, }); //递归。
                let files = dir$files[sdir]; //文件短名称列表。

                files = files.map(function (file) {
                    let id = `${sdir}${file}`;//完整名称。

                    return {
                        'type': 'file',
                        'name': file,
                        'id': id,
                        'data': {},
                    };
                });

                list = [...list, ...files];


                return {
                    'type': 'dir',
                    'name': item,
                    'id': sdir,
                    'data': {},
                    'list': list,
                };
            });

            return list;
        },

        //对树型结构的列表进行每项迭代。
        each(list, fn, depth = 0) { 
            list.forEach((item) => {
                fn(item, depth);

                let { list, } = item;

                if (Array.isArray(list)) {
                    exports.each(list, fn, depth + 1);
                }

            });
        },
    };

});
define('MenuTree/Template/Class', function (require, module, exports) {
    
    return {
        stringify(data) {
            if (Array.isArray(data)) {
                data = data.join(' ');
            }

            if (!data) {
                return '';
            }

            return `class="${data}"`;
        },
    };
});
define('MenuTree/Template/DataSet', function (require, module, exports) {

    return {
        stringify(data) {
            if (!data) {
                return '';
            }

            let list = Object.keys(data).map((key) => {
                let value = data[key];

                return `data-${key}="${value}"`;
            });

            return list.join(' ');
        },
    };
});
define('MenuTree/Template/Style', function (require, module, exports) {
    const Style = require('@definejs/style');

    return {
        stringify(data) {
            if (!data) {
                return '';
            }

            data = Style.stringify(data);
            
            if (!data) {
                return '';
            }

            return `style="${data}"`;
        },
    };
});

define('MenuTree/Data', function (require, module, exports) {
    const IDMaker = require('@definejs/id-maker');

    let idmaker = new IDMaker('MenuTree');


    function make(list, parent, context, fn) {
        if (!list) {
            return [];
        }
        

        list = list.map((item) => {
            let id = item.id;

            //针对非字符串类型的 id，尝试转成 json 字符串。
            if (typeof id != 'string') {
                id = JSON.stringify(id);

                //如果转换后依然不是字符串，则自动分配。
                if (typeof id != 'string') {
                    id = idmaker.next('item');
                }
            }

            context.cid++;

            let node = {
                'id': id,
                'cid': context.cid,
                'level': 0,
                'type': item.type,
                'name': item.name,
                'open': item.open,
                'dirIcon': item.dirIcon,
                'fileIcon': item.fileIcon,
                'style': item.style,
                'dataset': item.dataset,
                'data': item.data || {},
                'list': [],
                'parent': parent || null,
                'parents': [],      //向上追溯所有的父节点。
                'children': [],     //全部子节点，包括直接的和间接的。

            };

            node.list = make(item.list, node, context, fn);


            //向上追溯找出所有的父节点。
            exports.trace(node, function (parent) {
                parent.children.push(node);
                node.parents.push(parent);
            });

            node.level = node.parents.length;

            node.children.sort((a, b) => {
                return a.cid - b.cid;
            });
            

            fn(node);

            return node;

        });

        return list;
    }


    return exports = {

        make(list) {
            let id$item = {};
            let cid$item = {};
            let items = [];
            let context = { cid: 0, };

            list = make(list, null, context, function (node) {
                id$item[node.id] = node;
                cid$item[node.cid] = node;
                items.push(node);
            });
            

            let data = { list, items, id$item, cid$item, };

            return data;

        },


        /**
        * 向上追溯指定节点的所有父节点直到根节点，迭代执行指定的回调函数。
        * @param {Object} node 树节点。
        * @param {function} fn 要执行的回调函数。
        */
        trace(node, fn) {
            let parent = node.parent;

            if (!parent) {
                return;
            }

            fn(parent);

            exports.trace(parent, fn);
        },


        each(node, fn) { 
            fn(node);

            node.list.forEach((node, index) => {
                exports.each(node, fn);
            });
           
        },
       
    };

});



define('MenuTree/Events', function (require, module, exports) {
    const $ = require('$');

    function toggleOpen(meta, item, $li) {
        let $icon = $li.find('> div > i[data-cmd="icon-dir"]');
        let $ul = $li.children('ul');
        let open = item.open = !item.open;
        let cmd = open ? 'open' : 'close';
        let dirIcon = item.dirIcon || meta.dirIcon;

        if (open) {
            $icon.removeClass(dirIcon.close);
            $icon.addClass(dirIcon.open);
            $ul.slideDown('fast');

        }
        else {
            $icon.removeClass(dirIcon.open);
            $icon.addClass(dirIcon.close);
            $ul.slideUp('fast');
        }

        $li.toggleClass('open', open);
        meta.emitter.fire(cmd, [item]);

    }


    function activeItem(meta, item, $li) {
        let { current, } = meta;

        if (current) {
            meta.$.find(`[data-id="${current.id}"]`).removeClass('on'); //灭掉旧的。
        }

        $li.addClass('on');
        meta.current = item;
    }




    return {
        bind(meta) {

            //点击菜单项。
            meta.$.on('click', '[data-cmd="item"]', function (event) {
                let li = this.parentNode;
                let { id, } = li.dataset;
                let item = meta.id$item[id];
                let isCurrent = item === meta.current;  //是否为当前已激活的节点。
                let isDir = item.type == 'dir';       //是否为目录。
                let $li = $(li);

                if (meta.allowActiveDir) { //允许激活目录项。

                    activeItem(meta, item, $li);

                    if (isDir) { //点击的是一个目录。
                        if (isCurrent) {
                            toggleOpen(meta, item, $li);
                        }
                        else { //点击的不是当前项。
                            if (!item.open) {
                                toggleOpen(meta, item, $li);
                            }

                            meta.emitter.fire('item', [item]);
                        }
                    }
                    else { //点击的是一个文件。
                        meta.emitter.fire('item', [item]);
                    }
                }
                else { //不允许激活目录项。
                    if (isDir) { //点击的是一个目录。
                        toggleOpen(meta, item, $li);
                    }
                    else { //点击的是一个文件。
                        activeItem(meta, item, $li);
                        meta.emitter.fire('item', [item]);
                    }
                }

                //需要延迟一下。
                setTimeout(function () { 
                    li.scrollIntoViewIfNeeded();
                }, 100);

                

            });



            //点击目录的图标。
            meta.$.on('click', '[data-cmd="icon-dir"]', function (event) {
                event.stopPropagation();

                let li = this.parentNode.parentNode;
                let { id, } = li.dataset;
                let item = meta.id$item[id];
                let $li = $(li);


                toggleOpen(meta, item, $li);


            });
        },

    };
});


define('MenuTree/Files', function (require, module, exports) {
    const Init = module.require('Init');
    const List = module.require('List');


    return {
        parse(data, fnEach) {
            if (Array.isArray(data)) {
                return { list: data, };
            }

            let { root, dirs, files, } = data; //三个字段都是可选的。
            let list = [];

            if (typeof root == 'string') {
                root = {
                    id: '/',
                    type: 'dir',
                    name: root,
                    open: true,
                    data: {},
                    list: [],
                };
            }


            if (dirs || files) {
                let { dir$dirs, dir$files, } = Init.parse({ dirs, files, });

                //根目录的文件列表。
                let roots = dir$files['/'].map(function (file) {
                    return {
                        'type': 'file',
                        'name': file,
                        'id': file,
                        'data': {},
                    };
                });

                list = List.make('/', { dir$dirs, dir$files, });
                list = [...list, ...roots,];
            }

            if (root) {
                root.list = list;
                root.data = root.data || {}; //这个是必须的。
                list = [root];
            }


            if (fnEach) {
                List.each(list, fnEach);
            }
            
         
            return list;
            

            
        },
    };

});

/**
* 
*/
define('MenuTree/Meta', function (require, module, exports) {
    const IDMaker = require('@definejs/id-maker');

    let idmaker = new IDMaker('MenuTree');



    return {

        create(config, others) {
            let id = idmaker.next();
            
            let meta = {
                'id': id,                           //实例 id，会生成到 DOM 元素中。

                'container': config.container,      //表格的容器。
                'template': config.template,        //使用的 html 模板的对应的 DOM 节点选择器。
                'class': config.class,              //css 类名。
                'style': config.style,              //css 样式。
                'dataset': config.dataset,          //自定义数据集，会在 html 中生成 `data-` 的自定义属性。
                'dirIcon': config.dirIcon,
                'fileIcon': config.fileIcon,
                'allowActiveDir': config.allowActiveDir,    //

                '$': null,
                'this': null,
                'emitter': null,
                'tpl': null,

               
                'list': [],         //根节点列表。
                'items': [],        //list 的一维数组。
                'id$item': {},      //id 作为主键关联到项。
                'cid$item': {},     //cid 作为主键关联到项。

                'current': null,       //当前激活的节点 item。
            };


            Object.assign(meta, others);



            return meta;
           
        },


    };
    
});





define('MenuTree/Template', function (require, module, exports) {
    const Template = require('@definejs/template');
    const Class = module.require('Class');
    const DataSet = module.require('DataSet');
    const Style = module.require('Style');
   





    return {
        create(meta) {
           
            let tpl = new Template(meta.template);

            function fill(item, index) {
                let { id, type, list, } = item;

                //未指定类型，则自动推断。
                if (!type) {
                    type = list.length > 0 || id.endsWith('/') ? 'dir' : 'file';
                }

                let html = tpl.fill('root', type, item);

                return html;
            }

            function getName(item) {
                //让外面有机会自定义要展示的 name。
                let names = meta.emitter.fire('fill', 'name', [item]);
                let name = names.slice(-1)[0];

                if (name === undefined) {
                    name = item.name;
                }

                return name;
            }

            tpl.process({
                '': function () {

                    this.fix(['class', 'dataset', 'style',]);

                    let cssClass = Class.stringify(meta.class);
                    let dataset = DataSet.stringify(meta.dataset);
                    let style = Style.stringify(meta.style);
                    let roots = this.fill('root', meta.list);

                    return {
                        'id': meta.id,
                        'class': cssClass,
                        'dataset': dataset,
                        'style': style,
                        'roots': roots,
                    };
                   
                },

                'root': {
                    '': function (item, index) {
                        
                        let root = fill(item);

                        return {
                            'root': root,
                        };
                        
                    },

                    'dir': function (item) {
                        this.fix(['dataset', 'style',]);

                        let { current, } = meta;
                        let { open, id, list, } = item;
                        let items = list.map(fill);
                        let dirIcon = item.dirIcon || meta.dirIcon;
                        let style = Style.stringify(item.style);
                        let dataset = DataSet.stringify(item.dataset);

                        if (typeof dirIcon == 'string') {
                            dirIcon  = {
                                'close': dirIcon,
                                'open': dirIcon,
                            };
                        }

                        let name = getName(item);

                        return {
                            'id': id,
                            'name': name || '',
                            'open': open ? 'open' : '',
                            'on': current && id == current.id ? 'on' : '',
                            'empty': list.length > 0 ? '' : 'empty',
                            'style': style,
                            'dataset': dataset,
                            'ul-display': open ? '' : 'display: none;',
                            'icon': open ? dirIcon.open : dirIcon.close,
                            'items': items,
                        };
                    },

                    'file': function (item, index) {
                        this.fix(['dataset', 'style',]);

                        let { current, } = meta;
                        let { id, fileIcon, } = item;

                        let name = getName(item);
                        let style = Style.stringify(item.style);
                        let dataset = DataSet.stringify(item.dataset);


                        return {
                            'id': id,
                            'name': name,
                            'icon': fileIcon || meta.fileIcon,
                            'on': current && id == current.id ? 'on' : '',
                            'style': style,
                            'dataset': dataset,
                        };
                    },
                },
            });




            return tpl;

        },

    };
});

define('MenuTree.defaults', {
    //组件的 id，会生成到 DOM 元素中。
    //一般情况下不需要指定，组件内部会自动生成一个随机的。
    //如果自行指定，请保证在整个 DOM 树中是唯一的。
    id: '',

    container: '',
    template: '#tpl-MenuTree', //
    class: 'MenuTree',         //css 类名。
    style: {},
    dataset: {},
    //是否公开 meta 对象。
    //如果指定为 true，则外部可以通过 this.meta 来访问。
    //在某些场合需要用到 meta 对象，但要注意不要乱动里面的成员。
    meta: false,

    //是否允许激活目录项。
    //如果指定为 false，则目录项只能给展开或收起，而不能被激活。
    allowActiveDir: true,

    //目录图标。
    dirIcon: {
        close: 'fa fa-folder',
        open: 'fa fa-folder-open',
    },

    //文件图标。
    fileIcon: 'fas fa-file-alt',

});

/**
* 菜单树。
*/
define('MenuTree', function (require, module, exports) {
    const Emitter = require('@definejs/emitter');
    const $ = require('$');
    const Data = module.require('Data');
    const Events = module.require('Events');
    const Meta = module.require('Meta');
    const Template = module.require('Template');
    const Files = module.require('Files');

   
    const mapper = new Map();



    class MenuTree {
        /**
        * 构造器。
        * @param {*} config 
        */
        constructor(config) {
            config = Object.assign({}, exports.defaults, config);

            let emitter = new Emitter(this);
            
            let meta = Meta.create(config, {
                'this': this,
                'emitter': emitter,
            });

            meta.tpl = Template.create(meta);
            mapper.set(this, meta);

            //指定了公开 meta 对象。
            if (config.meta) {
                this.meta = meta;
            }

            this.id = meta.id;
        }

        each(fn) { 
            let meta = mapper.get(this);
            meta.list.forEach((node) => {
                Data.each(node, fn);
            });
        }

        /**
        * 渲染 HTML 到容器中以生成 DOM 节点。
        * @returns
        */
        render(list = []) {
            let meta = mapper.get(this);

            //已渲染。
            if (meta.$) {
                if (list.length > 0) {
                    this.update(list);
                }

                return;
            }

            //首次渲染。
            //data = { list, items, id$item, cid$item, };
            let data = Data.make(list);
            Object.assign(meta, data);
            

            let html = meta.tpl.fill({}); //填充全部。

            $(meta.container).html(html);
            meta.$ = this.$ = $(`#${meta.id}`);
            Events.bind(meta);

        }

        /**
        * 更新数据。
        */
        update(list) {
            let meta = mapper.get(this);

            //data = { list, items, id$item, cid$item, };
            let data = Data.make(list);
            Object.assign(meta, data);


            let html = meta.tpl.fill('root', meta.list);

            meta.$.html(html);
        }

        /**
        * 打开指定的节点。
        * 这会连同它的所有父节点也一起展开。
        * 已重载 open(id);
        * 已重载 open(cid);
        */
        open(id) {
            let meta = mapper.get(this);
            let item = null;

            if (typeof id == 'string') {
                item = meta.id$item[id];

                if (!item) {
                    throw new Error(`不存在 id 为 '${id}' 的节点`);
                }
            }
            else if (typeof id == 'number') {
                item = meta.cid$item[id];
                if (!item) {
                    throw new Error(`不存在 cid 为 '${id}' 的节点`);
                }
            }
            else {
                throw new Error(`无法识别的参数 id。`);
            }

            item.open = true;

            //向父节点追溯，更改 open 状态。
            //即：只要当前节点是打开状态，则它所有的父节点都要设置为打开状态。
            Data.trace(item, function (parent) {
                parent.open = true;
            });

            this.render(meta.list);

            //是一个目录，则先假设是折叠的。
            if (item.list.length > 0) {
                item.open = false;
            }

            let $li = item.$ = item.$ || meta.$.find(`li[data-id="${item.id}"]`);

            $li.find(`>[data-cmd="item"]`).trigger('click');

        }

        /**
        * 绑定事件。
        */
        on(...args) {
            let meta = mapper.get(this);
            meta.emitter.on(...args);
        }

        

    }

    //静态方法。
    MenuTree.parse = Files.parse;


    module.exports = exports = MenuTree;
    exports.defaults = require('MenuTree.defaults');

});
define('Pager/Template/Class', function (require, module, exports) {
    
    return {
        stringify(data) {
            if (Array.isArray(data)) {
                data = data.join(' ');
            }

            if (!data) {
                return '';
            }

            return `class="${data}"`;
        },
    };
});
define('Pager/Template/DataSet', function (require, module, exports) {

    return {
        stringify(data) {
            if (!data) {
                return '';
            }

            let list = Object.keys(data).map((key) => {
                let value = data[key];

                return `data-${key}="${value}"`;
            });

            return list.join(' ');
        },
    };
});


define('Pager/Template/Regions', function (require, module, exports) {
    const $Array = require('@definejs/array');

    /**
    * 根据总页数和当前页计算出要填充的区间。
    * @param {number} maxNo 总页数。
    * @param {number} no 当前激活的页码。
    * @return {Array} 返回一个区间描述的数组。
    */
    function get({ maxNo, no, }) {
        //10 页以内。
        if (maxNo <= 10) {
            return [{ 'from': 1, 'to': maxNo, 'more': false, }];
        }

        //超过 10 页。


        if (no <= 3) {
            return [{ 'from': 1, 'to': 5, 'more': true, }];
        }

        if (no <= 5) {
            return [{ 'from': 1, 'to': no + 2, 'more': true, }];
        }

        if (no >= maxNo - 1) {
            return [
                { 'from': 1, 'to': 2, 'more': true, },
                { 'from': maxNo - 5, 'to': maxNo, 'more': false, },
            ];
        }

        return [
            { 'from': 1, 'to': 2, 'more': true, },
            { 'from': no - 2, 'to': no + 2, 'more': no + 2 != maxNo, },
        ];
    }

    return {
        /**
        * 根据总页数和当前页计算出要填充的区间。
        * @param {number} maxNo 总页数。
        * @param {number} no 当前激活的页码。
        * @return {Array} 返回一个区间数组。
        */
        make({ maxNo, no, }) {
            let list = get({ maxNo, no, });

            list = list.map((item) => {
                let { from, to, more, } = item;
                let list = $Array.pad(from, to + 1);

                return { list, more, };
            });

            return list;

        },
    };




});


define('Pager/Template/Style', function (require, module, exports) {
    const Style = require('@definejs/style');

    return {
        stringify(data) {
            if (!data) {
                return '';
            }

            data = Style.stringify(data);
            
            if (!data) {
                return '';
            }

            return `style="${data}"`;
        },
    };
});


define('Pager/Events', function (require, module, exports) {

    
    return {

        bind: function (meta) {
            
            function jump() {
                let txt = document.getElementById(meta.txtId);
                let no = +txt.value;

                if (no != meta.no) {
                    meta.this.to(no);
                }

            }

            //点击上一页。
            meta.$.on('click', '[data-cmd="prev"]', function () {
                meta.this.jump(-1);
            });

            //点击页码。
            meta.$.on('click', '[data-no]', function () {
                let { no, } = this.dataset;
                no = Number(no);

                if (no != meta.no) {
                    meta.this.to(no);
                }
            });

            //点击下一页。
            meta.$.on('click', '[data-cmd="next"]', function () {
                meta.this.jump(1);
            });

            //点击 GO。
            meta.$.on('click', '[data-cmd="to"]', function () {
                jump();
            });

            //点击每页大小。
            //更改了分页的大小，要全部重算。
            meta.$.on('change', `#${meta.sizerId}`, function () {
                let index = this.selectedIndex;

                meta.size = meta.sizes[index];
                meta.this.to(1);
            });

            //自动选中文本框内的值，方便用户快速修改。
            meta.$.on('focus', `#${meta.txtId}`, function (event) {
                console.log('focus')
                let txt = document.getElementById(meta.txtId);
                txt.select();
            });


            //页面输入框中的键盘过滤。
            meta.$.on('keydown', `#${meta.txtId}`, function (event) {
                let keyCode = event.keyCode;

                if (keyCode == 13) {
                    jump();
                    return;
                }

                let isNumber =
                    (48 <= keyCode && keyCode <= 48 + 9) || //主键盘的 0 - 9
                    (96 <= keyCode && keyCode <= 96 + 9);   //数字键盘的 0 - 9

                let isControl =
                    keyCode == 8 ||     //回格键。
                    keyCode == 37 ||    //向左箭头。
                    keyCode == 39 ||    //向右箭头。
                    keyCode == 46;      //Delete 键

                //F1 - F12 键。
                let isFn = 112 <= keyCode && keyCode <= 112 + 11;
                let isValid = isNumber || isControl || isFn;

                if (!isValid) {
                    event.preventDefault();
                    return;
                }

            });

           

          
        },

    };


});


define('Pager/Meta', function (require, module, exports) {
    const $String = require('@definejs/string');

 

    return {
        create(config, more) {
            let id = config.id || $String.random();
            let { size, sizes, } = more;
         
            let total = config.total || 0;          //总的记录数。
            let maxNo = Math.ceil(total / size);    //总的页数，计算得到，向上取整。  

            let meta = {
                'id': id,                           //实例 id，会生成到 DOM 元素中。
                'txtId': $String.random(),          //会生成到 DOM 元素中。
                'sizerId': $String.random(),        //会生成到 DOM 元素中。

                'container': config.container,      //表格的容器。
                'template': config.template,        //使用的 html 模板的对应的 DOM 节点选择器。
                'class': config.class,              //css 类名。
                'style': config.style,              //css 样式。
                'dataset': config.dataset,          //自定义数据集，会在 html 中生成 `data-` 的自定义属性。

                'no': config.no || 1,               //当前页码，从 1 开始。
                'maxNo': maxNo,                     //总页数，计算得到。
                'recentNo': 0,                      //上一次的页码。
                'jumpNo': 0,                        //计算出下次要跳转的页码，填到输入框里。
                'minNo': config.minNo || 0,         //总页数小于该值时，分页器会隐藏。 如果不指定或指定为 0，则一直显示。

                'total': total,                     //总的记录数。
                'size': size,                       //分页的大小，即每页的记录数。
                'sizes': sizes,                     //可供选择的分页大小列表。
                
                'emitter': null,                    //事件处理器。
                'tpl': null,                        //模板实例。
                'this': null,                       //方便内部使用。
                '$': null,                          //$('#' + meta.id)
                '$nav': null,
                '$stat': null,
                '$jump': null,
            };

            Object.assign(meta, more);

            return meta;
        },
    };

    
});
define('Pager/No', function (require, module, exports) {

    return {
        //确保 no 落在 [1, maxNo] 之间。
        normalize(no, maxNo) {
            if (typeof no != 'number') {
                throw new Error(`输入的参数页码必须为数字。`);
            }

            //负数页码，则从后面开始算起。
            //如 -1 表示倒数第一页，即最后一页。
            if (no < 0) {
                no = maxNo + 1 + no;
            }

            no = Math.max(no, 1);
            no = Math.min(no, maxNo);

            return no;
        },

        /**
        * 
        * @param {*} total 
        * @param {*} size 
        */
        getMax(total, size) {
            let maxNo = Math.ceil(total / size); //总的页数，计算得到，向上取整。  
            return maxNo;
        },


        /**
        * 根据总页数、当前页和上一页预测出要跳转的页码。
        * @param {number} maxNo 总页数。
        * @param {number} no 当前激活的页码。
        * @param {number} recentNo 上一页的页码。
        * @return {number} 返回一个跳转的页码。
        */
        getJump({ maxNo, no, recentNo, }) {
            if (maxNo <= 1) { // 0 或 1
                return maxNo;
            }

            if (no == maxNo) {
                return maxNo - 1;
            }

            let value;

            if (no > recentNo) {
                value = no + 1;
            }
            else {
                value = no - 1;

                if (value < 1) {
                    value = 2;
                }
            }

            return value;

        },
    };

    
});


define('Pager/Sizes', function (require, module, exports) {


    return {

        parse: function ({ size, sizes, }) {
            size = size || sizes[0];
            sizes = [size, ...sizes];
            sizes = [...new Set(sizes)];

            sizes.sort(function (x, y) {
                return x > y ? 1 : -1;
            });

            return { size, sizes, };
        },

    };


});




define('Pager/Template', function (require, module, exports) {
    const Template = require('@definejs/template');
    const Regions = module.require('Regions');
    const Class = module.require('Class');
    const Style = module.require('Style');
    const DataSet = module.require('DataSet');


    return {
        create(meta) {
            let tpl = new Template(meta.template);

            tpl.process({
                //填充表格。
                '': function () {
                    this.fix(['class', 'dataset', 'style',]);

                    let cssClass = Class.stringify(meta.class);
                    let dataset = DataSet.stringify(meta.dataset);
                    let style = Style.stringify(meta.style);

                    let nav = this.fill('nav', {});
                    let stat = this.fill('stat', {});
                    let jump = this.fill('jump', {});
                    

                    return {
                        'id': meta.id,
                        'class': cssClass,
                        'dataset': dataset,
                        'style': style,

                        'nav': nav,
                        'stat': stat,
                        'jump': jump,
                    };
                },

                'nav': {
                    '': function () {
                        this.fix(['prev-disabled', 'next-disabled',]);

                        let regions = Regions.make(meta);

                        regions = this.fill('region', regions);
                        
                        return {
                            'regions': regions,
                            'prev-disabled': meta.no == Math.min(1, meta.maxNo) ? 'disabled' : '',
                            'next-disabled': meta.no == meta.maxNo ? 'disabled' : '',
                        };
                    },

                    'region': {
                        '': function (item, index) {
                            let list = this.fill('item', item.list);
                            let more = this.fill('more', item);
                            let html = list + more;

                            return html;

                        },

                        'item': function (no, index) {
                            return {
                                'no': no,
                                'on': no == meta.no ? 'on' : '',
                            };
                        },

                        'more': function ({ more, }) {
                            return more ? {} : '';
                        },
                    },
                },

                'stat': {
                    '': function () {
                        let sizes = this.fill('size', meta.sizes);

                        return {
                            'maxNo': meta.maxNo,
                            'total': meta.total,
                            'sizerId': meta.sizerId,
                            'sizes': sizes,
                        };
                    },

                    'size': function (item, index) {
                        this.fix('selected');

                        return {
                            'value': item,
                            'selected': item == meta.size ? 'selected="selected"' : '',
                        };
                    },
                },

                'jump': function () {
                    this.fix(['disabled',]);

                    return {
                        'txtId': meta.txtId,
                        'value': meta.jumpNo,
                        'disabled': meta.maxNo == 0 ? 'disabled' : '',
                    };
                },

                
            });

            return tpl;
        },
    };



});



define('Pager.defaults', {
    //组件的 id，会生成到 DOM 元素中。
    //一般情况下不需要指定，组件内部会自动生成一个随机的。
    //如果自行指定，请保证在整个 DOM 树中是唯一的。
    id: '',
    container: '',          //组件的容器。
    template: '#tpl-Pager', //
    class: 'Pager',         //css 类名。
    style: {},              //
    dataset: {},            //

    total: 0,       //总记录数。
    no: 1,          //当前页码，从 1 开始。
    size: 20,       //分页的大小，即每页的记录数。
    minNo: 0,       //总页数小于该值时，分页器会隐藏。 如果不指定或指定为 0，则一直显示。
    sizes: [10, 20, 50, 100, 200,],      //可供选择的分页大小列表。

    //是否公开 meta 对象。
    //如果指定为 true，则外部可以通过 this.meta 来访问。
    //在某些场合需要用到 meta 对象，但要注意不要乱动里面的成员。
    meta: false,

});



/**
* 分页器。 
*/
define('Pager', function (require, module, exports) {
    const $ = require('$');
    const Emitter = require('@definejs/emitter');
    const Events = module.require('Events');
    const Meta = module.require('Meta');
    const No = module.require('No');
    const Sizes = module.require('Sizes');
    const Template = module.require('Template');

    let mapper = new Map();


    class Pager {
        constructor(config) {
            config = Object.assign({}, exports.defaults, config);

            let emitter = new Emitter(this);

            let { size, sizes, } = Sizes.parse(config);

            let meta = Meta.create(config, {
                'size': size,
                'sizes': sizes,
                'emitter': emitter,         //
                'this': this,               //方便内部使用。
            });

            meta.tpl = Template.create(meta);
            mapper.set(this, meta);

            //指定了公开 meta 对象。
            if (config.meta) {
                this.meta = meta;
            }
            
            this.id = meta.id;
            this.$ = meta.$;
        }

        /**
        * 渲染 HTML 到容器中以生成 DOM 节点。
        */
        render(opt) {
            let meta = mapper.get(this);
            let updated = this.update(opt);
            
            if (updated) {
                return;
            }

            //首次渲染，全量填充。
            let html = meta.tpl.fill({});

            $(meta.container).html(html);

            meta.$ = this.$ = $(`#${meta.id}`);
            meta.$nav = meta.$.find(`[data-id="nav"]`);
            meta.$stat = meta.$.find(`[data-id="stat"]`);
            meta.$jump = meta.$.find(`[data-id="jump"]`);
            meta.$.toggle(meta.maxNo >= meta.minNo);

            Events.bind(meta);
            
        }

        /**
        * 更新组件。
        * 必须在渲染后才可更新。
        * @param {object} opt 配置对象。
        *   opt = {
        *       total: 0,   //总的记录数。 必须为非负整数。
        *       size: 0,    //每页的记录数。 必须为正整数。
        *       no: 0,      //当前页码。 如果为负数，则从后面算始算起。 如：-1 表示倒数第一页，即最后一页。
        *   };
        * @returns 
        */
        update(opt) {
            opt = opt || {};

            let meta = mapper.get(this);

            let { size, sizes, } = Sizes.parse({
                'size': opt.size || meta.size,
                'sizes': meta.sizes,
            });

            
            let total = opt.total === 0 ? 0 : opt.total || meta.total;
            let maxNo = No.getMax(total, size);
            let no = opt.no || 1;

            let changes = {
                'no': no != meta.no,
                'total': total != meta.total,
                'size': size != meta.size,
                'maxNo': maxNo != meta.maxNo,
            };

            meta.total = total;
            meta.size = size;
            meta.maxNo = maxNo;
            meta.sizes = sizes;

            //下面三句的顺序不要变。
            meta.recentNo = meta.no;                //用来辅助判断下次要跳转的页码。
            meta.no = No.normalize(no, meta.maxNo); //每次都需要规范化。
            meta.jumpNo = No.getJump(meta);         //计算出下次要跳转的页码，填到输入框里。


            //尚未渲染。
            if (!meta.$) {
                return false;
            }


            let nav = '';
            let stat = '';
            let jump = '';

            //total、size、maxNo 发生变化时，要重新渲染 stat，nav、jump。
            if (changes.total || changes.size || changes.maxNo) {
                nav = meta.tpl.fill('nav', {});
                stat = meta.tpl.fill('stat', {});
                jump = meta.tpl.fill('jump', {});
            }
            else if (changes.no) {
                //no 发生变化时，要重新渲染 nav。
                nav = meta.tpl.fill('nav', {});
                // jump = meta.tpl.fill('jump', {});
                document.getElementById(meta.txtId).value = meta.jumpNo;  //用这句更新粒度会更小。
            }

            nav && meta.$nav.html(nav);
            stat && meta.$stat.html(stat);
            jump && meta.$jump.html(jump);

            meta.$.toggle(meta.maxNo >= meta.minNo);

            return true;
        }

        /**
        * 跳转到指定页码的分页。
        * @param {number} no 要跳转的页码。
        *   如果为负数，则从后面算始算起。 如：-1 表示倒数第一页，即最后一页。
        * @example
        *   pager.to(1);    //跳转到第一页。
        *   pager.to(2);    //跳转到第二页。
        *   pager.to(-1);   //跳转到最后一页。
        *   pager.to(-2);   //跳转到倒数第二页。
        */
        to(no) {
            let meta = mapper.get(this);

            meta.this.render({ no, }); //此处的 no 的范围可能不合法，渲染后会规范成合法的放在 meta.no 里。

            meta.emitter.fire('change', [{
                'no': meta.no,              //当前页码，从 1 开始。
                'size': meta.size,          //分页的大小，即每页的记录数。
                'maxNo': meta.maxNo,        //总页数，计算得到。
                'recentNo': meta.recentNo,  //上一次的页码。
                'jumpNo': meta.jumpNo,      //计算出下次要跳转的页码，填到输入框里。
                'total': meta.total,        //总的记录数。
                'sizes': meta.sizes,        //可供选择的分页大小列表。
            }]);
        }

        /**
        * 跳转指定的页数（步数）到目标页码。
        * @param {number} 要跳转的页数（步数），可以为负数。
        *   如果为正，则向页码增大的方向跳转。 如果目标页码超过最大页码，则取最大页码。
        *   如果为负数，则向页码减小的方向跳转。 如果目标小于 1，则取 1。
        * @example
        *   pager.jump(-1); //跳转到上一页。
        *   pager.jump(1);  //跳转到下一页。
        */
        jump(step) {
            let meta = mapper.get(this);
            let no = meta.no + step;

            //这个要加，否则又要从后面开始跳。
            if (no < 1) {
                no = 1;
            }

            this.to(no);
        }

        /**
        * 绑定事件。
        */
        on(...args) {
            let meta = mapper.get(this);
            meta.emitter.on(...args);
        }




    }




    module.exports = exports = Pager;
    exports.defaults = require('Pager.defaults');

});


define('Table/Meta/Column', function (require, module, exports) {
    const $String = require('@definejs/string');

    return {
        create({ field, table, }) {
            let id = $String.random();      //列 id。

            let column = {
                'name': field.name,             //列名，编程用的，只读。
                'caption': field.caption || '', //标题名，会生成到表头的单元格 DOM 元素中。
                'class': field.class || '',     //css 类名，会生成到表头和表体的单元格 DOM 元素中。
                'title': field.title || '',     //title 提示，会生成到表头和表体的单元格 DOM 元素中。
                'dataset': field.dataset || {}, //自定义属性集，会生成到表头和表体的单元格 DOM 元素中。
                'style': field.style || {},     //css 样式集，会生成到表头和表体的单元格 DOM 元素中。
                'id': id,                       //列 id，会生成到表头的单元格 DOM 元素中。
                'type': 'TableColumn',          //类型。
                'table': table,                 //表格实例的自身，方便业务使用。
                'cells': [],                    //该列所包含的表体的单元格集合。

                'field': field,                 //此字段只是存着，本组件不使用。 可以在触发事件时让外部使用。
                'value': null,                  //该列的任意类型的值，由业务层写入，组件内不关注、不使用。
                'data': {},                     //用户自定义数据的容器。 仅用于给用户存储数据，组件内不关注、不使用。
            };


            return column;


        },
    };

    

});


define('Table/Row/Cell', function (require, module, exports) {
    const $String = require('@definejs/string');

    return {
        /**
        * 创建一个表体单元格对应的数据对象。
        */
        create({ meta, column, row, no, }) {
            let id = $String.random();          //单元格 id

            let cell = {
                'name': column.name,        //列名，编程用，只读。
                'class': column.class,      //css 类名，会生成到 DOM 元素中。
                'title': column.title,      //title 提示，会生成到 DOM 元素中。
                'style': column.style,      //css 样式，会生成到 DOM 元素中。
                'dataset': column.dataset,  //自定义数据集，会在 DOM 元素中生成 `data-` 开头的自定义属性。
                'id': id,                   //单元格 id，会生成到 DOM 元素中。
                'type': 'TableCell',        //类型。
                'column': column,           //所在的列引用。
                'row': row,                 //单元格所在的行引用。
                'table': meta.this,         //表格实例的自身，方便业务使用。

                'value': null,              //该单元格的任意类型的值，由业务层写入，组件内不关注、不使用。
                'data': {},                 //用户自定义数据的容器。 仅用于给用户存储数据，组件内不关注、不使用。
            };

            meta.id$cell[id] = cell;
            row.name$cell[cell.name] = cell;
            column.cells.splice(no, 0, cell);

            return cell;
        },


    };

});



define('Table/Template/Caption', function (require, module, exports) {

    return {
        html(meta, column, index) {
            let { emitter, } = meta;
            let { name, caption, } = column;
            let args = [column, { index, }]; //触发事件用到的参数列表。

            //让外界有机会处理/更改 cell 对象。
            let values0 = emitter.fire('process', 'caption', name, args);
            let values1 = emitter.fire('process', 'caption', args);

            let html0 = values0.slice(-1)[0]; //以最后一个为准。
            let html1 = values1.slice(-1)[0]; //以最后一个为准。
            let html2 = caption;

            if (html0 !== undefined) {
                return html0;
            }

            if (html1 !== undefined) {
                return html1;
            }

            if (html2 !== undefined) {
                return html2;
            }

            return '';
        },
    };
});
define('Table/Template/Cell', function (require, module, exports) {

    return {
        html(meta, cell, index, no) {
            let { emitter, } = meta;
            let { name, row, } = cell;
            let args = [cell, { index, no, }]; //触发事件用到的参数列表。

            //让外界有机会处理/更改 cell 对象。
            let values0 = emitter.fire('process', 'cell', name, args);
            let values1 = emitter.fire('process', 'cell', args);
            let item = row.item || {};

            let html0 = values0.slice(-1)[0]; //以最后一个为准。
            let html1 = values1.slice(-1)[0]; //以最后一个为准。
            let html2 = item[name];

            if (html0 !== undefined) {
                return html0;
            }

            if (html1 !== undefined) {
                return html1;
            }

            if (html2 !== undefined) {
                return html2;
            }

            return '';
        },
    };
});
define('Table/Template/Class', function (require, module, exports) {
    
    return {
        stringify(data) {
            if (Array.isArray(data)) {
                data = data.join(' ');
            }

            if (!data) {
                return '';
            }

            return `class="${data}"`;
        },
    };
});
define('Table/Template/DataSet', function (require, module, exports) {

    return {
        stringify(data) {
            if (!data) {
                return '';
            }

            let list = Object.keys(data).map((key) => {
                let value = data[key];

                return `data-${key}="${value}"`;
            });

            return list.join(' ');
        },
    };
});
define('Table/Template/Style', function (require, module, exports) {
    const Style = require('@definejs/style');

    return {
        stringify(data) {
            if (!data) {
                return '';
            }

            data = Style.stringify(data);
            
            if (!data) {
                return '';
            }

            return `style="${data}"`;
        },
    };
});
define('Table/Template/Title', function (require, module, exports) {

    return {
        stringify(data) {
            if (!data) {
                return '';
            }

            return `title="${data}"`;
        },
    };
});


define('Table/Events', function (require, module, exports) {


    return {
        bind(meta) {
            //整个表格的点击事件。
            meta.$.on('click', function (event) {
                let element = this;

                meta.emitter.fire('click', [{ event, element, }]);
            });

            if (meta.header) {
                meta.$.on('click', '>thead>tr>th', function (event) {
                    let id = this.id;
                    let column = meta.id$column[id];

                    if (!column) {
                        throw new Error(`不存在 id 为 ${id} 的列记录。`);
                    }

                    let { columns, } = meta;
                    let element = this;

                    let index = columns.findIndex((item) => {
                        return item === column;
                    });
                    let args = [column, { event, index, columns, element, }];

                    meta.emitter.fire('click', 'caption', column.name, args);
                    meta.emitter.fire('click', 'caption', args);

                });
            }



            //整个表体的点击事件。
            meta.$tbody.on('click', function (event) {
                let element = this;

                meta.emitter.fire('click', 'body', [{ event, element, }]);
            });

            //表格行的点击事件。
            meta.$tbody.on('click', '>tr', function (event) {
                let id = this.id;
                let row = meta.id$row[id];

                if (!row) {
                    throw new Error(`不存在 id 为 ${id} 的表格行记录。`);
                }

                //所在的行号。
                let no = meta.rows.findIndex((row) => {
                    return row.id == id;
                });

                let element = this;
                let args = [row, { event, no, element, }];

                meta.emitter.fire('click', 'row', `${no}`, args);
                meta.emitter.fire('click', 'row', args);
            });

            //单元格的点击事件。
            meta.$tbody.on('click', '>tr>td', function (event) {
                let id = this.id;
                let cell = meta.id$cell[id];

                if (!cell) {
                    throw new Error(`不存在 id 为 ${id} 的单元格记录。`);
                }

                //所在的行号。
                let no = meta.rows.findIndex((row) => {
                    return row.id == cell.row.id;
                });

                //所在的列号。
                let index = cell.row.cells.findIndex((cell) => {
                    return cell.id == id;
                });

                let element = this;
                let args = [cell, { event, no, index, element, }];

                meta.emitter.fire('click', 'cell', cell.name, args);
                meta.emitter.fire('click', 'cell', args);
            });
        }

    };

});



define('Table/Meta', function (require, module, exports) {
    const $String = require('@definejs/string');
    const Column = module.require('Column');

    return {
        create(config, more) {
            let id = config.id || $String.random();
            let name$column = {};
            let id$column = {};

            let table = more.this;

            let columns = config.fields.map(function (field, index) {
                let column = Column.create({ field, table, });

                name$column[column.name] = column;
                id$column[column.id] = column;

                return column;
            });


            let meta = {
                'id': id,                           //实例 id，会生成到 DOM 元素中。
               
                'container': config.container,      //表格的容器。
                'template': config.template,        //使用的 html 模板的对应的 DOM 节点选择器。
                'class': config.class,              //css 类名。
                'style': config.style,              //css 样式。
                'dataset': config.dataset,          //自定义数据集，会在 html 中生成 `data-` 的自定义属性。
                'header': config.header,            //是否渲染表头。
                
                'columns': columns,                 //所有的列集合。
                'id$column': id$column,             //用随机 id 关联列。
                'name$column': name$column,         //命名的列。

                'rows': [],                         //所有的行记录集合。
                'id$row': {},                       //用随机 id 关联表格行元数据。
                'id$cell': {},                      //用随机 id 关联单元格元数据。

                'list': [],                         //当前渲染时的列表数据。
                
                'emitter': null,                    //
                'tpl': null,                        //模板实例。
                '$': null,                          //$(`table`)
                'this': null,                       //方便内部使用。

                '$tbody': null,                     //$(`tbody`);
            };

            Object.assign(meta, more);

            

            return meta;
        },
    };

    
});

//表格行。
define('Table/Row', function (require, module, exports) {
    const $String = require('@definejs/string');
    const Cell = module.require('Cell');


    return {
        /**
        * 创建一个表格行记录的数据对象并插入到行的集合中。
        */
        insert(meta, item, no) {
            let max = meta.rows.length;

            //未指定，或指定的范围不对，则都当成在末尾插入。
            if (no === undefined || no < 0 || no > max) {
                no = max;
            }
            

            let id = $String.random();  //行 id

            //行结构。
            let row = meta.id$row[id] = {
                'type': 'TableRow',     //类型。
                'item': item,           //当前行的数据记录。
                'id': id,               //行 id，会生成到 DOM 元素中。
                'class': '',            //css 类名，会生成到 DOM 元素中。
                'title': '',            //title 提示，会生成到 DOM 元素中。
                'dataset': {},          //自定义数据集，会在 DOM 元素中生成 `data-` 开头的自定义属性。
                'style': {},            //css 样式，会生成到 DOM 元素中。
                'table': meta.this,     //表格实例的自身，方便业务使用。
                'name$cell': {},        //命名的单元格集合。
                'cells': null,          //单元格集合，先占位。

                'value': null,          //该行的任意类型的值，由业务层写入，组件内不关注、不使用。
                'data': {},             //用户自定义数据的容器。 仅用于给用户存储数据，组件内不关注、不使用。
            };

            row.cells = meta.columns.map((column) => {
                let cell = Cell.create({ meta, column, row, no, });
                return cell;
            });

            //在指定的位置插入。
            meta.rows.splice(no, 0, row);

            return { row, no, };
        },

        /**
        * 根据索引、行对象或 id 来获取对应的行对象与其与在的索引值。
        * @param {number|Object|string} item 要获取的行对象对应的索引、行对象或 id 值。
        *   如果传入的是一个 number，则当成行的索引值。 如果小于 0，则从后面开始算起。
        *   如果传入的是一个 Object，则当成是行对象并进行引用匹配。
        *   如果传入的是一个 string，则当成是 id 进行匹配。
        * @returns {Object} 返回获取到的表格行对象及描述，结构为：
        *   {
        *       row: {},    //表格行对象。 获取不到时为空。
        *       no: 0,      //所在行数组的索引值。 在 row 为空时，此字段值为 -1。
        *       msg: '',    //错误信息描述。 在 row 为空时，有此字段值。
        *   }
        */
        get(meta, item) {
            let row = null;
            let no = -1;
            let msg = ``;

            switch (typeof item) {
                //item 为一个索引。
                case 'number':
                    //传入负数，则从后面开始算起。
                    if (item < 0) {
                        item = meta.rows.length + item; //如 -1 就是最后一项；-2 就是倒数第 2 项。
                    }

                    row = meta.rows[item]; //可能为空。
                    no = row ? item : -1;
                    msg = row ? `` : `不存在索引值为 ${item} 的表格行。`;
                    break;

                //item 为一个对象。
                case 'object':
                    //可能为 -1。
                    no = meta.rows.findIndex((row) => {
                        return row === item;
                    });

                    row = meta.rows[no];
                    msg = row ? `` : `不存在匹配的表格行。`;
                    break;


                //item 为一个 id。
                case 'string':
                    row = meta.id$row[item]; //可能为空。
                    no = !row ? -1 : meta.rows.findIndex((row) => {
                        return row.id == item;
                    });
                    msg = row ? `` : `不存在 id 为 ${item} 的表格行。`;
                    break;

            }

            return { row, no, msg, };

        },




    };

});





define('Table/Template', function (require, module) {
    const Template = require('@definejs/template');
    const Class = module.require('Class');
    const DataSet = module.require('DataSet');
    const Cell = module.require('Cell');
    const Caption = module.require('Caption');
    const Style = module.require('Style');
    const Title = module.require('Title');



    return {
        create(meta) {
            let tpl = new Template(meta.template);

            tpl.process({
                //填充表格。
                '': function () {
                    this.fix(['class', 'dataset', 'style',]);

                    let cssClass = Class.stringify(meta.class);
                    let dataset = DataSet.stringify(meta.dataset);
                    let style = Style.stringify(meta.style);
                    let header = this.fill('header', {});
                    let rows = this.fill('row', meta.rows);

                    return {
                        'id': meta.id,
                        'class': cssClass,
                        'dataset': dataset,
                        'style': style,
                        'header': header,
                        'rows': rows,
                    };
                },

                'header': {
                    '': function () {
                        if (!meta.header) {
                            return '';
                        }

                        let captions = this.fill('caption', meta.columns);
                        return { captions, };
                    },

                    'caption': function (column, index) {
                        this.fix(['class', 'title', 'dataset', 'style',]);

                        //这句在前面。
                        //会触发事件，让外界有机会处理/更改 cell 对象。
                        let html = Caption.html(meta, column, index);

                        let cssClass = Class.stringify(column.class);
                        let title = Title.stringify(column.title);
                        let dataset = DataSet.stringify(column.dataset);
                        let style = Style.stringify(column.style);

                        return {
                            'id': column.id,
                            'class': cssClass,
                            'title': title,
                            'dataset': dataset,
                            'style': style,
                            'html': html,
                        };
                    },

                },

                

                'row': {
                    //填充行本身。
                    '': function (row, no) {
                        this.fix(['class', 'title', 'dataset', 'style',]);

                        let args = [row, { no, }];
                        
                        //让外界有机会去处理/更改 row 对象。
                        meta.emitter.fire('process', 'row', `${no}`, args);
                        meta.emitter.fire('process', 'row', args);

                        //这句写在前面。
                        //让外界有机会处理/更改 row 对象。
                        let cells = this.fill('cell', row.cells, no);

                        let cssClass = Class.stringify(row.class);
                        let title = Title.stringify(row.title);
                        let dataset = DataSet.stringify(row.dataset);
                        let style = Style.stringify(row.style);
                       

                        return {
                            'id': row.id,
                            'class': cssClass,
                            'title': title,
                            'dataset': dataset,
                            'style': style,
                            'cells': cells,
                        };
                    },

                    //填充单元格。
                    'cell': function (cell, index, no) {
                        this.fix(['class', 'title', 'dataset', 'style',]);

                        //这句在前面。
                        //会触发事件，让外界有机会处理/更改 cell 对象。
                        let html = Cell.html(meta, cell, index, no);
                        let cssClass = Class.stringify(cell.class);
                        let title = Title.stringify(cell.title);
                        let dataset = DataSet.stringify(cell.dataset);
                        let style = Style.stringify(cell.style);


                        return {
                            'id': cell.id,
                            'class': cssClass,
                            'title': title,
                            'dataset': dataset,
                            'style': style,
                            'html': html,
                        };
                    },
                },
            });

            return tpl;

        },

    };

});



define('Table.defaults', {
    //组件的 id，会生成到 DOM 元素中。
    //一般情况下不需要指定，组件内部会自动生成一个随机的。
    //如果自行指定，请保证在整个 DOM 树中是唯一的。
    id: '',    
    
    container: '',
    template: '#tpl-Table', //
    class: 'Table',         //css 类名。
    style: {},
    dataset: {},
    header: true,           //是否生成表头。 如果指定为 false，则不生成 `<thead></thead>` 表头元素。
    fields: [],             //列的字段数组。

    //是否公开 meta 对象。
    //如果指定为 true，则外部可以通过 this.meta 来访问。
    //在某些场合需要用到 meta 对象，但要注意不要乱动里面的成员。
    meta: false,            

});


/**
* HTML 表格组件。
* 提供自定义列、动态生成列表、增加/插入表格行等功能。
*/
define('Table', function (require, module, exports) {
    const $ = require('$');
    const Emitter = require('@definejs/emitter');
    const Meta = module.require('Meta');
    const Row = module.require('Row');
    const Template = module.require('Template');
    const Events = module.require('Events');


    
    let mapper = new Map();


    class Table {
        constructor(config) {
            config = Object.assign({}, exports.defaults, config);

            let emitter = new Emitter(this);
            let meta = Meta.create(config, {
                'emitter': emitter,         //
                'this': this,               //方便内部使用。
            });

            meta.tpl = Template.create(meta);
            mapper.set(this, meta);

            //指定了公开 meta 对象。
            if (config.meta) {
                this.meta = meta;
            }
            
            this.id = meta.id;

            
        }

        /**
        * 渲染 HTML 到容器中以生成 DOM 节点。
        * @returns 
        */
        render(list) {
            let meta = mapper.get(this);

            //先清空之前可能存在的。
            this.clear();

            meta.list = list.map((item) => {
                Row.insert(meta, item);
                return item;
            });


            //已渲染过。
            if (meta.$) {
                let html = meta.tpl.fill('row', meta.rows);
                meta.$tbody.html(html);
                return;
            }
            
            //首次渲染。
            let html = meta.tpl.fill({});
            $(meta.container).html(html);
            meta.$ = this.$ = $(`#${meta.id}`);
            meta.$tbody = meta.$.find('>tbody');
            Events.bind(meta);
        }


        /**
        * 迭代执行每一表格行。
        */
        eachRow(fn) {
            let meta = mapper.get(this);
            let { rows, } = meta;
            rows.forEach(function (row, index) {
                fn.apply(meta.this, [row, index, rows]);
            });
        }

        /**
        * 迭代执行每一表格列。
        */
        eachColumn(fn) {
            let meta = mapper.get(this);
            let { columns, } = meta;

            columns.forEach(function (column, index) {
                fn.apply(meta.this, [column, index, columns]);
            });
        }

        /**
        * 插入一行表格行。
        * @param {Object} item 要插入的数据行记录，为 list 中的项。
        * @param {number} [index] 可选，要插入的位置。
        *   如果不指定，则在末尾插入，此时变成了追加一行。
        */
        insertRow(item, index) {
            let meta = mapper.get(this);
            let { row, no, } = Row.insert(meta, item, index);
            let html = meta.tpl.fill('row', row, no);
            let max = meta.rows.length - 1;

            if (no == 0) {
                meta.$tbody.prepend(html);
            }
            else if (no == max) {
                meta.$tbody.append(html);
            }
            else {
                let row = meta.rows[no + 1];
                $(`#${row.id}`).before(html);
            }

            meta.emitter.fire('insert', [row, { no, }]);

        }

        /**
        * 移除一行。
        * @param {number|string|Object} item 要移除的表格行。
        *   当传入一个 number 时，则表示该表格行所在的索引。
        *   当传入一个 string 时，则表示该表格行的 id。
        *   当传一个 Object 时，则取其 `id` 字段进行匹配。
        */
        removeRow(item, fn) {
            let meta = mapper.get(this);
            let { row, no, msg, } = Row.get(meta, item);

            if (!row) {
                throw new Error(msg);
            }

            //外面提供了自定义删除方式。
            if (fn) {
                fn(row, no, done);
            }
            else {
                done();
            }

            meta.emitter.fire('remove', [row, { no, }]);


            function done() {
                //从 DOM 中删除。
                let tr = document.getElementById(row.id);
                tr.parentNode.removeChild(tr);

                //从数据上删除。
                meta.rows.splice(no, 1);
                delete meta.id$row[row.id];

                meta.columns.map(function (column, index) {
                    column.cells.splice(no, 1);
                });
            }
           

        }

        /**
        * 把指定的表格行向前或向后移动若干步。
        * @param {number|string|Object} item 要移动的表格行。
        *   当传入一个 number 时，则表示该表格行所在的索引。
        *   当传入一个 string 时，则表示该表格行的 id。
        *   当传一个 Object 时，则取其 `id` 字段进行匹配。
        * @param {number} step 要移动的步数。
        *   如果为 0，则不移动，直接返回。
        *   如果为正数，则向后移动。
        *   如果为负数，则向前移动。
        */
        moveRow(item, step) {
            if (step == 0) {
                return;
            }

            let meta = mapper.get(this);
            let { row, no, msg, } = Row.get(meta, item);

            if (!row) {
                throw new Error(msg);
            }

            let max = meta.rows.length - 1; //允许的最大索引值。
            let index = no + step;          //目标索引值。

            index = Math.max(index, 0);   //如果为负数，则取为 0.
            index = Math.min(index, max); //如果超过最大值，则取为最大值。

            //移动后的位置一样。
            if (index == no) {
                return;
            }

            let targetRow = meta.rows[index];
            let tr = document.getElementById(row.id);

            //处理数据。
            meta.rows.splice(no, 1);            //删除原位置的。
            meta.rows.splice(index, 0, row);    //在目标位置插入。

            //处理 DOM。
            tr.parentNode.removeChild(tr);

            if (step > 0) {
                $(`#${targetRow.id}`).after(tr.outerHTML);
            }
            else {
                $(`#${targetRow.id}`).before(tr.outerHTML);
            }

            meta.emitter.fire('move', [row, { no, index, }]);
        }

        /**
        * 清空表格。
        * 会触发每行单元格和每行表格行的清空事件。
        * @returns   
        */
        clear() {
            let meta = mapper.get(this);

            //无任何数据。
            if (meta.rows.length == 0) {
                return;
            }

            meta.rows.map(function (row) {
                row.cells.map(function (cell) {
                    meta.emitter.fire('clear', 'cell', cell.name, [cell]);
                    meta.emitter.fire('clear', 'cell', [cell]);
                });

                meta.emitter.fire('clear', 'row', [row]);
            });

            meta.columns.map(function (column) {
                column.cells.splice(0); //清空原数组。
            });

            meta.id$row = {};
            meta.id$cell = {};
            meta.rows.splice(0);     //清空原数组。
            
            if (meta.$) {
                meta.$tbody.html('');
            }

            meta.emitter.fire('clear');
        }

        /**
        * 绑定事件。
        */
        on(...args) {
            let meta = mapper.get(this);
            meta.emitter.on(...args);
        }


    }




    module.exports = exports = Table;
    exports.defaults = require('Table.defaults');

});


define('TableResizer/Column', function (require, module, exports) {
    const $String = require('@definejs/string');

   


    return {

        /**
        * 
        * @param {*} fields 
        * @returns 
        */
        parse(config) {
            let id$column = {};
            

            let columns = config.fields.map((field) => {
                let id = $String.random();
                let cid = `col-${id}`;
                let { width, minWidth, maxWidth, dragable, } = field;

                //每一列可以指定自己所允许的最小宽度，如果不指定，则使用全局的。
                minWidth = typeof minWidth == 'number' ? minWidth : config.minWidth;
                maxWidth = typeof maxWidth == 'number' ? maxWidth : config.maxWidth;

                dragable = dragable === false ? false : true;

                let column = id$column[id] ={
                    'id': id,
                    'cid': cid,
                    'width': width,
                    'minWidth': minWidth,   //所允许的最小宽度。 如果为 0，则不限制。
                    'maxWidth': maxWidth,   //所允许的最大宽度。 如果为 0，则不限制。
                    'dragable': dragable,   //只有显式指定了为 false 才禁用。
                    'field': field,         //此字段只是存着，本组件不使用。 可以在触发事件时让外部使用。

                    '$': null,              //$(cid); 只是用来暂存，用到时再去获取。
                };


                return column;
            });

            return {
                columns,
                id$column,
            };
        },


        /**
        * 根据索引、列对象或 id 来获取对应的列对象与其与在的索引值。
        * @param {number|Object|string} item 要获取的列对象对应的索引、列对象或 id 值。
        *   如果传入的是一个 number，则当成列的索引值。 如果小于 0，则从后面开始算起。
        *   如果传入的是一个 Object，则当成是列对象进行引用匹配。
        *   如果传入的是一个 string，则当成是 id 进行匹配。
        * @returns {Object} 返回获取到的列对象及描述，结构为：
        *   {
        *       column: {},     //表格行对象。 获取不到时为空。
        *       index: 0,       //所在数组的索引值。 在 column 为空时，此字段值为 -1。
        *       msg: '',        //错误信息描述。 在 column 为空时，有此字段值。
        *   }
        */
        get(meta, item) {
            let column = null;
            let index = -1;
            let msg = ``;

            switch (typeof item) {
                //item 为一个索引。
                case 'number':
                    //传入负数，则从后面开始算起。
                    if (item < 0) {
                        item = meta.columns.length + item; //如 -1 就是最后一项；-2 就是倒数第 2 项。
                    }

                    column = meta.columns[item]; //可能为空。
                    index = column ? item : -1;
                    msg = column ? `` : `不存在索引值为 ${item} 的列。`;
                    break;

                //item 为一个对象。
                case 'object':
                    //可能为 -1。
                    index = meta.columns.findIndex((column) => {
                        return column === item;
                    });

                    column = meta.columns[index];
                    msg = column ? `` : `不存在与传入的对象引用完全相等的列。`;
                    break;


                //item 为一个 id。
                case 'string':
                    column = meta.id$column[item]; //可能为空。

                    index = !column ? -1 : meta.columns.findIndex((column) => {
                        return column.id == item;
                    });
                    msg = column ? `` : `不存在 id 为 ${item} 的列`;
                    break;

            }

            return { column, index, msg, };

        },

    };
});

define('TableResizer/Events', function (require, module, exports) {
    const $ = require('$');

    return {
        bind(meta) {
            let draging = false;    //表示鼠标左键是否已按下并还没释放。
            let x = 0;              //鼠标按下时的 pageX 值。
            let cursor = '';        //鼠标按下时的 cursor 指针值。
            let width = 0;

            let column = null;
            let $b = null;
            let tid = null;

            let $body = $(document.body);


            //开始按下鼠标左键。
            $body.on('mousedown', function (event) {
                //只针对左键。
                if (event.which != 1) {
                    return;
                }

                column = meta.id$column[event.target.id];

                if (!column) {
                    return;
                }

                draging = true;
                x = event.pageX;
                width = column.width;
                cursor = document.body.style.cursor;
                document.body.style.cursor = 'ew-resize';
                
                $b = $(`#${column.id}>b`);
                $b.html(`${column.width}px`);

                //延迟显示，在双击时显示。
                //即快速双击时不会显示，长按住时才会显示。
                tid = setTimeout(function () {
                    $b.addClass('on');
                }, 200);
                
            });

            //按住鼠标左键进行移动。
            $body.on('mousemove', function (event) {
                if (!draging) {
                    return;
                }

                //防止按住鼠标左键移动到 body 外面。
                //再进入时，恢复为松开的状态。
                if (event.which == 0) {
                    $body.trigger('mouseup');
                    return;
                }

                let dx = event.pageX - x;   //delta width
                let cw = width + dx;        //cell width
                let { minWidth, maxWidth, } = column;

                //列宽不能小于指定的最小宽度。
                if (minWidth > 0 && cw < minWidth) {
                    return;
                }

                //列宽不能大于指定的最大宽度。
                if (maxWidth > 0 && cw > maxWidth) {
                    return;
                }


                $b.html(`${cw}px`);

                meta.setWidth(column, cw, {
                    'type': 'drag',
                    'dx': dx,
                });

                
            });

            //释放鼠标左键。
            $body.on('mouseup', function (event) {
                if (!draging) {
                    return;
                }

        

                clearTimeout(tid); //可能是快速的单击，也取消。
                draging = false;
                document.body.style.cursor = cursor;
                $b.removeClass('on');

                //看看调整完的值是否生效。
                //如果没生效，则使用实际的宽度。
                let resizer = document.getElementById(column.id);
                let cell = resizer.parentNode;
                let width = cell.offsetWidth;

                if (column.width < width) {
                    meta.setWidth(column, width, {
                        'type': 'drag',
                        'dx': 0,
                    });
                }

                //性能起见。
                column.$ = null;
                column = null;
                $b = null;
                tid = null;
            });



            //双击。
            meta.$.on('dblclick', 'i', function (event) {
                let column = meta.id$column[event.target.id];
                if (!column) {
                    return;
                }

                let { columns, } = meta;

                let index = columns.findIndex((item) => {
                    return item === column;
                });
                
                meta.emitter.fire('dblclick', [column, { columns, event, index, }]);
            });

        },
    };
});


/**
* 
*/
define('TableResizer/Meta', function (require, module, exports) {
    const $String = require('@definejs/string');


    return {

        create: function (config, more) {
            let id = $String.random();

            let meta = {
                'id': id,                       //实例 id，不会生成到 DOM 元素中。
                'template': config.template,    //使用的 html 模板的对应的 DOM 节点选择器。
                'class': config.class,          //会添加到 meta.$ 对应的 DOM 元素中。
                'container': config.container,  //原始的 table 选择器。
                'indicator': config.indicator,  //是否显示拖动时的列宽指示器。
                'sumWidth': config.sumWidth,    //是否根据全部列宽的总和给 table 生成总的宽度。
                
                'columns': [],
                'id$column': null,

                '$': null,                      //$(meta.container)
                'this': null,                   //
                'emitter': null,                //

            };

            //设置宽度。 
            //兼做两件事：
            //  一，设定指定列的宽度。
            //  二，计算所有列宽的总和，并生成到所在的 table 里。
            meta.setWidth = function (column, width, info) {
                let sum = 0;

                if (column) {
                    column.width = width;
                    column.$ = column.$ || $(`#${column.cid}`);
                    column.$.width(width);
                }

                //计算所有列宽的总和，并生成到所在的 table 里。
                if (meta.sumWidth) {
                    sum = meta.columns.reduce((sum, item) => {
                        sum += item.width;
                        return sum;
                    }, 0);

                    meta.$.width(sum);
                }

                //此时 column 一定有。
                if (info) {
                    if (typeof info.index != 'number') {
                        info.index = meta.columns.findIndex((item) => {
                            return item === column;
                        });
                    }

                    info.columns = meta.columns;

                    if (meta.sumWidth) {
                        info.sum = sum;
                    }
                    
                    let args = [column, info];

                    meta.emitter.fire('change', column.name, args);
                    meta.emitter.fire('change', args);
                }
            };

            Object.assign(meta, more);

            return meta;
           
        },


    };
    
});





define('TableResizer/Template', function (require, module) {
    const Template = require('@definejs/template');




    return {
        create: function (meta) {
            let tpl = new Template(meta.template);

            tpl.process({
                'colgroup': {
                    '': function () {

                        let cols = this.fill('col', meta.columns);

                        return {
                            'cols': cols,
                        };
                    },

                    'col': function (column, index) {

                        return {
                            'cid': column.cid,
                            'width': column.width,
                        };
                    },
                },

                'resizer': {
                    '': function (column, index) {
                        //指定了不可拖拽，则不生成 html。
                        if (!column.dragable) {
                            return '';
                        }

                        let indicator = this.fill('indicator', { index, });

                        return {
                            'id': column.id,
                            'indicator': indicator,
                        };
                    },

                    'indicator': function ({ index, }) {
                        if (!meta.indicator) {
                            return '';
                        }

                        let maxIndex = meta.columns.length - 1;

                        return {
                            'class': index == maxIndex ? 'last' : '',
                        };
                    },


                },
            });

            return tpl;

        },

    };

});



define('TableResizer.defaults', {
    class: 'TableResizer',
    template: '#tpl-TableResizer',
    container: null,
    indicator: true,    //是否显示拖动时的列宽指示器。
    sumWidth: true,     //是否根据全部列宽的总和给 table 生成总的宽度。
    minWidth: 30,       //全部列所允许的最小宽度。 可以在针对每列单独设定一个 minWidth。
    maxWidth: 0,        //全部列所允许的最大宽度。 可以在针对每列单独设定一个 maxWidth。 如果指定为 0，则不限制。
    fields: [   //列的数组
        // {
        //     width: 0,           //列的宽度。 只能是整数的 number 类型。
        //     minWidth: 0,        //所允许的最小宽度。 优先级比上一级的 minWidth 高。
        //     maxWidth: 0,        //所允许的最大宽度。 优先级比上一级的 maxWidth 高。 如果指定为 0，则不限制。
        //     dragable: true,     //是否允许拖拽。 只能明确指定为 false 时才禁用拖拽，否则默认为允许。
        // },
    ],

    //是否公开 meta 对象。
    //如果指定为 true，则外部可以通过 this.meta 来访问。
    //在某些场合需要用到 meta 对象，但要注意不要乱动里面的成员。
    meta: false,

});



define('TableResizer', function (require, module) {
    const $ = require('$');
    const Emitter = require('@definejs/emitter');
    const Meta = module.require('Meta');
    const Template = module.require('Template');
    const Events = module.require('Events');
    const Column = module.require('Column');

    let mapper = new Map();

   

    class TableResizer {
        constructor(config) {
            config = Object.assign({}, exports.defaults, config);

            let emitter = new Emitter(this);
            let info = Column.parse(config); // info = { columns, cid$column, };

            let meta = Meta.create(config, {
                'this': this,               //方便内部使用。
                emitter,         //
                ...info,
            });

            meta.tpl = Template.create(meta);
            mapper.set(this, meta);

            //指定了公开 meta 对象。
            if (config.meta) {
                this.meta = meta;
            }

            this.id = meta.id;
            this.$ = meta.$;
        }

        /**
        * 渲染 HTML 到容器中以生成 DOM 节点。
        * @returns
        */
        render() {
            let meta = mapper.get(this);

            //已渲染过。
            if (meta.$) {
                return;
            }

            meta.$ = this.$ = $(meta.container);
            meta.$.addClass(meta.class);

            let rows = [...meta.$.get(0).rows];
            let cells = [...rows[0].cells]; //取表格的第一行。

            //列数可能跟实际不匹配，则进行截断处理。
            meta.columns = meta.columns.filter((column, index) => {
                let cell = cells[index];
                
                //可能 columns.length > cells.length;
                //即指定的 fields 元素多于实际要用到的，则只用一部分，多余的部分丢弃掉。
                if (!cell) {
                    return false;
                }

                //columns.length <= cells.length;
                //则只有部分 cell 能渲染出 resizer，不够的部分则不渲染。
                let html = meta.tpl.fill('resizer', column, index);
                $(cell).append(html);
                
                return true;
            });


            let html = meta.tpl.fill('colgroup', {});
            meta.$.prepend(html);
            meta.setWidth(); //生成总宽度。

            Events.bind(meta);
        }

        /**
        * 设置指定列的宽度。
        * @returns
        */
        set(item, width) {
            let meta = mapper.get(this);
            let { column, index, msg, } = Column.get(meta, item);

            if (!column) {
                throw new Error(msg);
            }

            let { minWidth, maxWidth, } = column;

            //列宽不能小于指定的最小宽度。
            if (minWidth > 0) {
                width = Math.max(width, column.minWidth);
            }

            //列宽不能大于指定的最大宽度。
            if (maxWidth > 0) {
                width = Math.min(width, maxWidth);
            }

            let dx = width - column.width;
         
            //会触发事件。
            meta.setWidth(column, width, { type: 'set', dx, index, });
        }


        /**
        * 清空表格。
        * @returns
        */
        clear() {
            let meta = mapper.get(this);
            let colgroup = meta.$.find('colgroup').get(0);

            colgroup.parentNode.removeChild(colgroup);

            meta.columns.forEach((column) => {
                column.$ = null;

                let resizer = document.getElementById(column.id);
                resizer.parentNode.removeChild(resizer);
            });


            meta.columns = [];
            meta.id$column = {};
        }

        /**
        * 绑定事件。
        */
        on(...args) {
            let meta = mapper.get(this);
            meta.emitter.on(...args);
        }


    }

    module.exports = exports = TableResizer;
    exports.defaults = require('TableResizer.defaults');

});


define('TextTree/Events/Status', function (require, module, exports) {
    const $ = require('$');


    return exports = {
        //
        close(item, includeSelf) {
            item.childs.forEach((item) => {
                //用户手动关闭的，直接关闭当前节点即可。
                //不需要再关闭下级节点。
                if (item.closed) {
                    $(`#${item.id}`).slideUp('fast');
                }
                else {
                    exports.close(item, true);//递归。
                }

            });

            if (includeSelf) {
                $(`#${item.id}`).slideUp('fast');
            }
        },

        //
        open(item, includeSelf) {
            item.childs.forEach((item) => {
                //用户手动关闭的。
                if (item.closed) {
                    $(`#${item.id}`).slideDown('fast');
                }
                else {
                    exports.open(item, true); //递归。
                }

            });


            if (includeSelf) {
                $(`#${item.id}`).slideDown('fast');
            }
        },

    };
});
define('TextTree/Template/Class', function (require, module, exports) {
    
    return {
        stringify(data) {
            if (Array.isArray(data)) {
                data = data.filter((item) => {
                    return !!item;
                });
                data = data.join(' ');
            }

            if (!data) {
                return '';
            }

            return `class="${data}"`;
        },
    };
});
define('TextTree/Template/DataSet', function (require, module, exports) {

    return {
        stringify(data) {
            if (!data) {
                return '';
            }

            let list = Object.keys(data).map((key) => {
                let value = data[key];

                return `data-${key}="${value}"`;
            });

            return list.join(' ');
        },
    };
});
define('TextTree/Template/Style', function (require, module, exports) {
    const Style = require('@definejs/style');

    return {
        stringify(data) {
            if (!data) {
                return '';
            }

            data = Style.stringify(data);
            
            if (!data) {
                return '';
            }

            data = data.trim();

            return `style="${data}"`;
        },
    };
});
define('TextTree/Template/Title', function (require, module, exports) {

    return {
        stringify(data) {
            if (!data) {
                return '';
            }

            return `title="${data}"`;
        },
    };
});

/**
* 
*/
define('TextTree/Data', function (require, module, exports) {
    const $String = require('@definejs/string');
    const Tree = require('@definejs/tree');

    return {

        /**
        * 
        */
        make(raws, trimLeft) {
            let tree = new Tree();

            raws.forEach((raw) => {
                tree.set(raw.keys, raw);
            });

            let item$node = new Map();
            let node$item = new Map();
            let id$item = {};

            let list = tree.render(function (node, info) {
                let raw = node.value || {};
                let id = raw.id || $String.random();
                let { tabs, linker, } = info;

                if (trimLeft) {
                    if (tabs) {
                        tabs = tabs.slice(4);
                    }
                    else {
                        linker = linker.slice(4);
                    }
                }

                let item = {
                    'id': id,
                    'class': raw.class,
                    'dataset': raw.dataset,
                    'title': raw.title,
                    'style': raw.style,
                    'value': raw.value,
                    'icon': raw.icon,
                    'data': raw.data, //节点的自定义数据，仅用来存储在当前节点，以便后续用户再读取出来使用。
                    'type': raw.type, //`dir` 或 `file`，如果未指定，则自动推算。

                    'isRoot': node.isRoot,
                    'key': node.key,
                    'keys': node.keys,
                    'x': node.x,
                    'y': node.y,
                    'tabs': tabs,
                    'linker': linker,

                    'parent': null,
                    'childs': [],
                    'siblings': [],

                    'closed': false,            //记录主动关闭的项。 即由用户手动关闭的，而非程序关闭的。
                    'raw': node.value,          //如果为空，则为虚拟节点。 即由于适应树形结构而必须构造出的辅助节点。
                };

                id$item[id] = item;    //
                item$node.set(item, node);
                node$item.set(node, item);

                return item;
            });

            list.forEach((item) => {
                let node = item$node.get(item);

                let childs = node.nodes.map((node) => {
                    return node$item.get(node);
                });

                if (!item.type) {
                    item.type = childs.length > 0 ? 'dir' : 'file';
                }

                item.childs = childs;

                item.parent = node$item.get(node.parent);

                item.siblings = node.siblings.map((node) => {
                    return node$item.get(node);
                });
            });

            return {
                list,
                id$item,
            };

        },


    };

});





define('TextTree/Events', function (require, module, exports) {
    const $ = require('$');
    const Status = module.require('Status');


    return {
        bind(meta) {

            meta.$.on('click', `>li [data-cmd="icon"]`, function (event) {
                let { id, } = this.dataset;
                let item = meta.id$item[id];

                if (item.childs.length == 0) {
                    return;
                }

                let $icon = $(this);
                let needOpen = $icon.hasClass('closed');
                let needClose = !needOpen;
              
                if (needClose) {
                    Status.close(item);
                }
                else {
                    Status.open(item);
                }
                
                item.closed = needClose;//此语句要在 close 或 open 之后。
                $icon.toggleClass('closed', needClose);
            });


            meta.$.on('click', `>li [data-cmd]`, function (event) {
                let { cmd, id, } = this.dataset;
                let item = meta.id$item[id];

                meta.emitter.fire('cmd', cmd, [item, event]);
                meta.emitter.fire('cmd', [cmd, item, event]);

            });

       



           
        },

    };
});

/**
* 
*/
define('TextTree/Meta', function (require, module, exports) {
    const $String = require('@definejs/string');

    return {

        create (config, others) {
            let id = $String.random();

            let meta = {
                'id': id,                           //实例 id，会生成到 DOM 元素中。

                'container': config.container,      //表格的容器。
                'template': config.template,        //使用的 html 模板的对应的 DOM 节点选择器。
                'class': config.class,              //css 类名。
                'style': config.style,              //css 样式。
                'dataset': config.dataset,          //自定义数据集，会在 html 中生成 `data-` 的自定义属性。
                'icon': config.icon,                //
                'trimLeft': config.trimLeft,        //
                'showValue': config.showValue,      //
                'showIcon': config.showIcon,        //
                'showTab': config.showTab,          //
                'showColor': config.showColor,      //
                'showHover': config.showHover,      //
                

                'list': [],     //渲染后对应的列表，排序可能跟 render(list) 中传入的 list 不同，以此为准。
                'id$item': {},  //
                
                '$': null,
                'this': null,
                'emitter': null,
                'tpl': null,
            };


            Object.assign(meta, others);



            return meta;
           
        },


    };
    
});





define('TextTree/Template', function (require, module, exports) {
    const Template = require('@definejs/template');
    const Class = module.require('Class');
    const DataSet = module.require('DataSet');
    const Style = module.require('Style');
    const Title = module.require('Title');



    return {
        create: function (meta) {
            let tpl = new Template(meta.template);

            function fill(name, data) {
                let html = tpl.fill(name, data);

                html = html.trim();
                html = html.split('\n').join('');
                return html;
            }


            tpl.process({
                '': function () {
                    this.fix(['class', 'title', 'dataset', 'style',]);

                    let classList = [
                        meta.class,
                        meta.showTab ? '' : 'hide-tab',
                        meta.showIcon ? '' : 'hide-icon',
                        meta.showValue ? '' : 'hide-value',
                        meta.showColor ? '' : 'hide-color',
                        meta.showHover ? '' : 'hide-hover',
                    ];

                    let cssClass = Class.stringify(classList);
                    let dataset = DataSet.stringify(meta.dataset);
                    let style = Style.stringify(meta.style);
                    let items = this.fill('item', meta.list);

                    return {
                        'id': meta.id,
                        'class': cssClass,
                        'dataset': dataset,
                        'style': style,
                        'items': items,
                    };
                },


                'item': function (item, index) {
                    this.fix(['class', 'title', 'dataset', 'style',]);
                    
                    meta.emitter.fire('process', 'item', [item]);

                    let { type, childs, } = item;
                    let emptyDir = type == 'dir' && childs.length == 0 ? 'empty' : '';

                    let cssClass = Class.stringify([item.class, item.type, emptyDir, ]);
                    let dataset = DataSet.stringify(item.dataset);
                    let style = Style.stringify(item.style);
                    let title = Title.stringify(item.title);

                    let tabs = fill('tabs', item);
                    let linker = fill('linker', item);
                    let key = fill('key', item);


                    return {
                        'id': item.id,
                        'class': cssClass,
                        'dataset': dataset,
                        'style': style,
                        'title': title,
                        'tabs': tabs,
                        'linker': linker,
                        'key': key,
                    };
                },

                'tabs': function (item) {
                    let { tabs, } = item;
                    let count = 0;

                    tabs = tabs.split('').map(function (item, index) {
                        item = item.trim();
                        count++;

                        if (item.length > 0) {
                            count = 0;
                        }

                        let cls = '';


                        //首项没有内容的，也当是一个分组。
                        if ((!item && index == 0) || count == 4) {
                            cls = 'grouper';
                            count = 0;
                        }

                        let b = fill('b', {
                            'class': cls,
                            'text': item,
                        });

                        return b;
                    });

                    return { tabs, };
                },

                'linker': function (item) {
                    return item.linker ? item : '';
                },

                'key': {
                    '': function (item) {
                        let icon = this.fill('icon', item);
                        let value = this.fill('value', item); //可能返回空串。

                        return {
                            'id': item.id,
                            'key': item.key,
                            'type': item.type,
                            'icon': icon,
                            'value': value,
                        };
                    },

                    'icon': function (item) {
                        let { id, type, } = item;
                        let icon = Object.assign({}, meta.icon, item.icon);

                        icon = icon[type];

                        return icon ? { id, type, icon, } : '';
                    },

                    'value': function (item) {
                        return item.value ? item : '';
                    },
                },




            });


            return tpl;

        },

    };
});

define('TextTree.defaults', {
    //组件的 id，会生成到 DOM 元素中。
    //一般情况下不需要指定，组件内部会自动生成一个随机的。
    //如果自行指定，请保证在整个 DOM 树中是唯一的。
    id: '',

    container: '',              //
    template: '#tpl-TextTree',  //
    class: 'TextTree',          //css 类名。
    style: {},                  //生成在 DOM 节点中的内联样式。
    dataset: {},                //生成在 DOM 节点中的以 `data-` 开头的自定义属性。

    icon: {
        dir: 'fas fa-angle-down',   //目录节点的图标。 如果指定为空串，则不生成图标 html。
        file: 'far fa-circle',      //文件节点的图标。 如果指定为空串，则不生成图标 html。
    },

    //是否公开 meta 对象。
    //如果指定为 true，则外部可以通过 this.meta 来访问。
    //在某些场合需要用到 meta 对象，但要注意不要乱动里面的成员。
    meta: false,

    trimLeft: false,    //是否去除左边的4个字符，以便消除一层多余的层级。
    showValue: false,   //是否显示值的部分。
    showIcon: false,    //是否显示节点图标，以便可以展开或收起子节点。
    showTab: false,     //是否显示缩进对齐线。
    showColor: false,   //是否显示彩色。
    showHover: false,   //是否显示鼠标悬停时的背景色。
});

/**
* 文本树。
*/
define('TextTree', function (require, module, exports) {
    const Emitter = require('@definejs/emitter');
    const $ = require('$');
    const Data = module.require('Data');
    const Events = module.require('Events');
    const Meta = module.require('Meta');
    const Template = module.require('Template');


    let mapper = new Map();

    class TextTree {
        /**
        * 构造器。
        * @param {Object} config 配置项。
        */
        constructor(config) {
            config = Object.assign({}, exports.defaults, config);

            let emitter = new Emitter(this);

            let meta = Meta.create(config, {
                'this': this,
                'emitter': emitter,
            });

            meta.tpl = Template.create(meta);

            mapper.set(this, meta);

            //指定了公开 meta 对象。
            if (config.meta) {
                this.meta = meta;
            }

            this.id = meta.id;
            this.$ = meta.$;
        }

        /**
        * 渲染。
        * @param {Array} raws 数据列表。 其中列表中的每个元素为：
        *   item = {
        *       keys: [],       //必选，节点名称数组。 如 ['foo', 'bar']
        *       type: '',       //可选，节点的类型，为 `dir` 或 `file`。 如果未指定，则自动根据是否有下级节点进行推算。
        *       id: '',         //可选，会生成在 DOM 节点中。 如果指定，请确保唯一。
        *       class: '',      //可选，生成在 DOM 节点中的样式类名。
        *       dataset: {},    //可选，生成在 DOM 节点中的以 `data-` 开头的自定义属性。
        *       title: '',      //可选，生成在 DOM 节点中的 title 提示。
        *       style: {},      //可选，生成在 DOM 节点中的内联样式。
        *       value: '',      //可选，要展示的值部分，即副字段。
        *       data: {},       //可选，用户的自定义数据，仅用来存储在当前节点，以便后续用户再读取出来使用，组件内部不使用。
        *   };
        * @returns 
        */
        render(raws = []) {
            let meta = mapper.get(this);
            let { list, id$item, } = Data.make(raws, meta.trimLeft);
           
            meta.list = list;
            meta.id$item = id$item;

            //已浸染过。
            if (meta.$) {
                let html = meta.tpl.fill('item', meta.list);
                meta.$.html(html);
                return;
            }


            let html = meta.tpl.fill({});

            $(meta.container).html(html);
            meta.$ = this.$ = $(`#${meta.id}`);
            Events.bind(meta);
        }

        /**
        * 转成字符串文本。
        * @param {boolean} withValue 可选，是否带上值部分。
        *   如果不指定，则根据当前界面的状态来判断。
        */
        toString(withValue) {
            let meta = mapper.get(this);

            //如果没有指定 withValue, 则根据当前界面的状态来判断。
            if (withValue === undefined && meta.$) {
                withValue = !meta.$.hasClass('hide-value');
            }

            let texts = meta.list.map(function (item) {
                let value = withValue ? item.value : '';
                let s = `${item.tabs}${item.linker} ${item.key}`;

                if (value) {
                    s = s + ' ' + value;
                }

                return s;
            });

            let content = texts.join('\n');

            return content;
        }

        /**
        * 绑定事件。
        */
        on(...args) {
            let meta = mapper.get(this);

            meta.emitter.on(...args);
        }

        /**
        * 切换显示或隐藏指定的效果。
        * 切换展开或收起指定的节点。
        * 切换显示或隐藏整个组件。
        */
        toggle(opt) {
            let meta = mapper.get(this);

            if (!meta.$) {
                return;
            }

            switch (typeof opt) {
                //展开或收起指定的节点。
                case 'string':
                    let id = opt;
                    $(`#${id}`).find(`[data-cmd][data-id="${id}"]`).trigger('click');
                    break;
                
                //切换显示某种效果，如显示或隐藏颜色。
                case 'object':
                    Object.entries(opt).forEach(([key, visible]) => {
                        meta.$.toggleClass(`hide-${key}`, !visible);
                    });
                    break;
                
                //整个组件的显示或隐藏。
                default:
                    meta.$.toggle(opt);
                    break;
            }


        }



    }



    module.exports = exports = TextTree;
    exports.defaults = require('TextTree.defaults');
});

define('CheckBox.defaults', {
    checked: false,
    fireNow: true,
    checkedClass: 'far fa-check-square checked',
    uncheckedClass: 'far fa-square',
});

define('CheckBox', function (require, module, exports) {
    const $ = require('$');
    const $Object = require('@definejs/object');
    const Template = require('@definejs/template');
    const Emitter = require('@definejs/emitter');
    let defaults = require('CheckBox.defaults');
    
    let mapper = new Map();
    let tpl = new Template('#tpl-CheckBox');


    class CheckBox {
        constructor(config) {
            config = Object.assign({}, defaults, config);

            let emitter = new Emitter(this);

            let meta = {
                'checked': config.checked,
                'text': config.text,
                'fireNow': config.fireNow,
                'checkedClass': config.checkedClass,
                'uncheckedClass': config.uncheckedClass,

                '$': $(config.container),

                'emitter': emitter,
                'bind': false,

            };

            mapper.set(this, meta);

            
        }

        render(opt = {}) {
            let meta = mapper.get(this);
            let config = $Object.filter(opt, ['checked', 'text',]);

            Object.assign(meta, config);


            let html = tpl.fill({
                'class': meta.checked ? meta.checkedClass : meta.uncheckedClass,
                'text': meta.text,
            });


            meta.$.html(html);
            meta.$.addClass('CheckBox');

            //指定了立即触发事件。
            if (meta.fireNow) {
                meta.emitter.fire('checked', [meta.checked]);
            }

            if (!meta.bind) {
                meta.$.on('click', function (event) {
                    let checked = meta.checked = !meta.checked;
                    let $icon = meta.$.find('i');

                    //因为 class 里有空格，所以下面的写法有问题。
                    // $icon.toggleClass(meta.checkedClass, checked);
                    // $icon.toggleClass(meta.uncheckedClass, !checked);

                    if (checked) {
                        $icon.removeClass(meta.uncheckedClass);
                        $icon.addClass(meta.checkedClass);
                    }
                    else {
                        $icon.removeClass(meta.checkedClass);
                        $icon.addClass(meta.uncheckedClass);
                    }

                    meta.emitter.fire('checked', [checked]);
                });

                meta.bind = true;
            }
            
            

        }

        on(...args) {
            let meta = mapper.get(this);
            meta.emitter.on(...args);
        }

        destroy() {
            let meta = mapper.get(this);

            meta.emitter.destroy();
            meta.$ = null;
            mapper.delete(this);
        }

    }



    return CheckBox;
});

define('Dialog/Drager', function (require, module, exports) {
    const $ = require('$');
    const Masker = require('@definejs/masker');




    let x = 0;              //鼠标按下时的 pageX 值。
    let y = 0;              //鼠标按下时的 pageY 值。
    let marginLeft = 0;
    let marginTop = 0;

    let cursor = '';        //鼠标按下时的 cursor 指针值。
    let body = document.body;
    let masker = null;

    let id$meta = {};
    let meta = null;


    function stop(event) {
        body.style.cursor = cursor;
        meta && meta.$.removeClass('draging');
        masker && masker.hide();
        event && event.preventDefault();
        meta = null;
    }


    $(body).on({
        'mousedown': function (event) {
            meta = id$meta[event.target.id];

            if (!meta) {
                return;
            }

            x = event.pageX;
            y = event.pageY;

            cursor = body.style.cursor;
            body.style.cursor = 'move';

            marginLeft = meta.$.css('margin-left');
            marginTop = meta.$.css('margin-top');
            marginLeft = parseInt(marginLeft);
            marginTop = parseInt(marginTop);
            meta.$.addClass('draging');

            masker = masker || new Masker({
                opacity: 0.0,
                background: 'red',
                'z-index': 1025,
            });

            masker.show();

            //禁止选中文本
            window.getSelection().removeAllRanges();

        },

        'mousemove': function (event) {

            if (!meta) {
                return;
            }

            //鼠标左键按下去时， event.which 的值为 1。
            //拖曳 dialog 一直离开浏览器区域，松开鼠标，并不会触发 mouseup 事件。
            //然后鼠标再回到浏览器区域，mousemove 事件还是会继续触发，但 event.which 的值为 0。
            //这里，当 dialog 给拖曳到离开浏览器区域时，我们执行跟 mouseup 一样的逻辑。
            if (event.which != 1) {
                stop();
                return;
            }

            let dx = event.pageX - x;
            let dy = event.pageY - y;
            let left = marginLeft + dx;
            let top = marginTop + dy;

            meta.$.css({
                'margin-left': left,
                'margin-top': top,
            });
        },

        'mouseup': function (event) {
            stop(event);
        },
    });





    return {

        set: function (id, meta) {
            id$meta[id] = meta;
        },


        remove: function (id) {
            delete id$meta[id];
        },

    };
});

define('Dialog/Events', function (require, module, exports) {
    const $ = require('$');







    return {
        bind: function (meta) {

            //响应回车键。
            let name$fn = {
                'keyup': function (event) {
                    if (event.keyCode != 13 || !meta.visible) {
                        return;
                    }

                    event.stopPropagation();
                    meta.emitter.fire('enter', [event]);
                },
            };


            $(document.body).on(name$fn);
            $('#' + meta.id).on(name$fn);



            $('#' + meta.headerId).on('click', 'i', function () {
                meta.this.close();
            });


            $('#' + meta.footerId).on('click', 'button[data-index]', function () {
                let index = +this.getAttribute('data-index');
                let item = meta.footer.buttons[index];
                let name = item.name || String(index);

                meta.emitter.fire('button', name, [item, index]);
                meta.emitter.fire('button', [item, index]);

                // item.autoClosed 优先级高于 meta.autoClosed
                let autoClose = 'autoClose' in item ?
                        item.autoClose :
                        meta.autoClose;

                if (autoClose) {
                    meta.this.close(true);
                }
            });



        },

    };
});

define('Dialog/Meta', function (require, module, exports) {
    const $String = require('@definejs/string');






    return {
        create: function (config, others) {
            let id = 'Dialog-' + $String.random(4);
            let footer = config.footer;

            if (Array.isArray(footer)) {
                footer = {
                    'content': '',
                    'buttons': footer,
                };
            }
            else if (typeof footer == 'string') {
                footer = {
                    'content': footer,
                    'buttons': [],
                };
            }
            else {
                footer = footer || {};
            }


            let meta = {
                'dragable': config.dragable,
                'resizable': config.resizable,
                'cssClass': config.cssClass,
                'autoClose': config.autoClose,  //点击任何一个按钮后是否自动关闭组件
                'mask': config.mask,
                'z-index': config['z-index'],    //生成透明层时要用到
                'width': config.width,
                'height': config.height,
                'container': config.container,
                'title': config.title,
                'content': config.content,
                'footer': footer,
                'maxWidth': config.maxWidth,
                'minWidth': config.minWidth,
                'maxHeight': config.maxHeight,
                'minHeight': config.minHeight,
                'attributes': config.attributes,
                'masker': null,

                'id': id,
                'headerId': id + '-header',
                'contentId': id + '-content',
                'footerId': id + '-footer',
                'sizerId': id + '-sizer',

                'rendered': false,  //是否已渲染过了。
                'visible': false,   //记录当前组件是否已显示
                '$': null,          //$(this)，内部使用的一个 jQuery 对象。
                'this': this,
            };


            Object.assign(meta, others);


            return meta;


        },
    };
});

define('Dialog/Resizer', function (require, module, exports) {
    const $ = require('$');




    let x = 0;              //鼠标按下时的 pageX 值。
    let y = 0;              //鼠标按下时的 pageY 值。
    let width = 0;
    let height = 0;

    let cursor = '';        //鼠标按下时的 cursor 指针值。
    let body = document.body;

    let id$meta = {};
    let meta = null;
    let header = null;
    let sizer = null;


    function stop(event) {
        body.style.cursor = cursor;
        event && event.preventDefault();
        header && header.removeClass('resizing');

        meta = null;
        header = null;
        sizer = null;
    }

    function setSizer(width, height) {
        let html = width + ' x ' + height;
        sizer.html(html);
    }


    $(body).on({
        'mousedown': function (event) {
            let target = event.target;
            let id = target.getAttribute('data-id');
            meta = id$meta[id];

            if (!meta) {
                return;
            }

            x = event.pageX;
            y = event.pageY;

            cursor = body.style.cursor;
            body.style.cursor = $(target).css('cursor');

            width = meta.$.css('width');
            height = meta.$.css('height');
            width = parseInt(width);
            height = parseInt(height);

            header = $('#' + meta.headerId);
            header.addClass('resizing');

            sizer = $('#' + meta.sizerId);
            setSizer(width, height);

            return false; //禁止选中文本
        },

        'mousemove': function (event) {
            if (!meta) {
                return;
            }

            //鼠标左键按下去时， event.which 的值为 1。
            //拖曳 dialog 一直离开浏览器区域，松开鼠标，并不会触发 mouseup 事件。
            //然后鼠标再回到浏览器区域，mousemove 事件还是会继续触发，但 event.which 的值为 0。
            //这里，当 dialog 给拖曳到离开浏览器区域时，我们执行跟 mouseup 一样的逻辑。
            if (event.which != 1) {
                stop();
                return;
            }

            let dx = event.pageX - x;
            let dy = event.pageY - y;

            let w = width + dx;
            let h = height + dy;

            let maxWidth = meta.maxWidth;
            if (maxWidth && w > maxWidth) {
                w = maxWidth;
            }

            let minWidth = meta.minWidth;
            if (minWidth && w < minWidth) {
                w = minWidth;
            }

            let maxHeight = meta.maxHeight;
            if (maxHeight && h > maxHeight) {
                h = maxHeight;
            }

            let minHeight = meta.minHeight;
            if (minHeight && h < minHeight) {
                h = minHeight;
            }


            meta.$.css({
                'width': w,
                'height': h,
            });

            setSizer(w, h);
        },

        'mouseup': function (event) {
            stop(event);
        },
    });





    return {
        set: function (id, meta) {
            id$meta[id] = meta;
        },

        remove: function (id) {
            delete id$meta[id];
        },

    };
});

/**
* 
*/
define('Dialog/Style', function (require, module, exports) {
    const $Object = require('@definejs/object');
    

    function getMargin(value) {
        value = parseInt(value);
        value = 0 - value / 2;
        return value + 'px';
    }

    

    return {
        get: function (data) {

            var style = $Object.filter(data, [
                'height',
                'width',
                'z-index',
            ]);

            //根据宽度计算 margin-left 和 margin-top，使其居中。
            var width = style.width;
            if (width) {
                style.width = parseInt(width) + 'px';
                style['margin-left'] = getMargin(width);
            }
            else {
                delete style.width;
            }

            var height = style.height;
            if (height) {
                style.height = parseInt(height) + 'px';
                style['margin-top'] = getMargin(height);
            }
            else {
                delete style.height;
            }





            var list = [];
            for (var key in style) {
                var value = style[key];
                var item = key + ': ' + value;
                list.push(item);
            }

            style = list.join('; ') + ';';

            return style;
        },
    };


});




define('Dialog/Template', function (require, module) {
    const Template = require('@definejs/template');

    let tpl = new Template('#tpl-Dialog');

    tpl.process({
        '': function (data) {
            let header = this.fill('header', data);
            let content = this.fill('content', data);
            let footer = this.fill('footer', data);

            let attributes = Object.entries(data.attributes).map(function (item) {
                return item[0] + '="' + item[1] + '"';
            });


            //因为原 html 中的 sample 给处理后 没有等号的属性值会给替换成有空值的属性值。
            //如 {attributes} 会给替换成 {attributes}=""，这不是我们想要的。
            //这里我们手动替换回来。
            this.fix('attributes');

            return {
                'id': data.id,
                'headerId': data.headerId,
                'contentId': data.contentId,
                'footerId': data.footerId,
                'attributes': attributes.join(' '),
                'cssClass': data.cssClass,
                'style': data.style,

                'header': header,
                'content': content,
                'footer': footer,
            };
        },

        'header': function (data) {
            return {
                'title': data.title,
                'sizerId': data.sizerId,
            };
        },

        'content': function (data) {
            return data.content;
        },


        'footer': {
            '': function (data) {

                let footer = data.footer;

                let content = this.fill('content', footer);
                let buttons = this.fill('buttons', footer);
                let resizer = this.fill('resizer', data);

                return {
                    'content': content,
                    'buttons': buttons,
                    'resizer': resizer,
                };
            },

            'content': function (data) {
                return data.content;
            },

            'buttons': {
                '': function (data) {
                    let buttons = data.buttons;
                    if (!buttons || buttons.length == 0) {
                        return '';
                    }


                    buttons = this.fill('button', buttons);

                    return {
                        'buttons': buttons,
                    };
                },

                'button': function (item, index) {
                    return {
                        'index': index,
                        'text': item.text,
                        'cssClass': item.cssClass || '',
                    };
                },
            },
           
            'resizer': function (data) {
                if (!data.resizable) {
                    return '';
                }

                return {
                    'id': data.id,
                };
            },
        },
        
    });


    return tpl;



});



define('Dialog.defaults', {
    cssClass: '',

    /**
    * 是否启用 mask 层。
    */
    mask: true,

    /**
    * 组件的标题文本。
    */
    title: '',

    /**
    * 组件的内容文本。
    */
    content: '',

    /**
    * 组件宽度（单位为像素）。
    */
    width: 0,

    /**
    * 组件高度（单位为像素）。
    */
    height: 0,

    'z-index': 1024,

    maxWidth: 0,
    maxHeight: 0,

    minWidth: 200,
    minHeight: 160,

    dragable: true,
    resizable: true,

    autoClose: true, //点击底部任一按钮时自动关闭组件。

    attributes: {},

    footer: {
        content: '',
        buttons: [],
    },
});



define('Dialog', function (require, module, exports) {
    const $ = require('$');

    const Emitter = require('@definejs/emitter');
    const Masker = require('@definejs/masker');
    const Panel = require('@definejs/panel');

    const Meta = module.require('Meta');
    const Template = module.require('Template');
    const Drager = module.require('Drager');
    const Resizer = module.require('Resizer');
    const Style = module.require('Style');
    const Events = module.require('Events');

    let defaults = require('Dialog.defaults');

    let mapper = new Map();




    function Dialog(config) {
        config = Object.assign({}, defaults, config);

        let emitter = new Emitter(this);

        let meta = Meta.create(config, {
            'this': this,
            'emitter': emitter,
        });

        mapper.set(this, meta);

        this.id = meta.id;
        this.$ = meta.$;

    }




    Dialog.prototype = {
        constructor: Dialog,

        id: '',
        $: null,

        render: function (options) {
            options = options || {};

            let meta = mapper.get(this);
            let emitter = meta.emitter;

            if (meta.rendered) { //已渲染过。
                this.set(options);
                this.show();
                emitter.fire('render', [options]);
                return;
            }

            //首次渲染。
            let title = meta.title = options.title || meta.title;
            let content = meta.content = options.content || meta.content;
            let footer = meta.footer = options.footer || meta.footer;
            let style = Style.get(meta);
            let headerId = meta.headerId;

            let html = Template.fill({
                'id': meta.id,
                'headerId': headerId,
                'contentId': meta.contentId,
                'footerId': meta.footerId,
                'sizerId': meta.sizerId,
                'cssClass': meta.cssClass,
                'resizable': meta.resizable,
                'attributes': meta.attributes,
                'style': style,
                'title': title,
                'content': content,
                'footer': footer,
            });

            $(document.body).prepend(html);
            meta.rendered = true;           //更改状态。

            this.$ = meta.$ = $('#' + meta.id);  //
            meta.$.toggleClass('auto-size', !meta.width || !meta.height);
            

            if (meta.mask) {
                meta.masker = new Masker({
                    'z-index': meta['z-index'] - 1,
                });
            }

            if (meta.dragable) {
                Drager.set(headerId, meta);
            }

            if (meta.resizable) {
                Resizer.set(meta.id, meta);
            }

            Events.bind(meta);
            this.show();

            emitter.fire('first-render', [options]);
            emitter.fire('render', [options]);
        },

        /**
        * 显示本组件。
        */
        show: function () {
            let meta = mapper.get(this);

            //尚未渲染或已是可见状态。
            if (!meta.rendered || meta.visible) {
                return;
            }

            let masker = meta.masker;
            if (masker) {
                let mask = Masker.normalize(meta.mask);
                masker.show(mask);
            }

            meta.$.show();
            meta.visible = true;
            meta.emitter.fire('show');

        },

        /**
        * 关闭本组件(仅隐藏)。
        */
        close: function (sure) {
            let meta = mapper.get(this);

            //尚未渲染或已是隐藏状态。
            if (!meta.rendered || !meta.visible) {
                return;
            }

            let emitter = meta.emitter;

            if (!sure) {
                let values = emitter.fire('before-close');
                sure = values.slice(-1)[0];
                if (sure === false) { //只有在事件中明确返回 false 才取消关闭。
                    return;
                }
            }
            

            let masker = meta.masker;

            masker && masker.hide();
            meta.$.hide();
            meta.visible = false;
            emitter.fire('close');
        },




        set: function (key, value) {
            let data = typeof key == 'object' ? key : { [key]: value, };
            let meta = mapper.get(this);

            let key$tpl = {
                title: 'header',
                content: 'content',
                footer: 'footer',
            };


            for (key in data) {
                let tpl = key$tpl[key];
                
                if (tpl) {
                    let html = Template.fill(tpl, data);
                    let sid = meta[tpl + 'Id']; //headerId、contentId、footerId。

                    $('#' + sid).html(html);

                    continue;
                }


                value = data[key];

                switch (key) {
                    case 'width':
                    case 'height':
                        meta.$.css(key, value);
                        break;
                }
            }

        },


        on: function (name, fn) {
            let meta = mapper.get(this);
            let emitter = meta.emitter;
            let args = Array.from(arguments);
            emitter.on(args);
        },

        destroy: function () {
            let meta = mapper.get(this);

            //已销毁。
            if (!meta) {
                return;
            }

            meta.emitter.destroy();
            meta.masker.destroy();
            meta.$.off();

            let div = meta.$.get(0);
            div.parentNode.removeChild(div);

            Drager.remove(meta.headerId);
            Resizer.remove(meta.id);
        },
    };


    //静态方法。
    Object.assign(Dialog, {

        /**
        * 根据创建好的 panel 对应去填充对话框中相应的区域，同时会保留原 panel 中原有的逻辑和事件等。
        * 以使用户可以以熟悉的模块化方式去操纵对话框中的内容， 如模板填充、事件绑定等。
        */
        panel: function (options) {
            let Content = options.content;
            let Container = options.container;
            let Footer = options.footer; //可能是一个数组或 DOM 节点。

            let content = Content.$.get(0);
            let container = Container.$.get(0);
            let footer = Footer && !Array.isArray(Footer) ? Footer.$.get(0) : null; //DOM 节点。

            let attributes = {};

             Array.from(container.attributes).map(function (item) {
                let name = item.name;
                if (name == 'class') {
                    return;
                }

                attributes[name] = item.value;
            });


            let config = Object.assign({}, options, {
                'content': content.outerHTML,
                'cssClass': container.className,
                'attributes': attributes,
            });

            config['footer'] = footer ? footer.outerHTML : Footer;

           

            let dialog = new Dialog(config);

      

            dialog.on({
                'first-render': function () {
                    //删除 panel 中对应原先的 DOM 节点，
                    container.parentNode.removeChild(container);
                    content.parentNode.removeChild(content);
                    footer && footer.parentNode.removeChild(footer);

                    //重新绑定到对应原 Panel 中。
                    Container.set('$');


                    let moduleId = container.getAttribute('data-panel');
                    let selector = `[data-panel^="${moduleId}"]`;
                    let list = Container.$.find(selector).toArray();

                    list = list.map(function (item) {
                        return item.getAttribute('data-panel');
                    });


                    Panel.update(list);

                    container = null;
                    content = null;
                    footer = null;

                },
            });

            return dialog;

        },
    });



    return Dialog;
});


define('DropCheckList/Events', function (require, module, exports) {
    const $ = require('$');

    



    return {
        bind: function (meta) {
            if (meta.binded) {
                return;
            }


            meta.binded = true;

            meta.$.on('click', `button`, function (event) {
                if (meta.visible) {
                    meta.masker.hide();
                }
                else {
                    meta.masker.show();
                }
            });

            //点击全选。
            meta.$.on('click', '[data-id="chk-all"]', function (event) {
                let { list, all, tpl, emitter, $list, } = meta;
                let checked = !all.checked;

                all.fill(checked);

                let html = tpl.fill('item', list);
                $list.html(html);

                emitter.fire('check', 'all', [checked, list]);
                emitter.fire('check', [list]);
            });
           
            meta.$.on('click', 'li[data-index]', function (event) {
                let { list, all, tpl, emitter, } = meta;
                let index = +this.dataset.index;
                let item = list[index];

                item.checked = !item.checked;

                all.fill();

                let html = tpl.fill('item', item, index);
                this.outerHTML = html;

                emitter.fire('check', 'item', [item, index, list]);
                emitter.fire('check', [list]);

            });

        },

    };
});

define('DropCheckList/Masker', function (require, module, exports) {
    const Masker = require('@definejs/masker');


    return {
        create: function (meta) {
            let masker = new Masker({
                volatile: true, //易消失。
                opacity: 0,
                //opacity: 0.04,
            });


            masker.on({
                'show': function () {
                    meta.$.addClass('show');
                    meta.visible = true;
                    meta.$main.slideDown(80);
                    

                },

                'hide': function () {
                    meta.$.removeClass('show');
                    meta.visible = false;

                    meta.$main.slideUp(50);

                },
               
            });


            return masker;

        },

    };
});

/**
* 
*/
define('DropCheckList/Meta', function (require, module, exports) {
    const IDMaker = require('@definejs/id-maker');

    let idmaker = new IDMaker(module.parent.id);


    return {

        create: function (config, others) {
            let { container, list, text, } = config;

            let meta = {
                'id': idmaker.next(),

                '$': null,
                'this': null,
                'emitter': null,
                'masker': null,
                'tpl': null,
                '$main': null,
                '$list': null,
                '$container': $(container),

                'text': text,
                'width': config.width || 'auto',
                'maxTextWidth': 0,          //根据 text 计算出的最大宽度。
                'container': container,
                'list': list || [],

                'binded': false,
                'visible': false,
                
                all: {
                    $: null,
                    text: '全选',
                    checked: false,

                    fill(checked) {
                        let { all, list, tpl, } = meta;

                        let total = list.length;
                        let count = 0;

                        //指定了具体的值，则把列表的都统一为该值。
                        if (typeof checked == 'boolean') {
                            count = checked ? total : 0;
                            all.checked = checked;

                            list.forEach((item) => {
                                item.checked = checked;
                            });
                        }
                        else {
                            list.forEach((item) => {
                                if (item.checked) {
                                    count++;
                                }
                            });

                            checked = all.checked = count > 0 && count == total;
                        }

                        let html = tpl.fill('all', {
                            'text': all.text,
                            'checked': checked,
                            'count': count,
                            'total': total,
                        });

                        meta.$.toggleClass('not-all-checked', !checked);

                        all.$.html(html);

                    }

                },
                
            };


            Object.assign(meta, others);


           

            return meta;
           
        },


    };
    
});





define('DropCheckList/Template', function (require, module) {
    const $String = require('@definejs/string');
    const Template = require('@definejs/template');


    return {

        create: function (meta) {

            let tpl = new Template('#tpl-DropCheckList');


            tpl.process({
                '': function () {
                    return {
                        'id': meta.id,
                        'text': meta.text,
                    };
                   
                },

                'all': function (data) {

                    return {
                        'checked': data.checked ? 'checked' : '',
                        'icon': data.checked ? 'check-' : '',
                        'text': data.text,
                        'count': data.count,
                        'total': data.total,

                    };
                },

                'item': function (item, index) {
                    let { text, checked, } = item;
                    let width = $String.getByteLength(text) * 8;


                    meta.maxTextWidth = Math.max(width, meta.maxTextWidth);


                    return {
                        'index': index,
                        'text': text,
                        'checked': checked ? 'checked' : '',
                        'icon': checked ? 'check-' : '',
                    }
                    
                },

            });


            return tpl;
        },
    };



});



define('DropCheckList.defaults', {
    

});

define('DropCheckList', function (require, module, exports) {
    const Emitter = require('@definejs/emitter');
    const Meta = module.require('Meta');
    const Template = module.require('Template');
    const Events = module.require('Events');
    const Masker = module.require('Masker');

    const defaults = require('DropCheckList.defaults');
    const mapper = new Map();


    class DropCheckList {
        constructor(config) {
            config = Object.assign({}, defaults, config);

            let emitter = new Emitter(this);

            let meta = Meta.create(config, {
                'emitter': emitter,
                'this': this,
            });


            mapper.set(this, meta);

            Object.assign(this, {
                'id': meta.id,
                '$': meta.$,
            });

        }


        render(list) {
            let meta = mapper.get(this);

            if (list) {
                meta.list = list;
            }

            //已经渲染过了，直接填充即可。
            if (meta.$) {
                this.fill();
                return;
            }

            let tpl = meta.tpl = Template.create(meta);
            let html = tpl.fill({});
            let $container = $(meta.container);

            $container.html(html);

            meta.$ = this.$ = $(`#${meta.id}`);
            meta.$main = meta.$.find('[data-id="main"]');
            meta.all.$ = meta.$.find('[data-id="all"]');
            meta.$list = meta.$.find('[data-id="list"]');
            meta.masker = Masker.create(meta);

            Events.bind(meta);

            this.fill();
            
        }

        fill(list) {
            let meta = mapper.get(this);

            list = meta.list = list || meta.list;

            let width = meta.width;
            let html = meta.tpl.fill('item', list);

            meta.all.fill();
            meta.$list.html(html);

            if (width == 'auto') {
                width = meta.maxTextWidth + 50;
            }

            if (width > 0) {
                width = Math.max(width, 110);
                meta.$main.width(width);
                meta.all.$.width(width);
            }

            meta.emitter.fire('fill', [list]);

           

        }

        on(...args) {
            let meta = mapper.get(this);
            meta.emitter.on(...args);
        }
    }

    return DropCheckList;
});

/**
* 记录当前的状态，包括选中的项、表格行等。
*/
define('DropList/Current', function (require, module, exports) {


    let defaults = {
        'item': null,
        'row': null,
        'event': null,  //通过 UI 选中的会有相应的事件对象。
        'hover': null,  //hover row
        'keyword': '',  //关键词。
        'html': '',     //keyword 对应的 html。
    };



    return {
        create: function () {
            return Object.assign({}, defaults);
        },


        reset: function (meta, obj) {
            obj = obj || {};

            //let hover = obj.hover;

            ////说明要重置 hover 字段为 null，为避免丢失，
            ////则先清掉之前可能存在的 hover 样式。
            //if (!hover) {
            //    meta.this.hover(-1);
            //}

            Object.assign(meta.current, defaults, obj);

            meta.this.hover(0);
        },

    };
});

define('DropList/Field', function (require, module, exports) {


    function getValue(item, key) {
        return typeof key == 'function' ? key(item) : item[key];
    }




    return {
        map: function (field, list) {
            list = list || [];

            if (!field) {
                return list;
            }


            list = list.map(function (item) {
               
                let id = field.id ? getValue(item, field.id) : '';
                let title = field.title ? getValue(item, field.title) : '';

                return {
                    'id': id,
                    'title': title,
                    'item': item,
                    'disabled': false,
                };
            });

            return list;

        },


    };
});

//默认过滤器。

define('DropList/Filter', function (require, module, exports) {

    function find(item, keys, keyword) {
        let len = keys.length;

        for (let i = 0; i < len; i++) {
            let key = keys[i];
            let ignoreCase = false; //是否忽略大小写。

            // { name: '', ignoreCase: true }
            if (typeof key == 'object') {
                let opt = key;

                key = opt.name;
                ignoreCase = opt.ignoreCase;
            }


            let value = item[key];

            if (typeof value == 'number') {
                value = String(value);
            }

            //搜索下一个字段值。
            if (typeof value != 'string') {
                continue;
            }
            
            //指定了不区分大小写。
            if (ignoreCase) {
                value = value.toLowerCase();
                keyword = keyword.toLowerCase();
            }

            //已找到。
            if (value.includes(keyword)) {
                return true;
            }
        }

        //如果没找到，必须明确返回 false。
        return false;
    }




    return {
        bind: function (meta) {
            let filters = meta.filters;

            meta.this.on('change', function (keyword) {

                this.fill(meta.list, keyword, function (item, index) {

                    //不需要过滤时，则只高亮关键词。
                    if (!filters) {
                        return true;
                    }

                    return find(item, filters, keyword);

                });

              
            });

        },

    };
});

define('DropList/Input', function (require, module, exports) {
    const $ = require('$');


    //如果指定了
    function checkFocus(meta) {
        let field = meta.field;
        let item = meta.current.item;

        if (!field || !field.focus || !item) {
            return;
        }

     
        let text = meta.getValue(item.item, field.focus);

        meta.this.set('text', text);
        meta.this.select();
    }



    function checkBlur(meta) {
        let field = meta.field;
        let item = meta.current.item;

        if (!field || !field.text || !item) {
            return;
        }

        let text = meta.getValue(item.item, field.text);
        meta.this.set('text', text);
    }




    return {
        create: function (meta) {
            let txt = document.getElementById(meta.txtId);
            let $txt = $(txt);
            let compositing = false;            //针对中文输入法，为 true 表示正在输入而未选中汉字。



            //文本输入框中的事件。
            $txt.on({
                'focus': function () {
                    if (meta.disabled) {
                        return;
                    }

                    meta.masker.show();
                    checkFocus(meta);

                },

                'blur': function () {
                    if (meta.hovering) {
                        return;
                    }

                    meta.masker.hide();
                    checkBlur(meta);
                },

                'click': function (event) {
                  
                },


                'input': function () {
                    if (compositing) {
                        return;
                    }

                    meta.change();
                },

                'compositionstart': function (event) {
                    compositing = true;
                },

                'compositionend': function (event) {
                    compositing = false;
                    meta.change();
                },

                //针对键盘的向上键和向下键来移动、回车键来选取。
                'keydown': function (event) {
                    let keyCode = event.keyCode;
                    let current = meta.current;
                    let hover = current.hover; //row


                    //回车键。
                    if (keyCode == 13) {
                        current.event = event; //模拟手动选中。
                        hover && meta.this.select(hover.index);
                        txt.blur();
                        return;
                    }

                    //
                    let index = hover ? hover.index : -1;
                    let isUp = keyCode == 38;       //向上键。
                    let isDown = keyCode == 40;     //向下键。
                    let max = meta.length - 1;

                    if (isUp || isDown) {

                        index = isUp ? index - 1 : index + 1;

                        //使可以上下循环移动
                        if (index < 0) {
                            index = max;
                        }
                        else if (index > max) {
                            index = 0;
                        }


                        meta.this.hover(index);
                        event.preventDefault();
                    }




                },
            });

            return txt;
        },

    };
});

define('DropList/Masker', function (require, module, exports) {
    const Masker = require('@definejs/masker');


    return {
        create: function (meta) {

            let masker = new Masker({
                'volatile': true, //易消失。
                'opacity': meta.mask,
                'container': meta.dialog,
                'position': 'absolute',     //这里用回绝对定位。
            });


            masker.on({
                'show': function () {
                    meta.$.addClass('on');
                    meta.visible = true;

                    meta.adjust();
                    meta.$table.get(0).scrollIntoViewIfNeeded(); //在对话框环境中，可能会给遮挡住了。

                    let row = meta.current.row;
                    row && row.element.scrollIntoViewIfNeeded();

                    meta.emitter.fire('focus');
                },

                'hide': function () {
                    let item = meta.old.item;
                    let isEmpty = meta.txt.value === '';

                    if (isEmpty && !meta.empty && item) {
                        meta.this.fill(meta.list);
                        meta.this.select(item);
                    }

                    //是否非法的: true 表示非法。 false 表示合法。
                    let invalid =
                          !meta.custom &&         //不允许自定义输入。
                          !meta.current.item &&   //尚未选中任何项。
                          !!meta.text;              //输入框中有内容。


                    if (invalid) {
                        meta.$txt.addClass('error');
                        
                        definejs.alert('输入的数据不存在，请重新输入。', function () {
                            meta.txt.focus();
                        });
                        return false; //返回 false 阻止 masker 关闭。
                    }



                    meta.$.removeClass('on');
                    meta.visible = false;
                    meta.emitter.fire('blur');



                    //if (invalid) {
                    //    meta.$txt.addClass('error');
                    //    meta.txt.focus();
                    //    //meta.emitter.fire('error', ['custom', '输入的数据不存在，请重新输入。']);


                    //    setTimeout(function () {
                    //        meta.txt.focus();
                    //    }, 100);

                    //    //definejs.alert('输入的数据不存在，请重新输入。', function () {
                    //    //    meta.txt.focus();

                    //    //});
                    //}
                },
               
            });


            return masker;

        },

    };
});

/**
* 
*/
define('DropList/Meta', function (require, module, exports) {
    const $String = require('@definejs/string');
    const $ = require('$');


    return {

        create: function (config, others) {
            let filters = config.filters;
            let columns = config.columns;

            //如果指定为 true，则跟 columns 中的字段一样的。
            if (filters === true) { 
                filters = columns || null;
            }


            let meta = {
                'id': $String.random(),
                'txtId': $String.random(),
                'tableId': $String.random(),

                '$': null,
                '$table': null, //$(tableId)
                '$txt': null,   //$(txt)
                'txt': null,
                'this': null,

                'emitter': null,
                'table': null,
                'masker': null,
                'tpl': null,


                'container': config.container,
                'cssClass': config.cssClass,
                'tableClass': config.tableClass,
                'text': config.text,
                'readonly': config.readonly,
                'disabled': config.disabled,
                'custom': config.custom,
                'order': config.order,          //是否自动增加一列作为序号列。
                'empty': config.empty,          //是否允许为空。
                'mask': config.mask,
                'dialog': config.dialog,
                'field': config.field,

                'tabIndex': config.tabIndex,
                'maxLength': config.maxLength,

                'columns': columns,
                'filters': filters,             //要进行过滤的字段名。 如果指定则在组件内部进行关键词过滤。
                'direction': '',                //要展示的方向。 在页面右边位置不够时，要加 `right` 类，但只需要检测一次。
                'visible': false,               //下拉列表是否可见。
                'hovering': false,              //记录鼠标是否正在列表项中悬停。
                'list': [],                     //用来存放本地过滤的列表数据。
                'length': 0,                    //总记录数。

                'current': {},
                'old': {},         //最后一次有选中项的状态，结构跟 current 一样，主要用于清空后的恢复。

                'getValue': function (item, key) {
                    return typeof key == 'function' ? key(item) : item[key];
                },

                'change': function (value) {
                    let hasArgs = arguments.length > 0;
                    let txt = meta.txt;
                    let $txt = $(txt);

                    value = hasArgs ? String(value) : txt.value;

                    if (value === meta.text) {
                        return;
                    }


                    let isEmpty = value === '';
                    $txt.removeClass('error');
                    meta.text = txt.title = value;

                    //内部输入的不需要重新写值，否则会导致光标一直在最后。
                    if (hasArgs) {
                        txt.value = value;
                    }

                    //外面传进来值，说明是手动调用 this.set('text', value) 的引起的，不需要再触发事件。
                    //即是说，只有在输入框中手动输入内容时才会触发事件。
                    if (!hasArgs) {
                        meta.emitter.fire('change', [value]);
                    }

                    if (isEmpty) {
                        meta.emitter.fire('empty', []);
                    }

                    //这个放在事件触发的后面。
                    txt.placeholder = meta.current.item && isEmpty ? '(无内容)' : '';
                },

                //调整列表展示的方向。
                //要在显示之后再计算位置。
                //在页面右边位置不够时，要加 `right` 类，但只需要检测一次。
                'adjust': function () {
                    if (!meta.visible) {
                        return;
                    }

                    meta.$.removeClass('right');    //先移除，以避免影响。

                    let width = meta.$table.outerWidth();
                    let max = $(meta.dialog).width();

                    let left1 = meta.$table.offset().left;
                    let left2 = $(meta.dialog).offset().left;
                    let left = left1 - left2;

                    let direction = meta.direction = left + width > max ? 'right' : 'left';

                    meta.$.toggleClass('right', direction == 'right');
                },
            };


            Object.assign(meta, others);


           

            return meta;
           
        },


    };
    
});




/**
* 
*/
define('DropList/Table', function (require, module, exports) {
    const Escape = require('@definejs/escape');
    const Table = require('Table');


    return {

        create: function (meta) {

            let fields = meta.columns.map(function (name) {
                return { 'name': name, };
            });

            let table = new Table({
                'container': '#' + meta.tableId,
                'fields': fields,
                'order': meta.order,
                'class': meta.tableClass,
                'columnName': 'name',
            });


            table.on('process', {
                'row': function (row) {
                    let title = meta.field.title;


                    if (title) {
                        row.title = meta.getValue(row.data.item, title);
                    }
                },
                'cell': function (cell) {
                    let values = meta.emitter.fire('process', [cell]);
                    let text = values.slice(-1)[0];

                    //未返回值，则取字段中的。
                    if (text === undefined) {
                        text = cell.row.data.item[cell.name];
                        text = text == null ? '' : text;    //null、undefined 转为 ''。
                        text = Escape.html(text); //避免 xss 注入。
                    }

                    let current = meta.current;
                    let keyword = current.keyword;

                    //让候选项指向含有关键词的第一项，并且只需要设置一次。
                    if (text.includes(keyword) && current.index < 0) {
                        current.index = cell.row.index;
                    }


                    //如果指定了关键词，则进行关键词高亮。
                    if (keyword) {
                        text = String(text).split(keyword).join(current.html); //replaceAll
                    }

                    return text;
                },
            });


            table.on('fill', function (list) {
                let length = meta.length = list.length;
                let index = Math.max(meta.current.index, 0);

                meta.$table.removeClass('loading').toggleClass('nodata', !length);
                meta.$txt.removeClass('error'); //移除输入框中的错误提示。
                meta.this.hover(index);

                meta.adjust();
            });

            table.on('render', function () {
                this.$.on('mouseover', function () {
                    meta.hovering = true;
                });

                this.$.on('mouseout', function () {
                    meta.hovering = false;
                });

            });


            table.on('click', {
                //表格行的点击事件。
                'row': function (row, event) {
                    //用于传递到业务层，以识别是手动选中触发的。
                    meta.current.event = event;
                    meta.this.select(row.index);
                },
            });


            return table;
           
        },

        /**
        * 根据指定的 item，从 table 中获取对应的 row。
        */
        getRow: function (table, item) {
            let rows = table.get('rows');
            let type = typeof item;

            //重载 getRow(table, index); 
            if (type == 'number') {
                return rows[item];
            }


            //重载 getRow(table, fn); 
            if (type == 'function') {
                return rows.find(function (row, index) {
                    return item(row.data, index);
                });
            }

            if (!item) {
                return null;
            }


            //重载 getRow(table, id);
            let id = item;


            //重载 getRow(table, item);
            if (type == 'object') {
                id = String(item.id); //后台的数据类型并不是十分严格，有可能为数字类型的 0。
            }

            return rows.find(function (row, index) {
                return row.data.id == id;
            });


        },
    };
    
});





define('DropList/Template', function (require, module) {
    const Template = require('@definejs/template');


    return {

        create: function (meta) {

            let tpl = new Template('#tpl-DropList');


            tpl.process({
                '': function () {

                    //因为原 html 中的 sample 给处理后 没有等号的属性值会给替换成有空值的属性值。
                    //如 {readonly} 会给替换成 {readonly}=""，这不是我们想要的。
                    //这里我们手动替换回来。
                    this.fix(['maxlength', 'readonly', 'disabled', 'tabIndex']);

                    let tabIndex = meta.tabIndex;
                    let maxLength = meta.maxLength;

                    tabIndex = tabIndex ? 'tabindex="' + tabIndex + '"' : '';
                    maxLength = maxLength ? 'maxlength="' + meta.maxLength + '"' : '';

                    return {
                        'txtId': meta.txtId,
                        'tableId': meta.tableId,
                        'text': meta.text,
                        'readonly': meta.readonly ? 'readonly' : '',
                        'disabled': meta.disabled ? 'disabled' : '',

                        'tabindex': tabIndex,
                        'maxlength': maxLength,

                    };
                },

            });


            return tpl;
        },
    };



});



//注意：
//factory 用工厂函数的形式是最安全的，便于 wepbart 统计工具进行分析。
//因为如果用立即执行的方式，涉及到浏览器环境的变量时，webpart 统计工具会失效。
//因此最安全可靠的方式是把导出对象放在工厂函数里。
define('DropList.defaults', function (require, module, exports) {
    return {
        cssClass: 'DropList',
        tableClass: '',
        text: '',
        readonly: false,
        disabled: false,
        custom: false,
        order: false,            //是否自动增加一列作为序号列。
        empty: false,           //是否允许为空。
        mask: 0,
        dialog: document.body,  //这里用到了浏览器的环境，为了便于 webpart 工具统计，要放在一个 factory 工厂函数中。
        columns: [],
        field: null,
        filters: true,
        container: null,

        tabIndex: '',
        maxLength: 0,           //0 表示不限制。
    };
});


/**
*
* 带输入文本框的下拉列表组件。
*/
define('DropList', function (require, module) {
    const $ = require('$');
    
    const Emitter = require('@definejs/emitter');
    const $Array = require('@definejs/array');
    const $Object = require('@definejs/object');

    const Current = module.require('Current');
    const Field = module.require('Field');
    const Filter = module.require('Filter');
    const Input = module.require('Input');
    const Masker = module.require('Masker');
    const Meta = module.require('Meta');
    const Table = module.require('Table');
    const Template = module.require('Template');

    const defaults = require('DropList.defaults');
    let mapper = new Map();


    function DropList(config) {
        config = Object.assign({}, defaults, config);


        let emitter = new Emitter(this);
        let current = Current.create();

        let meta = Meta.create(config, {
            'emitter': emitter,
            'current': current,
            'this': this,
        });

  
        mapper.set(this, meta);

        Object.assign(this, {
            'id': meta.id,
            '$': meta.$,
            'meta': meta,
        });

        //绑定默认过滤器。
        Filter.bind(meta);
      
    }



    DropList.prototype = { //实例方法
        constructor: DropList,

        id: '',
        $: null,

        /**
        * 
        */
        render: function (list) {
            let meta = mapper.get(this);
            let tpl = meta.tpl = Template.create(meta);
            let html = tpl.fill(meta);

            meta.$ = this.$ = $(meta.container);
            meta.$.html(html);
            meta.$.addClass(meta.cssClass);
        
            let table = meta.table = Table.create(meta);
            table.render();

            meta.txt = Input.create(meta);
            meta.masker = Masker.create(meta);

            meta.$table = $('#' + meta.tableId);
            meta.$txt = $(meta.txt);

            list && this.fill(list);
        },


        /**
        * 填充下拉列表部分。
        * 已重载 fill(list);
        * 已重载 fill(list, fn);
        * 已重载 fill(list, keyword);
        * 已重载 fill(list, keyword, fn);
        * 如果指定了关键词，则进行关键词高亮。
        * 如果指定了处理函数或过滤，则进处数据的处理转换或过滤。
        */
        fill: function (list, keyword, fn) {
            //重载 fill(list, fn);
            if (typeof keyword == 'function') {
                fn = keyword;
                keyword = '';
            }

            let meta = mapper.get(this);

            list = $Array.map(list, function (item, index) {
                if (!fn) {
                    return item;
                }

                let value = fn.call(meta.this, item, index);

                return value === false ? null :
                    typeof value == 'object' ? value : item;
            });

            if (!keyword) {
                meta.list = list;
            }

            //要填充的最终列表。
            let items = Field.map(meta.field, list);
            let html = keyword ? meta.tpl.fill('keyword', { keyword, }) : '';
            let current = meta.current;

            current.item && Object.assign(meta.old, current);

            Current.reset(meta, {
                'keyword': keyword,
                'html': html,
                'index': -1,    //重置一下。
            });
           
            meta.table.fill(items);
            meta.emitter.fire('fill', [list]);
        },



        /**
        * 从下拉列表中选择指定的项。
        * 或选中文本框内的文本。
        * 已重载 select() 选中文本框内的文本。
        * 已重载 select(index) 从下拉列表中选择指定索引值的项。
        * 已重载 select(id) 从下拉列表中选择指定id 值的项。
        * 已重载 select(fn) 从下拉列表中选择符合条件的项。
        */
        select: function (options) {
            let meta = mapper.get(this);
            let txt = meta.txt;

            //重载 select(); 选中并返回文本框内的文本值。
            if (arguments.length == 0) {
                txt.select();
                return txt.value;
            }

            //选择指定的项。
            let row = Table.getRow(meta.table, options);

            if (!row) {
                console.warn('要选择的项无法找到:', options);
                return;
            }


            let item = row.data;

            if (item.disabled) {
                console.warn('要选择的项已给禁用:', item);
                return;
            }


            let current = meta.current;

            //选中的是同一项。
            if (current.item === item) {
                meta.masker && meta.masker.hide(); //可能已给 destroy();
                console.warn('要选择的项已给选中:', item);
                return;
            }


            //选中的不是同一项。
            let oldRow = current.row;
            let oldItem = current.item;
            let event = current.event;

            current.row = row;
            current.item = item;
            current.event = null; //清空一下，避免影响下次。

            oldRow && $(oldRow.element).removeClass('on');

            $(row.element).addClass('on');
            meta.$txt.removeClass('error');         //移除输入框中的错误提示。
            row.element.scrollIntoViewIfNeeded();

            this.hover(row.index);

            //手动选中的，让视觉上有个选中的效果。
            event && setTimeout(function () {
                meta.visible && meta.masker && meta.masker.hide(); //可能已给隐藏或 destroy();
            }, 50);


            let field = meta.field;

            if (field && field.text) {
                let text = meta.getValue(item.item, field.text);
                this.set('text', text);
            }

            meta.emitter.fire('select', [item, {
                'index': row.index,
                'row': row,
                'item': item,
                'event': event,
                'keyword': current.keyword,
                'oldRow': oldRow,
                'oldItem': oldItem,
            }]);


        },

        /**
        * 悬停在指定索引值的项上。
        */
        hover: function (index) {
            let meta = mapper.get(this);
            let target = meta.table.get(index);
            let old = meta.current.hover;

            if (!target) {
                old && $(old.element).removeClass('hover');
                meta.current.hover = null;
                return;
            }

            if (target === old) {
                return;
            }

            meta.current.hover = target;
            old && $(old.element).removeClass('hover');
            $(target.element).addClass('hover');
            target.element.scrollIntoViewIfNeeded();
        },



 
        /**
        * 设置指定的属性。
        * 已重载 set(obj); 批量设置的情况。
        * 已重载 set(key, value); 单个设置的情况。
        */
        set: function (key, value) {
            let obj = $Object.isPlain(key) ? key : { [key]: value, };
            let meta = mapper.get(this);


            $Object.each(obj, function (key, value) {
                switch (key) {
                    case 'text':
                        meta.change(value);
                        break;

                    case 'disabled':
                        value = !!value;
                        meta.txt.disabled = meta.disabled = value;
                        break;

                    case 'list':
                        meta.list = value || [];
                        break;
                }
            });
        },

        get: function (key) {
            let meta = mapper.get(this);
            let current = meta.current;

            if (!key) {
                return current.item;
            }


            switch (key) {
                case 'text':
                case 'disabled':
                case 'length':
                    return meta[key];
            }

        },

        /**
        * 重置。
        */
        reset: function () {
            let meta = mapper.get(this);
            let current = meta.current;
            let row = current.row;

            row && $(row.element).removeClass('on hover');

            meta.old = {};
            Current.reset(meta);    //这个在前。

            this.set({
                'text': '',
                'disabled': false,
            });

            meta.emitter.fire('reset');
        },

        /**
        * 给本控件实例绑定事件。
        */
        on: function () {
            let meta = mapper.get(this);
            meta.emitter.on(...arguments);
        },

        /**
        * 销毁本控件实例。
        */
        destroy: function () {
            let meta = mapper.get(this);

            //已销毁。
            if (!meta) {
                return;
            }

            meta.emitter.destroy();
            meta.table.destroy();
            meta.masker.destroy();
            meta.tpl.destroy();


            meta.current = null;
            meta.$ = null;
            meta.txt = null;
            meta.this = null;
            meta.$txt = null;
            meta.$table = null;
            meta.masker = null;


            mapper.delete(this);
        },
    };


    return DropList;

});




define('File/API', function (require, module, exports) {
    const Loading = require('@definejs/loading');
    const API = require('API');

    let loading = new Loading({
        mask: 0,
    });


    return {
        /**
        * 读取。
        */
        read(file, fn) {
            let api = new API('FileSystem.read');

            api.on({
                'request': function () {
                    loading.show('加载中...');
                },

                'response': function () {
                    loading.hide();
                },

                'success': function (file$item, json, xhr) {
                    let { content, } = file$item[file];
                    fn && fn(content);
                },

                'fail': function (code, msg, json, xhr) {
                    definejs.alert(`读取文件失败: ${msg}`);
                },

                'error': function (code, msg, json, xhr) {
                    definejs.alert(`读取文件错误: 网络繁忙，请稍候再试`);
                },
            });



            api.post({
                files: [file],
                content: true,
                info: false,
            });

        },



    };


});


define('File/Icon', function (require, module, exports) {
    let ext$font = {
        '/': 'fa fa-folder',
        '': 'fas fa-file-alt',

        'css': 'fab fa-css3-alt',
        'doc': 'fas fa-file-word',
        'docx': 'fas fa-file-word',
        'html': 'fab fa-html5',
        'js': 'fab fa-node-js',
        'json': 'fab fa-npm',
        'less': 'fab fa-less',
        'md': 'fab fa-markdown',
        'map': 'fas fa-globe',

        'bmp': 'fas fa-file-image',
        'gif': 'fas fa-file-image',
        'jpg': 'fas fa-file-image',
        'jpeg': 'fas fa-file-image',
        'png': 'fas fa-file-image',

        'ttf': 'fas fa-font',
        'woff2': 'fas fa-font',
        'gitattributes': 'fab fa-square-git',
        'npmignore': 'fab fa-npm',
        'ds_store': 'fab fa-apple',
    };

   
   

    return {
        get(ext) {
            ext = ext.toLowerCase();

            let type = ext == '/' ? 'dir' : 'file';
            let font = ext$font[ext] || ext$font[''];
            let className = `FileIcon ${type} ${ext == '/' ? '' : ext} ${font}`;
            let html = `<i class="${className}"></i>`;

            return { type, font, className, html, };
        },

        
    };
});


define('File/Size', function (require, module, exports) {

    return {

        /**
        * 获取文件大小的描述。
        */
        get: function (size) {
            if (!size) {
                return { 'value': 0, 'desc': '', };
            }

            if (size < 1024) {
                return { 'value': size, 'desc': 'B', };
            }

            
            size = size / 1024; //KB

            if (size < 1024) {
                size = Math.ceil(size);
                return { 'value': size, 'desc': 'KB', };
            }


            size = size / 1024; //MB

            if (size < 1024) {
                size = size.toFixed(2);

                if (size.endsWith('0')) { //如 19.x0
                    size = size.slice(0, -1);
                }

                if (size.endsWith('0')) { //如 19.0
                    size = size.slice(0, -2);
                }

                return { 'value': size, 'desc': 'MB', };
            }



            size = size / 1024; //GB

            size = size.toFixed(2);

            if (size.endsWith('0')) { //如 19.x0
                size = size.slice(0, -1);
            }

            if (size.endsWith('0')) { //如 19.0
                size = size.slice(0, -2);
            }


            return { 'value': size, 'desc': 'GB', };

        },

    };

});









define('File/Type', function (require, module, exports) {
    let images = [
        'bmp',
        'gif',
        'jpg',
        'jpeg',
        'png',
    ]



    return exports = {

        //从文件名中提取出后缀名。
        get(file) {
            if (file.endsWith('/')) {
                return '/';
            }

            // `a/b.c/e`
            file = file.split('/').slice(-1)[0];
            
            if (!file.includes('.')) {
                return '';
            }

            let ext = file.split('.').slice(-1)[0];
            return ext;
        },

        checkImage(file) { 
            let ext = exports.get(file);

            ext = ext.toLowerCase();

            return images.includes(ext);

        },

        
    };
});


define('File', function (require, module, exports) {
    const API = module.require('API');
    const Type = module.require('Type');
    const Icon = module.require('Icon');
    const Size = module.require('Size');




    return {

        getInfo(file) { 
            let names = file.split('/');
            let dir = names.slice(0, -1).join('/') + '/';
            let name = names.slice(-1)[0];
            let ext = Type.get(file);
            let isImage = Type.checkImage(file);
            let icon = Icon.get(ext);

            return { names, dir, name, ext, isImage, icon, };
        },

        /**
        * 获取文件大小的描述。
        */
        getSize(size) {
            let raw = size;
            let { value, desc, } = Size.get(size);
            return { value, desc, raw, };
        },

        /**
        * 获取文件类型或目录的图标。
        */
        getIcon(file) {
            let ext = Type.get(file);
            let icon = Icon.get(ext);
            return icon;
        },



        /**
        * 从文件名中获取后缀名。
        * @param {string} file 必选，文件名。
        * @returns 返回文件名的后缀名，不包含 `.`。
        */
        getExt(file) {
            return Type.get(file);
        },


        checkImage(file) { 
            return Type.checkImage(file);
        },


        read(file, fn) { 
            let isImage = Type.checkImage(file);

            if (!isImage) {
                API.read(file, function (content) { 
                    fn && fn(content);
                });
            }
            else {
                let url = `${location.origin}${location.pathname}${file}`;
                let content = `![](${url})`;
                fn && fn(content);
            }
        },

        


    };

});








/**
*/
define('MarkDoc/Href/Url', function (require, module, exports) {
    const Query = require('@definejs/query');
    const Hash = require('@definejs/hash');
    const resolveUrl = require('resolveUrl');


    //获取相对路径
    function relative(baseUrl, file) {

        //不是以 './' 或 '../' 开头的，不处理
        if (file.indexOf('.') != 0) {
            return file;
        }

        let dir = baseUrl.split('/').slice(0, -1).join('/') + '/';  //提取出目录
        let url = resolveUrl(dir, file);    //获取完整 url
        let root = resolveUrl('./');        //当前页面的目录，因为是单页，所以是网站根目录。

        url = url.slice(root.length);

        return url;
    }


  


    return {
        /**
        * 根据相对路径获取最终路径。
        */
        getHref: function (href, baseUrl) {

            let qs = Query.get(href) || {};
            let file = qs.file;
            let dir = qs.dir;

            if (!file) {
                return href; //原样返回
            }

            if (dir) {
                dir = relative(baseUrl, dir);
            }

            let list = file.split(',');

            list = list.map(function (file) {
                file = relative(baseUrl, file);
                return file;
            });

            file = list.join(',');
            

            if (dir) {
                href = Query.add(href, 'dir', dir);
            }

            href = Query.add(href, 'file', file);

            return href;
        },



        //把超链接中以查询字符串开头的 url 改成以 hash 开头。
        //主要是为了方便用户写链接，因为查询字符串比复合结构的 hash 容易写。
        getHash: function (href) {
            let qs = Query.get(href);
            let hash = Hash.set('', qs); //把查询字符串变成 hash

            return hash;
        },
    };




   




});


/**
* 
*/
define('MarkDoc/Code', function (require, module, exports) {
    const $ = require('$');
    const $String = require('@definejs/string');
    const JSON = require('@definejs/json');


    return {


        /**
        * 迭代指定 DOM 元素中的每个代码块。
        */
        each: function (el, fn) {
            $(el).find('code[data-language]').each(function (index) {
                let element = this;
                let content = element.innerText;
                let language = element.getAttribute('data-language');

                let item = {
                    'element': element,
                    'content': content,
                    'language': language,
                };

                fn(item, index);
            });
        },

        


        /**
        * 对代码区域进行格式化。
        */
        format: function (el) {
            let language = el.getAttribute('data-language');
     

            //尝试把 json 格式化一下
            if (language == 'json') {
                let text = el.innerText;
                let json = JSON.parse(text);
                if (json) {
                    json = window.JSON.stringify(json, null, 4);
                    el.innerHTML = json;

                    
                }
                return json;
            }

            

        },

        /**
        * 
        */
        language: function (meta, language) {
            let html = $String.format(meta.samples['language'], {
                'language': language,
                'foldable': meta.code.foldable ? 'foldable' : '',
            });

            return html
        },
        
        /**
        * 把整个代码区域和一些附加的 html 内容包裹起来。
        *   options = {
        *       element: DOM,   // `code` DOM 元素。
        *       language: '',   //语言标签的 html，或者为空串。
        *       numbers: '',    //行号的 html，或者为空串。
        *       height: '',     //高度。
        *   };
        */
        wrap: function (meta, options) {
            let $pre = $(options.element.parentNode);
            let html = options.language + options.numbers;

            $pre.wrap(meta.samples['source']);
            $pre.before(html);
            $pre.height(options.height); //设置高度，以撑开高度

            //根据最大的行号的数字串的长度设置 ul 的宽度和 pre 的 margin-left。
            let $ul = $pre.parent().find('>ul');
            let length = $ul.find('>li').length.toString().length; //最大的行号的数字串的长度
            let width = length * 10 + 15;

            $ul.css('width', width);
            $pre.css('margin-left', width);
          
        },
    };
    
});




/**
* 
*/
define('MarkDoc/Content', function (require, module, exports) {
    const $String = require('@definejs/string');

    const marked = window.marked;


    return {

        /**
        * 获取内容。
        *   opt = {
        *       language: '',   //可选。 语言类型。 如果要使用源代码模式显示内容，则需要指定该字段。
        *       content: '',    //必选。 要填充的内容。
        *       sample: '',     //可选，要使用地模板名称，值为 `pre` 或 `code`。
        *       process: function(content){ },
        *   };
        */
        get: function (meta, opt) {

            let {
                language,
                content,
                sample = 'pre',
                process,
            } = opt;

            //html源文件要特殊处理。
            if (language == 'html' || language == 'htm') {
                language = '';

                content = [
                    '``` html',
                        content,
                    '```',
                ].join('\r\n');
            }


            if (language) {

                //注意，content 里可能含有 html 标签，因此需要转义。
                let reg = /[&'"<>\/\\\-\x00-\x09\x0b-\x0c\x1f\x80-\xff]/g;

                content = content.replace(reg, function (r) {
                    return "&#" + r.charCodeAt(0) + ";"
                });

                content = $String.format(meta.samples[sample], {
                    'language': language,
                    'content': content,
                });

            }
            else {
                content = marked(content);

                if (process) {
                    content = process(content);
                }
            }

            return content;
        },


        
    };
    
});




/**
* 
*/
define('MarkDoc/Events', function (require, module, exports) {
    const $ = require('$');



    return {
        
        bind: function (meta, options) {

            meta.bind = true;

            //点击语言标签时。
            meta.code.foldable && meta.$.on('click', '[data-cmd="language"]', function (event) {
                $(this.parentNode).toggleClass('on');
                event.stopPropagation();
            });


            //折叠起来时，整个源代码区别可点击。
            meta.code.foldable && meta.$.on('click', '[data-cmd="source-code"]', function () {
                let $div = $(this);
                if ($div.hasClass('on')) {
                    $div.removeClass('on');
                }
            });


            //点击超链接时。
            meta.$.on('click', 'a[href^="#"]', function (event) {
                let a = this;
                let href = a.getAttribute('href');

                event.preventDefault();
                meta.emitter.fire('hash', [href]);
            });
            

            //点击标题时。
            meta.titles.foldable && meta.$.on('click', meta.titles.selector, function (event) {
                if (event.target.tagName.toLowerCase() != 'span') {
                    return;
                }

                $(this).nextUntil(meta.titles.selector).animate({
                    height: 'toggle',
                    opacity: 'toggle',
                });
            });

        },

    };
    
});




/**
*/
define('MarkDoc/Highlight', function (require, module, exports) {
    const $String = require('@definejs/string');

    const hljs = window.hljs;


    return {

        highlight: function (type, code) {

            if (!code) {
                return '';
            }

            //marked 库把 '<' 和 '>' 变成了 '&lt;' 和 '&gt;'，
            //这会影响 hljs 的解析，这里变回去。
            code = $String.replaceAll(code, '&lt;', '<');
            code = $String.replaceAll(code, '&gt;', '>');

            try {
                let info = hljs.highlight(type, code);
                return info.value;
            }
            catch (ex) { //不支持某种语法高亮时，直接原样返回
                return code;
            }

        }
    };


});


/**
* 
*/
define('MarkDoc/Href', function (require, module, exports) {
    const Url = module.require('Url');

    return {
        format: function (meta, baseUrl) {

            if (!baseUrl) {
                return;
            }

            //改写 a 标签。
            meta.$.find('a').each(function () {
                let a = this;

                //不要用 a.href，因为 a.href 在浏览器中会给自动补充成完整的 url，而我们是要获取最原始的。
                let href = a.getAttribute('href');

                if (href.startsWith('#') || href.startsWith('?')) {
                    a.setAttribute('target', '_self');
                }

                if (href.startsWith('?')) {

                    href = Url.getHref(href, baseUrl);
                    href = Url.getHash(href);

                    a.setAttribute('href', href);
                }


            });

        },
    };
    
});




/**
* 
*/
define('MarkDoc/Image', function (require, module, exports) {
    const $ = require('$');



    return {



        


        /**
        * 对非完整地址的图片进行地址补充。
        */
        format: function (el, url) {
            
            //不需要补充。
            if (!url) {
                return;
            }


            $(el).find('img').each(function () {
                let img = this;
                let src = img.getAttribute('src'); //要用这个方法，获取原始的值。 img.src 会返回完整的，不合要求。

                if (!src || src.startsWith('http://') || src.startsWith('https://')) {
                    return;
                }

                img.src = url + src;
            });

        },

    };
    
});




/**
*/
define('MarkDoc/Lines', function (require, module, exports) {
    const $String = require('@definejs/string');


    return exports = {

        /**
        *  产生行号的 html。
        */
        getNumbers: function (meta, content) {
            let sample = meta.samples['numbers'];
            let sitem = meta.samples['numbers.item'];
            let lines = content.split(/\r\n|\n|\r/);
            let height = exports.getHeight(lines);

            //最后一个空行要去掉。
            //因为它在 `<pre></pre>` 中无法展示出来。
            let lastLine = lines[lines.length - 1];

            if (!lastLine) {
                lines = lines.slice(0, -1);
            }

            let list = lines.map(function (item, index) {

                return $String.format(sitem, { 'no': index + 1, });
            });


            let html = $String.format(sample, {
                'height': height,
                'items': list.join(''),
                'total': list.length,
            });
        
            return html;


            //let tpl = meta.tpl.template('numbers');

            //tpl.process({
            //    '': function (data) {
            //        let items = this.fill('item', data.items);

            //        return {
            //            'height': height,
            //            'items': lines.join(''),
            //        };
            //    },

            //    'item': function (item, index) {
            //        return {
            //            'no': index + 1,
            //        };
            //    },
            //});

            //let html = tpl.fill({
            //    'height': height,
            //    'items': lines,
            //});
        },


        /**
        * 根据文本内容计算需要的高度。
        */
        getHeight: function (lines) {
            if (!Array.isArray(lines)) {
                lines = lines.split(/\r\n|\n|\r/);
            }

            return lines.length * 20;
        },
    };








});


/**
* 
*/
define('MarkDoc/Meta', function (require, module, exports) {
    const $ = require('$');
    const $String = require('@definejs/string');
    const Template = require('@definejs/template');

    let defaults = {
        code: {
            format: true,   //是否自动格式化（针对 JSON）。
            language: true, //是否显示语言类型标签。
            numbers: true,  //是否显示行号。
            foldable: true, //是否允许通过点击语言类型标签来切换折叠和展开代码区。
        },
        titles: {
            selector: 'h1,h2,h3,h4,h5,h6',
            foldable: true,                 //允许折叠。
        },
    };


    return {

        create: function (config, others) {
            let tpl = new Template('#tpl-MarkDoc');
            let code = Object.assign({}, defaults.code, config.code);
            let titles = Object.assign({}, defaults.titles, config.titles);
            let container = config.container;

            let meta = {
                'id': $String.random(),         //实例 id。
                'container': container,         //
                'code': {
                    'format': code.format,          //是否自动格式化。
                    'language': code.language,      //是否显示语言类型。
                    'numbers': code.numbers,        //是否显示行号。
                    'foldable': code.foldable,      //
                },

                'this': null,                   //方便内部引用自身的实例。
                'emitter': null,                //事件驱动器。
                '$': $(container),              //$(container);
                'tpl': tpl,                     //Template 实例。
                'bind': false,                  //是否已对 meta.$ 进行绑定事件。

                'outline': {
                    'visible': true,            //用于记录提纲的内容的显示或隐藏状态。
                },

                'current': {

                },

                'titles': {
                    'selector': titles.selector,
                    'foldable': titles.foldable,
                },

                'samples': {
                    'source': tpl.sample('source'),
                    'language': tpl.sample('language'),
                    'pre': tpl.sample('pre'),
                    'code': tpl.sample('code'),
                    'numbers': tpl.sample('numbers'),
                    'numbers.item': tpl.sample('numbers', 'item'),
                    'title': tpl.sample('title'),

                },

               
            };


            Object.assign(meta, others);
           

            return meta;
           
        },

    };
    
});




/**
* 标题相关的。
*/
define('MarkDoc/Titles', function (require, module, exports) {
    const $ = require('$');


    return {

        render: function (meta) {
            let sample = meta.samples['title'];
            let selector = meta.titles.selector;
            let title = ''; //取第一个 title 作为浏览器标题。

            meta.$.find(selector).each(function () {
                let $this = $(this);
                let list = $this.nextUntil(selector);

                title = title || $this.text();
                $this.wrapInner(sample);
                $this.toggleClass('title', list.length > 0);

            });

            return title;

        },
    };
    
});




/**
* markdoc 内容渲染器。
*/
define('MarkDoc', function (require, module, exports) {
    const $ = require('$');
    const $Array = require('@definejs/array');
    const Emitter = require('@definejs/emitter');

    const Meta = module.require('Meta');
    const Content = module.require('Content');
    const Events = module.require('Events');
    const Titles = module.require('Titles');
    const Href = module.require('Href');

    const Code = module.require('Code');
    const Highlight = module.require('Highlight');
    const Lines = module.require('Lines');
    const Image = module.require('Image');

    let mapper = new Map();





    /**
    * 构造器。
    *    options = {
    *        container: '',     //要填充的 DOM 元素，内容将会填充到该元素里面。
    *    };
    */
    function MarkDoc(config) {

        let emitter = new Emitter(this);

        let meta = Meta.create(config, {
            'this': this,
            'emitter': emitter,
        });

        mapper.set(this, meta);

        Object.assign(this, {
            'id': meta.id,
            '$': meta.$,
            'data': {},     //用户的自定义数据容器。
        });

        //插件机制。
        this.on('process', function (content) {
            content = content.split('<li>[ ] ').join('<li class="todo-list-item"> <i class="far fa-square"></i>');
            content = content.split('<li>[#] ').join('<li class="todo-list-item"> <i class="fas fa-check-square"></i>');
            content = content.split('<li>[x] ').join('<li class="todo-list-item"> <i class="fas fa-check-square"></i>');

            return content;
        });

    }


    MarkDoc.prototype = {
        constructor: MarkDoc,

        /**
        * 对传入的容器的 jQuery 对象包装，即 $(container)。
        */
        $: null,

        /**
        * 用户的自定义数据容器。
        */
        data: {},

        /**
        * 渲染生成 markdoc 内容。
        *   options = {
        *       content: '',        //必选。 要填充的内容。
        *       language: '',       //可选。 语言类型，如 `json`、`javascript` 等。 如果指定，则当成源代码模式展示内容。
        *       baseUrl: '',        //内容里的超链接中的相对 url。 非源代码模式下可用。
        *       imgUrl: '',         //图片 src 属性相对地址的前缀。 即如果 img.src 为相对地址，则加上该前缀补充为完整的 src。
        *       sample: 'pre',      //可选，要使用地模板名称，值为 `pre` 或 `code`。 默认情况下为 `pre`。 
        *                           //某些特殊场景下不需要 `pre`，如显示压缩后的、只有一行代码的情况，使用 `code`。
        *       code: {
        *           format: true,   //是否自动格式化（针对 JSON）。
        *           language: true, //是否显示语言类型标签。
        *           numbers: true,  //是否显示行号。
        *           foldable: true, //是否允许通过点击语言类型标签来切换折叠和展开代码区。
        *       },
        *       titles: {
        *           selector: 'h1,h2,h3,h4,h5,h6',
        *           foldable: true,                 //允许折叠。
        *       },
        *       
        *   };
        */
        render: function (options) {
            let meta = mapper.get(this);
            let current = meta.current;
            let isSourceMode = !!options.language; //如果指定，则当成源代码模式展示内容。

            let content = Content.get(meta, {
                'language': options.language,
                'content': options.content,
                'sample': options.sample,

                'process': function (content) {
                    let values = meta.emitter.fire('process', [content]);
                    return values.length > 0 ? values[0] : content;
                },
            });


            //提供一个机会可以在 render 时重新传配置。
            if (options.code) {
                Object.assign(meta.code, options.code);
            }

            if (options.titles) {
                Object.assign(meta.titles, options.titles);
            }

            meta.$.html(content);
            meta.$.addClass('MarkDoc');
            meta.$.toggleClass('SourceMode', isSourceMode);
            meta.outline.visible = true; //每次填充都要重置。


            //首次绑定。
            if (!meta.bind) {
                Events.bind(meta);
            }

            Image.format(meta.$, options.imgUrl);


            Code.each(meta.$, function (item, index) {
                let element = item.element;
                let language = item.language;
                let code = meta.code;

                //尝试把 json 格式化一下。
                if (code.format) {
                    Code.format(element);
                }

                let content = element.innerText; //在格式化后重新获取。
                let height = Lines.getHeight(content);

                Code.wrap(meta, {
                    'element': element,
                    'height': height,
                    'language': code.language ? Code.language(meta, language) : '', //添加语言类型标签。
                    'numbers': code.numbers ? Lines.getNumbers(meta, content) : '', //对源代码添加行号显示。
                });


                //语法高亮
                content = Highlight.highlight(language, content);
                $(element).addClass('hljs').html(content);

            });

            let title = Titles.render(meta);


            if (!isSourceMode) {
                Href.format(meta, options.baseUrl);
            }


            current.code = meta.$.find('pre>code');
            current.html = current.code.html();
            current.ul = meta.$.find('ul');


            meta.emitter.fire('render', [{
                'title': title,
            }]);

        },

        /**
        * 显示本组件。
        */
        show: function () {
            let meta = mapper.get(this);
        
            meta.$.show(...arguments);
            meta.emitter.fire('show');

        },

        /**
        * 隐藏本组件。
        */
        hide: function () {
            let meta = mapper.get(this);

            meta.$.hide(...arguments);
            meta.emitter.fire('hide');
        },

        /**
        * 切换显示或隐藏提纲。
        */
        outline: function () {
            let meta = mapper.get(this);
            let $ = meta.$.find('>*:not(' + meta.titles.selector + ')');
            let value = meta.outline.visible ? 'hide' : 'show';

            $.animate({
                'height': value,
                'opacity': value,
            }, 'fast');

            meta.outline.visible = !meta.outline.visible;
        },

        /**
        * 隐藏或显示空行。
        */
        empty: function (checked) {
            let meta = mapper.get(this);
            let current = meta.current;

            let code = current.code;
            let ul = current.ul;
            let html = current.html;

            //显示空行。
            if (checked) {
                //重新计算高度。
                let height = Lines.getHeight(html);
                code.parent().height(height);
                ul.find('li').show();
                code.html(html);
                return;
            }

            //隐藏空行。
            html = code.html();
            let lines = html.split(/\r\n|\n|\r/);

            lines = $Array.map(lines, function (line) {
                return line.length > 0 ? line : null;
            });

            html = lines.join('\r\n');
            code.html(html);


            //重新计算高度。
            let height = Lines.getHeight(html);
            code.parent().height(height);

            //隐藏多余的行号
            let maxIndex = lines.length - 1;
            ul.find('li').show();
            ul.find('li:gt(' + maxIndex + ')').hide();
        },

        /**
        * 绑定事件。
        */
        on: function () {
            let meta = mapper.get(this);
            meta.emitter.on(...arguments);
        },

        /**
        * 滚动到指定索引值的提纲。
        */
        toOutline: function (index) {
            let meta = mapper.get(this);
            let el = meta.$.find(meta.titles.selector).get(index);
            if (!el) {
                return;
            }

            let $el = $(el);

            if (el.scrollIntoViewIfNeeded) {
                el.scrollIntoViewIfNeeded();
            }
            else {//兼容一下低端浏览器。
                el.scrollIntoView();
            }

            //闪两次
            let timeout = 200;

            $el.addClass('on');

            setTimeout(function () {
                $el.removeClass('on');

                setTimeout(function () {
                    $el.addClass('on');

                    setTimeout(function () {
                        $el.removeClass('on');
                    }, timeout);

                }, timeout);

            }, timeout);
        },

        /**
        * 获取提纲列表信息。
        * 必须在渲染后调用，方能获取到。
        */
        getOutlines: function () {
            let meta = mapper.get(this);
            let list = meta.$.find(meta.titles.selector).toArray();

            list = list.map(function (el) {
                let level = el.nodeName.slice(1);
                let text = el.innerText;

                return {
                    'level': +level,
                    'text': text,
                };
            });

            return list;
        },

    };


   

    return MarkDoc;


});


define('MenuNav/Panel/Data', function (require, module, panel) {
    const File = require('File');


    return {
        parse(opt) {
            let path = opt; //假设 opt 是 string。
            let text = '';
            let icon = null;
            let names = null;

            if (typeof opt == 'object') {
                path = opt.path;
                text = opt.text;
                icon = opt.icon;
                names = opt.names;
            }
           

            if (!text) {
                text = path;
            }

            if (!icon) {
                icon = File.getIcon(path);
            }

            if (!names) {
                names = path.split('/');

                if (path.endsWith('/')) {
                    names = names.slice(0, -1);
                }
            }


            return { names, path, text, icon, };
    


        },
    };

});


define.panel('MenuNav/Panel/Icon', function (require, module, panel) {
    const Panel = require('@definejs/panel');
  

    


    return {
        create($meta) {
            let panel = new Panel(`[data-panel="${$meta.id}/Icon"]`);

            panel.on('init', function () {

            });


            /**
            * 渲染内容。
            */
            panel.on('render', function (icon) {
                panel.$.html(icon.html);

            });


            
            return panel.wrap({

            });
        },
    };




});


define.panel('MenuNav/Panel/List', function (require, module, panel) {
    const Panel = require('@definejs/panel');


    
    return {
        create($meta) {
            
            let panel = new Panel(`[data-panel="${$meta.id}/List"]`);

            panel.on('init', function () {

                panel.$on('click', {
                    '[data-index]': function (event) {
                        let index = +this.dataset.index;

                        panel.fire('item', [index]);

                        event.stopPropagation();
                    },
                });

                panel.$.on('click', function (event) {
                    panel.fire('text', []);
                });




            });


            /**
            * 渲染内容。
         
            */
            panel.on('render', function (list) {

                let html = $meta.tpl.fill('item', list);
               
                panel.$.html(html);

            });

            return panel.wrap({

            });

        },
    };


});


define.panel('MenuNav/Panel/Text', function (require, module, panel) {
    const Panel = require('@definejs/panel');

    
    return {
        create($meta) {
            let panel = new Panel(`[data-panel="${$meta.id}/Text"]`);

            let txt = null;

            let meta = {
                value: '',
            };

            panel.set('show', false);


            panel.on('init', function () {

                txt = panel.$.find('input').get(0);



                panel.$bind('input', {
                    'blur': function (event) {
                        panel.fire('blur');
                    },

                    'click': function (event) {
                        
                        let len = txt.value.length;
                        let d = txt.selectionEnd - txt.selectionStart;

                        //已全部选中，点击则取消选中，并把焦点移到最后一位字符。
                        if (d == len) {
                            txt.selectionStart = len;
                            txt.selectionEnd = len;
                        }

                    },

                    'change': function (event) {
                        let value = txt.value;


                        if (value == meta.value) {
                            return;
                        }

                        //这个语句先提前设置为原先的值。 
                        //因为：
                        //1，如果新值不正确，外面一样会显示回原值的，但外面没机会告诉本界面，所以本界面可以提前先设置回原值。
                        //2，如果正确，则由外面再切换到新值，同时也会触发事件导致本界面设置成新值。
                        txt.value = meta.value;

                        meta.value = value;

                        panel.fire('change', [value]);
                    },

                    'keyup': function (event) {
                        if (event.keyCode == 13) {
                            txt.blur();
                        }
                    },
                });

            });


            /**
            * 渲染内容。
         
            */
            panel.on('render', function (value) {

                meta.value = txt.value = value;

            });



            panel.on('show', function () {
                txt.focus();
                txt.select();

            });

            return panel.wrap({

            });
        },
    };

});


/**
* 
*/
define('MenuNav/Meta', function (require, module, exports) {
    const IDMaker = require('@definejs/id-maker');

    let idmaker = new IDMaker(module.parent.id);




    return {

        create: function (config, others) {
            let id = idmaker.next();
            
            let meta = {
                'id': id,
                'container': config.container, //可选。
               

                'this': null,
                'emitter': null,
                'tpl': null,
                'panel': null,
              
            };


            Object.assign(meta, others);



            return meta;
           
        },


    };
    
});





define('MenuNav/Panel', function (require, module, exports) {
    const Panel = require('@definejs/panel');
    const $Icon = module.require('Icon');
    const $List = module.require('List');
    const $Text = module.require('Text');
    const Data = module.require('Data');


    return {
        create($meta) {
            const Icon = $Icon.create($meta);
            const List = $List.create($meta);
            const Text = $Text.create($meta);


            let panel = new Panel(`[data-panel="${$meta.id}"]`);


            let meta = {
                path: '',
                text: '',
                names: [],
            };


            panel.on('init', function () {

                List.on({
                    'item': function (index) {
                        let { names, } = meta;
                        panel.fire('item', [{ names, index, }]);
                    },

                    'text': function () {
                        List.hide();
                        Text.show();
                    },
                });

                Text.on({
                    'blur': function () {
                        List.show();
                        Text.hide();
                    },
                    'change': function (text) {
                        let values = panel.fire('text', [text]);

                        //外部明确返回了 false，则表示归位。
                        if (values.includes(false)) {
                            Text.render(meta.text);
                        }
                    },
                });

            });


            /**
            * 渲染内容。
            *   opt = {
            *       names: [],
            *       path: '',
            *       icon: '',
            *       text: '',
            *   };
            */
            panel.on('render', function (opt) {
                let { path, text, icon, names, } = Data.parse(opt);
              
                meta.path = path;
                meta.text = text;
                meta.names = names;

                Icon.render(icon);
                List.render(names);
                Text.render(text);

                panel.$.toggleClass('no-icon', !icon);
                panel.fire('render', [opt]);

            });



            return panel.wrap({
                
            });

        },
    };

});


define('MenuNav/Template', function (require, module, exports) {
    const Template = require('@definejs/template');


   





    return {
        create: function (meta) {
           
            let tpl = new Template('#tpl-MenuNav');
           

            tpl.process({
                '': function () {

                    return {
                        'id': meta.id,
                    };
                   
                },

                'item': function (item, index) {
                    return {
                        'index': index,
                        'name': item,
                    };
                },

            });




            return tpl;

        },

    };
});

define('MenuNav.defaults', {

    

});

/**
* 菜单树。
*/
define('MenuNav', function (require, module, exports) {
    const Emitter = require('@definejs/emitter');
    const $ = require('$');

    const Panel = module.require('Panel');
    const Meta = module.require('Meta');
    const Template = module.require('Template');

    const defaults = require('MenuNav.defaults');
    const mapper = new Map();



    class MenuNav {
        constructor(config) {
            config = Object.assign({}, defaults, config);

            let emitter = new Emitter(this);

            let meta = Meta.create(config, {
                'this': this,
                'emitter': emitter,
            });


            mapper.set(this, meta);

            Object.assign(this, {
                'id': meta.id,
                '$': meta.$,
            });
        }


        init() {
            let meta = mapper.get(this);

            if (meta.panel) {
                return;
            }

            //首次渲染。
            meta.tpl = Template.create(meta);

            if (meta.container) {
                let html = this.fill();
                $(meta.container).html(html);
            }
        
            meta.panel = Panel.create(meta);
            this.$ = meta.panel.$;

            meta.panel.on({
                'item': function ({ names, index, }) {
                    meta.emitter.fire('item', [{ names, index, }]);
                },
                'text': function (path) {
                    let values = meta.emitter.fire('text', [path]);
                    return values.slice(-1)[0];
                },
                'render': function (opt) {
                    meta.emitter.fire('render', [opt]);
                },
            });
        }

        fill() {
            let meta = mapper.get(this);
            let html = meta.tpl.fill({});
            return html;
        }

        render(options) {
            let meta = mapper.get(this);

            this.init();
            meta.panel.render(options);
        }

        on(...args) {
            let meta = mapper.get(this);
            meta.emitter.on(...args);
        }

    }




    return MenuNav;
});


define('Outline/Events', function (require, module, exports) {
    const $ = require('$');


    return {
        bind: function (meta) {

            meta.$.on('click', 'li[data-index]', function (event) {
                let index = +this.getAttribute('data-index');
                let item = meta.list[index];

                meta.emitter.fire('item', [item, index]);
            });




            //点击展开/收起的图标。
            meta.$.on('click', 'i[data-index]', function (event) {
                let list = meta.list;
                let index = +this.getAttribute('data-index');
                let item = list[index];
                let children = item.children || [];

                //没有下级节点。
                if (children.length == 0) {
                    return;
                }


                let $icon = $(this);
                let needOpen = $icon.hasClass('closed');
                let beginIndex = index + 1;

                let endIndex = list.slice(beginIndex).findIndex(function (oItem, index) {
                    return oItem.level <= item.level;
                });

                endIndex = endIndex < 0 ? list.length : endIndex + beginIndex;
                console.log(beginIndex, endIndex);


                $icon.toggleClass('opened', needOpen);
                $icon.toggleClass('closed', !needOpen);
                $icon.attr({
                    'title': needOpen ? '点击收起子级' : '点击展开子级',
                });

                event.stopPropagation();




                list.slice(beginIndex, endIndex).forEach(function (oItem, index) {
                    index = index + beginIndex;

                  
                    let $li = meta.$.find(`li[data-index="${index}"]`);
                    let key = 'closed-count';
                    let count = $li.data(key) || 0; //记录关闭的计数，为 0 时，才能打开。


                    if (needOpen) { //要打开。
                        count--;

                        if (count <= 0) {
                            count = 0;              //确保不会出现负数。
                            $li.slideDown('fast');
                        }
                    }
                    else {//要关闭
                        count++;
                        $li.slideUp('fast');
                    }

                    $li.data(key, count);
                   
                });





            });


        },

    };
});

/**
* 
*/
define('Outline/Meta', function (require, module, exports) {
    const $String = require('@definejs/string');


    return {

        create: function (config, others) {
           
            let meta = {
                'id': $String.random(),         //实例 id。
                'container': config.container,
                'this': null,                   //方便内部引用自身的实例。
                'emitter': null,                //事件驱动器。
                '$': null,                      //$(container);
                'tpl': null,                    //模板 Template 实例。
                'list': null,                   //当前填充的列表数据 []。
            };


            Object.assign(meta, others);
           

            return meta;
           
        },

    };
    
});





define('Outline/Template', function (require, module, exports) {
    const Template = require('@definejs/template');
    const $String = require('@definejs/string');




    return {
        create: function () {
           
            let tpl = new Template('#tpl-Outline');


            tpl.process({
                '': function (data) {
                    let list = data.list;
                    let items = this.fill('item', list);

                    return {
                        'items': items,
                    };
                },

                'item': {
                    '': function (item, index) {
                        let level = item.level;
                        let tabs = level - 1;
                        let children = item.children || [];


                        //创建一个指定长度的数组。
                        tabs = $String.random(tabs).split('');

                        tabs = tabs.map(function () {
                            return {};
                        });

                        tabs = this.fill('tab', tabs);

                        return {
                            'index': index,
                            'level': level,
                            'tabs': tabs,
                            'text': item.text,
                            'opened': children.length > 0 ? 'opened' : '',
                            'folder-title': children.length > 0 ? '点击收起子级' : '',
                        };
                    },

                    'tab': function (item, index) {
                        return {};
                    },
                },
            });

            return tpl;

        },

    };
});

/**
* 提纲列表。
*/
define('Outline', function (require, module, exports) {
    const $ = require('$');
    const Emitter = require('@definejs/emitter');
    const Meta = module.require('Meta');
    const Events = module.require('Events');
    const Template = module.require('Template');

  

    let mapper = new Map();





    /**
    * 构造器。
    *    options = {
    *        container: '',     //要填充的 DOM 元素，内容将会填充到该元素里面。
    *    };
    */
    function Outline(config) {
        let emitter = new Emitter(this);
        let tpl = Template.create();

        let meta = Meta.create(config, {
            'this': this,
            'emitter': emitter,
            'tpl': tpl,
        });

        mapper.set(this, meta);

        Object.assign(this, {
            'id': meta.id,
            '$': meta.$,
            'data': {},     //用户的自定义数据容器。
        });

       

    }


    Outline.prototype = {
        constructor: Outline,

        /**
        * 对传入的容器的 jQuery 对象包装，即 $(container)。
        */
        $: null,

        /**
        * 用户的自定义数据容器。
        */
        data: {},

        /**
        * 渲染生成提纲内容。
        * 该方法只能调用一次，后续要更新内容请调用 fill(list) 方法。
        *   list = [            //可选，要渲染生成的列表数据。
        *       {
        *           level: 1,   //标题级别，从 1 到 6，对应 h1 - h6。
        *           text: '',   //标题内容。
        *       },
        *   ];
        */
        render: function (list) {
            
            let meta = mapper.get(this);

            meta.$ = $(meta.container);
            list = list || meta.list;
            list && this.fill(list);

            meta.$.show();
            Events.bind(meta);

        },

        /**
        * 填充以获得 html。
        * 调用该方法之前，可以不必先调用 render()，这样可以仅获得生成的 html，以便在业务层手动处理。
        */
        fill: function (list) {

            //建立起父子关系。
            list.forEach(function (item, index) {
                item.parent = null; //先统一假设父节点为空。

                let level = item.level;

                if (level == 1) { //最顶级的，即 h1，不存在父节点。
                    return;
                }


                //再往回沿路搜索比当前节点的级别低的节点。
                //往回过程中，第一个级别低的节点即为父节点。
                for (let i = index - 1; i >= 0; i--) {
                    let parent = list[i];

                    if (level > parent.level) {
                        item.parent = parent;

                        parent.children = parent.children || [];
                        parent.children.push(item);

                        return;
                    }
                }

            });



            let meta = mapper.get(this);
            let html = meta.tpl.fill({ 'list': list, });

            meta.list = list;
            meta.$ && meta.$.html(html);

            return html;
        },

        /**
        * 显示本组件。
        */
        show: function () {
            let meta = mapper.get(this);
            meta.$.show(...arguments);
            meta.emitter.fire('show');
        },

        /**
        * 隐藏本组件。
        */
        hide: function () {
            let meta = mapper.get(this);
            meta.$.hide(...arguments);
            meta.emitter.fire('hide');
        },


        /**
        * 绑定事件。
        */
        on: function () {
            let meta = mapper.get(this);
            meta.emitter.on(...arguments);
        },

    };




    return Outline;


});


define('Settings.Header', function (require, module, exports) {
    const Storage = require('@definejs/local-storage');
    const Emitter = require('@definejs/emitter');

    let storage = new Storage(module.id);
    let emitter = new Emitter();


    let meta = {
        value: storage.get('value') || module.data || 'hide',
    };

  

    return {
        on: emitter.on.bind(emitter),

        get() {
            return meta.value;
        },

        set(value) {
            let old = meta.value;

            if (value == old) {
                return;
            }

            
            if (value) {
                storage.set('value', value);
                meta.value = value;
            }
            else {
                value = old;
            }

            emitter.fire('change', [value, old]);
            
            console.log(module.id, 'set', value);
        },

        
    };
    

    


});

define('Settings.Language', function (require, module, exports) {
    const Storage = require('@definejs/local-storage');
    const Emitter = require('@definejs/emitter');

    let storage = new Storage(module.id);
    let emitter = new Emitter();

    let meta = {
        value: storage.get('value') || module.data || 'chinese',
    };

  

    return {
        on: emitter.on.bind(emitter),

        get() {
            return meta.value;
        },

        set(value) {
            let old = meta.value;

            if (value == old) {
                return;
            }

            
            if (value) {
                storage.set('value', value);
                meta.value = value;
            }
            else {
                value = old;
            }

            emitter.fire('change', [value, old]);
            
            console.log(module.id, 'set', value);
        },

        
    };
    

    


});

define('Settings.Theme', function (require, module, exports) {
    const Storage = require('@definejs/local-storage');
    const Emitter = require('@definejs/emitter');

    let storage = new Storage(module.id);
    let emitter = new Emitter();

    let meta = {
        value: storage.get('value') || module.data || 'light',
    };

  

    return {
        on: emitter.on.bind(emitter),

        get() {
            return meta.value;
        },

        set(value) {
            let old = meta.value;

            if (value == old) {
                return;
            }

            
            if (value) {
                storage.set('value', value);
                meta.value = value;
            }
            else {
                value = old;
            }


            let body = document.body;
            let list = [...body.classList];

            list.forEach((name) => {
                if (name.startsWith(`theme-`)) {
                    body.classList.remove(name);
                }
            });
           
            body.classList.add(`theme-${value}`);

            emitter.fire('change', [value, old]);
        },

        
    };
    

    


});


define('SidebarTree/Panel/Resizer/Masker', function (require, module, exports) {
    const Masker = require('@definejs/masker');

    let masker = null;

    
    return {
        show() { 
            masker = masker || new Masker({
                // opacity: 0.5,
                opacity: 0,
            });

            masker.show();
        },

        hide() { 
            masker && masker.hide();
        },
    };
   


});


define('SidebarTree/Panel/Header', function (require, module, exports) {
    const Panel = require('@definejs/panel');
    const CheckBox = require('CheckBox');
    


    return {
        create($meta) {
            let panel = new Panel(`[data-panel="${$meta.id}/Header"]`);

            let chk = null;

            let meta = {
                dirOnly: false,
            };

            panel.set('show', false);

            panel.on('init', function () {

                chk = new CheckBox({
                    'fireNow': true,
                    'container': panel.$.find(`[data-cmd="dirOnly"]`),
                    'text': '仅目录',
                });

                chk.on('checked', function (checked) {
                    meta.dirOnly = checked;
                    panel.fire('dir-only', [checked]);
                });



                panel.$on('click', {
                    '[data-cmd]': function (event) {
                        let { cmd, } = this.dataset;
                        panel.fire(cmd);
                    },
                });

            });


            /**
            * 渲染。
            *   opt = {
            *       
            *   };
            */
            panel.on('render', function (opt) {
                opt = opt || {};

                panel.$.toggleClass('back', !!opt.back);
                panel.$.toggleClass('forward', !!opt.forward);
                panel.$.toggleClass('up', !!opt.up);
                panel.$.toggleClass('root', !!opt.root);
                panel.$.toggleClass('dir-only', !!opt.dirOnly);

                chk.render({
                    'checked': meta.dirOnly,
                });

            });

            return panel.wrap({
                
            });

        },
    };

});


define('SidebarTree/Panel/Main', function (require, module, exports) {
    const Panel = require('@definejs/panel');
    const MenuTree = require('MenuTree');


    return {
        create($meta) {
            let panel = new Panel(`[data-panel="${$meta.id}/Main"]`);

            let tree = null;

            let meta = {
                item: null,     //当前激活的项。
                index: -1,      //路径中下次要 push 的指针。
                list: [],       //路径历史。
            };


            panel.on('init', function () {

                function active(item) {

                    if (item === meta.item) {
                        return;
                    }

                    meta.index++;
                    meta.list[meta.index] = item;
                    meta.item = item;

                    panel.fire('item', [item, {
                        'back': meta.index > 0,
                        'forward': meta.index < meta.list.length - 1,
                        'up': !!(item && item.parent),
                        'root': !!item.parent,
                        'dirOnly': item.list.length > 0,
                    }]);

                    panel.fire(item.data.type, [item]);
                }



                let config = { 'container': panel.$, };
                let { fileIcon, dirIcon, } = $meta;

                if (fileIcon) {
                    config.fileIcon = fileIcon;
                }

                if (dirIcon) {
                    config.dirIcon = dirIcon;
                }

                tree = new MenuTree(config);

                tree.on({
                    //点击某一项时触发。
                    'item'(item) {
                        let id = item.id;

                        //空目录的指示文件。
                        if (id.endsWith('/.')) {
                            tree.open(item.parent.id);
                        }
                        else {
                            active(item);
                        }
                    },
                    'fill': {
                        'name': function (item) {
                            let names = panel.fire('fill', 'name', [item]);
                            return names.slice(-1)[0];
                        },
                    },

                });

            });


            /**
            * 渲染。
            */
            panel.on('render', function (data) {
                let { list,  } = MenuTree.parse(data);

                meta.item = null;
                meta.list = [];
                meta.index = -1;

                tree.render(list);


            });


            return panel.wrap({

                each(fn) { 
                    tree.each(fn);
                },

                open(id) {
                    tree.open(id);
                },

                back() {
                    let index = meta.index - 1;
                    let item = meta.list[index];

                    if (!item) {
                        return;
                    }

                    meta.index = index - 1; //后退多一步，为 push 做准备。
                    this.open(item.id);
                },

                forward() {
                    let index = meta.index + 1;
                    let item = meta.list[index];

                    if (!item) {
                        return;
                    }

                    this.open(item.id);
                },

                up() {
                    let item = meta.item;
                    let parent = item ? item.parent : null;

                    if (!parent) {
                        return;
                    }

                    this.open(parent.id);
                },

                root() {
                    this.open(1); //cid 从 1 开始。
                },

                dirOnly(checked) {
                    panel.$.toggleClass('dir-only', !!checked);
                },
            });



        },
    };

});


define('SidebarTree/Panel/Resizer', function (require, module, exports) {
    const Panel = require('@definejs/panel');
    const Masker = module.require('Masker');

    return {
        create($meta) {

            let panel = new Panel(`[data-panel="${$meta.id}/Resizer"]`);

            panel.set('show', false);

            panel.on('init', function () {
                let draging = false;    //表示鼠标左键是否已按下并还没释放。
                let x = 0;              //鼠标按下时的 pageX 值。
                let cursor = '';        //鼠标按下时的 cursor 指针值。
                let body = document.body;
                let div = panel.$.get(0);


                $(body).on({

                    //开始按下鼠标左键。
                    'mousedown': function (event) {
                        if (event.target !== div) {
                            return;
                        }

                        draging = true;
                        x = event.pageX;
                        cursor = body.style.cursor;
                        body.style.cursor = 'ew-resize';
                        Masker.show();

                        panel.fire('start');

                    },

                    //按住鼠标左键进行移动。
                    'mousemove': function (event) {
                        if (!draging) {
                            return;
                        }

                        let dx = event.pageX - x;   //delta width

                        panel.fire('change', [dx]);
                    },

                    //释放鼠标左键。
                    'mouseup': function (event) {
                        if (!draging) {
                            return;
                        }

                        draging = false;

                        body.style.cursor = cursor;
                        Masker.hide();
                        panel.fire('stop');

                    },


                });
            });

            /**
            * 渲染。
            *   options = {
            *   };
            */
            panel.on('render', function (options) {



            });

            return panel.wrap();
        },
    };
});



/**
* 
*/
define('SidebarTree/Meta', function (require, module, exports) {
    const IDMaker = require('@definejs/id-maker');

    let idmaker = new IDMaker(module.parent.id);




    return {

        create: function (config, others) {
            let id = idmaker.next();
            
            let meta = {
                'id': id,
                'container': config.container, //可选。
                'width': config.width,
                'minWidth': config.minWidth,
                'fileIcon': config.fileIcon,
                'dirIcon': config.dirIcon,

                'header': config.header,
                'resizer': config.resizer,

                'this': null,
                'emitter': null,
                'tpl': null,
                'panel': null,
              
            };


            Object.assign(meta, others);



            return meta;
           
        },


    };
    
});





define('SidebarTree/Panel', function (require, module, exports) {
    const Panel = require('@definejs/panel');
    const $Header = module.require('Header');
    const $Main = module.require('Main');
    const $Resizer = module.require('Resizer');


    return {
        create($meta) {
            const Header = $Header.create($meta);
            const Main = $Main.create($meta);
            const Resizer = $Resizer.create($meta);


            let panel = new Panel(`[data-panel="${$meta.id}"]`);

            panel.on('init', function () {
                Main.on({
                    'item': function (item, status) {
                        panel.fire('item', [item]);

                        Header.render(status);

                    },

                    'dir': function (item) {
                        panel.fire('dir', [item]);
                    },

                    'file': function (item) {
                        panel.fire('dir', [item]);
                    },

                    'fill': {
                        'name': function (item) {
                            let names = panel.fire('fill', 'name', [item]);
                            return names.slice(-1)[0];
                        },
                    },
                });

                Header.on({
                    'back': function () {
                        Main.back();
                    },
                    'forward': function () {
                        Main.forward();
                    },
                    'up': function () {
                        Main.up();
                    },
                    'root': function () {
                        Main.root();
                    },
                    'dir-only': function (sw) {
                        Main.dirOnly(sw);
                    },
                });



            });

            panel.on('init', function () {
                function get() {
                    let width = panel.$.outerWidth();
                    return width;
                }

                function set(width) {
                    panel.$.outerWidth(width);
                }

                let width = get();

                Resizer.on({
                    'change': function (dx) {
                        let w = width + dx;

                        if (w < $meta.minWidth) {
                            set($meta.minWidth)
                            return;
                        }

                        set(w);

                        panel.fire('resize');
                    },

                    'stop': function () {
                        width = get();
                    },
                });
            });


            /**
            * 渲染。
            */
            panel.on('render', function (data) {
                Header.render();
                Main.render(data);
                Resizer.render();


                if ($meta.header) {
                    Header.show();
                }

                if ($meta.resizer) {
                    Resizer.show();
                }
               


            });

            return panel.wrap({
                each: function (fn) { 
                    Main.each(fn);
                },

                open: function (id) {
                    Main.open(id);
                },
            });

        },
    };

});


define('SidebarTree/Template', function (require, module, exports) {
    const Template = require('@definejs/template');


   





    return {
        create: function (meta) {
           
            let tpl = new Template('#tpl-SidebarTree');
           

            tpl.process({
                '': function () {

                    return {
                        'id': meta.id,
                        'width': meta.width,
                        'header-display': meta.header ? '' : 'display: none;',
                        'resizer-display': meta.resizer ? '' : 'display: none;',
                    };
                   
                },

            });




            return tpl;

        },

    };
});

define('SidebarTree.defaults', {

    container: null,
    width: 300,
    minWidth: 220,

    fileIcon: '',
    dirIcon: null,

    header: true,     //是否显示头部。
    resizer: true,    //允许调整宽度。

});

/**
* 菜单树。
*/
define('SidebarTree', function (require, module, exports) {
    const Emitter = require('@definejs/emitter');
    const $ = require('$');

    const Panel = module.require('Panel');
    const Meta = module.require('Meta');
    const Template = module.require('Template');

    const defaults = require('SidebarTree.defaults');
    const mapper = new Map();



    class SidebarTree {
        constructor(config) {
            config = Object.assign({}, defaults, config);

            let emitter = new Emitter(this);

            let meta = Meta.create(config, {
                'this': this,
                'emitter': emitter,
            });


            mapper.set(this, meta);

            Object.assign(this, {
                'id': meta.id,
                '$': meta.$,
            });
        }


        init() {
            let meta = mapper.get(this);

            if (meta.panel) {
                return;
            }

            //首次渲染。
            meta.tpl = Template.create(meta);

            if (meta.container) {
                let html = this.fill();
                $(meta.container).html(html);
            }
        
            meta.panel = Panel.create(meta);
            this.$ = meta.panel.$;

            meta.panel.on({
                'item': function (item) {
                    meta.emitter.fire('item', [item]);
                },
                'dir': function (item) {
                    meta.emitter.fire('dir', [item]);
                },
                'resize': function () {
                    meta.emitter.fire('resize');
                },
                'fill': {
                    'name': function (item) {
                        let names = meta.emitter.fire('fill', 'name', [item]);
                        return names.slice(-1)[0];
                    },
                },
            });
        }

        fill() {
            let meta = mapper.get(this);
            let html = meta.tpl.fill({});
            return html;
        }

        //name 可选。
        render(data) {
            let meta = mapper.get(this);

            this.init();
            meta.panel.render(data);
        }

        on(...args) {
            let meta = mapper.get(this);
            meta.emitter.on(...args);
        }

        open(id) {
            let meta = mapper.get(this);

            meta.panel.open(id);
        }

        each(fn) { 
            let meta = mapper.get(this);
            meta.panel.each(fn);
        }

    }




    return SidebarTree;
});


define('HtmlStat/Repeat', function (require, module, exports) {

    module.exports = {

        check({ old, file, }) {
            if (!old) {
                return false;
            }


            console.error(`已存在相同 id 的模块: ${old.id}\n 所在文件:\n ├──${old.file}\n └──${file}`);
            // console.error(`所在文件:`);
            // console.error(`├──${old.file}`);
            // console.error(`└──${file}`);

            definejs.alert(`已存在相同 id 的模块: ${old.id}<br/>详情请打开控制台`);

            return true;


        },
    };

});


define('ModuleStat/Repeat', function (require, module, exports) {

    module.exports = {

        check({ old, file, }) {
            if (!old) {
                return false;
            }

            console.error(`已存在相同 id 的模块: ${old.id}\n 所在文件:\n ├──${old.file}\n └──${file}`);
            // console.error(`所在文件:`);
            // console.error(`├──${old.file}`);
            // console.error(`└──${file}`);

            definejs.alert(`已存在相同 id 的模块: ${old.id}<br/>详情请打开控制台`);

            return true;


        },
    };

});

define('ModuleStat/Require', function (require, module, exports) {
    const $Array = require('@definejs/array');

    module.exports = {
        parse(id, requires) {

            let id$requires = {};
            let outers = [];    //所依赖的外部公共模块。
            let publics = [];   //所依赖的内部公共模块。
            let privates = [];  //所依赖的内部私有模块。


            requires.publics.map((item) => {
                let { id, } = item;

                $Array.add(id$requires, id, item);

                if (id.includes('/')) {
                    outers.push(id);
                }
                else {
                    publics.push(id);
                }
            });

            requires.privates.map((item) => {
                let sid = `${id}/${item.id}`
                privates.push(sid);

                $Array.add(id$requires, sid, item);
            });


            return { privates, publics, outers, id$requires, };


        },
    };
});

define('HtmlStat', function (require, module, exports) {
    const $Array = require('@definejs/array');
    const Repeat = module.require('Repeat');


    return {

        /**
        * 对分析出来的列表信息从多个维度作进一步分析、提取和归类等，以便后续快速使用相关维度的数据。
        */
        parse(file$info) {
            let id$module = {};     //记录模块 id 对应的模块信息记录。 
            let method$ids = {};    //记录模块的定义方法对应的模块列表。 即按定义方法把模块进行归类。
            let level$ids = {};     //层级对应的模块列表。
            let file$ids = {};      //记录文件名对应的模块 id。 可能存在一对多，即一个文件里定义了两个模块（相同或不同模块）。
            let dir$ids = {};       //目录对应的模块 id。
            let factory$ids = {};   //
            let name$ids = {};      //

            let id$childs = {};     //记录模块 id 对应的直接子模块 id 列表。
            let id$children = {};   //记录模块 id 对应的所有子模块 id 列表。


            Object.entries(file$info).forEach(([file, info]) => {
                //info = { isUTF8, lines, links, md5, modules, stat, }

                let dir = file.split('/').slice(0, -1).join('/');

                if (dir) {
                    dir += '/';
                }

                //这个是必须的，可以发现不存在 module 的文件。
                file$ids[file] = []; 
                dir$ids[dir] = dir$ids[dir] || [];

                info.modules.forEach((module) => {
                    let { factory, id, method, } = module;
                    let old = id$module[id];

                    if (Repeat.check({ old, file, })) {
                        throw new Error(`已存在相同 id 的模块: ${id}`);
                    }

                    let names = id.split('/');
                    let name = names.slice(-1)[0];
                    let level = names.length;
                    let parent = undefined;
                    let parents = [];

                    $Array.add(method$ids, method, id);
                    $Array.add(level$ids, level, id);
                    $Array.add(file$ids, file, id);
                    $Array.add(dir$ids, dir, id);
                    $Array.add(factory$ids, factory.type, id);
                    $Array.add(name$ids, name, id);


                    if (level > 1) {
                        //`A/B/C/D` --> ['A', 'B', 'C']
                        parents = names.slice(0, -1);  

                        //父模块 id，如 `A/B/C`。
                        //可能不存在。
                        parent = parents.join('/');    

                        $Array.add(id$childs, parent, id);

                        // `A/B/C/D` ---> ['A/B/C', 'A/B', 'A']
                        parents = parents.map((name, index) => {
                            let pid = names.slice(0, index + 1).join('/'); //可能不存在。
                            $Array.add(id$children, pid, id);
                            return pid;
                        }).reverse();
                    }

                    
                    id$module[id] = {
                        dir, file,
                        factory, id, method,
                        names, name, level,
                        parent, parents,
                        childs: [],
                        children: [],
                        siblings: [],
                    };
                });
            });

            Object.entries(id$childs).forEach(([id, childs]) => {
                childs.sort();

                childs.forEach((id) => {
                    let module = id$module[id]; //这个肯定不为空。

                    //从过滤掉自己，剩下的就是兄弟节点了。
                    module.siblings = childs.filter((sid) => {
                        return sid != id;
                    });
                });


                let module = id$module[id]; //这个可能为空。

                if (module) {
                    module.childs = childs;
                }

            });


            Object.entries(id$children).forEach(([id, children]) => {
                children.sort();

                let module = id$module[id];
                if (module) {
                    module.children = children;
                }
            });



            return { id$module, method$ids, level$ids, file$ids, dir$ids, factory$ids, name$ids,  };
        },



    };

});


define('ModuleStat', function (require, module, exports) {
    const $Array = require('@definejs/array');
    const Repeat = module.require('Repeat');
    const Require = module.require('Require');


    return {

        /**
        * 对分析出来的列表信息从多个维度作进一步分析、提取和归类等，以便后续快速使用相关维度的数据。
        */
        parse(file$info) {
            let id$module = {};         //记录模块 id 对应的模块信息记录。 
            let method$ids = {};        //记录模块的定义方法对应的模块列表。 即按定义方法把模块进行归类。
            let level$ids = {};         //层级对应的模块列表。
            let file$ids = {};          //记录文件名对应的模块 id。 可能存在一对多，即一个文件里定义了两个模块（相同或不同模块）。
            let dir$ids = {};           //目录对应的模块 id。
            let factory$ids = {};       //
            let name$ids = {};          //
            let outer$dependents = {};  //
            let id$dependents = {};     //记录模块 id 的依赖者列表，即模块 id 被谁依赖了。

            let id$childs = {};         //记录模块 id 对应的直接子模块 id 列表。
            let id$children = {};       //记录模块 id 对应的所有子模块 id 列表。


            Object.entries(file$info).forEach(([file, info]) => {
                //info = { isUTF8, lines, md5, modules, stat, }

                let dir = file.split('/').slice(0, -1).join('/');

                if (dir) {
                    dir += '/';
                }

                file$ids[file] = []; //这个是必须的，可以发现不存在 module 的文件。
                dir$ids[dir] = dir$ids[dir] || [];  

                info.modules.forEach((module) => {
                    let { factory, id, method, requires, } = module;
                    let old = id$module[id];

                    if (Repeat.check({ old, file, })) {
                        throw new Error(`已存在相同 id 的模块: ${id}`);
                    }

                    let names = id.split('/');
                    let name = names.slice(-1)[0];
                    let level = names.length;
                    let parent = undefined;
                    let parents = [];
                    let { privates, publics, outers, id$requires, } = Require.parse(id, requires);

                    $Array.add(method$ids, method, id);
                    $Array.add(level$ids, level, id);
                    $Array.add(file$ids, file, id);
                    $Array.add(dir$ids, dir, id);
                    $Array.add(factory$ids, factory.type, id);
                    $Array.add(name$ids, name, id);


                   

                    privates.forEach((sid) => { 
                        $Array.add(id$dependents, sid, id); //sid 可能不存在。
                    });

                    publics.forEach((sid) => {
                        $Array.add(id$dependents, sid, id); //sid 可能不存在。
                    });

                    outers.forEach((sid) => {
                        $Array.add(outer$dependents, sid, id);  //sid 可能不存在。
                    });

      


                    if (level > 1) {
                        //`A/B/C/D` --> ['A', 'B', 'C']
                        parents = names.slice(0, -1);  

                        //父模块 id，如 `A/B/C`。
                        //可能不存在。
                        parent = parents.join('/');    

                        $Array.add(id$childs, parent, id);

                        // `A/B/C/D` ---> ['A/B/C', 'A/B', 'A']
                        parents = parents.map((name, index) => {
                            let pid = names.slice(0, index + 1).join('/'); //可能不存在。
                            $Array.add(id$children, pid, id);
                            return pid;
                        }).reverse();
                    }

                    
                    id$module[id] = {
                        dir, file,
                        factory, id, method, requires,
                        names, name, level,
                        privates, publics, outers, id$requires,
                        parent, parents,
                        childs: [],
                        children: [],
                        siblings: [],
                        dependents: [],
                    };
                });
            });

            Object.entries(id$childs).forEach(([id, childs]) => {
                childs.sort();

                childs.forEach((id) => {
                    let module = id$module[id]; //这个肯定不为空。

                    //从过滤掉自己，剩下的就是兄弟节点了。
                    module.siblings = childs.filter((sid) => {
                        return sid != id;
                    });
                });


                let module = id$module[id]; //这个可能为空。

                if (module) {
                    module.childs = childs;
                }

            });


            Object.entries(id$children).forEach(([id, children]) => {
                children.sort();

                let module = id$module[id];
                if (module) {
                    module.children = children;
                }
            });

            Object.entries(id$dependents).forEach(([id, dependents]) => {
                let module = id$module[id];

                if (!module) {
                    return;
                }

                let id$dependents = {}; //用于 module 内部的。

                dependents.sort();

                dependents.forEach((sid) => {
                    let module = id$module[sid];
                    let { id$requires, } = module;
                    let requires = id$requires[id];

                    id$dependents[sid] = requires;
                });

                module.dependents = dependents;
                module.id$dependents = id$dependents;
            });



            return { id$module, outer$dependents, method$ids, level$ids, file$ids, dir$ids, factory$ids, name$ids, };
        },






        match(moduleStat, htmlStat) {
            let matchedIds = [];
            let jsIds = [];
            let htmlIds = [];

            Object.keys(moduleStat.id$file).forEach((id) => {
                let htmlFile = htmlStat.id$file[id];

                if (htmlFile) {
                    matchedIds.push(id);
                }
                else {
                    jsIds.push(id);
                }
            });

            Object.keys(htmlStat.id$file).forEach((id) => {
                let jsFile = moduleStat.id$file[id];

                if (jsFile) {
                    // matchedIds.push(id);
                }
                else {
                    htmlIds.push(id);
                }
            });

            return {
                matchedIds,
                jsIds,
                htmlIds,
            }


        },
    };

});

define('Tabs/Template/Class', function (require, module, exports) {
    
    return {
        stringify(data) {
            if (Array.isArray(data)) {
                data = data.join(' ');
            }

            if (!data) {
                return '';
            }

            return `class="${data}"`;
        },
    };
});
define('Tabs/Template/DataSet', function (require, module, exports) {

    return {
        stringify(data) {
            if (!data) {
                return '';
            }

            let list = Object.keys(data).map((key) => {
                let value = data[key];

                return `data-${key}="${value}"`;
            });

            return list.join(' ');
        },
    };
});
define('Tabs/Template/Style', function (require, module, exports) {
    const Style = require('@definejs/style');

    return {
        stringify(data) {
            if (!data) {
                return '';
            }

            data = Style.stringify(data);
            
            if (!data) {
                return '';
            }

            return `style="${data}"`;
        },
    };
});

define('Tabs/Data', function (require, module, exports) {
    const IDMaker = require('@definejs/id-maker');

    let idmaker = new IDMaker('Tabs');


    function make(list, parent, context, fn) {
        if (!list) {
            return [];
        }
        

        list = list.map((item) => {
            let id = item.id;

            //针对非字符串类型的 id，尝试转成 json 字符串。
            if (typeof id != 'string') {
                id = JSON.stringify(id);

                //如果转换后依然不是字符串，则自动分配。
                if (typeof id != 'string') {
                    id = idmaker.next('item');
                }
            }

            context.cid++;

            let node = {
                'id': id,
                'cid': context.cid,
                'level': 0,
                'type': item.type,
                'name': item.name,
                'open': item.open,
                'dirIcon': item.dirIcon,
                'fileIcon': item.fileIcon,
                'style': item.style,
                'dataset': item.dataset,
                'data': item.data || {},
                'list': [],
                'parent': parent || null,
                'parents': [],      //向上追溯所有的父节点。
                'children': [],     //全部子节点，包括直接的和间接的。

            };

            node.list = make(item.list, node, context, fn);


            //向上追溯找出所有的父节点。
            exports.trace(node, function (parent) {
                parent.children.push(node);
                node.parents.push(parent);
            });

            node.level = node.parents.length;

            node.children.sort((a, b) => {
                return a.cid - b.cid;
            });
            

            fn(node);

            return node;

        });

        return list;
    }


    return exports = {

        make(list) {
            let id$item = {};
            let cid$item = {};
            let items = [];
            let context = { cid: 0, };

            list = make(list, null, context, function (node) {
                id$item[node.id] = node;
                cid$item[node.cid] = node;
                items.push(node);
            });
            

            let data = { list, items, id$item, cid$item, };

            return data;

        },


        /**
        * 向上追溯指定节点的所有父节点直到根节点，迭代执行指定的回调函数。
        * @param {Object} node 树节点。
        * @param {function} fn 要执行的回调函数。
        */
        trace(node, fn) {
            let parent = node.parent;

            if (!parent) {
                return;
            }

            fn(parent);

            exports.trace(parent, fn);
        },


        each(node, fn) { 
            fn(node);

            node.list.forEach((node, index) => {
                exports.each(node, fn);
            });
           
        },
       
    };

});



define('Tabs/Events', function (require, module, exports) {
    const $ = require('$');



    return {
        bind(meta) {

            //点击菜单项。
            meta.$.on('click', 'li[data-index]', function (event) {
                let li = this;
                let { index, } = li.dataset;

                meta.this.active(+index);
                

            });

            
            // //绑定动画结束事件。
            // meta.$.on('transitionend', function (event) {
            //     console.log(event);

            //     //忽略掉内部的子节点冒泡上来的动画结束事件。 
            //     if (event.target !== this) {
            //         return;
            //     }

            //     let { index, } = meta;
            //     let item = meta.list[index];
            //     meta.emitter.fire('change', [item, index]);

            //     event.stopPropagation();
              
            // });

        },

    };
});

/**
* 
*/
define('Tabs/Meta', function (require, module, exports) {
    const IDMaker = require('@definejs/id-maker');
    const Storage = require('@definejs/local-storage');


    let idmaker = new IDMaker('Tabs');



    return {

        create(config, others) {
            let { storage, } = config;
            let index = 0;

            if (typeof storage == 'string') {
                storage = new Storage(`${module.id}-${storage}`);
                index = storage.get('index') || 0;
            }
            else {
                storage = null;
            }

            let id = idmaker.next();
            
            let meta = {
                'id': id,                           //实例 id，会生成到 DOM 元素中。

                'container': config.container,      //表格的容器。
                'template': config.template,        //使用的 html 模板的对应的 DOM 节点选择器。
                'class': config.class,              //css 类名。
                'style': config.style,              //css 样式。
                'dataset': config.dataset,          //自定义数据集，会在 html 中生成 `data-` 的自定义属性。
               

                '$': null,
                '$li': null,        //当前激活的 li。
                'this': null,
                'emitter': null,
                'tpl': null,

                'storage': storage,
                'index': index,         //当前激活的 index。
                'list': [],             //节点列表。
                
            };


            Object.assign(meta, others);



            return meta;
           
        },


    };
    
});





define('Tabs/Template', function (require, module, exports) {
    const Template = require('@definejs/template');
    const Class = module.require('Class');
    const DataSet = module.require('DataSet');
    const Style = module.require('Style');
   





    return {
        create(meta) {
           
            let tpl = new Template(meta.template);

           

            tpl.process({
                '': function () {

                    this.fix(['class', 'dataset', 'style',]);

                    let cssClass = Class.stringify(meta.class);
                    let dataset = DataSet.stringify(meta.dataset);
                    let style = Style.stringify(meta.style);
                    let items = this.fill('item', meta.list);

                    return {
                        'id': meta.id,
                        'class': cssClass,
                        'dataset': dataset,
                        'style': style,
                        'items': items,
                    };
                   
                },

                'item': {
                    '': function (item, index) {
                        let { name, icon, } = item;
                       
                        icon = this.fill('icon', item);

                        return {
                            index,
                            name, 
                            icon,
                        };
                    },
                    'icon': function ({ icon, }) { 
                        return icon ? { icon, } : '';
                    },
                },
            });




            return tpl;

        },

    };
});

define('Tabs.defaults', {
    //组件的 id，会生成到 DOM 元素中。
    //一般情况下不需要指定，组件内部会自动生成一个随机的。
    //如果自行指定，请保证在整个 DOM 树中是唯一的。
    id: '',

    container: '',
    template: '#tpl-Tabs', //
    class: 'Tabs',         //css 类名。
    style: {},
    dataset: {},

    //是否公开 meta 对象。
    //如果指定为 true，则外部可以通过 this.meta 来访问。
    //在某些场合需要用到 meta 对象，但要注意不要乱动里面的成员。
    meta: false,
    storage: false, //如果指定为一个 id，则启用。 
    list: [],

  

});

/**
* 
*/
define('Tabs', function (require, module, exports) {
    const Emitter = require('@definejs/emitter');
    const $ = require('$');
    const Events = module.require('Events');
    const Meta = module.require('Meta');
    const Template = module.require('Template');

   
    const mapper = new Map();



    class Tabs {
        /**
        * 构造器。
        * @param {*} config 
        */
        constructor(config) {
            config = Object.assign({}, exports.defaults, config);

           
            let emitter = new Emitter(this);
            
            let meta = Meta.create(config, {
                'this': this,
                'emitter': emitter,
            });

            meta.tpl = Template.create(meta);
            mapper.set(this, meta);

            //指定了公开 meta 对象。
            if (config.meta) {
                this.meta = meta;
            }

            this.id = meta.id;
        }

        /**
        * 渲染 HTML 到容器中以生成 DOM 节点。
        * @returns
        */
        render(list = []) {
            let meta = mapper.get(this);

            //已渲染。
            if (meta.$) {
                if (list.length > 0) {
                    this.update(list);
                }

                return;
            }

            //首次渲染。
            if (list) {
                meta.list = list;
            }

            let html = meta.tpl.fill({}); //填充全部。

            $(meta.container).html(html);
            meta.$ = this.$ = $(`#${meta.id}`);
            
           
            Events.bind(meta);

        }

        /**
        * 更新数据。
        */
        update(list) {
            let meta = mapper.get(this);
            meta.list = list;

            let html = meta.tpl.fill('item', meta.list);
            meta.$.find('>ul').html(html);
        }

        active(index) { 
            let meta = mapper.get(this);
            let { $li, } = meta;

            if ($li) {
                $li.removeClass('on');
            }

            if (typeof index == 'number') {
                meta.index = index;
            }
            else {
                index = meta.index;
            }

            //列表长度可能发生了变化。
            if (index > meta.list.length - 1) {
                index = 0;
            }

            meta.index = index;

            if (meta.storage) {
                meta.storage.set('index', index);
            }

            $li = meta.$li = meta.$.find(`li[data-index="${index}"]`);
            $li.addClass('on');

            //要延迟获取 left 与 width。
            setTimeout(() => {
                let { left, } = $li.position();
                let width = $li.outerWidth();
                let item = meta.list[index];
                let $slider = meta.$.find(`[data-id="slider"]`);

                $slider.css({
                    left: `${left + 10}px`,
                    width: `${width}px`,
                });
                

                //等动画结束后再触发外部逻辑。
                setTimeout(() => {
                    meta.emitter.fire('change', [item, index]);
                }, 150);

            }, 0);

            
        }

       
        /**
        * 绑定事件。
        */
        on(...args) {
            let meta = mapper.get(this);
            meta.emitter.on(...args);
        }

        

    }

    //静态方法。

    module.exports = exports = Tabs;
    exports.defaults = require('Tabs.defaults');

});

/**
* API。 
* 主要实现自动加上 token 字段。
*/
define('API', function (require, module, exports) {
    const $API = require('@definejs/api');
    

    function API(name, config) {
        let api = new $API(name, config);
        let get = api.get.bind(api);
        let post = api.post.bind(api);

      

        api.post = function (data, query) {
            return post({ 'data': data, }, query);
        };



        return api;
    }

    return API;
   

});


define('Clipboard', function (require, module, exports) {
    const Toast = require('@definejs/toast');

    let toast = new Toast({
        duration: 1200,
    });

   





    return {
        
        copy(value) {
            let txt = document.createElement('textarea');
            
            txt.setAttribute('readonly', 'readonly');
            txt.style.height = 0;

            document.body.appendChild(txt);
            
            txt.value = value;
            txt.select();

            if (document.execCommand('copy')) {
                toast.show('已复制');
            }

            document.body.removeChild(txt);
        },
        
    };



});


/**
* 具有事件触发的通用列表类。
* 列表的每一项都必须具有唯一 id 值。
*/
define('List', function (require, module, exports) {
    const Emitter = require('@definejs/emitter');
    let mapper = new Map();


    function List(list) {

        let emitter = new Emitter(this);
        list = list || [];
       
        let meta = {
            'emitter': emitter,
            'list': list.slice(0),
            'reserves': list.slice(0),
        };

        mapper.set(this, meta);

    }




    List.prototype = {
        constructor: List,

        /**
        * 添加一项到列表中。
        * 如果已存在该项，则不重复添加。
        * @param {Object} item 要添加的项。
        * @return 返回该项在列表中的索引位置。
        */
        add: function (item) {
            let index = this.index(item);
            if (index >= 0) { //已存在该项。
                return index;
            }

            let meta = mapper.get(this);
            let list = meta.list;
            let emitter = meta.emitter;

            list.push(item);
            index = list.length - 1;

            emitter.fire('change', [list.slice(0)]);
            emitter.fire('add', [item, index]);

            return index;

        },

        /**
        * 在列表中指定的索引位置处插入一项。
        * @param {number} 要插入的索引位置。
        * @param {Object} 要插入的项。
        * @return 返回该项在列表中的索引值。
        */
        insert: function (index, item) {
            let meta = mapper.get(this);
            let list = meta.list;
            let emitter = meta.emitter;

            index = index + 1;
            list.splice(index, 0, item);
            emitter.fire('change', [list.slice(0)]);
            emitter.fire('insert', [item, index]);

            return index;
        },

        /**
        * 从列表中删除指定索引位置的项。
        * 如果不存在该项，则忽略。
        * 已重载 remove(item);
        * @param {number|Object} index 要删除的项所在的索引位置。
        *   或者指定为要删除的项。
        * @return 返回被删除的项。
        */
        remove: function (index) {
            //重载 remove(item)
            if (typeof index == 'object') {
                index = this.index(index);
            }

            let meta = mapper.get(this);
            let emitter = meta.emitter;
            let list = meta.list;
            let item = list[index];

            if (!item) {
                return;
            }

            list.splice(index, 1); //注意，此时 list 的长度已发生了变化
            emitter.fire('change', [list.slice(0)]);
            emitter.fire('remove', [item, index]);

            return item;
        },

        /**
        * 清空列表。
        * @param {boolean} clearAll 是否清空并且不恢复创建时的样子。
        */
        clear: function (clearAll) {
            let meta = mapper.get(this);
            let list = meta.list;
            let emitter = meta.emitter;
            let reserves = meta.reserves;
            
            meta.list = clearAll ? [] : reserves.slice(0);

            emitter.fire('change', [meta.list.slice(0)]);
            emitter.fire('clear');
        },

        /**
        * 获取指定索引值的列表项。
        * 已重载 get(); 获取全部列表项。
        * @param {number} 要获取的列表项的索引位置。
        * @return {Object|Array} 返回要获取的列表项或全部项。
        */
        get: function (index) {
            let meta = mapper.get(this);
            let list = meta.list;

            return arguments.length == 0 ?
                list.slice(0) :
                list[index];
        },

        /**
        * 获取指定项在列表中的索引位置。
        * 该方法通过项的 id 去检索列表中的每一项，直到找到为止。
        * @param {Object} item 要检索的项。
        * @return {number} 返回该项在列表中的索引位置。
        */
        index: function (item) {
            let meta = mapper.get(this);
            let list = meta.list;
            let id = item.id;

            let index = list.findIndex(function (item, index) {
                return item.id == id;
            });

            return index;
        },

        /**
        * 绑定事件。
        */
        on: function (name, fn) {
            let meta = mapper.get(this);
            meta.emitter.on(...arguments);
        },

    };

    return List;
});

//用来补全 DOM 元素中 `data-panel` 属性的简写。


define('Panel', function (require, module, exports) {
    const $ = require('$');

    const defaults = {
        key: 'panel',   //针对 `data-panel`。
        prefix: './',   //针对简写的开头句式，如 `data-panel="./Main"`。
    };


    function trace(item, opt) {
        let list = [item,];

        collect(item, list, opt);

        list.reverse();

        return list;
    }


    function collect(item, list, opt) {
        let { key, prefix, } = opt;
        let parent = item.parentNode;

        //根节点。
        if (!parent) {
            return;
        }

        let dataset = parent.dataset || {};
        let value = dataset[key];

        if (value) {
            list.push(parent);

            //找到真正的有实名的父节点。
            if (!value.startsWith(prefix)) {
                return;
            }
        }

        collect(parent, list, opt);
    }

    



    return {
        pad(list, opt) {
            opt = opt || defaults;

            let { key, prefix, } = opt;

            list = list || $(`[data-${key}^="${prefix}"]`).toArray();

            console.log(list);

            list.forEach(function (item) {
                let { dataset, } = item;

                if (!dataset) {
                    return;
                }

                //如 `data-panel="./API"`;
                let value = dataset[key];
                
                if (!value || !value.startsWith(prefix)) {
                    return;
                }
                
                let list = trace(item, opt);
                let root = list[0];

                if (root.dataset[key].startsWith(prefix)) {
                    throw new Error(`无法找到值为完整 data-${key} 的父节点。`);
                }

                list.forEach((item, index) => {
                    let value = item.dataset[key];

                    if (!value.startsWith(prefix)) {
                        return;
                    }

                    let parent = list[index - 1];
                    let name = value.slice(prefix.length);
                    let newValue = `${parent.dataset[key]}/${name}`;

                    item.dataset[key] = newValue;
                    item.dataset[`${key}_old`] = value;
                });
            });
        },
    };
});

define('resolveUrl', function (require, module, exports) {
    return window.resolveUrl;
});


define.panel('/Loading', function (require, module, panel) {



});

define.panel('/Markdoc/Content', function (require, module, panel) {
    const MarkDoc = require('MarkDoc');

    let markdoc = null;
   

    panel.on('init', function () {

        markdoc = new MarkDoc({
            'container': panel.$.find('[data-id="content"]'),
        });


        
        markdoc.on('render', function (data) {
            let outlines = markdoc.getOutlines();

            panel.fire('render', [{
                'title': data.title,
                'outlines': outlines,
            }]);

        });


        markdoc.on('hash', function (href) {
            panel.fire('hash', [href]);
        });
    });




    /**
    * 
    */
    panel.on('render', function (content, info) {
       
        markdoc.render({
            'content': content,
            'baseUrl': info.url,
            'language': info.isCode ? info.ext : '',
        });

    });






    return {

        'toOutline': function (index) {
            markdoc.toOutline(index);
        },

        'font': function (size) {
            markdoc.$.css({
                'font-size': size + 'px',
            });
        },

    };

});


/**
* 针对代码模式的头部工具栏。
*/
define.panel('/Markdoc/Header', function (require, module, panel) {
    const $String = require('@definejs/string');

    
    let list = [
        { cmd: 'numbers', text: '行号', checked: true, },
        { cmd: 'comment', text: '注释', checked: true, },
        //{ cmd: 'empty', text: '空行', checked: true, },
        //{ cmd: 'mark', text: '当前行', checked: true, },
    ];


    panel.set('show', false);


    panel.on('init', function () {

        panel.$.on('click', '[data-index]', function () {
            let chk = this;
            let index = +chk.getAttribute('data-index');
            let item = list[index];
            let cmd = item.cmd;
            let checked = chk.checked;

            //在源代码比较多时，选中的动画会比较卡。
            //先让动画完成，再执行其它业务可避免此问题。
            if (checked) {
                setTimeout(function () {
                    panel.fire('check', [cmd, checked]);
                }, 200);
            }
            else {
                panel.fire('check', [cmd, checked]);
            }
            
        });

        panel.template({
            '': function (data) {
                let html = this.fill('html', data);
                return html;
            },

            'html': {
                '': function (data) {
                    let items = this.fill('item', data.list);

                    return {
                        'url': data.url,
                        'name': data.name,
                        'items': items,
                    };
                },
                'item': function (item, index) {

                    return {
                        'id': $String.random(),
                        'index': index,
                        'text': item.text,
                        'checked': item.checked ? 'checked': '',
                    };
                },
            },

        });

    });

    panel.on('render', function (data) {

        if (!data.isCode) {
            panel.hide();
            return;
        }

        panel.fill({
            'url': data.url,
            'name': data.name,
            'list': list,
        });

        panel.show();
       
    });



    return {
        'leave': function (sw) {
            panel.$.toggleClass('fixed', sw);
        },
    };



});


/**
* 提纲，即内容目录。
*/
define.panel('/Markdoc/Outline', function (require, module, panel) {
    const Outline = require('Outline');

    let outline = null;



    panel.set('show', false); //不要在 render 后自动显示。


    panel.on('init', function () {

        panel.$.on('scroll', 'ul', function (event) {
            event.stopPropagation();
            console.log(event);
        });

        outline = new Outline({
            'container': panel.$.find('[data-id="container"]'),
        });

        outline.on({
            'item': function (item, index) {
                panel.fire('item', [item, index]);
            },
        });

        outline.render();
    });



 
    /**
    * 渲染。
    *   items = [
    *       {
    *           text: '',       //
    *           level: 1,       //
    *       },
    *   ];
    */
    panel.on('render', function (items) {

        outline.fill(items);

    });


   



});


/**
* 右侧固定的工具栏。
*/
define.panel('/Markdoc/Tools', function (require, module, panel) {
    let list = [
        {
            "cmd": "top",
            "text": "顶部",
            "icon": "fas fa-chevron-up"
        },
        {
            "cmd": "home",
            "text": "首页",
            "icon": "fas fa-home"
        },
        {
            "cmd": "outline",
            "text": "提纲",
            "icon": "fas fa-list"
        },
        {
            "cmd": "font",
            "text": "字体",
            "icon": "fas fa-font"
        },
        {
            "cmd": "print",
            "text": "打印",
            "icon": "fas fa-print"
        },
        {
            "cmd": "bottom",
            "text": "底部",
            "icon": "fas fa-chevron-down"
        }
    ];

    let font = {
        list: [14, 16, 18, 20],
        index: 1,
    };
    

    panel.set('show', false);

    panel.on('init', function () {


        panel.$on('click', '[data-cmd="{value}"]', {
            'top': function () {
                panel.fire('top');
            },

            'home': function () {
                location.hash = '';
            },

            'font': function () {
                let list = font.list;
                let index = font.index + 1;

                if (index >= list.length) {
                    index = 0;
                }

                font.index = index;
                panel.fire('font', [list[index]]);

            },

            'outline': function () {
                panel.fire('outline');
            },

            'print': function () {
                panel.fire('print');
            },

            'bottom': function () {
                panel.fire('bottom');
            },
        });

        panel.template(function (item, index) {
            return {
                'index': index,
                'cmd': item.cmd || '',
                'text': item.text || '',
                'icon': item.icon || '',
            };
        });

    });


   


    panel.on('render', function () {

        panel.fill(list);
        panel.show();

    });


    return {
        set: function (isCode) {
            panel.$.find('[data-cmd="outline"]').toggle(!isCode);
        },
    };


});





    

define('/Markdoc/Url', function (require, module, exports) {
    let texts = [
        'md',
        'txt',
        'markdown',
    ];

    let images = [
        'bmp',
        'gif',
        'jpg',
        'jpeg',
        'png',
    ];

    //提取出目录
    function getDir(url) {
        url = url.split('#')[0];
        url = url.split('?')[0];

        let dir = url.split('/').slice(0, -1).join('/') + '/';  
        return dir;
    }



    return {
        parse(sUrl) {
            console.log({ sUrl });

            let isOrigin = sUrl.startsWith('@');            //是否明确指定作为源码模式。
            let url = isOrigin ? sUrl.slice(1) : sUrl;      //
            let ext = url.split('.').slice(-1)[0].toLowerCase();          //
            let name = url.split('/').slice(-1)[0];         //取最后一部分的短名称
            let dir = getDir(url);
            
            let isMarkdown = texts.includes(ext) || images.includes(ext); //
            let isCode = isOrigin || !isMarkdown;

            

            return {
                'url': url,
                'name': name,
                'dir': dir,
                'ext': ext,
                'isCode': isCode,
            };
        },
    };

});



define.panel('/Markdoc', function (require, module, panel) {
    const File = require('File');
    const Header = module.require('Header');
    const Content = module.require('Content');
    const Url = module.require('Url');
    const Outline = module.require('Outline');
    const Tools = module.require('Tools');


    panel.on('init', function () {

        Header.on({
            'check': function (cmd, checked) {
                panel.$.toggleClass(`no-${cmd}`, !checked);
            },
        });
       


   


        Content.on({
            'render': function ({ title, outlines, }) {
                document.title = title;
                Outline.render(outlines);
                Tools.render();
            },

        });

        Outline.on({
            'item': function (item, index) {
                Content.toOutline(index);
            },
        });

        Tools.on({
            'top': function () { },
            'bottom': function () {
                let h = panel.$.get(0).scrollHeight;
                console.log(module.id, h);

                scrollTo(0, h);
            },
            'outline': function () {
                Outline.toggle();
            },


            'print': function () {
                //切换打印模式和正常模式。
                function print() {
                    panel.$.toggleClass('print');
                }

                print();

                //同步模式，打印窗口关闭后会有返回值。
                document.execCommand('print') && print();
            },

            'font': function (size) {
                
                Content.font(size);
            },
        });

    });


    /**
    *
    */
    panel.on('render', function (url) {
        let info = Url.parse(url);

        console.log(info);

        //切换普通模式和代码模式。
        panel.$.toggleClass('source', info.isCode);

        //针对代码模式的头部工具栏，仅代码模式时显示。
        Header.render(info);


        File.read(info.url, function (content) {
            Content.render(content, info);

            panel.fire('loading', [false]);

        });

       
        
    });




    return {


    };


});


define('/Master/PageList/List', function (require, module, exports) {
    const List = require('List');

    let list = new List([]);

    return list;

});


define('/Master/PageList/Mask', function (require, module, exports) {
    const Panel = require('@definejs/panel');
    const Masker = require('@definejs/masker');

    let mask = null;
    let visible = false;
    let panel = new Panel();


    panel.on('init', function () {

        mask = new Masker({
            volatile: true, //易消失。
            //opacity: 0.04,
            opacity: 0,
            //'z-index': -1, //测试。
        });


        mask.on({
            'hide': function () {
                visible = false;
                panel.fire('hide');
            },
            'show': function () {
                visible = true;
                panel.fire('show');
            },
        });


    });






    panel.on('render', function () {
       
    });





    return panel.wrap({
        toggle: function () {
            if (!visible) {
                mask.show();
            }
            else {
                mask.hide();
            }
        },
    });
});


define.panel('/Master/PageList/Tabs', function (require, module, panel) {
    const $ = require('$');
    const Tabs = require('@definejs/tabs');
    const Language = require('Settings.Language');



    let tabs = null;


    let meta = {
        index: 0,
        list: [],
    };

    panel.on('init', function () {
        tabs = new Tabs({
            container: panel.$.get(0),
            selector: '>li',
            eventName: 'click',
            indexKey: 'data-index',
            activedClass: 'on',
        });

        tabs.on('change', function (item, index) {
            meta.index = index;
            panel.fire('active', [item, index]);
        });


        tabs.template(function (item, index) {
            return {
                'index': index,
                'name': item.name,
                'icon': item.icon,
                'close-display': item.view == 'Home' ? 'display: none;' : '',
            };
        });


        Language.on('change', function (value, old) {
            panel.render(meta.list);
            tabs.reset();
            tabs.active(meta.index);
        });

        panel.$on('click', {
            '[data-cmd="close"]': function (event) {
                event.stopPropagation();

                let li = this.parentNode;
                let index = +li.getAttribute('data-index');
                let item = meta.list[index];

                //发出信号告诉外面即将要关闭了。
                let values = panel.fire('before-close', [item, index]);

                //外面有返回 false 时，取消关闭。
                if (values.includes(false)) {
                    return false;
                }

                exports.close(index, true); //主动关闭的，需要触发事件。
            },
        });

    });




    panel.on('render', function (items) {
        let language = Language.get();

        let list = meta.list = items.map((item) => {
            item.name = item.language$name[language];
            return item;
        });


        tabs.render(list);

    });


    let exports = null;

    return exports = {

        active(index, fireEvent) {
            meta.index = index;
            tabs.active(index, fireEvent);

            let li = panel.$.find('>li').get(index);

            if (li) {
                let scroll = li.scrollIntoViewIfNeeded || li.scrollIntoView;   //优先使用前者，但在 IE 下不存在该方法。
                scroll.call(li);
            }
        },

        index() {
            return tabs.getActivedIndex();
        },

        close(index, fireEvent) {
            //这两句不要放在动画的回调函数内，因为外面可能已给更改了 list。
            let item = meta.list[index]; 
            tabs.remove(index); //让 tabs 设置到正确的状态

            panel.$.find(`>li[data-index="${index}"]`).animate({
                height: 0,  //这里是高度。
            }, function () {

                $(this).hide();
                if (fireEvent) {
                    panel.fire('after-close', [item, index]);
                }

            });
        },

        
    };


});


define.panel('/Master/PageList', function (require, module, panel) {
    const List = module.require('List');
    const Tabs = module.require('Tabs');
    const Mask = module.require('Mask');



    panel.on('init', function () {
        let div = panel.$.find('>div');

        panel.$on('click', {
            '>i': function (event) {
                Mask.toggle();
            },
            
            '[data-cmd="refresh"]': function (event) {
                panel.fire('refresh');
            },
        });

        Mask.on({
            'hide': function () {
                div.slideUp('fast');
                panel.$.removeClass('show');
            },
            'show': function () {
                div.slideDown('fast');
                panel.$.addClass('show');
            },
        });

        List.on({
            'change': function (list) {
                Tabs.render(list);
            },
            'remove': function (item, index) {
                Tabs.active(index - 1, true);
            },
        });

        Tabs.on({
            'active': function (item, index) {
                panel.fire('active', [item, index]);
            },
            'before-close': function (item, index) {
                let values = panel.fire('before-close', [item, index]);

                if (values.includes(false)) {
                    return false;
                }
            },

            //关闭后。
            'after-close': function (item, index) {
                List.remove(index);
                panel.fire('after-close', [item, index]);
            },
        });


    });

    


    panel.on('render', function () {
        Tabs.render([]);
        Mask.render();
       
    });



    return {
        open: function (item) {
            let index = List.index(item);

            //尚未存在。
            if (index < 0) {
                //在当前激活的项后面插入。
                index = Tabs.index();
                index = List.insert(index, item);
            }

            Tabs.active(index, false); //不触发事件。

        },

        //给外面手动关闭页签。
        close: function (id) {
            let index = List.index({ 'id': id, });

            Tabs.close(index, false);//被动关闭的，不需要触发事件。
            List.remove(index);
        },




    };



});


define('/Master/PageTabs/List', function (require, module, exports) {
    const List = require('List');

    let list = new List([]);

    return list;

});


define.panel('/Master/PageTabs/Tabs', function (require, module, panel) {
    const $ = require('$');
    const Tabs = require('@definejs/tabs');
    const Language = require('Settings.Language');



    let tabs = null;


    let meta = {
        index: 0,
        list: [],
    };

    panel.on('init', function () {
        tabs = new Tabs({
            container: panel.$.get(0),
            selector: '>li',
            eventName: 'click',
            indexKey: 'data-index',
            activedClass: 'on',
        });

        tabs.on('change', function (item, index) {
            meta.index = index;
            panel.fire('active', [item, index]);
        });


        tabs.template(function (item, index) {
            return {
                'index': index,
                'name': item.name,
                'icon': item.icon,
                'close-display': item.view == 'Home' ? 'display: none;' : '',
            };
        });


        Language.on('change', function (value, old) {
            panel.render(meta.list);
            tabs.reset();
            tabs.active(meta.index);
        });

        panel.$on('click', {
            '[data-cmd="close"]': function (event) {
                event.stopPropagation();

                let li = this.parentNode;
                let index = +li.getAttribute('data-index');
                let item = meta.list[index];

                //发出信号告诉外面即将要关闭了。
                let values = panel.fire('before-close', [item, index]);

                //外面有返回 false 时，取消关闭。
                if (values.includes(false)) {
                    return false;
                }

                exports.close(index, true); //主动关闭的，需要触发事件。
            },
        });

    });




    panel.on('render', function (items) {
        let language = Language.get();

        let list = meta.list = items.map((item) => {
            item.name = item.language$name[language];
            return item;
        });


        tabs.render(list);
       
    });



    let exports = null;

    return exports = {

        active(index, fireEvent) {
            meta.index = index;
            tabs.active(index, fireEvent);

            let li = panel.$.find('>li').get(index);

            if (li) {
                let scroll = li.scrollIntoViewIfNeeded || li.scrollIntoView;   //优先使用前者，但在 IE 下不存在该方法。
                scroll.call(li);
            }
        },

        index() {
            return tabs.getActivedIndex();
        },

        close(index, fireEvent) {
            //这两句不要放在动画的回调函数内，因为外面可能已给更改了 list。
            let item = meta.list[index];
            tabs.remove(index); //让 tabs 设置到正确的状态

            panel.$.find(`>li[data-index="${index}"]`).animate({
                width: 0,
                padding: 0,
            }, function () {

                $(this).hide();

                if (fireEvent) {
                    panel.fire('after-close', [item, index]);
                }

            });
        },

        
      
    };

});


define.panel('/Master/PageTabs', function (require, module, panel) {
    const List = module.require('List');
    const Tabs = module.require('Tabs');


    panel.on('init', function () {
        List.on({
            'change': function (list) {
                Tabs.render(list);
            },
            'remove': function (item, index) {
                Tabs.active(index - 1, true);
            },
        });


        Tabs.on({
            'active': function (item, index) {
                panel.fire('active', [item, index]);
            },
            'before-close': function (item, index) {
                let values = panel.fire('before-close', [item, index]);

                if (values.includes(false)) {
                    return false;
                }
            },

            //关闭后。
            'after-close': function (item, index) {
                List.remove(index);
                panel.fire('after-close', [item, index]);
            },
        });

    });

    


    panel.on('render', function () {
        Tabs.render([]);


    });





    return {
        open(item) {
            let index = List.index(item);
         
            //尚未存在。
            if (index < 0) {
                //在当前激活的项后面插入。
                index = Tabs.index();
                index = List.insert(index, item);
            }

            Tabs.active(index, false); //不触发事件。

        },

        //给外面手动关闭页签。
        close(id) {
            let index = List.index({ 'id': id, });

            Tabs.close(index, false);//被动关闭的，不需要触发事件。
            List.remove(index);
        },

       
       
    };


});

define('/Master/Sidebar/List/Data', function (require, module, exports) {
    const Language = require('Settings.Language');


    return {

        make(items) {
            let language = Language.get();

            let list = items.map((item, index) => {
                item = { ...item, };

                item.id = item.view;    //这里以 view 作为 id，需要具有唯一性。
                item.index = index;
                item.name = item.language$name[language];

                return item;
            });

            return list;
        },

        set(list, language) {
            list.forEach((item) => {
                item.name = item.language$name[language];
            });
        },

       
    };
});


define.panel('/Master/Sidebar/Header', function (require, module, panel) {
    const Storage = require('@definejs/local-storage');

    let storage = null
    let visible = true;


    panel.on('init', function () {
        storage = new Storage(module.id);
        visible = storage.get('visible');

        if (visible === undefined) {
            visible = true;
        }

        panel.fire('toggle', [visible]);


        panel.$.on('click', function () {
            visible = !visible;

            storage.set('visible', visible);
            panel.fire('toggle', [visible]);

        });
    });




    panel.on('render', function () {
     
       

    });






});


define.panel('/Master/Sidebar/List', function (require, module, panel) {
    const Tabs = require('@definejs/tabs');
    const Language = require('Settings.Language');
    const Data = module.require('Data');

    let tabs = null;

    let meta = {
        index: -1,   //
        list: [],
    };



    panel.on('init', function () {

        tabs = new Tabs({
            container: panel.$,
            selector: '>li',
            activedClass: 'on',
            repeated: true,
        });

        tabs.on('change', function (item, index) {
            //点击的是当前已激活的项，则当成是刷新，有意而为之。
            if (index == meta.index) {
                panel.fire('refresh', [item]);
                return;
            }

            item = meta.list[index];
            meta.index = index;

            panel.fire('item', [item]);
        });

      
       

        panel.template(function (item, index) {
            return {
                'index': index,
                'name': item.name,
                'icon': item.icon,
                'class': item.border ? 'group' : '',
            };
        });

        Language.on('change', function (value, old) {
            Data.set(meta.list, value);
            panel.fill(meta.list);

            tabs.reset();
            tabs.active(meta.index);
        });


    });




    panel.on('render', function (items) {
        let list = meta.list = Data.make(items);

        panel.fill(list);
        
        tabs.render();
        panel.fire('render', [list]);


    });



    


    return {
        active: function (item) {
            let index = item.index;

            if (typeof index != 'number') {
                index = -1;
            }

            meta.index = index;
            tabs.active(index, false);
        },

        get: function (view) {
            let item = meta.list.find(function (item, index) {
                return item.view === view;
            });

            return item;
        },

    };

});


define.panel('/Master/Sidebar', function (require, module, panel) {
    const Package = require('@definejs/package');
    const Header = module.require('Header');
    const List = module.require('List');


    panel.on('init', function () {

        Header.on({
            'toggle': function (visible) {
                panel.fire('toggle', [visible]);
            },
        });

        List.on({
            'render': function (list) {
                panel.fire('render', [list]);
            },
            'item': function (item) {
                panel.fire('item', [item]);
            },
            'refresh': function (item) {
                panel.fire('refresh', [item]);
            },
        });

      
    });





    panel.on('render', function () {

        Package.load('data.Sidebar', function () {
            let list = require('data.Sidebar');

            Header.render();
            List.render(list);

        });

    });




    return {

        active(item) {
            if (typeof item == 'string') {
                item = List.get(item);
            }

            if (!item) {
                return;
            }

            List.active(item);

            return item;
        },
    };

});


define.panel('/Master/Views', function (require, module, panel) {
    const Package = require('@definejs/package');

    
    let meta = {
        current: null,              //当前激活的视图。
        view$bind: new Map(),       //记录视图是否已被绑定事件。
        view$rendered: new Map(),   //记录视图是否已经 render 过了。 用于辅助要 show() 还是要 render()。
    };


    function get(name) {
        let values = panel.fire('require', [name]);
        let view = values[0];

        if (!view) {
            return;
        }

        //未绑定事件。
        if (!meta.view$bind.get(view)) {
            meta.view$bind.set(view, true);

            //接收来自 view 内部触发的事件。
            //即以下事件是 view 内部业务层的代码触发的。

            //视图内部发出信号想要关闭。
            view.on('close', function (...args) {
                panel.fire('close', [name]);
            });
           

            view.on('fullscreen', function (...args) {
                panel.fire('fullscreen', args);
            });

            //视图内部发出信号想要设置 title。
            view.on('title', function (...args) {
                panel.fire('title', args);
            });
        }
     

    
        return view;
    }



    //激活指定的视图。
    function active(view, opt = {}) {
        let { args = [], render = null, title = '', } = opt;

        if (meta.current) {
            meta.current.hide();
        }

        meta.current = view;

        //未指定是否要渲染。
        if (render === null) {
            render = !meta.view$rendered.get(view);
        }

        //这句放在 view.render() 的前面。
        //因为 view 内部可能有要修改 title 的逻辑。
        //让 view 内部的发出的 title 优先级更高。
        panel.fire('title', [title]);

        if (render) {
            meta.view$rendered.set(view, true);
            view.render(...args);
        }
        else {
            view.show();
        }

        

    }



    panel.on('init', function () {
        
    });
  



    panel.on('render', function (name, opt) {
        //重载 render(item, opt);
        if (typeof name == 'object') {
            let item = name;
            name = item.view;

            opt = {
                'title': item.name,
                ...opt,
            };
        }


        let view = get(name);

        if (view) {
            active(view, opt);
            return;
        }

        //尝试以异步方式去加载。
        Package.load(name, function (pack) {
            if (!pack) {
                console.warn(`不存在视图 ${name} 对应的 package 文件。`);
                panel.fire('404', [name, opt]);
                return;
            }

            //要先添加 html 内容。
            let html = pack['html'];
            if (html) {
                panel.$.append(html.content);
            }

            //再去加载 js 模块。
            let view = get(name);

            if (!view) {
                console.warn(`无法获取到视图 ${name}`);
                panel.fire('404', [name, opt]);
                return;
            }

            active(view, opt);

        });

    });



    return {
        /**
        * 关闭指定名称的视图，并传递一些参数。
        */
        close(name, args) {
            
            let view = get(name);

            if (!view) {
                return;
            }

            //目标视图中有阻止关闭的，或需要确认关闭的，则先取消关闭。
            //调用 view.close(); 会触发 view 内部的 `close` 事件，从而执行 view 内部的业务代码。
            //目标视图包含：
            //  view.on('close', function () { 
            //      return false;
            //  });
            //通过返回 false 即可阻止关闭。
            let values = view.close(...args);

            if (values.includes(false)) {
                return false;
            }

            view.$.fadeOut('slow', function () {
                view.hide();
            });

            //关闭的是当前被激活的视图。
            if (meta.current === view) {
                meta.current = null;
            }
            
            meta.view$rendered.delete(view);
        },

        /**
        * 刷新指定的或当前视图。
        */
        refresh(view) {
            view = view || meta.current;

            if (typeof view == 'string') {
                view = get(view);
            }

            if (!view) {
                return;
            }

          
            view.refresh();
            meta.view$rendered.set(view, true);
        },
    };


});


define.panel('/Master/Container', function (require, module, panel) {
    const Header = require('Settings.Header');


    panel.on('init', function () {
        Header.on('change', function (value, old) {
            panel.$.toggleClass('no-header', value == 'hide');
        });


    });


    panel.on('render', function () {
        let value = Header.get();
        panel.$.toggleClass('no-header', value == 'hide');

    });

});


define.panel('/Master', function (require, module, panel) {
    const Sidebar = module.require('Sidebar');
    const Container = module.require('Container');
    const PageTabs = module.require('PageTabs');
    const PageList = module.require('PageList');
    const Views = module.require('Views');


  
    let meta = {
        rendered: false,
        view: '', //记录在 Sidebar 就绪后要进一步打开的视图。
    };

    function open(view) {
        if (!view) {
            return;
        }

        

        let item = Sidebar.active(view);

        PageTabs.open(item);
        PageList.open(item);
        Views.render(item);
    }


    panel.on('init', function () {
        Sidebar.on({
            'render': function (list) {
                let home = list[0].view;
                PageTabs.render();
                PageList.render();


                open(home);

                if (meta.view != home.view) {
                    open(meta.view);
                    meta.view = '';
                }

                panel.fire('ready');
            },

            'item': function (item) {
                location.hash = '#' + item.view;
            },

            'refresh': function (item) {
                Views.refresh();
            },

            'toggle': function (visible) {
                panel.$.toggleClass('hide', !visible);
            },

        });

        PageTabs.on({
            'active': function (item, index) {
                location.hash = '#' + item.view;
            },
            //主动关闭前触发。
            'before-close': function (item, index) {
                return Views.close(item.view, [index]);
            },

            //主动关闭后触发。
            'after-close': function (item, index) {
                PageList.close(item.id);
            },
        });

        PageList.on({
            'active': function (item, index) {
                location.hash = '#' + item.view;
            },
            //关闭前触发。
            'before-close': function (item, index) {
                return Views.close(item.view, [index]);
            },

            'after-close': function (item, index) {
                PageTabs.close(item.id);
            },

            'refresh': function () {
                Views.refresh();
            },

        });

        Views.on({
            'require': function (name) {
                let values = panel.fire('require', [name]);
                return values[0];
            },

            '404': function (name, opt) {
                Views.render('404', {
                    'args': [name],
                    'render': true,
                    'title': `404 - ${opt.title}`,
                });
            },

            'close': function (name) {
                PageTabs.close(name);
                PageList.close(name);
            },

            'title': function (title) {
                document.title = `webpart - ${title}`;
            },

            'fullscreen': function (...args) {
                panel.$.toggleClass('fullscreen', ...args);
            },
        });

    });


    /**
    *
    */
    panel.on('render', function (view) {
        if (!view) {
            location.hash = '#Home';
            return;
        }

        if (meta.rendered) {
            open(view);
            return;
        }
        
        
        meta.view = view;
        meta.rendered = true;

        Sidebar.render();
        Container.render();
        
      
    });


    //让 panel 先 show 出来再触发外界绑定的 render 事件。
    panel.on('after-render', function () {
        panel.fire('render');

    });



    return {
        open: function (view, args) {
            Views.render(view, {
                'args': args,
                'render': true,
            });

            location.hash = '#' + view;

        },

    };


});

define.panel('/Router', function (require, module, panel) {
    const Hash = require('@definejs/hash');


    panel.on('init', function () {

        Hash.onchange(window, true, function (hash, old) {
            hash = hash || '';

            if (hash.startsWith('!')) {
                let url = hash.slice(1);
                panel.fire('markdoc', [url]);
            }
            else {
                panel.fire('master', [hash]);
            }

        });
    });
    
    panel.on('render', function () {

    });


   

});

define.view('/404', function (require, module, view) {


    view.on('init', function () {

  
    });


    view.on('render', function (name) {
        console.log(module.id, name);
    });

});


define('/DocAdd/Data/API', function (require, module, exports) {
    const Emitter = require('@definejs/emitter');
    const Loading = require('@definejs/loading');
    const Toast = require('@definejs/toast');
    const File = require('File');
    const API = require('API');

    let emitter = new Emitter();

    let loading = new Loading({
        mask: 0,
    });

    let toast = new Toast({
        text: '保存成功',
        duration: 1500,
        mask: 0,
    });



    return {
        on: emitter.on.bind(emitter),

        read(file) {

            File.read(file, function (content) { 
                let ext = File.getExt(file);
                ext = ext.toLowerCase();

                emitter.fire('success', 'read', [{ file, content, ext, }]);
            });

        },


        //提交详情
        save(opt) {
            let api = new API('FileList.write');

            api.on({
                'request': function () {
                    loading.show('保存中...');
                },

                'response': function () {
                    loading.hide();
                },

                'success': function (data, json, xhr) {

                    toast.show();

                    setTimeout(function () {
                        emitter.fire('success', 'save', [data, opt]);
                    }, 1500);

                },

                'fail': function (code, msg, json) {
                    definejs.alert(`保存失败: ${msg}`);
                },

                'error': function () {
                    definejs.alert('保存错误: 网络繁忙，请稍候再试');
                },
            });

            api.post(opt);

        },

    };


});


define('/DocAdd/Data/Status', function (require, module, exports) {
    const Storage = require('@definejs/local-storage');

    let storage = new Storage(module.id);


    let meta = {
        /**
        * 状态。 取值：
        *   'init': 初始状态。
        *   'read': 刚读取文件的状态。
        *   'changed',
        *   'saved',
        */
        'status': storage.get('status') || 'init',
    };



    return {

        panel: null,

        set(status) {
            meta.status = status;
            storage.set('status', status);
            this.panel.fire('status', status);
        },
        
        get() {
            return meta.status;
        },

        confirm(done) {
            if (meta.status == 'changed') {
                definejs.confirm(`当前编辑器中存在未保存的内容，是否继续加载新内容？`, done);
            }
            else {
                done();
            }
        },
    };


});



define('/DocAdd/Data/Storage', function (require, module, exports) {
    const Storage = require('@definejs/local-storage');

    let storage = new Storage(module.id);


    return exports = {

        get() {
            let data = storage.get() || {
                file: '',
                content: '',
                ext: '',
            };

            return data;
        },

        set({ file, content, ext, }) {
            file = file || '';
            content = content || '';
            ext = ext || '';

            
            //editor 会把 `\r\n` 替换成一个 `\n`。
            //这里也要保持一致，否则会造成 content 一进一出后不相等。
            if (content) {
                content = content.split('\r\n').join('\n');
            } 

            let data = { file, content, ext, };
            storage.set(data);

            return data;
        },
        

      
    };


});



define.panel('/DocAdd/Data', function (require, module, panel) {
    const API = module.require('API');
    const Storage = module.require('Storage');
    const Status = module.require('Status');
   


    panel.on('init', function () {
        Status.panel = panel;

        API.on('success', {

            'read': function ({ file, content, ext, }) {
                Storage.set({ file, content, ext, });
                Status.set('read');
                panel.fire('render', [{ file, content, ext, }]);
            },

            'save': function (data, opt) {
                Storage.set(data);
                Status.set('saved');
                panel.fire('save', [data, opt]);
            },
        });
    });

   

    panel.on('render', function (file) {
        //没指定文件 id 或内容，则从 storage 中读取。
        if (file === undefined) {
            let data = Storage.get();
            Status.set('init');
            panel.fire('render', [data]);
            return;
        }

        //传入是文件 id。
        if (typeof file == 'string') {
            Status.confirm(function () {
                API.read(file);
            });
            return;
        }

        
        //指定了新内容。
        if (typeof file == 'object') {
            Status.confirm(function () {
                let { content, ext, } = file;
                let old = Storage.get();
                let data = Storage.set({ content, ext, });

                //指定了新的内容。
                let status =
                    content === '' ? 'init' :
                    content != old.content ? 'changed' : '';

                Status.set(status);
                panel.fire('render', [data]);
            });
        }

        throw new Error(`无法识别的参数`);


     
        

       

    });






    return {
       
        set(content) {
            let old = Storage.get();

            let status =
                content === '' ? 'init' :
                content != old.content ? 'changed' : '';
           
            
            Status.set(status);
            Storage.set('content', content);
        },

        /**
        * 
        * @param {*} name 
        * @returns 
        */
        save(name) {
            let data = Storage.get();
            let mode = data.name ? 'edit' : 'new';

            if (mode == 'edit') {
                name = data.name;
            }
          
            if (!name) {
                definejs.alert(`文件 id 不能为空。`)
                return;
            }



            API.save({
                'id': name,                 //
                'mode': mode,               // `new` | `edit`。
                'content': data.content,    //
            });
        },

        status() {
            return Status.get();
        },

        
    };

});



define('/DocAdd/Editor/CMD', function (require, module, exports) {

    //把一些额外命令收拢到该模块，
    //主要是为了父模块更简洁些。

    let editor = null;



    /**
    * 使用特定的标记去包裹编辑器中所有选中的文本。
    * 如用 `**` 去加粗。
    *   options = {
    *       empty: false,   //是否允许操作空选中。 如果指定为 true，则会插入为 beginTag + endTag 的内容。
    *   };
    */
    function wrap(beginTag, endTag, options) {
        if (typeof endTag == 'object') {
            options = endTag;
            endTag = '';
        }


        endTag = endTag || beginTag;
        options = options || { empty: false, };


        let list = editor.getSelections();

        let values = list.map(function (item) {

            //没有选中时。
            if (!item) {
                return options.empty ? beginTag + endTag : item;
            }

            if (item.startsWith(beginTag) && item.endsWith(endTag)) {

                return item.slice(beginTag.length, 0 - endTag.length);
            }

            return beginTag + item + endTag;
        });


        editor.replaceSelections(values, list);

        if (list.length < 2) {
            editor.focus();
        }

    }





    return {

        init: function (edt) {
            editor = edt;
        },


        //插入横线。
        hr: function () {
            let hr = '----------\n';
            let info = editor.getCursor(); //info = { line: 100, ch: 12, xRel: 1, };

            //如果所在的光标不是在行的首字符，则在前面加多一个换行。
            if (info.ch > 0) {
                hr = '\n' + hr;
            }

            editor.replaceSelection(hr);
        },


        redo: function () {
            editor.redo();
        },

        undo: function () {
            editor.undo();
        },

        bold: function () {
            wrap('**');
        },

        italic: function () {
            wrap('*');

        },

        code: function () {
            wrap('`');
        },
       

        link: function () {
            wrap('[', '](http://)', { empty: true, });
        },


        image: function () {
            wrap('![', '](http://)', { empty: true, });
        },


        quote: function () {
            let list = editor.getSelections();
            let values = list.map(function (item) {
                if (!item) {
                    return '\n\n> \n\n';
                }

                return '\n\n> ' + item + '\n\n';
                
            });

            editor.replaceSelections(values, list);

            if (values.length < 2) {
                editor.focus();
            }
            
        },

        ol: function () {
            let list = editor.getSelections();

            let values = list.map(function (item) {
                if (!item) {
                    return '\n 1. ';
                }

                let lines = item.split('\n');

                lines = lines.map(function (line, index) {
                    //取消作为列表 item。
                    let matchs =
                        line.match(/^ \d\. /g) ||
                        line.match(/^\d\. /g);

                    if (matchs) {
                        return line.slice(matchs[0].length);
                    }


                    let no = index + 1;

                    return ' ' + no + '. ' + line;
                });

                return lines.join('\n');
               

            });

            editor.replaceSelections(values, list);

        },

        ul: function () {
            let list = editor.getSelections();

            let values = list.map(function (item) {
                if (!item) {
                    return '\n - ';
                }

                


                let lines = item.split('\n');

                lines = lines.map(function (line, index) {
                    //取消作为列表 item。
                    if (line.startsWith(' - ')) {
                        return line.slice(3);
                    }

                    //取消作为列表 item。 
                    if (line.startsWith('- ')) {
                        return line.slice(2);
                    }

                    return ' - ' + line;
                });

                return lines.join('\n');


            });

            editor.replaceSelections(values, list);

        },

        

    };





});



define('/DocAdd/Editor/File', function (require, module, exports) {
    const $Date = require('@definejs/date');
    const $String = require('@definejs/string');
    const Loading = require('@definejs/loading');
    const File = require('File');

    let loading = new Loading({
        mask: 0,
    });





    return {

        /**
        * 上传粘贴板中的文件。
        *   file: File,         //必选，DOM 节点中的 input[type="file"] 元素中获取到的对象。
        *   done: function,     //可选，上传完成后的回调。
        */
        upload: function (file, done) {
            let now = new Date();
            let date = $Date.format(now, 'yyyy-MM-dd');
            let time = $Date.format(now, 'HHmmss');

            let dir = 'upload/paste/' + date + '/';
            let name = time + '-' + $String.random(4) + '.png';


            loading.show('上传中...');


            File.upload({
                'file': file,
                'dir': dir,
                'name': name,

                'done': function (data) {
                    loading.hide();

                    if (!data) {
                        definejs.alert('上传失败');
                        return;
                    }

                    let sample = '![]({dest})';
                    let md = $String.format(sample, data);

                    done && done(md, data);

                },
            });
        },

        /**
        * 
        */
        paste: function () {

        },
    };





});



define('/DocAdd/Editor/Table', function (require, module, exports) {
  

    function map(count, fn) {
        let list = [];
        let item = null;

        for (let i = 0; i < count; i++) {
            item = fn(i, i == count - 1);

            if (item !== null) {
                list.push(item);
            }
        }

        return list;
    }



    return {
        /**
        * 创建表格。
        *   options = {
        *       row: 0,
        *       cell: 0,
        *   };
        * 最终效果如: 
        *   |  列1  |  列2  |  列3  |
        *   |-------|-------|-------|
        *   |       |       |   1   |
        *   |       |       |   2   |
        *   |       |       |   3   |
        * 每列的最后一个单元格要加点内容，才能把整行的高度撑开。
        * 特别是最后一行的最后一个单元格，必须要有点内容，否则会丢失它。
        * 为了直观，就干脆加行号当内容算了。
        */
        create: function (options) {
            let row = options.row;
            let cell = options.cell;


            //表头。 如:
            //|  列1  |  列2  |  列3  |
            let headers = map(cell, function (index, isLast) {
                let item = '|  列' + (index + 1) + '  ';

                if (isLast) {
                    item += '|';
                }

                return item;
            });


            //分隔线。 如: 
            //|-------|-------|-------|
            let spliters = map(cell, function (index, isLast) {
                let item = '|-------';

                if (isLast) {
                    item += '|';
                }

                return item;
            });


            //表体行。 如:
            //|       |       |   1   |
            //|       |       |   2   |
            //|       |       |   3   |
            let rows = map(row, function (no) {
                let order = no + 1;

                let cells = map(cell, function (index, isLast) {

                    return isLast ? '|   ' + order + '   |' : '|       ';
                });

                return cells;
            });


            let table = [
                headers,
                spliters,
                ...rows,
            ];

            table = table.join('\n');
            table = table.replace(/,/g, ''); //去掉里面的逗号。

            table = '\n\n' + table + '\n\n'; //前后插入多两个空行，可以解决在文本行内插入表格的问题。


            return table;

        },
    };





});



define.panel('/DocAdd/Editor', function (require, module, panel) {
    const File = module.require('File');
    const CMD = module.require('CMD');
    const Table = module.require('Table');


    let passive = false;    //是否被动的滚动。 即是否由于外面调用而引起的滚动。
    let editor = null;
    let doc = null;
    let txt = panel.$.find('textarea').get(0);

    let ext$mode = {
        '.js': 'javascript',
        '.json': 'javascript',
        '.css': 'css',
        '.less': 'css',
        '.htm': 'htmlmixed',
        '.html': 'htmlmixed',
    };

    let meta = {
        ext: '',
    };



    panel.on('init', function () {

        editor = CodeMirror.fromTextArea(txt, {
            mode: 'gfm',
            //mode: 'css',
            //theme: 'midnight',
            cursorHeight: 1,
            lineNumbers: true,
            lineWrapping: true,         //是否自动换行。
            styleActiveLine: true,
            smartIndent: false,
            indentUnit: 4,
            tabSize: 4,
            
            //viewportMargin: Infinity, //全部生成 DOM 节点，性能消耗很大。
        });

        doc = editor.getDoc();




        editor.on('scroll', function () {
            if (passive) {
                passive = false;
                return;
            }

            let info = editor.getScrollInfo();
            panel.fire('scroll', [info]);

        });




        editor.on('change', function () {
            let doc = editor.getDoc()
            let content = doc.getValue();
            let { ext, } = meta;

            content = content.split('\t').join('    ');
            panel.fire('change', [{ content, ext, }]);
            
        });


        panel.$.on('keydown', function (event) {
            //metaKey 为 MacOS 的 `command` 键。
            let isSave = (event.ctrlKey || event.metaKey) && event.key == 's';

            if (!isSave) {
                return;
            }

            event.preventDefault();
            panel.fire('save');
        });

        CMD.init(editor);

        
    });


    //这个事件要放在外面才能监听到文件。
    panel.$.on('paste', function (event) {
        let clipboardData = event.originalEvent.clipboardData;
        let file = clipboardData.files[0];

        if (!file || file.type != 'image/png') {
            return;
        }
       
        File.upload(file, function (md, data) {
            editor.replaceSelection(md);
        });

    });



    /**
    * 渲染。
    *   opt = {
    *       content: '',    //内容。
    *       ext: '',        //扩展名，以此来确定类型。 如 '.json'。
    *   };
    */
    panel.on('render', function ({ content, ext, }) {
        content = content || '';
        ext = ext || 'md';

        let mode = ext$mode[ext] || 'gfm';

        meta.ext = ext;

        editor.setOption('mode', mode);

        doc.setValue(content); //会触发 editor.change 事件。


        //详见：http://www.91r.net/ask/8349571.html
        setTimeout(function () {
            editor.refresh();
        }, 100);

    
      
    });




    let exports ={
        /**
        *   preview = {
        *       top: 0,         //
        *       height: 0,      //
        *   };
        */
        scroll: function (preview) {
            let info = editor.getScrollInfo();
            let top = (info.height - info.clientHeight) * preview.top / (preview.height - info.clientHeight);

            passive = true;
            editor.scrollTo(0, top);
        },

        getReadme: function () {
            return txt.value;
        },



        getContent: function () {
            let content = doc.getValue();
            return content;
        },

        setTheme: function (name) {
            editor.setOption('theme', name);
        },

        call: function (name) {
            CMD[name]();
        },

        addTable: function (data) {
            let table = Table.create(data);
           
            console.log(table);

            editor.replaceSelection(table);
            editor.focus();
        },

        set: function (key, value) {
            editor.setOption(key, value);
        },
    };


    return exports;

});


define('/DocAdd/Header/Switch', function (require, module, exports) {
    const $Object = require('@definejs/object');
    const Storage = require('@definejs/local-storage');
    const $ = require('$');

    let storage = new Storage(module.id);


    let meta = {
        panel: null,
        act$on: null,
    };
    
    
    return {
        init(panel) {
            meta.panel = panel;

            meta.act$on = storage.get() || {
                'crlf': true,
                'fullscreen': false,
                'column': true,
            };

            $Object.each(meta.act$on, function (act, on) {
                let $el = panel.$.find(`[data-cmd="switch:${act}"]`);

                //先置反，点击时再置反就得正。                
                meta.act$on[act] = !on;

                $el.click();
            });


        },

        toggle(el) {
            let { panel, act$on, } = meta;

            let { cmd, } = el.dataset;
            let act = cmd.split(':')[1];
            let on = act$on[act] = !act$on[act];

            storage.set(act$on);

            $(el).toggleClass('on', on);
            panel.fire('switch', act, [on]);
        },
    };

});


define.panel('/DocAdd/Header/Table', function (require, module, panel) {
    const $String = require('@definejs/string');
    const Masker = require('@definejs/masker');

    let masker = null;


    panel.on('init', function () {
      
        //
        function makeArray(count) {
            let list = [];
            let item = {};

            for (let i = 0; i < count; i++) {
                list.push(item);
            }

            return list;
        }



        panel.template({
            '': function (data) {
                let html = this.fill('all', data);
                return html;
            },

            'all': {
                '': function (data) {
                    let list = makeArray(data.rows);
                    let rows = this.fill('row', list, data.cells);

                    return {
                        'rows': rows,
                    };
                },


                'row': {
                    '': function (row, no, count) {
                        let list = makeArray(count);
                        let cells = this.fill('cell', list, no);

                        return {
                            'cells': cells,
                        };
                    },

                    'cell': function (cell, index, no) {
                        return {
                            'no': no,
                            'index': index,
                        };
                    },
                },
            },

        });


        panel.$.on('mouseover', 'td', function () {
            let td = this;
            let no = +td.getAttribute('data-no');
            let index = +td.getAttribute('data-index');

            let row = no + 1;
            let cell = index + 1;

            let html = row + cell < 2 ? '插入表格' : $String.format('{row}行 x {cell}列 表格', {
                'row': row,
                'cell': cell,
            });

            panel.$.find('div').html(html);

            panel.$.find('td').each(function () {
                let cell = this;
                let no2 = +cell.getAttribute('data-no');
                let index2 = +cell.getAttribute('data-index');
                let isRange = (no2 <= no) && (index2 <= index);
               
                $(cell).toggleClass('on', isRange);
            });
            
        });

        panel.$.on('click', 'td', function () {
            let cell = this;
            let no = +cell.getAttribute('data-no');
            let index = +cell.getAttribute('data-index');

            panel.fire('add', [{
                'row': no + 1,
                'cell': index + 1,
            }]);

            masker.hide();
        });


        masker = new Masker({
            volatile: true, //易消失。
            opacity: 0,
        });

        masker.on({
            'hide': function () {
                panel.hide();
            },
        });
    });



    panel.on('show', function () {
        masker.show();
    });



    /**
    * 渲染。
    *   options = {
    *   };
    */
    panel.on('render', function (options) {

        panel.fill({
            rows: 9,
            cells: 10,
        });

    });



});



define.panel('/DocAdd/Header/Validater', function (require, module, panel) {
    const Toast = require('@definejs/toast');

    let toast = new Toast({
        icon: 'times',
        duration: 1200,
        mask: 0,
        width: 250,
    });

    let timeout = 150;

    let allows = [
        '.md',
        '.txt',
        '.json',
        '.js',
        '.css',
        '.html',
        '.sql',
    ];



    return {
        check: function ($name) {
            let name = $name.val();

            function error(msg) {
                toast.show(msg);

                //闪两次
                $name.addClass('on');

                setTimeout(function () {
                    $name.removeClass('on');

                    setTimeout(function () {
                        $name.addClass('on');

                        setTimeout(function () {
                            $name.removeClass('on');
                        }, timeout);

                    }, timeout);

                }, timeout);
            }


            if (!name) {
                error('文件名不能为空');
                return;
            }



            let file = name.replace(/\\/g, '/'); //把所有的 '\' 替换成 '/'。

            if (file.includes('../')) {
                return error('不能引用到父目录中去');
            }

            if (file.includes('./')) {
                return error('不能使用相对路径');
            }

            if (file.startsWith('.')) {
                return error('文件路径非法');
            }

            if (!file.includes('.')) {
                return error('文件名必须包含后缀名');
            }

            if (file.includes('..') ||
                file.includes(':') ||
                file.includes('*') ||
                file.includes('?') ||
                file.includes('"') ||
                file.includes('<') ||
                file.includes('>') ||
                file.includes('|') ||
                file.includes('//') ||
                file.includes(' ') ||
                file.includes('./')) {

                return error('文件路径非法');
            }

           
            let ext = file.split('.').slice(-1)[0];
            ext = '.' + ext.toLowerCase();

            if (!allows.includes(ext)) {
                return error('不能使用后缀名: ' + ext);
            }

            return file;
        },
    };



});

define.panel('/DocAdd/Header', function (require, module, panel) {
    const $Date = require('@definejs/date');
    const Switch = module.require('Switch');
    const Table = module.require('Table');
    const Validater = module.require('Validater');

    let $file = panel.$.find('[data-id="file"]');



    panel.on('init', function () {

        panel.$.on('click', '[data-cmd]', function (event) {
            let { cmd, } = this.dataset;
            
            let list = cmd.split(':');
            let target = list.length > 1 ? list[0] : '';
            let act = list.length > 1 ? list[1] : cmd;

            if (!target) {
                panel.fire('cmd', cmd, []);
                return;
            }


            //针对 editor 的。
            if (target == 'editor') {
                panel.fire('editor', [act]);
                return;
            }

            if (target == 'switch') {
                Switch.toggle(this);
                return;
            }

        });


        panel.$on('click', {
            '[data-id="table"]': function () {
                Table.render();
            },
            '[data-id="demo"]': function() {
                let file = $file.val();
                panel.fire('cmd', 'demo', [file]);
            },
            '[data-id="outline"]': function() {
                panel.fire('cmd', 'outline', []);
            },
        });
    

        Table.on({
            'add': function (data) {
                panel.fire('cmd', 'table', [data]);
            },
        });

      
    });



    /**
    * 渲染。
    *   opt = {
    *       file: '',    //文件名称，即文件 id。
    *       ext: '',    //可选，后缀名。 主要针对 json 文件显示相应的按钮。
    *   };
    */
    panel.on('render', function ({ file, ext, }) {
        let isEdit = !!file;

     
        $file.val(file);

        $file.attr({
            'disabled': isEdit,
            'title': isEdit ? '这是一个已存在的文件，不允许编辑其路径。' : '',
        });

        panel.$.toggleClass('edit-mode', isEdit);
        panel.$.toggleClass('json', ext == 'json');

        Switch.init(panel);


    });


    return {
        saved: function (saved) {
            if (saved === null) {
                panel.$.find('[data-id="saved"] span').html('已保存');
                panel.$.addClass('saved');
                return;
            }

            if (saved) {
                let time = $Date.format(new Date(), 'HH:mm:ss');
                panel.$.addClass('saved');
                panel.$.find('[data-id="saved"] span').html('已保存 [' + time + ']');

            }
            else {
                panel.$.removeClass('saved');
            }
        },

        get: function () {
            return Validater.check($file);
        },
    };


});



define.panel('/DocAdd/Outline', function (require, module, panel) {
    const Masker = require('@definejs/masker');
    const Outline = require('Outline');

    let masker = null;
    let outline = null;


    panel.set('show', false); //不要在 render 后自动显示。


    panel.on('init', function () {

        masker = new Masker({
            volatile: true, //易消失。
            opacity: 0,
        });

        masker.on({
            'hide': function () {
                panel.hide();
            },
        });


        outline = new Outline({
            'container': panel.$.find('>div'),
        });

        outline.on({
            'item': function (item, index) {
                panel.fire('item', [item, index]);
            },
        });

        outline.render();


        panel.$.on('click', '[data-cmd="close"]', function (event) {
            panel.hide();
        });

    });



    panel.on('show', function () {
        //masker.show();
    });





    /**
    * 渲染。
    *   items = [
    *       {
    *           text: '',       //
    *           level: 1,       //
    *       },
    *   ];
    */
    panel.on('render', function (items) {

        outline.fill(items);

    });



});



define.panel('/DocAdd/Preview', function (require, module, panel) {
    const MarkDoc = require('MarkDoc');

    let $div = panel.$.find('>div');
    let passive = false;    //是否被动的滚动。 即是否由于外面调用而引起的滚动。
    let markdoc = null;

    //需要保持为代码模式展示的。 
    let exts = [ '.json', '.js', '.css', '.less', '.html', '.htm', ];
    //let headers = [];
  


    panel.on('init', function () {
        markdoc = new MarkDoc({
            'container': $div.get(0),
        });

        markdoc.on('hash', function (href) {
            panel.fire('hash', [href]);
        });


        markdoc.on('render', function (info) {
            let list = markdoc.getOutlines();
            panel.fire('render', [list]);

        });



        panel.$.on('scroll', function (event) {
            if (passive) {
                passive = false;
                return;
            }

            let height = $div.outerHeight();
            let top = panel.$.get(0).scrollTop;

            panel.fire('scroll', [{
                'height': height,
                'top': top,
            }]);

        });

       
    });



    /**
    * 渲染。
    *   opt = {
    *       content: '',                    //文件内容。
    *       ext: '',                        //如 `.json`。
    *   };
    */
    panel.on('render', function (opt) {

        let { content, ext, } = opt;
        let language = '';

        if (exts.includes(ext)) {
            language = ext.slice(1);
        }

        markdoc.render({
            'content': content,
            'language': language,
            'baseUrl': '',
        });


        

    });

    return {

        /**
        *   editor = {
        *       left: 0,            //
        *       top: 0,             //
        *       height: 0,          //
        *       width: 0,           //
        *       clientHeight: 0,    //
        *   };
        */
        scroll(editor) {
            let height = $div.outerHeight();
            let top = (height - editor.clientHeight) * editor.top / (editor.height - editor.clientHeight);

            passive = true;
            panel.$.get(0).scrollTo(0, top);
        },

        to(index) {
            markdoc.toOutline(index);
        },

      
       

    };



});



define.panel('/DocAdd/Themes/List', function (require, module, panel) {
    const Tabs = require('@definejs/tabs');

    let tabs = null;

    let list = [
        { name: 'default', },
        { name: 'custom', desc: '深色', },
        { name: '3024-day', },
        { name: '3024-night', desc: '深色', },
        { name: 'ambiance-mobile', },
        { name: 'ambiance', desc: '深色', },
        { name: 'base16-dark', desc: '深色', },
        { name: 'base16-light', },
        { name: 'blackboard', desc: '深色', },
        { name: 'cobalt', desc: '深色', },
        { name: 'eclipse', },
        { name: 'elegant', },
        { name: 'erlang-dark', desc: '深色', },
        { name: 'lesser-dark', desc: '深色', },
        { name: 'mbo', desc: '深色', },
        { name: 'mdn-like', },
        { name: 'midnight', desc: '深色', },
        { name: 'monokai', desc: '深色', },
        { name: 'neat', },
        { name: 'neo', },
        { name: 'night', desc: '深色', },
        { name: 'paraiso-dark', desc: '深色', },
        { name: 'paraiso-light', },
        { name: 'pastel-on-dark', desc: '深色', },
        { name: 'rubyblue', desc: '深色', },
        { name: 'solarized', },
        { name: 'the-matrix', desc: '深色', },
        { name: 'tomorrow-night-eighties', desc: '深色', },
        { name: 'twilight', desc: '深色', },
        { name: 'vibrant-ink', desc: '深色', },
        { name: 'xq-dark', desc: '深色', },
        { name: 'xq-light', },
    ];



    panel.set('show', false);

    panel.on('init', function () {
        
        tabs = new Tabs({
            container: panel.$,
            selector: '>li',
            activedClass: 'on',
        });

        tabs.on('change', function (item, index) {
          

            item = list[index];
            panel.fire('item', [item, index]);
        });



        panel.$.on('click', '[data-index]', function (event) {
            let index = + this.dataset.index;
            tabs.active(index);
        });

        panel.template({
            '': function (data) {
                let items = this.fill('item', data.list);

                return {
                    'items': items,
                };
            },

            'item': {
                '': function (item, index) {
                    let desc = this.fill('desc', item);

                    return {
                        'index': index,
                        'name': item.name,
                        'desc': desc,
                    };
                },

                'desc': function (item) {
                    return item.desc ? { 'desc': item.desc, } : '';
                },
            },
        });
    });




    panel.on('render', function (index) {
        
        panel.fill({ 'list': list, });

        if (typeof index == 'number') {
            tabs.active(index);
        }

       
    });


    return {
        active: function (index) {
            tabs.active(index);
        },

        slide: function (visible, fn) {
            if (!visible) {
                panel.$.slideUp('fast', fn);
                return;
            }

            //向下弹出以展示。
            panel.$.slideDown('fast', function () {
                //把当前选中的项滚到可视范围内。
                let index = tabs.getActivedIndex();
                let li = panel.$.find(`li[data-index="${index}"]`).get(0);
              
                li.scrollIntoViewIfNeeded();

                fn && fn();
            });
        },
    };


});


define.panel('/DocAdd/Themes/Mask', function (require, module, panel) {
    const Masker = require('@definejs/masker');

    let mask = null;
    let visible = false;
   

    panel.on('init', function () {
        mask = new Masker({
            volatile: true, //易消失。
            opacity: 0,
            //opacity: 0.04,

            //'z-index': -1, //测试。
        });

        mask.on({
            'hide': function () {
                visible = false;
                panel.fire('hide');
            },
            'show': function () {
                visible = true;
                panel.fire('show');
            },
        });

    });






    panel.on('render', function () {
       
    });



    return {
        toggle: function () {
            if (!visible) {
                mask.show();
            }
            else {
                mask.hide();
            }
        },
    };


});


define.panel('/DocAdd/Themes', function (require, module, panel) {
    const Storage = require('@definejs/local-storage');
    const List = module.require('List');
    const Mask = module.require('Mask');
   

    let storage = null;

    panel.set('show', false);

    panel.on('init', function () {
        storage = new Storage(module.id);

        Mask.on({
            'show': function () {
                panel.$.addClass('show');
                List.slide(true);
            },

            'hide': function () {
                List.slide(false);
                panel.$.removeClass('show');
            },
        });

        List.on({
            'item': function (item, index) {
                storage.set('index', index);
                panel.fire('item', [item.name]);
            },
        });
    });



    panel.on('render', function (index) {
        if (typeof index == 'number') {
            storage.set('index', index);
        }
        else {
            index = storage.get('index') || 1;
        }

        List.render(index);
        Mask.render();

    });


    return {
        toggle: function () {
            Mask.toggle();
        },
    };

    

});


define.view('/DocAdd', function (require, module, view) {
    const Editor = module.require('Editor');
    const Preview = module.require('Preview');
    const Themes = module.require('Themes');
    const Header = module.require('Header');
    const Outline = module.require('Outline');
    const Data = module.require('Data');




    view.on('init', function () {

        Data.on({
            'render': function ({file, content, ext, }) {
                console.log({ file, content, ext, });

                Editor.render({ content, ext, });
                Header.render({ file, ext, });
                Themes.render();
            },

            'save': function (data, opt) {
                //如果是新增文件，则重新加载一下，以便根据后缀名进行语法高亮。
                if (opt.mode == 'new') {
                    view.render({ 'name': data.name });
                    return;
                }
            },

            'status': {
                'init': function () {
                    Header.saved(false);
                },
                'changed': function () {
                    Header.saved(false);
                },
                'read': function () {
                    Header.saved(null);
                },
                'saved': function () {
                    Header.saved(true);
                },
            },
        });

        Editor.on({
            'save': function () {
                let name = Header.get();
                Data.save(name);
            },

            'scroll': function (info) {
                Preview.scroll(info);
            },

            //填充内容、修改内容时，都会触发。
            'change': function (data) {
                Data.set(data.content);
                Preview.render(data);
            },
        });

        Header.on({
            'cmd': {
                'save': function () {
                    let name = Header.get();
                    Data.save(name);
                },
                'themes': function () {
                    Themes.toggle();
                },
                'new': function () {
                    Data.render({ content: '', });
                },
               
                'format': function () {
                    let content = Preview.$.find('code').text();
                    Editor.render({ content, });
                },

                'outline': function () {
                    Outline.toggle();
                },
                'demo': function (file) {
                    view.fire('demo', [file]);
                },

                'table': function (data) {
                    Editor.addTable(data);
                },
            },

            

            'editor': function (cmd) {
                Editor.call(cmd);
            },

            'switch': {
                'crlf': function (on) {
                    Editor.set('lineWrapping', on);
                },
                'fullscreen': function (on) {
                    view.fire('fullscreen', [on]);
                },
                'column': function (on) {
                    view.$.toggleClass('full-editor', !on);
                },
            },
        });

       

        Preview.on({
            'render': function (titles) {
                Outline.render(titles);
            },
            'scroll': function (info) {
                Editor.scroll(info);
            },
        });

        Themes.on({
            'item': function (name) {
                Editor.setTheme(name);
            },
        });

        Outline.on({
            'item': function (item, index) {
                Preview.to(index);
            },
        });

    });


    /**
    * 渲染内容。
    * 处理的优先级如下：
    *   //1, 来源于某个文件时。
    *   file: '', //必选。 文件 id。
    *   //2, 来源于具体内容时。
    *   opt = {
    *       content: '',    //必选。 内容。
    *       ext: '',        //可选。 内容类型。
    *   };
    *   //3, 来源于 storage 时。
    *   opt: 不指定时。
    */
    view.on('render', function (file) {
        
        Data.render(file);

       
    });


    view.on('close', function () {
        let status = Data.status();

        //
        if (status == 'changed') {
            definejs.confirm(`当前编辑器中存在未保存的内容，是否继续关闭？`, function () {
                view.fire('close'); //发出确实要关闭的信号。
            });

            return false;
        }
        
    });
  

});


define.view('/Error', function (require, module, view) {

 

    view.on('init', function () {

  
    });


    view.on('render', function (page, ex) {
        view.fill({
            'name': page.name,
            'ex': ex.stack,
        });


        console.log(ex);

    });




});



define('/FileList/API/Data', function (require, module, exports) {
    const $Array = require('@definejs/array');
    const $Date = require('@definejs/date');
    const File = require('File');

    return {
        
        make({ dir, dir$info, file$info, }) {
            let md5$files = {};
            let dir$files = {};
          
            let baseUrl = `${location.origin}/${dir}`;


            let dirs = Object.entries(dir$info).map(([dir, info]) => {
                let { stat, } = info;
                let size = File.getSize(stat.size);
                let atime = $Date.format(stat.atimeMs, 'yyyy-MM-dd HH:mm:ss');
                let birthtime = $Date.format(stat.birthtimeMs, 'yyyy-MM-dd HH:mm:ss');
                let ctime = $Date.format(stat.ctimeMs, 'yyyy-MM-dd HH:mm:ss');
                let mtime = $Date.format(stat.mtimeMs, 'yyyy-MM-dd HH:mm:ss');
                let icon = File.getIcon(dir);
                let url = `${baseUrl}${dir}`;

                Object.assign(info, {
                    size,
                    atime,
                    birthtime,
                    ctime,
                    mtime,
                    icon,
                    url,
                });

                return dir;
            });


            let files = Object.entries(file$info).map(([file, info]) => {
                let { md5, stat, } = info;
                let url = `${baseUrl}${file}`;
                let { names, dir, name, ext, isImage, icon, } = File.getInfo(file);

                let size = File.getSize(stat.size);
                let atime = $Date.format(stat.atimeMs, 'yyyy-MM-dd HH:mm:ss');
                let birthtime = $Date.format(stat.birthtimeMs, 'yyyy-MM-dd HH:mm:ss');
                let ctime = $Date.format(stat.ctimeMs, 'yyyy-MM-dd HH:mm:ss');
                let mtime = $Date.format(stat.mtimeMs, 'yyyy-MM-dd HH:mm:ss');


                $Array.add(md5$files, md5, file);
                $Array.add(dir$files, dir, file);

                let repeats = md5$files[md5];
                let siblings = dir$files[dir];

                Object.assign(info, {
                    url,
                    name,
                    names,
                    ext,
                    dir,
                    size,
                    atime,
                    birthtime,
                    ctime,
                    mtime,
                    icon,
                    isImage,
                    repeats,
                    siblings,
                    content: undefined, //预留一个字段。 调用后端接口读取后，会写入到此字段。
                });

                return file;
            });


           
            dirs.sort(function (a, b) {
                a = a.toLowerCase();
                b = b.toLowerCase();
                return a > b ? 1 : -1;
            });

            files.sort(function (a, b) {
                a = a.toLowerCase();
                b = b.toLowerCase();
                return a > b ? 1 : -1;
            });


            return { dirs, files, };

        },

     
     

    };


});


define('/FileList/Body/Main/Icon/List/Data', function (require, module, exports) {
    function sort(a, b) {
        a = a.name.toLowerCase();
        b = b.name.toLowerCase(); 

        return a == b ? 0 :
            a > b ? 1 : -1;
    }


    return {
        get(list) {
            let dirs = [];
            let files = [];

            list.forEach((item) => {
                let { icon, } = item.data;
                let list = item.type == 'dir' ? dirs : files;

                list.push({
                    'name': item.name,
                    'icon': icon.html,
                    'raw': item,
                });
            });


            dirs = dirs.sort(sort);
            files = files.sort(sort);

            list = [...dirs, ...files,];

            return list;
        },
    };
});

define.panel('/FileList/Body/Main/Icon/List', function (require, module, panel) {
    const Data = module.require('Data');
    


    let meta = {
        list: null,
    };


    panel.on('init', function () {
       

        panel.$on('click', {
            '[data-index]': function (event) {
                let index = + this.dataset.index;
                let item = meta.list[index].raw;
                panel.fire('item', [item]);
            },
        });

    });


    /**
    * 渲染内容。
    */
    panel.on('render', function (list) {

        meta.list = Data.get(list);

        panel.fill(meta.list, function (item, index) {
            return {
                index,
                ...item,
            };
        });

    });




    return {
        
    };

});


define.panel('/FileList/Body/Main/Icon', function (require, module, panel) {

    const List = module.require('List');


    let meta = {
        item: null,
    };


    panel.on('init', function () {
       
        List.on({
            'item': function (item) {
                panel.fire('item', [item]);
            },
        });
    });


    /**
    * 渲染内容。
    */
    panel.on('render', function (item) {
        if (item === meta.item) {
            panel.show();
            return;
        }

        meta.item = item;
        List.render(item.list);

    });




    return {
        
    };

});


/*
* 
*/
define.panel('/FileList/Body/Main/List/Dir/Filter/CWD', function (require, module, panel) {
    const CheckBox = require('CheckBox');


    let chk = null;

    /**
    * 初始化时触发。
    * 即首次 render 之前触发，且仅触发一次。
    * 适用于创建实例、绑定事件等只需要执行一次的操作。
    */
    panel.on('init', function () {

        chk = new CheckBox({
            'fireNow': true,
            'container': panel.$,
            'text': '仅当前目录',
        });

        chk.on('checked', function (checked) {
            panel.fire('change', [checked]);
        });


    });




    panel.on('render', function (checked) {

        chk.render({
            'checked': checked,
        });

    });


});





define.panel('/FileList/Body/Main/List/Dir/Filter/ChildDirs', function (require, module, panel) {
    const $Array = require('@definejs/array');
    const DropCheckList = require('DropCheckList');


    let chk = null;

   
    panel.on('init', function () {

        function fireCheck(list) {
            //注意，为了后续方便处理，此处过滤出选中的项。
            list = $Array.map(list, function (item) {
                return item.checked ? item.value : null;
            });
            panel.fire('check', [list]);
        }


        chk = new DropCheckList({
            'container': panel.$,
            'text': '直接子目录',
            'fireNow': true,    //rende() 后立即触发 `check` 事件。 因为每次 render() 后，list 可能已发生变化。
        });

        chk.on({
            'check': function (list) {
                fireCheck(list);
            },
            'fill': function (list) {
                fireCheck(list);
            },
        });


       
    });



    panel.on('render', function (item) {
        let { dirs, } = item.data.current;

        let list = dirs.map((item) => {
            return {
                'text': item.name,
                'value': item.name,
                'checked': true,
            };
        });

        chk.render(list);

    });



    return {
        
    };







});


define.panel('/FileList/Body/Main/List/Dir/Filter/Dirs', function (require, module, panel) {
    const DropCheckList = require('DropCheckList');

    let chk = null;

    let list = [
        { text: 'N = 0', checked: true, value: 'N=0', },
        { text: 'N > 0', checked: true, value: 'N>0', },
    ];

    panel.on('init', function () {

        chk = new DropCheckList({
            'container': panel.$,
            'text': '目录数',
        });

        chk.on({
            'check': function (list) {
                panel.fire('check', [list]);
            },
        });


       
    });



    panel.on('render', function () {

        chk.render(list);


    });



    return {
        
    };







});


define.panel('/FileList/Body/Main/List/Dir/Filter/Files', function (require, module, panel) {
    const DropCheckList = require('DropCheckList');

    let chk = null;

    let list = [
        { text: 'N = 0', checked: true, value: 'N=0', },
        { text: 'N > 0', checked: true, value: 'N>0', },
    ];

    panel.on('init', function () {

        chk = new DropCheckList({
            'container': panel.$,
            'text': '文件数',
        });

        chk.on({
            'check': function (list) {
                panel.fire('check', [list]);
            },
        });


       
    });



    panel.on('render', function () {

        chk.render(list);


    });



    return {
        
    };







});


/*
* 
*/
define.panel('/FileList/Body/Main/List/Dir/Filter/Name', function (require, module, panel) {
  
    /**
    * 初始化时触发。
    * 即首次 render 之前触发，且仅触发一次。
    * 适用于创建实例、绑定事件等只需要执行一次的操作。
    */
    panel.on('init', function () {

        panel.$.on('input', 'input', function () {

            panel.fire('change', [this.value]);
        });

    });



    /**
    * 渲染时触发。
    * 即外界显式调用 render() 时触发，且每次调用都会触发一次。
    * 外界传进来的参数会原样传到这里。
    */
    panel.on('render', function () {


    });




});





/*
* 
*/
define.panel('/FileList/Body/Main/List/Dir/Filter', function (require, module, panel) {
    const Name = module.require('Name');
    const CWD = module.require('CWD');
    const Files = module.require('Files');
    const Dirs = module.require('Dirs');
    const ChildDirs = module.require('ChildDirs');


    //当前选中的数据字段。
    let meta = {
        name: '',
        cwd: false, //是否仅限当前目录。
        files$checked: null,
        dirs$checked: null,
        childDirs: null,         //选中的直接子目录。 如果非空，则为一个数组。
    };


   

    /**
    * 初始化时触发。
    * 即首次 render 之前触发，且仅触发一次。
    * 适用于创建实例、绑定事件等只需要执行一次的操作。
    */
    panel.on('init', function () {

        let tid = null;

        function change(item) {
            Object.assign(meta, item);

            //把短时间内的多次 change 合并成一次对外触发。
            clearTimeout(tid);

            tid = setTimeout(function () {
                panel.fire('change', [meta]);
            }, 100);
        }

        function make(list) {
            let key$checked = {};

            list.forEach((item) => {
                key$checked[item.value] = item.checked;
            });

            return key$checked;
        }

        

       
        Name.on({
            'change': function (name) {
                change({ 'name': name, });
            },
        });

        CWD.on({
            'change': function (checked) {
                change({ 'cwd': checked, });
            },
        });

        Files.on({
            'check': function (list) {
                change({
                    'files$checked': make(list),
                });
            },
        });

        Dirs.on({
            'check': function (list) {
                change({
                    'dirs$checked': make(list),
                });
            },
        });

        ChildDirs.on({
            'check': function (list) {
                console.log(list)
                change({
                    'childDirs': list,
                });
            },
        });


    });



    /**
    * 渲染时触发。
    * 即外界显式调用 render() 时触发，且每次调用都会触发一次。
    * 外界传进来的参数会原样传到这里。
    */
    panel.on('render', function (item) {
       
        ChildDirs.render(item);

        Name.render();
        CWD.render(meta.cwd);
        Files.render();
        Dirs.render();
    });



});





define.panel('/FileList/Body/Main/List/Dir/GridView', function (require, module, panel) {
    const GridView = require('GridView');

    let gridview = null;
    let tpl = null;

    let meta = {
        keyword: '',
        keywordHtml: '',
    };

    panel.on('init', function () {
        tpl = panel.template();

        gridview = new GridView({
            container: panel.$,
            fields: [
                { caption: '序号', name: 'order', width: 40, class: 'order', },
                { caption: '路径', name: 'name', width: 600, class: 'name', click: '[data-cmd]', },
                { caption: '大小', name: 'size', width: 95, class: 'size number', },
                { caption: '文件数', name: 'files', width: 74, class: 'files number', },
                { caption: '目录数', name: 'dirs', width: 74, class: 'dirs number', },
            ],

        });


        gridview.on('process', 'cell', {
            'order': function (cell, { no, }) {
                return no + 1;
            },

            'name': function (cell) {
                let { name, icon, } = cell.row.item;

                // name = name.split(meta.item.id).join(`<span class="base-dir">${meta.item.id}</span>`);

                if (meta.keyword) {
                    name = name.split(meta.keyword).join(meta.keywordHtml);
                }

                let html = tpl.fill('name', { name, icon, });

                return html;
            },
            'files': function (cell) {
                let item = cell.row.data;

                cell.class += ` files-${item.files}`;
            },
        });


        gridview.on('click', 'cell', {
            'name': {
                '[data-cmd]': function (cell, { event, }) {
                    let item = cell.row.item.raw;
                    panel.fire('item', [item]);
                    event.stopPropagation();

                },
            },
        });




    });


    /**
    * 渲染内容。
    *   list: [],       //必选，数据列表。
    *   opt: {          //可选。
    *       keyword: '' //高亮的关键词。
    *       root: '',   //根目录。
    *   },    
    */
    panel.on('render', function (list, { keyword, item, }) {
        meta.item = item;
        meta.keyword = keyword;
        meta.keywordHtml = `<span class="keyword">${keyword}</span>`;


        list = list.map(function (item, index) {
            
            let { icon, } = item.data;
            let { size, dirs, files, } = item.data.global;


            return {
                'name': item.id,
                'size': `${size.value} ${size.desc}`,
                'dirs': dirs.length,
                'files': files.length,
                'icon': icon.html,
                'raw': item,       //点击时会用到。
            };

        });


        gridview.render(list);

        // //内部分页。
        // gridview.render(list, {
        //     no: 1,
        //     size: 20,
        // });

    });



});



define('/FileList/Body/Main/List/Dir/Data', function (require, module, exports) {

    function filter(list, condition, fn) {
        if (condition) {
            list = list.filter(fn);
        }

        return list;
    }

    return {

        /**
        * 从列表数据中过滤出指定条件的子集。
        */
        filter: function (item, opt) {
            let {
                cwd = false,
                name = '',
                files$checked = null,
                dirs$checked = null,
                childDirs = [],
            } = opt;


            let list = item.data[cwd ? 'current' : 'global'].dirs;

            childDirs = childDirs.map((dir) => {
                let { id, } = item;
                let pid = id == '/' ? '' : id;
                return `${pid}${dir}/`;
            });

            list = list.filter(function (item) {
                let { id, } = item;

                let isOK = childDirs.some((dir) => {
                    return id == dir || id.startsWith(dir);
                });

                return isOK;
            });

            list = filter(list, name, function (item) {
                return item.id.includes(name);
            });

          

            list = filter(list, files$checked, function (item) {
                let N = item.data[cwd ? 'current' : 'global'].files.length;

                //`N=0` 没有勾选。
                if (!files$checked['N=0'] && N == 0) {
                    return false;
                }

                //`N>0` 没有勾选。
                if (!files$checked['N>0'] && N > 0) {
                    return false;
                }

                return true;
            });

            list = filter(list, dirs$checked, function (item) {
                let N = item.data[cwd ? 'current' : 'global'].dirs.length;

                //`N=0` 没有勾选。
                if (!dirs$checked['N=0'] && N == 0) {
                    return false;
                }

                //`N>0` 没有勾选。
                if (!dirs$checked['N>0'] && N > 0) {
                    return false;
                }

                return true;
            });


            return list;

        },

    };

});


define.panel('/FileList/Body/Main/List/Dir', function (require, module, panel) {
    const Filter = module.require('Filter');
    const GridView = module.require('GridView');
    const Data = module.require('Data');



    let meta = {
        item: null,
    };



    panel.on('init', function () {
       
        Filter.on({
            'change': function (filter) {
                let { item, } = meta;
                let keyword = filter.name;
                let list = Data.filter(item, filter);

                console.log({ list, });


                GridView.render(list, { keyword, item, });

            },
        });

        GridView.on({
            'item': function (item) {
                panel.fire('item', [item]);
            },
        });

    });


    /**
    * 渲染内容。
    *   opt = {
    *       list:  [],  //文件列表。
    *       item: {},   //当前菜单项。
    *       root: '',   //根目录。
    *   };
    */
    panel.on('render', function (item) {
        if (item === meta.item) {
            panel.show();
            return;
        }

        
        meta.item = item;
        Filter.render(item);


    });




    return {
        
    };

});


define.panel('/FileList/Body/Main/List/File/Filter/ChildDirs', function (require, module, panel) {
    const $Array = require('@definejs/array');
    const DropCheckList = require('DropCheckList');


    let chk = null;

   
    panel.on('init', function () {

        function fireCheck(list) {
            //注意，为了后续方便处理，此处过滤出选中的项。
            list = $Array.map(list, function (item) {
                return item.checked ? item.value : null;
            });
            
            panel.fire('check', [list]);
        }


        chk = new DropCheckList({
            'container': panel.$,
            'text': '直接子目录',
        });

        chk.on({
            'check': function (list) {
                console.log(list);
                fireCheck(list);
            },
            'fill': function (list) {
                fireCheck(list);
            },
        });


       
    });



    panel.on('render', function (item) {
        let { dirs, } = item.data.current;

        let list = dirs.map((item) => {
            return {
                'text': item.name,
                'value': item,
                'checked': true,
            };
        });

        chk.render(list);

    });



    return {
        
    };







});


/*
* 
*/
define.panel('/FileList/Body/Main/List/File/Filter/MD5', function (require, module, panel) {
    const DropCheckList = require('DropCheckList');

    let list = [
        { text: 'N = 1', checked: true, value: 'N=1', },
        { text: 'N > 1', checked: true, value: 'N>1', },
    ];


    panel.on('init', function () {

        chk = new DropCheckList({
            'container': panel.$,
            'text': '重复文件',
        });

        chk.on({
            'check': function (list) {
                panel.fire('check', [list]);
            },
        });



    });



    panel.on('render', function () {

        chk.render(list);

       


    });



    return {

    };



});





/*
* 
*/
define.panel('/FileList/Body/Main/List/File/Filter/Name', function (require, module, panel) {
  
    /**
    * 初始化时触发。
    * 即首次 render 之前触发，且仅触发一次。
    * 适用于创建实例、绑定事件等只需要执行一次的操作。
    */
    panel.on('init', function () {
       

        panel.$.on('input', 'input', function () {
            

            panel.fire('change', [this.value]);
        });

    });



    /**
    * 渲染时触发。
    * 即外界显式调用 render() 时触发，且每次调用都会触发一次。
    * 外界传进来的参数会原样传到这里。
    */
    panel.on('render', function () {


    });




});





/*
* 
*/
define.panel('/FileList/Body/Main/List/File/Filter/OnlyCurrent', function (require, module, panel) {
    const CheckBox = require('CheckBox');


    let chk = null;

    /**
    * 初始化时触发。
    * 即首次 render 之前触发，且仅触发一次。
    * 适用于创建实例、绑定事件等只需要执行一次的操作。
    */
    panel.on('init', function () {

        chk = new CheckBox({
            'fireNow': true,
            'container': panel.$,
            'text': '仅当前目录',
        });

        chk.on('checked', function (checked) {
            panel.fire('change', [checked]);
        });


    });




    panel.on('render', function (checked) {

        chk.render({
            'checked': checked,
        });

    });


});





/*
* 
*/
define.panel('/FileList/Body/Main/List/File/Filter/Type', function (require, module, panel) {
    const DropCheckList = require('DropCheckList');

    let chk = null;
    let list = [ ];

    panel.on('init', function () {

        chk = new DropCheckList({
            'container': panel.$,
            'text': '类型',
        });

        chk.on({
            'check': function (list) {
                panel.fire('check', [list]);
            },
        });



    });



    panel.on('render', function (item) {

        let { exts, } = item.data.global;

        list = exts.map((ext) => {
            return {
                'text': ext ? `.${ext}` : `(无后缀)`,
                'checked': true,
                'value': ext,
            };
        });


        chk.render(list);

        //因为每次 render 后 list 可能发生了变化，
        //此处需要重新触发事件。
        panel.fire('check', [list]);


    });



    return {

    };



});





/*
* 
*/
define.panel('/FileList/Body/Main/List/File/Filter', function (require, module, panel) {
    const Type = module.require('Type');
    const Name = module.require('Name');
    const OnlyCurrent = module.require('OnlyCurrent');
    const MD5 = module.require('MD5');
    const ChildDirs = module.require('ChildDirs');


    //当前选中的数据字段。
    let meta = {
        name: '',
        onlyCurrent: false, //是否仅限当前目录。
        ext$checked: null,
        md5$checked: null,
        childDirs: null,         //选中的直接子目录。 如果非空，则为一个数组。
    };



    /**
    * 初始化时触发。
    * 即首次 render 之前触发，且仅触发一次。
    * 适用于创建实例、绑定事件等只需要执行一次的操作。
    */
    panel.on('init', function () {

        let tid = null;

        function change(item) {
            Object.assign(meta, item);

            //把短时间内的多次 change 合并成一次对外触发。
            clearTimeout(tid);

            tid = setTimeout(function () {
                panel.fire('change', [meta]);
            }, 100);
        }


        function make(list) {
            let key$checked = {};

            list.forEach((item) => {
                key$checked[item.value] = item.checked;
            });

            return key$checked;
        }

       
        Name.on({
            'change': function (name) {
                change({ 'name': name, });
            },
        });

        OnlyCurrent.on({
            'change': function (checked) {
                change({ 'onlyCurrent': checked, });
            },
        });


        Type.on({
            'check': function (list) {
                change({
                    'ext$checked': make(list),
                });
            },
        });


        MD5.on({
            'check': function (list) {
                change({
                    'md5$checked': make(list),
                });
            },
        });

        ChildDirs.on({
            'check': function (list) {
                change({
                    'childDirs': list,
                });
            },
        });

    });



    /**
    * 渲染时触发。
    * 即外界显式调用 render() 时触发，且每次调用都会触发一次。
    * 外界传进来的参数会原样传到这里。
    */
    panel.on('render', function (item) {
        ChildDirs.render(item);
        Type.render(item);
        OnlyCurrent.render(meta.onlyCurrent);
        Name.render();
        MD5.render();

       

    });



});





define.panel('/FileList/Body/Main/List/File/GridView', function (require, module, panel) {
    const GridView = require('GridView');

    let gridview = null;
    let tpl = null;

    let meta = {
        keyword: '',
        keywordHtml: '',
    };

    panel.on('init', function () {
        tpl = panel.template();

        gridview = new GridView({
            container: panel.$,

            fields: [
                { caption: '序号', name: 'order', width: 40, class: 'order', },
                { caption: '路径', name: 'name', width: 600, class: 'name', click: '[data-cmd]', sort: true, },
                { caption: '大小', name: 'size', width: 70, class: 'size number', sort: true, },
                { caption: 'MD5', name: 'md5', width: 285, class: 'md5', sort: true, },
            ],

        });



        gridview.on('process', 'cell', {
            'order': function (cell, { no, }) {
                return no + 1;
            },
            'name': function (cell) {
                let item = cell.row.item;
                let { name, icon, } = item;

                if (meta.keyword) {
                    name = name.split(meta.keyword).join(meta.keywordHtml);
                }

                let html = tpl.fill('name', { name, icon, });

                return html;
            },

            'md5': function (cell) {
                let { repeat, isNewGroup, } = cell.row.item;
                
                if (repeat) {
                    cell.class += ' repeat';
                }

                if (isNewGroup) {
                    cell.row.class += ' md5-group';
                }

            },
        });

        gridview.on('sort', {
            'name': function ({ a, b, }) {
                a = a.name.toUpperCase();
                b = b.name.toUpperCase();
                return { a, b, };
            },

            'size': function ({ a, b, }) {
                a = a.raw.data.size.raw;
                b = b.raw.data.size.raw;
                return { a, b, };
            },
        });



        gridview.on('click', 'cell', {
            'name': {
                '[data-cmd]': function (cell, { event, }) {
                    let item = cell.row.item.raw;

                    panel.fire('item', [item]);
                    event.stopPropagation();
                },
            },
        });


    });


    /**
    * 渲染内容。
    *   list: [],                   //必选，数据列表。
    *   opt: {                      //可选。
    *       keyword: ''             //高亮的关键词。
    *       isRepeatMode: false,    //
    *   },    
    */
    panel.on('render', function (list, { keyword, isRepeatMode, }) {

        meta.keyword = keyword;
        meta.keywordHtml = `<span class="keyword">${keyword}</span>`;

        let prevMd5 = '';
        

        list = list.map(function (item, index) {
            let { md5, repeats, size, icon, } = item.data;
            let isNewGroup = index == 0;

            if (prevMd5 != md5) {
                isNewGroup = true;
                prevMd5 = md5;
            }


            return {
                'name': item.id,
                'size': `${size.value} ${size.desc}`,
                'repeat': repeats.length > 1,
                'isNewGroup': isNewGroup,
                'icon': icon.html,
                'md5': md5,
                'raw': item,       //点击时会用到。
            };

        });

        gridview.render(list);

        // //内部分页。
        // gridview.render(list, {
        //     no: 1,
        //     size: 20,
        // });

        gridview.$.toggleClass('md5-repeat-mode', !!isRepeatMode);

    });



});



define('/FileList/Body/Main/List/File/Data', function (require, module, exports) {
    const $Array = require('@definejs/array');


    function filter(list, condition, fn) {
        if (condition) {
            list = list.filter(fn);
        }

        return list;
    }



    return {


        /**
        * 从列表数据中过滤出指定条件的子集。
        */
        filter(node, opt) {

            let {
                onlyCurrent = false,
                name = '',
                ext$checked = null,
                md5$checked = null,
                childDirs = [],
            } = opt;

            let isGlobal = !onlyCurrent;
            let list = node.data[isGlobal ? 'global' : 'current'].files;


            if (isGlobal) {
                list = list.filter(function (item) {
                    //当前目录下的直接子文件。
                    if (item.parent.id == node.id) {
                        return true;
                    }

                    let { id, } = item;

                    let found = childDirs.some((child) => {
                        return id.startsWith(child.id);
                    });

                    return found;
                });
            }
            

            list = filter(list, name, function (item) {
                return item.id.includes(name);
            });


            list = filter(list, ext$checked, function (item) {
                let { ext, } = item.data;

                return ext$checked[ext];
            });


            list = filter(list, md5$checked, function (item) {
                let { repeats, } = item.data;
                let N = repeats.length;

                //`N=1` 没有勾选。
                if (!md5$checked['N=1'] && N == 1) {
                    return false;
                }

                //`N>1` 没有勾选。
                if (!md5$checked['N>1'] && N > 1) {
                    return false;
                }

                return true;
            });


            let isRepeatMode = md5$checked && md5$checked['N>1'] && !md5$checked['N=1'];


            //此时仅要查看重复的文件。
            //则按 md5 值进行分组，让 md5 值相同的记录排在一起。
            if (isRepeatMode) {
                let md5$files = {};

                list.forEach((item) => {
                    let { md5, } = item.data;
                    $Array.add(md5$files, md5, item);
                });

                list = [];

                Object.entries(md5$files).forEach(([md5, files]) => {
                    list = [...list, ...files,];
                });

            }


            return { list, isRepeatMode, };



        },

    };

});


define.panel('/FileList/Body/Main/List/File', function (require, module, panel) {
    const Filter = module.require('Filter');
    const GridView = module.require('GridView');
    const Data = module.require('Data');



    let meta = {
        item: null,
    };



    panel.on('init', function () {
       
        Filter.on({
            'change': function (filter) {
                let keyword = filter.name;
                let { list, isRepeatMode, } = Data.filter(meta.item, filter);

                GridView.render(list, { keyword, isRepeatMode, });

            },
        });

        GridView.on({
            'item': function (item) {
                panel.fire('item', [item]);
            },
        });

    });


    /**
    * 渲染内容。
    */
    panel.on('render', function (item) {
        if (item === meta.item) {
            panel.show();
            return;
        }
        

        meta.item = item;
        Filter.render(item);


    });




    return {
        
    };

});


define.panel('/FileList/Body/Main/List/Tabs', function (require, module, panel) {
    const Tabs = require('@definejs/tabs');
    const Storage = require('@definejs/local-storage');

    let tabs = null;
    let storage = null;

    let meta = {
        index: 0,

        list: [
            { name: '文件', cmd: 'file', },
            { name: '目录', cmd: 'dir', },
        ],
    };


    panel.on('init', function () {
        storage = new Storage(module.id);
        meta.index = storage.get('index') || 0;

        tabs = new Tabs({
            container: panel.$,
            activedClass: 'on',
            eventName: 'click',
            selector: '>li',
            // repeated: true, //这里要允许重复激活相同的项。
        });


        tabs.on('change', function (item, index) {
            meta.index = index;
            item = meta.list[index];
            storage.set('index', index);

            panel.fire(item.cmd);

        });


    });

    /**
    * 渲染。
    */
    panel.on('render', function (index) {

        tabs.render(meta.list, function (item, index) {
            return {
                'index': index,
                'name': item.name,
            };
        });

        if (typeof index == 'number') {
            meta.index = index;
        }
        else {
            index = meta.index;
        }

        tabs.active(index);

    });


    return {
        
    };

});


define.panel('/FileList/Body/Main/List', function (require, module, panel) {
    const Tabs = module.require('Tabs');
    const File = module.require('File');
    const Dir = module.require('Dir');



    let meta = {
        item: null,
    };

    panel.on('init', function () {

        Tabs.on({
            'file': function () {
                File.render(meta.item);
                Dir.hide();
            },
            'dir': function () {
                File.hide();
                Dir.render(meta.item);
            },
        });

        File.on({
            'item': function (item) {
                panel.fire('item', [item]);
            },
        });

        Dir.on({
            'item': function (item) {
                panel.fire('item', [item]);
            },
        });

    });


    /**
    * 渲染内容。
    */
    panel.on('render', function (item) {
        if (item === meta.item) {
            panel.show();
            return;
        }

        console.log(item);
        
        meta.item = item;

        Tabs.render();

    });




    return {
        
    };

});


define.panel('/FileList/Body/Main/Stat/GridView', function (require, module, panel) {
    const GridView = require('GridView');

    let gridview = null;
    let tpl = null;

    panel.on('init', function () {
        tpl = panel.template();

        gridview = new GridView({
            container: panel.$,

            fields: [
                { caption: '序号', name: 'order', width: 40, class: 'order', },
                { caption: '图标', name: 'icon', width: 40, class: 'icon', },
                { caption: '类型', name: 'name', width: 200, class: 'name', sort: true, },
                { caption: '个数', name: 'count', width: 400, class: 'count number', sort: true, },
                { caption: '大小', name: 'size', width: 400, class: 'size number', sort: true, },
            ],

        });

        gridview.on('render', function () { 
            gridview.$.find(`tr.item:first`).addClass('group-begin');
        });

        gridview.on('process', 'row', function (row, { no, }) { 
            if (row.item.top) {
                row.class = 'top';
            }
            else {
                row.class = 'item';
            }

            row.dataset.no = no;
        });


        gridview.on('process', 'cell', {
            'order': function (cell, { no, }) {
                return no + 1;
            },

            'icon': function (cell) {
                let { icon, } = cell.row.item;
                return icon.html;
            },
            'count': function (cell) {
                let { count, } = cell.row.item;
                let html = tpl.fill('cell', count);
                return html;
            },

            'size': function (cell) {
                let { size, } = cell.row.item;
                let html = tpl.fill('cell', size);

                return html;
            },

        });

        gridview.on('sort', {
            //让置顶的恢复置顶。
            '': function ({ list, }) { 
                let tops = [];
                let items = [];
                
                list.forEach((item) => {
                    if (item.top) {
                        tops.push(item);
                    }
                    else {
                        items.push(item);
                    }
                });

                tops.sort((a, b) => {
                    return a.top - b.top;
                });

             

                return [...tops, ...items,];
            },

            'name': function ({ a, b, }) {
                a = a.name.toUpperCase();
                b = b.name.toUpperCase();
                return { a, b, };
            },

            'count': function ({ a, b, }) {
                a = a.count.value;
                b = b.count.value;

                return { a, b, };
            },

            'size': function ({ a, b, }) {
                a = a.size.raw;
                b = b.size.raw;



                return { a, b, };
            },


        });



    });


    /**
    * 渲染内容。
    *   list: [],                   //必选，数据列表。
    */
    panel.on('render', function (list) {


        gridview.render(list);

        
        
      



    });



});



define('/FileList/Body/Main/Stat/Data', function (require, module, exports) {

    const File = require('File');

    function getPercent(value, total) { 
        if (Array.isArray(value)) {
            value = value.length;
        }

        if (Array.isArray(total)) {
            total = total.length;
        }

        let percent = value / total * 100;

        percent = percent.toFixed(2);

        if (0<percent && percent < 0.2) {
            percent = 0.2;
        }

        return percent;
    }

    return {
        
        get(item) {

            let {
                dirs, exts, files, emptyDirs, emptyFiles, size,
                ext$files, ext$size,
            } = item.data.global;

            let totalCount = dirs.length + files.length;
            let totalSize = size.raw;

            let list = [
                {
                    top: 1,
                    icon: File.getIcon(''),
                    name: '项目',
                    count: {
                        value: totalCount,
                        percent: 0,
                        desc: '个',
                    },

                    size: {
                        ...size,
                        percent: 0,
                    },
                },
                {
                    top: 2,
                    icon: File.getIcon('/'),
                    name: '目录',
                    count: {
                        value: dirs.length,
                        percent: getPercent(dirs, totalCount),
                        desc: '个',
                    },

                    size: {
                        value: emptyDirs.length,
                        percent: getPercent(emptyDirs, dirs),
                        desc: '空',
                    },
                },
                {
                    top: 3,
                    icon: File.getIcon(''),
                    name: '文件',
                    count: {
                        value: files.length,
                        percent: getPercent(files, totalCount),
                        desc: '个',
                    },
                    size: {
                        value: emptyFiles.length,
                        percent: getPercent(emptyFiles, files),
                        desc: '空',
                    },
                },
            ];

            exts.forEach((ext) => {
                let name = ext == '' ? '(无后缀)' : `.${ext}`;
                let size = ext$size[ext];
                let icon = File.getIcon(`.${ext}`);
                let count = ext$files[ext].length;


                list.push({
                    icon,
                    name,
                    size,

                    count: {
                        value: count,
                        percent: getPercent(count, files),
                        desc: '个',
                    },

                    size: {
                        ...size,
                        percent: getPercent(size.raw, totalSize),
                    },
                });
            });
           


            return list;
        },

        

    };

});


define.panel('/FileList/Body/Main/Stat', function (require, module, panel) {

    const Data = module.require('Data');
    const GridView = module.require('GridView');


    let meta = {
        item: null,
    };

    panel.on('init', function () {

    });


    /**
    * 渲染内容。
    */
    panel.on('render', function (item) {
        if (item === meta.item) {
            panel.show();
            return;
        }
        
        meta.item = item;

        console.log(item);

        let list = Data.get(item);
        console.log(list)

        GridView.render(list);

      

    });




    return {
        
    };

});



define.panel('/FileList/Body/Main/Tree/Header', function (require, module, panel) {
    const CheckBox = require('CheckBox');


    let chks = [
        { id: 'icon', text: '图标', chk: null,},
        { id: 'tab', text: '缩进', chk: null, },
        { id: 'color', text: '彩色', chk: null, },
        { id: 'hover', text: '悬停', chk: null, },
        { id: 'dirOnly', text: '仅目录', chk: null, },
    ];

    /**
    * 初始化时触发。
    * 即首次 render 之前触发，且仅触发一次。
    * 适用于创建实例、绑定事件等只需要执行一次的操作。
    */
    panel.on('init', function () {

        //把短时间内的多次触发合并成一次对外触发。
        let tid = null;
        let key$checked = {};

        function fireCheck(key, checked) { 
            clearTimeout(tid);

            key$checked[key] = checked;

            tid = setTimeout(() => {
                panel.fire('check', [key$checked]);
            }, 20);
        }

        chks.forEach((item) => {
            let { id, } = item;
            let chk = new CheckBox({
                'fireNow': true,
                'container': panel.$.find(`[data-id="chk-${id}"]`),
                'text': item.text,
            });

            chk.on('checked', function (checked) {
                if (id == 'dirOnly') {
                    panel.fire('dirOnly', [checked]);
                }
                else {
                    fireCheck(id, checked);
                }


                
            });

            item.chk = chk;
        });
        

        panel.$on('click', '[data-cmd]', function (event) {
            let { cmd, } = event.target.dataset;
            panel.fire('cmd', cmd, []);
        });

       
    });




    panel.on('render', function (id$checked) {

        chks.forEach((item) => {
            let checked = id$checked[item.id];

            item.chk.render({ checked, });
        });

    });





});



define.panel('/FileList/Body/Main/Tree/Main', function (require, module, panel) {
    const TextTree = require('TextTree');
    const Clipboard = require('Clipboard');
 
    let tree = null;


    panel.on('init', function () {
        tree = new TextTree({
            'container': panel.$,
        });

        tree.on('cmd', function (cmd, item, event) {
            panel.fire('cmd', [cmd, item,]);
        });


        
    });

   


    panel.on('render', function (item, dirOnly) {
        let { parents, } = item;
        let root = parents.slice(-1)[0] || item;

        let list = [
            ...parents,
            item,
        ];

        if (dirOnly) {
            list = [...list, ...item.data.global.dirs];
        }
        else {
            list = [...list, ...item.children];
        }


        list = list.map((item) => {
            let { id, type, } = item;
            let keys = id.split('/');

            if (type == 'dir') {
                keys = keys.slice(0, -1); //最后一项是空串。
            }

            if (id == '/') {
                keys = [item.name];
            }
            else {
                keys = [root.name, ...keys];
            }

            return {
                type,
                keys,
                data: { item, },
                dataset: { id, },
            };
        });
        
        

        tree.render(list);

        tree.$.find(`li[data-id="${item.id}"]`).addClass('current');




    });


    return {
        
        check(opt) {
            tree.toggle(opt);
        },

        copy() {
            let value = tree.toString();
            Clipboard.copy(value);
        },
        
    };



});



define.panel('/FileList/Body/Main/Tree', function (require, module, panel) {
    const Header = module.require('Header');
    const Main = module.require('Main');


    let meta = {
        item: null,
        dirOnly: true, //仅显示目录。
    };

    panel.on('init', function () {
      

        Header.on({
            'check': function (key$checked) {
                Main.check(key$checked);
            },
            'dirOnly': function (checked) { 
                meta.dirOnly = checked;
                Main.render(meta.item, checked);
            },
            'cmd': {
                'copy': function () {
                    Main.copy();
                },
            },
        });


        Main.on({
            'cmd': function (cmd, item) {
                panel.fire('cmd', cmd, [item,]);
            },
        });

    });




    panel.on('render', function (item) {
        if (item === meta.item) {
            panel.show();
            return;
        }

        console.log(item);

        meta.item = item;

        // Main.render(item, meta.dirOnly);

        Header.render({
            // 'file': false,
            'icon': false,
            'tab': true,
            'color': true,
            'hover': true,
            'dirOnly': meta.dirOnly,
        });
        

    });





});



define.panel('/FileList/Body/Main/Tabs', function (require, module, panel) {
    const Tabs = require('Tabs');

    let tabs = null;

    let meta = {
        item: null,
        cmd$module: null,
        list: [
            { name: '统计', cmd: 'Stat', icon: 'fas fa-chart-bar', },
            { name: '平铺', cmd: 'Icon', icon: 'fas fa-folder', },
            { name: '列表', cmd: 'List', icon: 'fas fa-list', },
            { name: '架构', cmd: 'Tree', icon: 'fas fa-folder-tree', },
        ],
    };


    panel.on('init', function () {

        tabs = new Tabs({
            container: panel.$.get(0),
            storage: module.id,
        });


        tabs.on('change', function (item, index) {
            let { cmd, } = item;
            let { cmd$module, } = meta;

            if (cmd$module) {
                Object.keys(cmd$module).forEach((key) => {
                    let M = cmd$module[key];

                    if (key == cmd) {
                        panel.fire('change', [M]);
                    }
                    else {
                        M.hide();
                    }
                });
            }

            //后备方案。
            panel.fire('cmd', cmd, []);
        });

       
    });

    /**
    * 渲染。
    */
    panel.on('render', function () {
        tabs.render(meta.list);
        tabs.active();
    });

    return {
        map(cmd$module) {
            meta.cmd$module = cmd$module;
        },
    };

});
define.panel('/FileList/Body/Main', function (require, module, panel) {
    const Tabs = module.require('Tabs');
    const Stat = module.require('Stat'); 
    const Tree = module.require('Tree');
    const List = module.require('List');
    const Icon = module.require('Icon');


    let meta = {
        item: null,
    };



    panel.on('init', function () {
        Tabs.map({ Stat, Tree, List, Icon, });

        Tabs.on({
            'change': function (M) {
                M.render(meta.item);
            },
        });


        List.on({
            'item': function (item) {
                panel.fire('item', [item]);
            },
        });

        Icon.on({
            'item': function (item) {
                panel.fire('item', [item]);
            },
        });

        Tree.on('cmd', {
            'key': function (item) {
                panel.fire('item', [item.data.item]);
            },
        })


    });


    /**
    * 渲染内容。
    */
    panel.on('render', function (item) {
        meta.item = item;

        Tabs.render();

    });





    return {

    };

});


define.panel('/FileList/Body/Nav', function (require, module, panel) {
    const MenuNav = require('MenuNav');


    let nav = null;


    panel.on('init', function () {
        nav = new MenuNav({
            'container': panel.$,
        });

        nav.on({
            'item': function ({ names, index, }) {
                console.log({ index, names, });

                let path = names.slice(1, index + 1).join('/');

                //不是最后一级，说明是一个目录。
                if (index < names.length - 1) {
                    path += '/';
                }
              
                panel.fire('path', [path]);
            },

            'text': function (text) {
                panel.fire('path', [text]);
            },
        });
    });


    /**
    * 渲染内容。
    */
    panel.on('render', function (item) {
        let { id, parents, name, } = item;
        let root = parents.slice(-1)[0];
        let path = root ? `${root.name}/${id}` : `${name}/`;
        let text = id;


        nav.render({ path, text, });

    });



});



define.panel('/FileList/Body/Preview/MarkDoc', function (require, module, panel) {
    const MarkDoc = require('MarkDoc');

    let markdoc = null;

    let previewExts = [
        'md',
        'markdown',
        'txt',
        // 'html',
    ];

    

    panel.on('init', function () {
        markdoc = new MarkDoc({
            container: panel.$,
        });

        markdoc.on('render', function (info) {
           
            let list = markdoc.getOutlines();

            panel.fire('outlines', [list]);

        });
       
    });



    /**
    * 渲染。
    */
    panel.on('render', function ({ content, type, ext, isImage, }) {
        console.log({ type })
        
        if (isImage) {
            ext = 'md';
        }

        let language = '';
        let format = true;

        if (previewExts.includes(ext)) {
            if (type == 'code') {
                language = ext;
            }
        }
        else {
            language = ext;
            if (type == 'code') {
                format = false;
            }
        }


        markdoc.render({
            content,
            language,
            code: { format, },
        });

        panel.$.toggleClass('image', !!isImage);

       
    });


    return {
        outline: function (index) {
           

            markdoc.toOutline(index);


        },

    };

});



define.panel('/FileList/Body/Preview/Tabs', function (require, module, panel) {
    const Tabs = require('@definejs/tabs');

    var list = [
        { name: '预览', type: 'preview', },
        { name: '源码', type: 'code', },
    ];

    var currentIndex = 0;
    var tabs = null;


    panel.on('init', function () {
        tabs = new Tabs({
            container: panel.$,
            activedClass: 'on',
            eventName: 'click',
            selector: '>li',
            repeated: true, //这里要允许重复激活相同的项。
        });


        tabs.on('change', function (item, index) {
            currentIndex = index;
            item = list[index];
            panel.fire('change', [item.type]);
        });

       
    });

    /**
    * 渲染。
    */
    panel.on('render', function (index) {
        tabs.render(list, function (item, index) {
            return {
                'index': index,
                'name': item.name,
            };
        });

        if (typeof index == 'number') {
            currentIndex = index;
        }
        else {
            index = currentIndex;
        }

        tabs.active(index);

    });


});


define.panel('/FileList/Body/Preview', function (require, module, panel) {
    const File = require('File');
    const Tabs = module.require('Tabs');
    const MarkDoc = module.require('MarkDoc');

    let meta = {
        item: null,
    };


    panel.on('init', function () {
        Tabs.on({
            'change': function (type) {
                let { ext, isImage, content, } = meta.item.data;
                MarkDoc.render({ type, content, ext, isImage, });
            },
        });

        MarkDoc.on({
            'outlines': function (outlines) {
                panel.fire('outlines', [outlines]);
            },
        });

        
       
    });



    /**
    * 渲染。
    */
    panel.on('render', function (item) {
        meta.item = item;

        File.read(item.id, function (content) { 
            item.data.content = content;
            Tabs.render();
        });
    });


    return {

        outline: function (index) {
            MarkDoc.outline(index);
        },

       
    };


});


define.panel('/FileList/Body', function (require, module, panel) {
    const Nav = module.require('Nav');
    const Main = module.require('Main');
    const Preview = module.require('Preview');




    panel.on('init', function () {
        Nav.on({
            'path': function (path) {
                panel.fire('path', [path]);
            },
        });

        Main.on({
            'item': function (item) {
                panel.fire('item', [item]);
            },
        });

        Preview.on({
            'outlines': function (outlines) {
                panel.fire('outlines', [outlines]);
            },
        });

    });


    /**
    * 渲染内容。
    */
    panel.on('render', function (item) {
        Nav.render(item);

        if (item.type == 'dir') {
            Preview.hide();
            Main.render(item);
        }
        else {
            Main.hide();
            Preview.render(item);
        }



    });



 



    return {
        outline: Preview.outline,

        resize(...args) {
            let w = args.reduce(function (sum, value) {
                return sum + value;
            }, 0);


            let calc = 'calc(100% - ' + w + 'px)';

            panel.$.css({
                'width': calc,
            });

        },
    };


});



define('/FileList/Sidebar/Operation/Data', function (require, module, exports) {
  
    let list = [
        { name: '详情', cmd: 'detail', icon: 'fas fa-angle-double-{icon}', },
        { name: '刷新', cmd: 'refresh', icon: 'fa fa-sync-alt', },
        { name: '打开', cmd: 'open', icon: 'fa fa-external-link-alt', },
        { name: '编辑', cmd: 'edit', icon: 'fa fa-edit', },
        { name: '效果', cmd: 'demo', icon: 'fas fa-desktop', },
        { name: '复制', cmd: 'copy', icon: 'far fa-copy', },
        { name: '编译', cmd: 'compile-less', icon: 'fab fa-less', },
        { name: '压缩', cmd: 'minify-js', icon: 'fab fa-node-js', },
        { name: '删除', cmd: 'delete', icon: 'fa fa-times', },
    ];

    let cmd$filter = {
        'detail': function () {
            return true;
        },
        'open': function (item) {
            return item.type == 'file';
        },
        'edit': function (item) {
            return item.type == 'file';
        },
        'demo': function (item) {
            return item.type == 'file';
        },
        'copy': function (item) {
            return item.type == 'file';
        },
        'compile-less': function (item) {
            return item.type == 'file' && item.data.ext == 'less';
        },
        'minify-js': function (item) {
            return item.type == 'file' && item.data.ext == 'js';
        },
        'delete': function (item) {
            return !!item.parent;
        },
    };









    return {
        make(item) {
            let items = list.filter(({ cmd, }) => {
                let filter = cmd$filter[cmd];

                if (filter) {
                    return filter(item);
                }

                return true;

            });

            return items;
        },
    };


});



define.panel('/FileList/Sidebar/Operation', function (require, module, panel) {
    const Storage = require('@definejs/local-storage');
    const $String = require('@definejs/string');
    const Data = module.require('Data');

    let meta = {
        visible: true,
        list: [],
    };

    let storage = null;
 



    panel.on('init', function () {
        storage = new Storage(module.id);
        meta.visible = storage.get('visible');

        //修正一下初始状态的值。
        if (meta.visible === undefined) {
            meta.visible = true;
        }


        panel.$on('click', {
            'li[data-index]': function (event) {
                let { index, } = this.dataset;
                let item = meta.list[index];
                let { cmd, } = item;

                if (cmd == 'detail') {
                    meta.visible = !meta.visible;
                    panel.refresh();
                    return;
                }

                panel.fire('cmd', [cmd]);
            },
        });
       

        panel.template(function (item, index) {
            let { cmd, icon, } = item;

            if (cmd == 'detail') {
                icon = $String.format(icon, {
                    'icon': meta.visible ? 'right' : 'left',
                });
            }

            return {
                'index': index,
                'cmd': cmd,
                'icon': icon,
                'name': item.name,
            };
        });
    });




    panel.on('render', function (item) {
        let visible = meta.visible;
        let list = meta.list = Data.make(item);

        panel.fill(list);
        panel.fire('detail', [visible]);
        storage.set('visible', visible);
    });





});



define.panel('/FileList/Sidebar/Outline', function (require, module, panel) {
    const Outline = require('Outline');

    let outline = null;


    panel.set('show', false); //不要在 render 后自动显示。


    panel.on('init', function () {

        outline = new Outline({
            'container': panel.$,
        });

        outline.on({
            'item': function (item, index) {
                panel.fire('item', [item, index]);
            },
        });

        outline.render();
    });



 
    /**
    * 渲染。
    *   items = [
    *       {
    *           text: '',       //
    *           level: 1,       //
    *       },
    *   ];
    */
    panel.on('render', function (items) {

        outline.fill(items);

    });



});



define('/FileList/Sidebar/Stat/Types', function (require, module, exports) {

    return {
        /**
        * 从列表数据中过滤出类型下拉列表。
        */
        get: function (item) {
            if (item.type == 'file') {
                return [];
            }

            let {
                dirs, exts, files, emptyDirs, emptyFiles, size,
                ext$files, ext$size,
            } = item.data.global;


            let list = [
                // {
                //     name: '名称',
                //     value: item.name,
                //     class: 'sname',
                // },
                // {
                //     name: '类型',
                //     value: '目录',
                //     class: 'type',
                // },
                // {
                //     name: '创建时间',
                //     value: item.data.birthtime,
                //     class: 'time',
                // },
                // {
                //     name: '修改时间',
                //     value: item.data.mtime,
                //     class: 'time',
                // },
                {
                    name: '项目',
                    value: dirs.length + files.length,
                    desc: '个',
                    value1: size.value,
                    desc1: size.desc,
                    class: 'spliter dir-size',
                },
                {
                    name: '目录',
                    value: dirs.length,
                    desc: '个',
                    value1: emptyDirs.length,
                    desc1: '空',
                },
                {
                    name: '文件',
                    value: files.length,
                    desc: '个',
                    value1: emptyFiles.length,
                    desc1: '空',
                },
            ];

            exts.forEach((ext) => {
                let size = ext$size[ext];

                list.push({
                    name: ext == '' ? '(无后缀)' : `.${ext}`,
                    value: `${ext$files[ext].length}`,
                    desc: `个`,

                    value1: size.value,
                    desc1: size.desc,
                });
            });
           


            return list;
        },

        

    };

});



define.panel('/FileList/Sidebar/Stat', function (require, module, panel) {
    const Types = module.require('Types');

    panel.on('init', function () {
    

        panel.template({
            '': function (data) {
                let table = this.fill('table', data);
                return table;
            },

            'table': {
                '': function (item) {
                    let { type, name, data, } = item;
                    let { ext, size, md5, birthtime, mtime, } = data;
                    let desc = type == 'dir' ? '目录' :  `${ext} 文件`;
                    let types = Types.get(item);
                    
                    types = this.fill('type', types);

                    return {
                        name,
                        ext,
                        md5,
                        birthtime,
                        mtime,

                        'sizeValue': size.value,
                        'sizeDesc': size.desc,
                        'type': desc,
                        'types': types,
                    };
                },

                'type': function (item, index) {
                    return {
                        'name': item.name,
                        'value': item.value,
                        'desc': item.desc,
                        'value1': item.value1,
                        'desc1': item.desc1,
                        'class': item.class,

                    };

                },
            },
        });
    });




    panel.on('render', function (item) {
        
        panel.fill(item);

        panel.$.toggleClass('dir', item.type == 'dir');
    });





});



define.panel('/FileList/Sidebar/Tabs', function (require, module, panel) {
    const Tabs = require('Tabs');


    let list = [
        { name: '常规', type: 'general', },
        { name: '提纲', type: 'outline', },
    ];

    let tabs = null;


    panel.on('init', function () {
        tabs = new Tabs({
            container: panel.$.get(0),
        });

        tabs.on('change', function (item, index) {
            panel.fire(item.type);
        });

    });

    /**
    * 渲染。
    */
    panel.on('render', function ({ index, outline, }) {
        let items = outline ? list : list.slice(0, -1);

        tabs.render(items);
        tabs.active(index);

    });


});


define.panel('/FileList/Sidebar', function (require, module, panel) {
    const Stat = module.require('Stat');
    const Operation = module.require('Operation');
    const Outline = module.require('Outline');
    const Tabs = module.require('Tabs');


    let meta = {
        item: null,
        width: 0,
    };

    panel.on('init', function () {
        
        Tabs.on({
            'general': function () {
                Stat.show();
                Operation.show();
                Outline.hide();
            },

            'outline': function () {
                Stat.hide();
                Operation.hide();

                Outline.show();
            },

        });

        Operation.on({
            'cmd': function (cmd) {
                panel.fire('operation', cmd, [meta.item]);
            },

            'detail': function (visible) {
                meta.width = meta.width || panel.$.width();

                let w = visible ? meta.width : 0;

                panel.$.width(w);
                panel.fire('hide', [w]);
            },
        });

        Outline.on({
            'item': function (item, index) {
                panel.fire('outline', [item, index]);
            },
        });

     
       
    });



    /**
    * 渲染。
    */
    panel.on('render', function (item) {
        meta.item = item;

        Stat.render(item);
        Operation.render(item);


        Tabs.render({
            outline: item.type == 'file',
        });


    });

    return {
        outline: function (titles) {
            Outline.render(titles);
        },
    };


});


define('/FileList/Tree/Data', function (require, module, exports) {
    const MenuTree = require('MenuTree');

    return {


        /**
        */
        make({ dir, dirs, files, file$info, }) {
            
            //过滤掉根目录。
            if (dirs[0] == '/') { 
                //性能优化。
                //经过排序后的 dirs 的首项就是根目录。
                dirs = dirs.slice(1);
            }
            else {
                //备用方案。
                dirs = dirs.filter((dir) => {
                    return dir != '/';
                });
            }



            let root = {
                id: '/',
                type: 'dir',
                name: dir.split('/').slice(-2, -1)[0],
                open: true,
            };


            let list = MenuTree.parse({ root, files, dirs, }, function (item, depth) {
              
                if (item.type == 'dir') {
                    return;
                }

                let { icon, } = file$info[item.id];
                
                item.fileIcon = icon.className;
            });

            return list;
        },



    };


});


define('/FileList/Tree/Stat', function (require, module, exports) {
    const $Array = require('@definejs/array');
    const File = require('File');


    function parse(list, file$info) {
        let dirs = [];
        let files = [];
        let emptyDirs = []; //空目录。
        let emptyFiles = []; //空文件。

        let size = 0;
        let exts = [];
        let ext$files = {};
        let ext$size = {};


        list.forEach((item) => {
            let { id, type, list, } = item;

            if (type == 'dir') {
                dirs.push(item);

                if (list.length == 0) {
                    emptyDirs.push(item);
                }
                return;
            }

            
            let info = file$info[id];
            let { ext, stat, } = info;

            files.push(item);

            if (stat.size == 0) {
                emptyFiles.push(item);
            }

            size += stat.size;
            ext$size[ext] = (ext$size[ext] || 0) + stat.size;

            $Array.add(ext$files, ext, item);
        });

        exts = Object.keys(ext$files);

        dirs.sort(function (a, b) {
            a = a.id.toLowerCase();
            b = b.id.toLowerCase();
            return a > b ? 1 : -1;
        });

        files.sort(function (a, b) {
            a = a.id.toLowerCase();
            b = b.id.toLowerCase();
            return a > b ? 1 : -1;
        });

        exts.sort();

        Object.entries(ext$size).forEach(([ext, size]) => {
            ext$size[ext] = File.getSize(size);
        });

        size = File.getSize(size);


        return {
            size,
            dirs,
            files,
            emptyDirs,
            emptyFiles,
            exts,
            ext$files,
            ext$size,
        
        };

    }

    return {
        

        parse(item, { dir$info, file$info, }) { 
            let { id, type, } = item;

            if (type == 'file') {
                let info = file$info[id];
                Object.assign(item.data, info);
                return;
            }


            //type == 'dir'
            let info = dir$info[id];
            let global = parse(item.children, file$info);
            let current = parse(item.list, file$info);

            Object.assign(item.data, info, { global, current, });

           
        },

     

    };


});


define.panel('/FileList/Tree', function (require, module, panel) {
    const SidebarTree = require('SidebarTree');
    const Stat = module.require('Stat');
    const Data = module.require('Data');
 
    let tree = null;


    panel.on('init', function () {
       
        tree = new SidebarTree({
            'container': panel.$,
            'width': panel.$.width(),
        });

        tree.on({
            'item': function (item) {

                panel.fire('item', [item]);
            },
        
            'resize': function () {
                let w = tree.$.outerWidth();

                panel.$.width(w);
                panel.fire('resize', [w]);
            },
        });
       

    });


    /**
    * 渲染。
    */
    panel.on('render', function ({ dir, dir$info, file$info, dirs, files, }) {
        let list = Data.make({ dir, dirs, files, file$info, });

        tree.render(list);

        tree.each(function (item) {
            Stat.parse(item, { dir$info, file$info, });
        });

        
    });


    return {
        open(id) {
            tree.open(id);
        },
    };


});


define('/FileList/API', function (require, module, exports) {
    const Emitter = require('@definejs/emitter');
    const Loading = require('@definejs/loading');
    const Toast = require('@definejs/toast');
    const API = require('API');
    const Data = module.require('Data');


    let emitter = new Emitter();

    let loading = new Loading({
        mask: 0,
    });

    let toast = new Toast({
        duration: 1500,
        mask: 0,
    });

    let meta = {
        data: null,
    };


    return {
        on: emitter.on.bind(emitter),

        /**
        * 获取。
        */
        get(refresh) {

            if (!refresh && meta.data) {
                emitter.fire('success', 'get', [meta.data, true]);
                return;
            }


            let api = new API('FileSystem.list');

            api.on({
                'request': function () {
                    loading.show('加载中...');
                },

                'response': function () {
                    loading.hide();

                },

                'success': function (data, json, xhr) {
                    let { dir, dir$info, file$info, } = data;
                    let { dirs, files, } = Data.make(data);

                    data = meta.data = {
                        dir, dir$info, file$info,
                        dirs, files,
                    };

                    emitter.fire('success', 'get', [data, false]);

                   



                    // let worker = new Worker('./worker/FileList.js');

                    // worker.addEventListener('message', (event) => {
                    //     worker.terminate();

                    //     loading.hide();
                    //     let data = meta.data = event.data;
                    //     emitter.fire('success', 'get', [data, false]);
                      

                    // });

                    // worker.postMessage(data);


                },

                'fail': function (code, msg, json, xhr) {
                    definejs.alert('获取文件列表失败: {0}', msg);
                },

                'error': function (code, msg, json, xhr) {
                    definejs.alert('获取文件列表错误: 网络繁忙，请稍候再试');
                },
            });

            api.get();

        },


        /**
       * 删除指定的文件或目录。
       */
        delete(item) {
            let type = item.type;

            let type$desc = {
                file: '文件',
                dir: '目录',
            };

            let msg = `你确认要删除该${type$desc[type]}（${item.id}）吗？ `;

            //是一个目录。
            if (type == 'dir') {
                msg += `<p style="color: red;">这将会连同它的所有子目录和文件一起删除。</p>`;
            }

            msg += `<p style="color: #FF5722; font-weight: bold;">该操作会直接从服务器上删除目标项，且不可恢复！</p>`;



            definejs.confirm(msg, function () {

                let api = new API('FileSystem.delete');

                api.on({
                    'request': function () {
                        loading.show('删除中...');
                    },

                    'response': function () {
                        loading.hide();
                    },

                    'success': function (data, json, xhr) {
                        toast.show('删除成功', function (params) {
                            emitter.fire('success', 'delete', [item]);
                        });
                    },

                    'fail': function (code, msg, json, xhr) {
                        definejs.alert('删除失败: {0}', msg);
                    },

                    'error': function (code, msg, json, xhr) {
                        definejs.alert('删除错误: 网络繁忙，请稍候再试');
                    },
                });

                api.post({
                    'id': item.id,
                });

            });


        },

    };


});

define.view('/FileList', function (require, module, view) {
    const SessionStorage = require('@definejs/session-storage');
    const Clipboard = require('Clipboard');
    const API = module.require('API');
    const Tree = module.require('Tree');
    const Sidebar = module.require('Sidebar');
    const Body = module.require('Body');
    
    let storage = null;

    view.on('init', function () {

        storage = new SessionStorage(module.id);

        API.on('success', {
            'get': function (data, fromCache) {
                let id = storage.get('id') || '/';
                
                if (!fromCache) {
                    Tree.render(data); //这个渲染很费时。
                }

                Tree.open(id);
            },
            'delete': function (item) {
                storage.set('id', item.parent.id); 
                API.get(true);
            },
        });

        Tree.on({
            'item': function (item) {
                storage.set('id', item.id); 
                Body.render(item);
                Sidebar.render(item);
            },
            'resize': function (w1) {
                let w2 = Sidebar.$.outerWidth();
                Body.resize(w1, w2, 6);
            },
        });



        Body.on({
            'outlines': function (outlines) {
                Sidebar.outline(outlines);
            },
            'item': function (item) {
                Tree.open(item.id);
            },

            'path': function (path) {
                Tree.open(path);
            },
        });

        Sidebar.on({
            'outline': function (item, index) {
                Body.outline(index);
            },

            'hide': function (w2) {
                let w1 = Tree.$.outerWidth();
                Body.resize(w1, w2, 6);
            },
        });

        Sidebar.on('operation', {
            'refresh': function () {
                API.get(true);
            },
            'open': function (item) {
                view.fire('open', [item.id]);
            },
            'edit': function (item) {
                view.fire('edit', [item.id]);
            },
            'demo': function (item) {
                view.fire('demo', [item.id]);
            },

            'copy': function (item) {
                Clipboard.copy(item.data.content);
            },

            'delete': function (item) {
                API.delete(item);
            },
            
            'compile-less': function (item) {
                view.fire('compile-less', [item.data.content]);
            },
            'minify-js': function (item) {
                view.fire('minify-js', [item.data.content]);
            },
        });

       
       
    });


    /**
    * 渲染内容。
    *   id: '',   //渲染完成后要打开的文件。
    */
    view.on('render', function (id) {
        if (id) {
            storage.set('id', id);
        }

        API.get();
       

       
    });




});



define('/Home/FileList/Main/Data', function (require, module, exports) {

    const File = require('File');


    function add(key$list, key, item) {
        let list = key$list[key];

        if (!list) {
            list = key$list[key] = [];
        }

        list.push(item);
    }


    return {
        
        parse({ dir$info, file$info, }) {
            let dirs = Object.keys(dir$info);
            let files = Object.keys(file$info);

            let images = [];
            let ext$files = {};
            let size = 0;

            files.forEach((file) => {
                let { md5, stat, } = file$info[file];
                let ext = File.getExt(file);
                let isImage = File.checkImage(file);
          
                add(ext$files, ext, file);

                if (isImage) {
                    images.push(file);
                }

                size += stat.size;

            });

            


            let types = Object.keys(ext$files).sort().map((ext) => {
                let files = ext$files[ext];
                return { ext, files, };
            });

            size = File.getSize(size);

            return {
                dirs,
                files,
                images,
                types,
                size,
            };


        },

    };


});


define('/Home/FileList/API', function (require, module, exports) {
    const Emitter = require('@definejs/emitter');
    
    const API = require('API');


    let emitter = new Emitter();




    return {
        on: emitter.on.bind(emitter),

        /**
        * 获取。
        */
        get: function () {
            let api = new API('FileSystem.list', {
                // proxy: '.json',
            });

            api.on({
                'request': function () {
                    // loading.show('加载中...');
                },

                'response': function () {
                    // loading.hide();
                },

                'success': function (data, json, xhr) {
                    emitter.fire('success', 'get', [data]);
                },

                'fail': function (code, msg, json, xhr) {
                    definejs.alert(`获取文件列表失败: ${msg}`);
                },

                'error': function (code, msg, json, xhr) {
                    definejs.alert('获取文件列表错误: 网络繁忙，请稍候再试');
                },
            });

            api.get({
                id: '/',
            });

        },

       

    };


});


define.panel('/Home/FileList/Loading', function (require, module, panel) {


    panel.on('init', function () {

        


    });


    panel.on('render', function () {
        
    });

});



define.panel('/Home/FileList/Main', function (require, module, panel) {
    const Data = module.require('Data');

   

    panel.on('init', function () {

        panel.template({
            '': function (data) {
                let html = this.fill('html', data);
                return html;
            },

            'html': {
                '': function (data) {
                    let {
                        dirs,
                        files,
                        images,
                        types,
                        size,
                    } = data;

                    types = this.fill('type', types);
                 

                    return {
                        'all': dirs.length + files.length,
                        'sizeValue': size.value,
                        'sizeDesc': size.desc,
                        'dir': dirs.length,
                        'file': files.length,
                        'image': images.length,
                        'types': types,
                    };
                },

                'type': function (item, index) {
                    let { ext, files, } = item;

                    ext = ext|| '(无后缀)';

                    return {
                        'ext': ext,
                        'count': files.length,
                    };
                },
            },

        });


    });


    panel.on('render', function (data) {
        data = Data.parse(data);
        panel.fill(data);
    });

});



define.panel('/Home/FileList', function (require, module, panel) {
    const API = module.require('API');
    const Loading = module.require('Loading');
    const Main = module.require('Main');


    panel.on('init', function () {
        panel.$on('click', {
            '[data-cmd="refresh"]': function (event) {
                panel.refresh();
            },
        });
        
        API.on('success', {
            'get': function (data) {
                Loading.hide();
                Main.render(data);
            },
        });

    });


    panel.on('render', function () {
        Main.hide();
        Loading.render();
        API.get();

    });

});


define('/Home/JsModule/API/Data', function (require, module, exports) {
    const $Date = require('@definejs/date');
    const File = require('File');
    const HtmlStat = require('HtmlStat');
    const ModuleStat = require('ModuleStat');


    



    return {
        make({ html, module, }) {

            [ html.file$info, module.file$info, ].forEach((file$info) => {
                Object.entries(file$info).forEach(([file, info]) => {
                    let { stat, } = info;
                    let { names, dir, name, ext, isImage, icon, } = File.getInfo(file);
                    let size = File.getSize(stat.size);

                    let atime = $Date.format(stat.atimeMs, 'yyyy-MM-dd HH:mm:ss');
                    let birthtime = $Date.format(stat.birthtimeMs, 'yyyy-MM-dd HH:mm:ss');
                    let ctime = $Date.format(stat.ctimeMs, 'yyyy-MM-dd HH:mm:ss');
                    let mtime = $Date.format(stat.mtimeMs, 'yyyy-MM-dd HH:mm:ss');


                    //增加几个字段。
                    Object.assign(info, {
                        file,
                        name, 
                        names,
                        icon,
                        ext,
                        dir,
                        size,
                        atime,
                        birthtime,
                        ctime,
                        mtime,
                    });
                });
            });

            

            let htmlStat = HtmlStat.parse(html.file$info);
            let moduleStat = ModuleStat.parse(module.file$info);

            htmlStat = { ...html, ...htmlStat, };
            moduleStat = { ...module, ...moduleStat, };

            return { htmlStat, moduleStat, };


        },
    };
});


define('/Home/JsModule/Main/Data', function (require, module, exports) {

    return {
        
        parse(stat) {
            let { id$module, level$ids, } = stat.moduleStat;

            let ids = Object.keys(id$module);
            let nones = [];         //空 id 的模块列表，一般只有一个，index.js 中的 launch()。
            let publics = [];       //公共模块列表。
            let privates = [];      //私有模块列表。
            let singles = [];       //单模块。
            let parents = [];       //父模块列表。

            //按定义的方式。
            let views = [];         //视图模块列表。
            let panels = [];        //面板模块列表。
            let defines = [];       //普通模块列表。

            ids.forEach((id) => {
                //启动模块，一般只有一个。
                if (!id) {
                    nones.push(id);
                    return;
                }

                let { level, children, method, } = id$module[id];
                let hasChild = children.length > 0;

                //有儿子的模块，即父模块。
                if (hasChild) {
                    parents.push(id);
                }

                if (level == 1) {
                    publics.push(id);
                    if (!hasChild) {
                        singles.push(id);
                    }
                }
                else { //二级或以上。
                    privates.push(id);
                }

                //按模块的定义方式。
                if (method.endsWith('.view')) {
                    views.push(id);
                }
                else if (method.endsWith('.panel')) {
                    panels.push(id);
                }
                else {
                    defines.push(id);
                }
               

            });


            let levels = Object.keys(level$ids).map((level) => {
                let ids = level$ids[level];

                return { level, ids, };
            });


            return {
                ids,

                nones,
                publics,
                privates,

                singles,
                parents,
            
                views,
                panels,
                defines,

                levels,
            };
        },

    };


});


define('/Home/JsModule/API', function (require, module, exports) {
    const Emitter = require('@definejs/emitter');
    
    const API = require('API');
    const Data = module.require('Data');


    let emitter = new Emitter();




    return {
        on: emitter.on.bind(emitter),

        /**
        * 获取。
        */
        get() {
            let api = new API('ModuleSystem.parse', {
                // proxy: '.json',
            });

            api.on({
                'request': function () {
                    // loading.show('加载中...');
                },

                'response': function () {
                    // loading.hide();
                },

                'success': function (data, json, xhr) {
                    data = Data.make(data);

                    emitter.fire('success', 'get', [data]);
                },

                'fail': function (code, msg, json, xhr) {
                    definejs.alert(`获取统计数据失败: ${msg}`);
                },

                'error': function (code, msg, json, xhr) {
                    definejs.alert('获取统计数据错误: 网络繁忙，请稍候再试');
                },
            });

            api.get();

        },

       

    };


});


define.panel('/Home/JsModule/Loading', function (require, module, panel) {


    panel.on('init', function () {

        


    });


    panel.on('render', function () {
        
    });

});



define.panel('/Home/JsModule/Main', function (require, module, panel) {

    const Data = module.require('Data');

   

    panel.on('init', function () {

        panel.template({
            '': function (data) {
                let html = this.fill('html', data);
                return html;
            },

            'html': {
                '': function (data) {
                    let {
                        ids,

                        nones,
                        publics,
                        privates,

                        singles,
                        parents,

                        views,
                        panels,
                        defines,

                        levels,
                    } = data;


                    let levelList = this.fill('level', levels);

                    return {
                        'all': ids.length,

                        'none': nones.length,
                        'public': publics.length,
                        'private': privates.length,

                        'view': views.length,
                        'panel': panels.length,
                        'define': defines.length,

                        'single': singles.length,
                        'parent': parents.length,
                        'child': privates.length,

                        'levels': levelList,
                    };
                },

                'level': function (item) {
                    return {
                        'level': item.level,
                        'count': item.ids.length,
                    };
                },
            },

        });


    });


    panel.on('render', function (stat) {
        
        let data = Data.parse(stat);
            

        panel.fill(data);
    });

});



define.panel('/Home/JsModule', function (require, module, panel) {
    const API = module.require('API');
    const Loading = module.require('Loading');
    const Main = module.require('Main');


    panel.on('init', function () {
        panel.$on('click', {
            '[data-cmd="refresh"]': function (event) {
                panel.refresh();
            },
        });
        
        API.on('success', {
            'get': function (stat) {
                Loading.hide();
                Main.render(stat);
            },
        });

    });


    panel.on('render', function () {
        Main.hide();
        Loading.render();
        API.get();

    });

});



define('/Home/Project/API', function (require, module, exports) {
    const Emitter = require('@definejs/emitter');
    
    const API = require('API');


    let emitter = new Emitter();




    return {
        on: emitter.on.bind(emitter),

        /**
        * 获取。
        */
        get: function () {
            let api = new API('Project.get', {
                // proxy: '.json',
            });

            api.on({
                'request': function () {
                    // loading.show('加载中...');
                },

                'response': function () {
                    // loading.hide();
                },

                'success': function (data, json, xhr) {
                    emitter.fire('success', 'get', [data]);
                },

                'fail': function (code, msg, json, xhr) {
                    definejs.alert(`获取项目信息失败: ${msg}`);
                },

                'error': function (code, msg, json, xhr) {
                    definejs.alert('获取项目信息错误: 网络繁忙，请稍候再试');
                },
            });

            api.get();

        },

       

    };


});


define.panel('/Home/Project/Loading', function (require, module, panel) {


    panel.on('init', function () {

        


    });


    panel.on('render', function () {
        
    });

});



define.panel('/Home/Project/Main', function (require, module, panel) {
    const $Date = require('@definejs/date');

    panel.on('init', function () {


        panel.template({
            '': function (data) {
                let table = this.fill('table', data);
                return table;
            },

            'table': {
                '': function (data) {
                    let { process, package, cwd, } = data;
                    let { repository, } = package;
                    let keywords = JSON.stringify(package.keywords).split('","').join('", "');

                  
                    let processInfo = {
                        time: '',
                        status: 'stop',
                        statusText: ' 已停止',
                        pid: '',
                        argv: '',
                    };

                    if (process) {
                        let { time, argv, pid, } = process;

                        time = $Date.format(time, 'yyyy-MM-dd HH:mm:ss');
                        argv = JSON.stringify(argv.slice(2)).split('","').join('", "');

                        processInfo = {
                            time,
                            argv: `[ ${argv.slice(1, -1)} ]`,
                            status: 'play',
                            statusText: ' 监控中',
                            pid,
                        };
                    }


                    return {
                        'cwd': cwd,
                        'name': package.name,
                        'description': package.description,
                        'repositoryHref': repository ? repository.url.slice(0, -4) : '',
                        'repositoryUrl': repository ? repository.url : '',
                        'version': package.version,
                        'keywords': `[ ${keywords.slice(1, -1)} ]`,
                        'author': package.author,
                        'email': package.email,

                        ...processInfo,

                    };
                },

            

            },
        });


    });


    panel.on('render', function (data) {

        panel.fill(data);
    });


    return {
        
    };

});



define.panel('/Home/Project', function (require, module, panel) {
    const API = module.require('API');
    const Loading = module.require('Loading');
    const Main = module.require('Main');


    panel.on('init', function () {
        panel.$on('click', {
            '[data-cmd="refresh"]': function (event) {
                panel.refresh();
            },
        });

        
        API.on('success', {
            'get': function (data) {
                Loading.hide();
                Main.render(data);

            },
        });


      

    });


    panel.on('render', function () {
        Main.hide();
        Loading.render();
        API.get();

    });

});



define('/Home/Server/API', function (require, module, exports) {
    const Emitter = require('@definejs/emitter');
    const Toast = require('@definejs/toast');
    const API = require('API');

    let emitter = new Emitter();

    let toast = new Toast({
        icon: 'ban',
        mask: 0.5,
        width: 200,
        text: '禁止访问该域名',
    });

    return {
        on: emitter.on.bind(emitter),

        /**
        * 获取。
        */
        get: function () {
            let api = new API('Server.get', {
                // proxy: '.json',
            });

            api.on({
                'request': function () {
                    // loading.show('加载中...');
                    toast.hide();
                },

                'response': function () {
                    // loading.hide();
                },

                'success': function (data, json, xhr) {
                    data.host = data.host || 'localhost';
                    emitter.fire('success', 'get', [data]);
                },

                'fail': function (code, msg, json, xhr) {
                    definejs.alert(`获取服务器信息失败: ${msg}`);
                },

                'error': function (xhr) {
                    if (xhr.status == 403) {
                        toast.show();
                    }
                    else {
                        definejs.alert('获取服务器信息错误: 网络繁忙，请稍候再试');
                    }
                },
            });

            api.get();

        },

       

    };


});


define.panel('/Home/Server/Loading', function (require, module, panel) {


    panel.on('init', function () {

        


    });


    panel.on('render', function () {
        
    });

});



define.panel('/Home/Server/Main', function (require, module, panel) {
    const $Date = require('@definejs/date');

    panel.on('init', function () {


        panel.template({
            '': function (data) {
                let table = this.fill('table', data);
                return table;
            },

            'table': {
                '': function (data) {
                    let statics = data.statics.filter((item) => {
                        return item != '/';
                    });
                    
                    let status = this.fill('status', { running: true, });
                    let localUrls = this.fill('local', statics, data);
                    let networkUrls = this.fill('network', statics, data);

                    let { session, process, } = data;
                    let { allowCrossOrigin, } = data.api;
                    let time = $Date.format(session.time, 'yyyy-MM-dd HH:mm:ss');

                    return {
                        'status': status,
                        'time': time,
                        'pid': process.pid,
                        'port': data.port,
                        'host': data.host,
                        'sessionId': session.id,
                        'crossOriginClass': allowCrossOrigin ? 'cross-origin-true' : 'cross-origin-false',
                        'crossOriginIcon': allowCrossOrigin ? 'check' : 'times',
                        'crossOriginText': allowCrossOrigin ? '允许' : '禁止',
                        'localUrls': localUrls,
                        'networkUrls': networkUrls,
                    };
                },

                'status': function ({ running, }) {
                    return {
                        'status': running ? 'play' : 'stop',
                        'text': running ? '运行中' : '已停止',
                    };

                },

                'local': function (item, index, data) {

                    return {
                        'port': data.port,
                        'dir': item,
                    };
                },

                'network': function (item, index, data) {
                    let { host, port, } = data;
                    let url = `http://${host}:${port}${item}`;

                    url = encodeURIComponent(url);

                    


                    return {
                        'host': host,
                        'port': port,
                        'dir': item,
                        'url': url,
                        'qrcode.path': data.qrcode.path,
                    };
                },
            },
        });


    });


    panel.on('render', function (data) {

        panel.fill(data);
    });


    return {
        setStatus(running) {
            let tpl = panel.template();
            let html = tpl.fill('table', 'status', { running, });
            
            panel.$.find(`[data-id="td-status"]`).html(html);
        },
    };

});



define('/Home/Server/Status', function (require, module, exports) {
    const Query = require('@definejs/query');
    const Emitter = require('@definejs/emitter');
    const Toast = require('@definejs/toast');

    let emitter = new Emitter();
    let toast = new Toast({
        icon: 'times',
        mask: 0.25,
        width: 200,
        text: '服务器已停止运行',
    });

    let config = definejs.config('API');
    let source = null;


    function close() {
        if (!source) {
            return;
        }

        source.close();
        source = null;
        return true;
    }


    return exports = {

        on: emitter.on.bind(emitter),

        /**
        * 
        */
        test: function (server) {
            let url = Query.add(`${config.url}sse/Terminal.exec`, {
                cmd: 'echo',
                args: JSON.stringify([`Server is runnig, tested from '${module.id}'`]),
            });

            let status = true;

            function change(running) {
                //true --> true
                //false --> false
                if (running === status) {
                    return;
                }

                //false --> true
                if (status === false && running === true) {
                    toast.hide();
                    emitter.fire('restart');
                }
                else {
                    // true --> false
                    toast.show();
                    emitter.fire('close');
                }

                status = running;
            }



            //先关闭之前的。
            close();
            source = new EventSource(url);

            //这个事件名是后端自定义的。
            source.addEventListener('stdout', function (event) {
                change(true);
            });


            source.addEventListener('error', function (event) {
                let { data, } = event; // data 是一个 string。

                //服务器可能已经关闭了，会不断重发请求到服务器。
                if (data === undefined) {
                    change(false);
                }
                else {
                    change(true); //在 windows 平台会执行这个。 调试后发现的。
                }
            });


            source.addEventListener('stderr', function (event) {
                change(true);
            });



        },



    };


});


define.panel('/Home/Server', function (require, module, panel) {
    const API = module.require('API');
    const Status = module.require('Status');
    const Loading = module.require('Loading');
    const Main = module.require('Main');


    panel.on('init', function () {
        panel.$on('click', {
            '[data-cmd="refresh"]': function (event) {
                panel.refresh();
            },
        });

        API.on('success', {
            'get': function (data) {
                Loading.hide();
                Main.render(data);
                Status.test(data);

                panel.fire('get', [data]);
            },
        });

        Status.on({
            'restart': function () {
                panel.refresh();
            },
            'close': function () {
                Main.setStatus(false);
            },
        });

    });


    panel.on('render', function () {
        Main.hide();
        Loading.render();
        API.get();

    });

    return {
        
    };

});



define.view('/Home', function (require, module, view) {
    const JsModule = module.require('JsModule');
    const FileList = module.require('FileList');
    const Project = module.require('Project');
    const Server = module.require('Server');

    view.on('init', function () {

        Server.on({
            'get': function (data) {
                Project.render();
                JsModule.render();
                FileList.render();
            },
        });

    });


    view.on('render', function () {
        
        Server.render();


    });

});


define('/HtmlTree/API/Data', function (require, module, exports) {
    
    
    return {
        //改成使用相对于 htdocs 的路径。
        make(data) { 
            let { cwd, masterBlock, } = data;

            function useRelative(item, key) { 
                if (Array.isArray(item)) {
                    let list = item;

                    list = list.map((item) => {
                        return useRelative(item, key);
                    });

                    return list;
                }

                if (typeof item == 'string') {
                    if (item.startsWith(cwd)) {
                        item = item.slice(cwd.length);
                    }
                    return item;
                }

                if (typeof item != 'object') {
                    throw new Error(`必须为一个 object`);
                }


                let path = item[key];

                if (!path || typeof path != 'string' || !path.startsWith(cwd)) {
                    return path;
                }

                item[key] = path = path.slice(cwd.length);
                return path;
            }

            function fixHtmlLinks(list) { 

                list.forEach((item) => {
                    useRelative(item, 'file');
                    useRelative(item.link, 'dir');
                    useRelative(item.link, 'file');

                    fixHtmlLinks(item.link.list);

                });
            }



            masterBlock.list.forEach((item) => {
                let { master, } = item;

                useRelative(item, 'file');
                useRelative(master, 'dest');
                useRelative(master, 'dir');
                useRelative(master, 'file');

                master.cssLinks.forEach((item) => {
                    useRelative(item, 'file');
                    useRelative(item.link, 'file');
                });

                master.htmlBlocks.forEach((item) => { 
                    let { block, } = item;

                    useRelative(block, 'dir');
                    
                    //这里有递归。
                    fixHtmlLinks(block.list);

                    block.patterns = useRelative(block.patterns);
                });


                //这个有递归。
                fixHtmlLinks(master.htmlLinks);


                master.jsBlocks.forEach((item) => {
                    let { block, } = item;
                    useRelative(block, 'dir');
                    
                    block.list.forEach((item) => {
                        useRelative(item, 'file');
                        useRelative(item.link, 'file');
                    });

                    block.patterns = useRelative(block.patterns);
                });

                master.jsLinks.forEach((item) => {
                    useRelative(item, 'file');
                    useRelative(item.link, 'file');
                });

                master.lessBlocks.forEach((item) => { 
                    let { block, } = item;

                    useRelative(block, 'dir');

                    block.list.forEach((item) => { 
                        useRelative(item, 'file');
                        useRelative(item.dest, 'file');
                        useRelative(item.dest.dir, 'css');
                        useRelative(item.link, 'file');
                    });

                    block.patterns = useRelative(block.patterns);

                });

                master.lessLinks.forEach((item) => {
                    useRelative(item, 'file');
                    useRelative(item.dest, 'file');
                    useRelative(item.dest.dir, 'css');
                    useRelative(item.link, 'file');
                });

            });

            masterBlock.patterns = useRelative(masterBlock.patterns);


        },
    };

});

define.panel('/HtmlTree/Main/HtmlBlock/BaseInfo/Children/GridView', function (require, module, panel) {
    const GridView = require('GridView');


    let gridview = null;
    let tpl = null;

    panel.on('init', function () {
        tpl = panel.template();

        gridview = new GridView({
            container: panel.$,

            fields: [
                { caption: '序号', name: 'order', width: 40, class: 'order', },
                // { caption: 'id', name: 'id', width: 200, class: 'name', },
                { caption: '节点名称', name: 'name', width: 400, class: 'name', },
                { caption: '所在文件', name: 'file', width: 500, class: 'file', },
                // { caption: '内容行数', name: 'lines', width: 74, class: 'number', },
                // { caption: '下级个数', name: 'list', width: 74, class: 'number', },
            ],

        });

        gridview.on('process', 'row', function (row) {


        });


        gridview.on('process', 'cell', {
            'order': function (cell, { no, }) {
                return no + 1;
            },

            'name': function (cell) {
                let { item, } = cell.row;;

                let html = tpl.fill('href', {
                    'cmd': 'id',
                    'text': item.name,
                });

                return html;
            },

            'file': function (cell) {
                let { item, } = cell.row;;

                let html = tpl.fill('href', {
                    'cmd': 'file',
                    'text': item.file,
                });

                return html;
            },




        });

        gridview.on('click', 'cell', function (cell, { event, }) {
            let { cmd, } = event.target.dataset;

            if (cmd) {
                event.stopPropagation();
                panel.fire('cmd', [cmd, cell.row.item]);
            }

        });



    });


    /**
    * 渲染内容。
    *   list: [],       //必选，数据列表。
   
    */
    panel.on('render', function (list) {



        gridview.render(list);

    });



});


define.panel('/HtmlTree/Main/HtmlBlock/BaseInfo/Childs/GridView', function (require, module, panel) {
    const GridView = require('GridView');


    let gridview = null;
    let tpl = null;

    panel.on('init', function () {
        tpl = panel.template();

        gridview = new GridView({
            container: panel.$,

            fields: [
                { caption: '序号', name: 'order', width: 40, class: 'order', },
                // { caption: 'id', name: 'id', width: 200, class: 'name', },
                { caption: '节点名称', name: 'name', width: 400, class: 'name', },
                { caption: '所在文件', name: 'file', width: 500, class: 'file', },
                // { caption: '内容行数', name: 'lines', width: 74, class: 'number', },
                // { caption: '下级个数', name: 'list', width: 74, class: 'number', },
            ],

        });

        gridview.on('process', 'row', function (row) {


        });


        gridview.on('process', 'cell', {
            'order': function (cell, { no, }) {
                return no + 1;
            },

            'name': function (cell) {
                let { item, } = cell.row;;

                let html = tpl.fill('href', {
                    'cmd': 'id',
                    'text': item.name,
                });

                return html;
            },

            'file': function (cell) {
                let { item, } = cell.row;;

                let html = tpl.fill('href', {
                    'cmd': 'file',
                    'text': item.file,
                });

                return html;
            },




        });

        gridview.on('click', 'cell', function (cell, { event, }) {
            let { cmd, } = event.target.dataset;

            if (cmd) {
                event.stopPropagation();
                panel.fire('cmd', [cmd, cell.row.item]);
            }

        });




    });


    /**
    * 渲染内容。
    *   list: [],       //必选，数据列表。
   
    */
    panel.on('render', function (list) {


        gridview.render(list);

    });



});



define.panel('/HtmlTree/Main/HtmlBlock/BaseInfo/Base', function (require, module, panel) {
    const Escape = require('@definejs/escape');

    let meta = {
        node: null,
    };







    panel.on('init', function () {

       

        panel.template(function (node) {
            let { data, parent, } = node;
           
            let beginTag = Escape.html(data.tags.begin);
            let endTag = Escape.html(data.tags.end);
            let patterns = JSON.stringify(data.patterns, null, 4);

            return {
                'tabs': data.tabs,
                'beginNo': data.begin + 1,
                'endNo': data.end + 1,
                'beginTag': beginTag,
                'endTag': endTag,
                'patterns': patterns,
                'parent': `${parent.cid} - ${parent.name}`,
            };
        });
       

        panel.$on('click', {

            '[data-cmd="parent"]': function (event) {
                let id = meta.node.parent.id;
                panel.fire('id', [id]);
            },

            '[data-cmd="file"]': function (event) {
                let file = meta.node.data.file;

                panel.fire('file', [file]);
            },

            '[data-cmd="dir"]': function (event) {
                let dir = meta.node.data.link.dir;

                if (dir.endsWith('/')) {
                    dir = dir.slice(0, -1);
                }

                panel.fire('file', [dir]);
            },

            '[data-cmd="rel"]': function (event) {
                panel.fire('rel');
            },
        });




    });




    panel.on('render', function (node) {
        meta.node = node;
        panel.fill(node);

    });

  




});



define.panel('/HtmlTree/Main/HtmlBlock/BaseInfo/Children', function (require, module, panel) {

    const GridView = module.require('GridView');

    panel.set('show', false);


    panel.on('init', function () {
        
        GridView.on({
            'cmd': function (cmd, item) {
                let value = item[cmd];      //cmd 为 `id`、`file`。
                panel.fire(cmd, [value]);
            },
        });

    });




    panel.on('render', function (node) {


        let list = node.children.map((node) => {
            let { data, } = node;
            // let lines = data.link.content.split('\n');


            return {
                'id': node.id,
                'name': `${node.cid} - ${node.name}`,
                'file': data.file,
                // 'lines': lines.length,
                'list': node.list.length,
            };
        });

        
        GridView.render(list);
        panel.show();
    });





});



define.panel('/HtmlTree/Main/HtmlBlock/BaseInfo/Childs', function (require, module, panel) {

    const GridView = module.require('GridView');

    panel.set('show', false);


    panel.on('init', function () {
        
        GridView.on({
            'cmd': function (cmd, item) {
                let value = item[cmd];      //cmd 为 `id`、`file`。
                panel.fire(cmd, [value]);
            },
        });

    });




    panel.on('render', function (node) {

        console.log({ node });
        
        let list = node.list.map((node) => {

            let { data, } = node;
            // let lines = data.link.content.split('\n');


            return {
                'id': node.id,
                'name': `${node.cid} - ${node.name}`,
                'file': data.file,
                // 'lines': lines.length,
                'list': node.list.length,
            };
        });

        
        GridView.render(list);
        panel.show();
    });





});



define.panel('/HtmlTree/Main/HtmlBlock/BaseInfo', function (require, module, panel) {
    const Base = module.require('Base');
    const Childs = module.require('Childs');
    const Children = module.require('Children');


    panel.on('init', function () {
        [
            Base,
            Childs,
            Children,
            
        ].forEach((M) => {
            M.on({
                'file': function (file) {
                    panel.fire('file', [file]);
                },
                'id': function (id) {
                    panel.fire('id', [id]);
                },
                
            });
        });

        Base.on({
            'rel': function () {
                panel.fire('rel');
            },
        });

    });




    panel.on('render', function (item) {
        console.log({ item });
        
        Base.render(item);
        Childs.render(item);

        
        if (item.children.length > item.list.length) {
            Children.render(item);
        }
        else {
            Children.hide();
        }
    });





});



define('/HtmlTree/Main/HtmlBlock/Rel/Data', function (require, module, exports) {




    return {
        get(node) {
            let { parent, } = node;



            return {
                'file': parent.data.file,
                'content': parent.data.content,
                'beginNo': node.data.begin,
                'endNo': node.data.end,
            };

        },
    };

});



define.panel('/HtmlTree/Main/HtmlBlock/Rel/Header', function (require, module, panel) {

    const File = require('File');


    let meta = {
        file: '',
    };

    panel.on('init', function () {
       
        panel.$on('click', {
            '[data-cmd="file"]': function (event) {
                panel.fire('file', [meta.file]);
            },
        });
    });



    /**
    * 渲染。
    */
    panel.on('render', function (file) {
        let icon = File.getIcon(file);
        
        meta.file = file;

        panel.fill({
            'icon': icon.html,
            'file': file,
        });
       
       
    });


    return {

    };

});



define.panel('/HtmlTree/Main/HtmlBlock/Rel/MarkDoc', function (require, module, panel) {
    const MarkDoc = require('MarkDoc');
    const $ = require('$');

    let markdoc = null;


    panel.on('init', function () {
        markdoc = new MarkDoc({
            'container': panel.$,
        });
        
       
    });



    /**
    * 渲染。
    */
    panel.on('render', function (content) {

        markdoc.render({
            'content': content,
            'language': 'html',
            'baseUrl': '',
            'code': {
                'format': true,
            },
        });

        
       
    });


    return {
        highlight(beginNo, endNo) {
            //高亮行号。

            let list = markdoc.$.find(`ul.line-numbers>li`).toArray();
            
            list = list.slice(beginNo, endNo + 1);

            list.forEach((li) => {
                $(li).addClass('on');
            });

            //滚动到可视范围。
            setTimeout(() => {
                list[0].scrollIntoViewIfNeeded();
            }, 200);

        },
    };

});



define.panel('/HtmlTree/Main/HtmlBlock/Rel', function (require, module, panel) {
    const Data = module.require('Data');
    const Header = module.require('Header');
    const MarkDoc = module.require('MarkDoc');



    panel.on('init', function () {
       
        Header.on({
            'file': function (file) {
                panel.fire('file', [file]);
            },
        });
       
    });



    /**
    * 渲染。
    */
    panel.on('render', function (node) {
        let { file, content, beginNo, endNo, } = Data.get(node);
        
        Header.render(file);
        MarkDoc.render(content);
        MarkDoc.highlight(beginNo, endNo);
       
       
    });


    return {

    };

});



define.panel('/HtmlTree/Main/HtmlBlock/Render', function (require, module, panel) {
    const MarkDoc = require('MarkDoc');

    let markdoc = null;


    panel.on('init', function () {
        markdoc = new MarkDoc({
            'container': panel.$,
        });

    });



    /**
    * 渲染。
    */
    panel.on('render', function (node) {
        let content = node.data.block.render;
        let tabs = node.data.tabs;

        if (tabs > 0) {
            let lines = content.split('\n').map((line) => {
                return line.slice(tabs);
            });

            content = lines.join('\n');
        }

        

        markdoc.render({
            'content': content,
            'language': 'html',
            'baseUrl': '',
            'code': {
                'format': true,
            },
        });
       


    });


    return {

    };

});



define.panel('/HtmlTree/Main/HtmlBlock/Tabs', function (require, module, panel) {
    const Tabs = require('Tabs');


    let allList = [
        { name: '基本信息', cmd: 'base', icon: 'fas fa-circle-info', },
        { name: '引用原文', cmd: 'rel', icon: 'fas fa-quote-left', },
        { name: '渲染内容', cmd: 'render', icon: 'fas fa-code', },
    ];


    let tabs = null;

    let meta = {
        index: 0,
        list: [],
        cmd$module: null,
    };


    panel.on('init', function () {
        tabs = new Tabs({
            container: panel.$.get(0),
            storage: module.id,
        });


        tabs.on('change', function (item, index) {
            let { cmd, } = item;
            let { cmd$module, } = meta;

            if (cmd$module) {
                Object.keys(cmd$module).forEach((key) => {
                    let M = cmd$module[key];

                    if (key == cmd) {
                        panel.fire('change', [M]);
                    }
                    else {
                        M.hide();
                    }
                });
            }
            
            //后备方案。
            panel.fire('cmd', cmd, []);
        });

       
    });

    /**
    * 渲染。
    */
    panel.on('render', function (isRoot) {
        meta.list = allList;

        if (isRoot) {
            meta.list = meta.list.filter((item) => {
                return item.root;
            });
        }

        tabs.render(meta.list);
        tabs.active();

    });

    return {
        active(cmd) {
            let index = meta.list.findIndex((item) => {
                return item.cmd == cmd;
            });

            tabs.active(index);
        },

        map(cmd$module) {
            meta.cmd$module = cmd$module;
        },
    };


});

define.panel('/HtmlTree/Main/HtmlBlock', function (require, module, panel) {
    const Tabs = module.require('Tabs');
    const BaseInfo = module.require('BaseInfo');
    const Rel = module.require('Rel');
    const Render = module.require('Render');


    let meta = {
        item: null,
    };

    panel.on('init', function () {

        Tabs.map({
            'base': BaseInfo,
            'rel': Rel,
            'render': Render,
        });

        Tabs.on({
            'change': function (M) {
                M.render(meta.item);
            },
        });



        [BaseInfo, Rel, ].forEach((M) => {
            M.on({
                'file': function (file) {
                    panel.fire('file', [file]);
                },
                'id': function (id) {
                    panel.fire('id', [id]);
                },
            });
        });

        BaseInfo.on({
            'rel': function () {
                Tabs.active('rel');
            },
        });



    });


    /**
    * 渲染内容。
    */
    panel.on('render', function (item) {
        meta.item = item;

        Tabs.render();

    });




    return {
        
    };

});


define.panel('/HtmlTree/Main/HtmlLink/BaseInfo/Children/GridView', function (require, module, panel) {
    const GridView = require('GridView');


    let gridview = null;
    let tpl = null;

    panel.on('init', function () {
        tpl = panel.template();

        gridview = new GridView({
            container: panel.$,

            fields: [
                { caption: '序号', name: 'order', width: 40, class: 'order', },
                // { caption: 'id', name: 'id', width: 200, class: 'name', },
                { caption: '节点名称', name: 'name', width: 300, class: 'name', },
                { caption: '所在文件', name: 'file', width: 500, class: 'file', },
                // { caption: '内容行数', name: 'lines', width: 74, class: 'number', },
                // { caption: '下级个数', name: 'list', width: 74, class: 'number', },
            ],

        });

        gridview.on('process', 'row', function (row) {


        });


        gridview.on('process', 'cell', {
            'order': function (cell, { no, }) {
                return no + 1;
            },

            'name': function (cell) {
                let { item, } = cell.row;;

                let html = tpl.fill('href', {
                    'cmd': 'id',
                    'text': item.name,
                });

                return html;
            },

            'file': function (cell) {
                let { item, } = cell.row;;

                let html = tpl.fill('href', {
                    'cmd': 'file',
                    'text': item.file,
                });

                return html;
            },




        });

        gridview.on('click', 'cell', function (cell, { event, }) {
            let { cmd, } = event.target.dataset;

            if (cmd) {
                event.stopPropagation();
                panel.fire('cmd', [cmd, cell.row.item]);
            }

        });




    });


    /**
    * 渲染内容。
    *   list: [],       //必选，数据列表。
   
    */
    panel.on('render', function (list) {



        gridview.render(list);

    });



});


define.panel('/HtmlTree/Main/HtmlLink/BaseInfo/Childs/GridView', function (require, module, panel) {
    const GridView = require('GridView');


    let gridview = null;
    let tpl = null;

    panel.on('init', function () {
        tpl = panel.template();

        gridview = new GridView({
            container: panel.$,
            fields: [
                { caption: '序号', name: 'order', width: 40, class: 'order', },
                // { caption: 'id', name: 'id', width: 200, class: 'name', },
                { caption: '节点名称', name: 'name', width: 300, class: 'name', },
                { caption: '所在文件', name: 'file', width: 500, class: 'file', },
                // { caption: '内容行数', name: 'lines', width: 74, class: 'number', },
                // { caption: '下级个数', name: 'list', width: 74, class: 'number', },
            ],

        });

        gridview.on('process', 'row', function (row) {


        });


        gridview.on('process', 'cell', {
            'order': function (cell, { no, }) {
                return no + 1;
            },

            'name': function (cell) {
                let { item, } = cell.row;;

                let html = tpl.fill('href', {
                    'cmd': 'id',
                    'text': item.name,
                });

                return html;
            },

            'file': function (cell) {
                let { item, } = cell.row;;

                let html = tpl.fill('href', {
                    'cmd': 'file',
                    'text': item.file,
                });

                return html;
            },




        });

        gridview.on('click', 'cell', function (cell, { event, }) {
            let { cmd, } = event.target.dataset;

            if (cmd) {
                event.stopPropagation();
                panel.fire('cmd', [cmd, cell.row.item]);
            }

        });




    });


    /**
    * 渲染内容。
    *   list: [],       //必选，数据列表。
   
    */
    panel.on('render', function (list) {



        gridview.render(list);

    });



});



define.panel('/HtmlTree/Main/HtmlLink/BaseInfo/Base', function (require, module, panel) {
    const MarkDoc = require('MarkDoc');

    let markdoc = null;


    let meta = {
        node: null,
    };







    panel.on('init', function () {

        function getHtml(html) {
            markdoc = markdoc || new MarkDoc({
                'container': document.createElement('div'),
            });

            markdoc.render({
                'content': html,
                'language': 'html',
                'code': {
                    numbers: false,
                    language: false,
                },
            });

            html = markdoc.$.html();
            return html;
        }

        panel.template({
            '': function (node) {
                let name = node.data.href ? 'static' : 'block';
                let html = this.fill(name, node);
                return html;
            },

            'static': function (node) {
                let { data, parent, } = node;
                let html = getHtml(data.item);
              

                return {
                    'href': data.href,
                    'file': data.file,
                    'tabs': data.tabs,
                    'no': data.no + 1,
                    'dir': data.link.dir,
                    'rel': html,
                    'parent': `${parent.cid} - ${parent.name}`,
                };
            },

            'block': function (node) {
                let { data, parent, } = node;

                return {
                    'file': data.file,
                    'dir': data.link.dir,
                    'parent': `${parent.cid} - ${parent.name}`,
                };
            },
            
        });
       

        panel.$on('click', {

            '[data-cmd="parent"]': function (event) {
                let id = meta.node.parent.id;
                panel.fire('id', [id]);
            },

            '[data-cmd="file"]': function (event) {
               
                let file = this.innerText;

                panel.fire('file', [file]);
            },

       
            '[data-cmd="rel"]': function (event) {
                panel.fire('rel');
            },
        });




    });




    panel.on('render', function (node) {
        meta.node = node;
        panel.fill(node);

    });

  




});



define.panel('/HtmlTree/Main/HtmlLink/BaseInfo/Children', function (require, module, panel) {

    const GridView = module.require('GridView');

    panel.set('show', false);


    panel.on('init', function () {
        
        GridView.on({
            'cmd': function (cmd, item) {
                let value = item[cmd];      //cmd 为 `id`、`file`。
                panel.fire(cmd, [value]);
            },
        });

    });




    panel.on('render', function (node) {


        let list = node.children.map((node) => {
            let { data, } = node;
            let lines = data.link.content.split('\n');


            return {
                'id': node.id,
                'name': `${node.cid} - ${node.name}`,
                'file': data.file,
                'lines': lines.length,
                'list': node.list.length,
            };
        });

        
        GridView.render(list);
        panel.show();
    });





});



define.panel('/HtmlTree/Main/HtmlLink/BaseInfo/Childs', function (require, module, panel) {

    const GridView = module.require('GridView');

    panel.set('show', false);


    panel.on('init', function () {
        
        GridView.on({
            'cmd': function (cmd, item) {
                let value = item[cmd];      //cmd 为 `id`、`file`。
                panel.fire(cmd, [value]);
            },
        });

    });




    panel.on('render', function (node) {

        let list = node.list.map((node) => {

            let { data, } = node;
            let lines = data.link.content.split('\n');


            return {
                'id': node.id,
                'name': `${node.cid} - ${node.name}`,
                'file': data.file,
                'lines': lines.length,
                'list': node.list.length,
            };
        });

        
        GridView.render(list);
        panel.show();
    });





});



define.panel('/HtmlTree/Main/HtmlLink/BaseInfo', function (require, module, panel) {
    const Base = module.require('Base');
    const Childs = module.require('Childs');
    const Children = module.require('Children');


    panel.on('init', function () {
        [
            Base,
            Childs,
            Children,
            
        ].forEach((M) => {
            M.on({
                'file': function (file) {
                    panel.fire('file', [file]);
                },
                'id': function (id) {
                    panel.fire('id', [id]);
                },
                
            });
        });

        Base.on({
            'rel': function () {
                panel.fire('rel');
            },
        });

    });




    panel.on('render', function (item) {
        Base.render(item);
        Childs.render(item);

        if (item.children.length > item.list.length) {
            Children.render(item);
        }
        else {
            Children.hide();
        }
    });





});



define('/HtmlTree/Main/HtmlLink/Content/Data', function (require, module, exports) {




    return {
        get(node) {
            let { data, } = node;
            let { content, file, } = data.link;


            return { file, content, };

        },
    };

});



define.panel('/HtmlTree/Main/HtmlLink/Content/Header', function (require, module, panel) {

    const File = require('File');


    let meta = {
        file: '',
    };

    panel.on('init', function () {
       
        panel.$on('click', {
            '[data-cmd="file"]': function (event) {
                panel.fire('file', [meta.file]);
            },
        });
    });



    /**
    * 渲染。
    */
    panel.on('render', function (file) {
        let icon = File.getIcon(file);
        
        meta.file = file;

        panel.fill({
            'icon': icon.html,
            'file': file,
        });
       
       
    });


    return {

    };

});



define.panel('/HtmlTree/Main/HtmlLink/Content/MarkDoc', function (require, module, panel) {
    const MarkDoc = require('MarkDoc');
    const $ = require('$');

    let markdoc = null;


    panel.on('init', function () {
        markdoc = new MarkDoc({
            'container': panel.$,
        });
        
       
    });



    /**
    * 渲染。
    */
    panel.on('render', function (content) {

        markdoc.render({
            'content': content,
            'language': 'html',
            'baseUrl': '',
            'code': {
                'format': true,
            },
        });

        
       
    });


    return {
        highlight(beginNo, endNo) {
            //高亮行号。
            let lis = [];

            markdoc.$.find(`ul.line-numbers>li`).each(function (index) {
                let li = this;

                if (beginNo <= index && index <= endNo) {
                    $(li).addClass('on');
                    lis.push(li);
                }
            });

            //滚动到可视范围。
            if (lis.length > 0) {
                setTimeout(() => {
                    lis[0].scrollIntoViewIfNeeded();
                }, 200);
            }

        },
    };

});



define.panel('/HtmlTree/Main/HtmlLink/Content', function (require, module, panel) {
    const Data = module.require('Data');
    const Header = module.require('Header');
    const MarkDoc = module.require('MarkDoc');



    panel.on('init', function () {
       
        Header.on({
            'file': function (file) {
                panel.fire('file', [file]);
            },
        });
       
    });



    /**
    * 渲染。
    */
    panel.on('render', function (node) {
        let { file, content, } = Data.get(node);
        
        Header.render(file);
        MarkDoc.render(content);
       
       
    });


    return {

    };

});



define('/HtmlTree/Main/HtmlLink/FileInfo/API', function (require, module, exports) {
    const Emitter = require('@definejs/emitter');
    const Loading = require('@definejs/loading');
    const API = require('API');

    let emitter = new Emitter();

    let loading = new Loading({
        mask: 0,
    });




    return {
        on: emitter.on.bind(emitter),

        /**
        * 读取。
        */
        read(file) {
            let api = new API('FileSystem.read', {
                // proxy: '.json',
            });

            api.on({
                'request': function () {
                    loading.show('加载中...');
                },

                'response': function () {
                    loading.hide();
                },

                'success': function (file$item, json, xhr) {
                    let item = file$item[file];

                    emitter.fire('success', 'read', [{ ...item, file, }]);
                },

                'fail': function (code, msg, json, xhr) {
                    definejs.alert('获取模块列表失败: {0}', msg);
                },

                'error': function (code, msg, json, xhr) {
                    definejs.alert('获取模块列表错误: 网络繁忙，请稍候再试');
                },
            });



            api.post({
                files: [file],
                content: true,
                info: true,
            });

        },



    };


});


define.panel('/HtmlTree/Main/HtmlLink/FileInfo', function (require, module, panel) {
    const $Date = require('@definejs/date');
    const File = require('File');
    const API = module.require('API');


    panel.on('init', function () {
        panel.$on('click', {
            '[data-cmd="file"]': function (event) {
                let file = this.innerText;
                panel.fire('file', [file]);
            },
        });

        API.on('success', {
            'read': function (data) {
                let { content, stat, md5, file, } = data;
                let lines = content.split('\n');
                let { names, dir, name, ext, isImage, icon, } = File.getInfo(file);
                let size = File.getSize(stat.size);
                let birthtime = $Date.format(stat.birthtimeMs, 'yyyy-MM-dd HH:mm:ss');
                let mtime = $Date.format(stat.mtimeMs, 'yyyy-MM-dd HH:mm:ss');


                panel.fill({
                    name,
                    file,
                    dir,
                    ext,
                    md5,
                    birthtime,
                    mtime,

                    'type': `${ext} 文件`,
                    'lines': lines.length,
                    'sizeValue': size.value,
                    'sizeDesc': size.desc,
                });
            },
        });

    });




    panel.on('render', function (item) {
        let { file, } = item.data;

        API.read(file);

   


    });





});



define('/HtmlTree/Main/HtmlLink/Rel/Data', function (require, module, exports) {




    return {
        get(node) {
            let { parent, } = node;
            let { data, } = parent;

            if (data.link) {
                let link = parent.data.link;
                let no = node.data.no;

                return {
                    'file': link.file,
                    'content': link.content,
                    'beginNo': no,
                    'endNo': no,
                };
            }

            if (data.block) {
                let master = parent.parent.data;

                return {
                    'file': master.file,
                    'content': master.content,
                    'beginNo': data.begin,
                    'endNo': data.end,
                };
            }


            if (data.type == 'MasterPage') {
                let master = parent.data;
                let no = node.data.no;

                return {
                    'file': master.file,
                    'content': master.content,
                    'beginNo': no,
                    'endNo': no,
                };
            }


            throw new Error('无法识别的 node 节点。');
        },
    };

});



define.panel('/HtmlTree/Main/HtmlLink/Rel/Header', function (require, module, panel) {

    const File = require('File');


    let meta = {
        file: '',
    };

    panel.on('init', function () {
       
        panel.$on('click', {
            '[data-cmd="file"]': function (event) {
                panel.fire('file', [meta.file]);
            },
        });
    });



    /**
    * 渲染。
    */
    panel.on('render', function (file) {
        let icon = File.getIcon(file);
        
        meta.file = file;

        panel.fill({
            'icon': icon.html,
            'file': file,
        });
       
       
    });


    return {

    };

});



define.panel('/HtmlTree/Main/HtmlLink/Rel/MarkDoc', function (require, module, panel) {
    const MarkDoc = require('MarkDoc');
    const $ = require('$');

    let markdoc = null;


    panel.on('init', function () {
        markdoc = new MarkDoc({
            'container': panel.$,
        });
        
       
    });



    /**
    * 渲染。
    */
    panel.on('render', function (content) {

        markdoc.render({
            'content': content,
            'language': 'html',
            'baseUrl': '',
            'code': {
                'format': true,
            },
        });

        
       
    });


    return {
        highlight(beginNo, endNo) {
            //高亮行号。

            let list = markdoc.$.find(`ul.line-numbers>li`).toArray();
            
            list = list.slice(beginNo, endNo + 1);

            list.forEach((li) => {
                $(li).addClass('on');
            });

            //滚动到可视范围。
            setTimeout(() => {
                list[0].scrollIntoViewIfNeeded();
            }, 200);

        },
    };

});



define.panel('/HtmlTree/Main/HtmlLink/Rel', function (require, module, panel) {
    const Data = module.require('Data');
    const Header = module.require('Header');
    const MarkDoc = module.require('MarkDoc');



    panel.on('init', function () {
       
        Header.on({
            'file': function (file) {
                panel.fire('file', [file]);
            },
        });
       
    });



    /**
    * 渲染。
    */
    panel.on('render', function (node) {
        let { file, content, beginNo, endNo, } = Data.get(node);
        
        Header.render(file);
        MarkDoc.render(content);
        MarkDoc.highlight(beginNo, endNo);
       
       
    });


    return {

    };

});



define.panel('/HtmlTree/Main/HtmlLink/Render', function (require, module, panel) {
    const MarkDoc = require('MarkDoc');

    let markdoc = null;


    panel.on('init', function () {
        markdoc = new MarkDoc({
            'container': panel.$,
        });
    });



    /**
    * 渲染。
    */
    panel.on('render', function (node) {
        let content = node.data.link.render;
        let tabs = node.data.tabs;

        if (tabs > 0) {
            let lines = content.split('\n').map((line) => {
                return line.slice(tabs);
            });

            content = lines.join('\n');
        }

        
        markdoc.render({
            'content': content,
            'language': 'html',
            'baseUrl': '',
            'code': {
                'format': true,
            },
        });


        
    });


    return {

    };

});



define.panel('/HtmlTree/Main/HtmlLink/Tabs', function (require, module, panel) {
    const Tabs = require('Tabs');

    let allList = [
        { name: '基本信息', cmd: 'base', icon: 'fas fa-circle-info', },
        { name: '引用原文', cmd: 'rel', icon: 'fas fa-quote-left', },
        { name: '渲染内容', cmd: 'render', icon: 'fas fa-code', },
        { name: '文件内容', cmd: 'content', icon: 'fas fa-file-lines', },
        { name: '文件信息', cmd: 'file', icon: 'fas fa-file', },

       
    ];

    // let allList = [
    //     { name: '基本', cmd: 'base', },
    //     { name: '引', cmd: 'rel', },
    //     { name: '渲染内', cmd: 'render', },
    //     { name: '文件内容', cmd: 'content', },
    //     { name: '文件信息', cmd: 'file', },
    // ];


    let tabs = null;

    let meta = {
        list: [],
        cmd$module: null,
    };


    panel.on('init', function () {
        tabs = new Tabs({
            container: panel.$.get(0),
            storage: module.id,
        });


        tabs.on('change', function (item, index) {
            let { cmd, } = item;
            let { cmd$module, } = meta;

            if (cmd$module) {
                Object.keys(cmd$module).forEach((key) => {
                    let M = cmd$module[key];

                    if (key == cmd) {
                        panel.fire('change', [M]);
                    }
                    else {
                        M.hide();
                    }
                });
            }
            
            //后备方案。
            panel.fire('cmd', cmd, []);
        });

       
    });

    /**
    * 渲染。
    */
    panel.on('render', function (isRoot) {
        meta.list = allList;

        if (isRoot) {
            meta.list = meta.list.filter((item) => {
                return item.root;
            });
        }

        tabs.render(meta.list);
        tabs.active();

    });

    return {
        active(cmd) {
            let index = meta.list.findIndex((item) => {
                return item.cmd == cmd;
            });

            tabs.active(index);
        },

        map(cmd$module) {
            meta.cmd$module = cmd$module;
        },
    };


});

define.panel('/HtmlTree/Main/HtmlLink', function (require, module, panel) {
    const Tabs = module.require('Tabs');
    const Content = module.require('Content');
    const FileInfo = module.require('FileInfo');
    const BaseInfo = module.require('BaseInfo');
    const Rel = module.require('Rel');
    const Render = module.require('Render');


    let meta = {
        item: null,
    };

    panel.on('init', function () {

        Tabs.map({
            'base': BaseInfo,
            'file': FileInfo,
            'content': Content,
            'rel': Rel,
            'render': Render,
        });

        Tabs.on({
            'change': function (M) {
                M.render(meta.item);
            },
        });



        [FileInfo, BaseInfo, Rel, Content, ].forEach((M) => {
            M.on({
                'file': function (file) {
                    panel.fire('file', [file]);
                },
                'id': function (id) {
                    panel.fire('id', [id]);
                },
            });
        });

        BaseInfo.on({
            'rel': function () {
                Tabs.active('rel');
            },
        });



    });


    /**
    * 渲染内容。
    */
    panel.on('render', function (item) {
        meta.item = item;

        Tabs.render();

    });




    return {
        
    };

});



define.panel('/HtmlTree/Main/JsLink/BaseInfo/Base', function (require, module, panel) {
    const MarkDoc = require('MarkDoc');

    let markdoc = null;


    let meta = {
        node: null,
        dir: '',
    };







    panel.on('init', function () {

        function getHtml(html) {
            markdoc = markdoc || new MarkDoc({
                'container': document.createElement('div'),
            });

            markdoc.render({
                'content': html,
                'language': 'html',
                'code': {
                    numbers: false,
                    language: false,
                },
            });

            html = markdoc.$.html();
            return html;
        }

        

        panel.template({
            '': function (node) {
                let name = node.data.html ? 'static' : 'block';
                let html = this.fill(name, node);
                return html;
            },

            'static': function (node) {
                let { data, parent, } = node;
                let { file, } = data;
                let dir = file.split('/').slice(0, -1).join('/') + '/';

                let html = getHtml(data.html);

                return {
                    'type': data.link.type,
                    'href': data.href,
                    'file': file,
                    'tabs': data.tabs,
                    'no': data.no + 1,
                    'dir': dir,
                    'rel': html,
                    'parent': `${parent.cid} - ${parent.name}`,
                };
            },

            'block': function (node) {
                let { data, parent, } = node;
                let { file, } = data;
                let dir = file.split('/').slice(0, -1).join('/') + '/';


                return {
                    'type': data.link.type,
                    'file': file,
                    'dir': dir,
                    'parent': `${parent.cid} - ${parent.name}`,
                };
            },

        });
       

        panel.$on('click', {

            '[data-cmd="parent"]': function (event) {
                let id = meta.node.parent.id;
                panel.fire('id', [id]);
            },

            '[data-cmd="file"]': function (event) {
                let file = this.innerText;

                panel.fire('file', [file]);
            },

            

            '[data-cmd="rel"]': function (event) {
                panel.fire('rel');
            },
        });




    });




    panel.on('render', function (node) {
        console.log({node})
        meta.node = node;
        panel.fill(node);

    });

  




});



define.panel('/HtmlTree/Main/JsLink/BaseInfo', function (require, module, panel) {
    const Base = module.require('Base');


    panel.on('init', function () {
        Base.on({
            'rel': function () {
                panel.fire('rel');
            },
            'file': function (file) {
                panel.fire('file', [file]);
            },
            'id': function (id) {
                panel.fire('id', [id]);
            },
        });

    });




    panel.on('render', function (item) {
        Base.render(item);
        
    });





});



define('/HtmlTree/Main/JsLink/Compile/API', function (require, module, exports) {
    const Emitter = require('@definejs/emitter');
    const Loading = require('@definejs/loading');
    const API = require('API');


    let emitter = new Emitter();

    let loading = new Loading({
        mask: 0,
    });


    return {
        on: emitter.on.bind(emitter),

        /**
        * 编译。
        */
        compile: function (opt) {
            let api = new API('Less.compile', {
                // proxy: '.json',
            });


            api.on({
                'request': function () {
                    loading.show('编译中...');
                },

                'response': function () {
                    loading.hide();
                },

                'success': function (data, json, xhr) {
                    emitter.fire('success', 'compile', [data]);
                },

                'fail': function (code, msg, json, xhr) {
                    definejs.alert('编译 less 失败: {0}', msg);
                },

                'error': function (code, msg, json, xhr) {
                    definejs.alert('编译 less 错误: 网络繁忙，请稍候再试');
                },
            });


            api.post({
                'file': opt.file,
                'dest': opt.dest,
                'minify': false,
            });

           

        },

       

    };


});


define.panel('/HtmlTree/Main/JsLink/Compile/Header', function (require, module, panel) {

    const File = require('File');


    let meta = {
        file: '',
    };

    panel.on('init', function () {
       
        panel.$on('click', {
            '[data-cmd="file"]': function (event) {
                panel.fire('file', [meta.file]);
            },
        });
    });



    /**
    * 渲染。
    */
    panel.on('render', function (file) {
        let icon = File.getIcon(file);
        
        meta.file = file;

        panel.fill({
            'icon': icon.html,
            'file': file,
        });
       
       
    });


    return {

    };

});



define.panel('/HtmlTree/Main/JsLink/Compile/MarkDoc', function (require, module, panel) {
    const MarkDoc = require('MarkDoc');

    let markdoc = null;


    panel.on('init', function () {
        markdoc = new MarkDoc({
            'container': panel.$,
        });
        
       
    });



    /**
    * 渲染。
    */
    panel.on('render', function (css) {

        markdoc.render({
            'content': css,
            'language': 'css',
        });

        
       
    });


    return {
        
    };

});



define.panel('/HtmlTree/Main/JsLink/Compile', function (require, module, panel) {
    const API = module.require('API');
    const Header = module.require('Header');
    const MarkDoc = module.require('MarkDoc');



    panel.on('init', function () {
       
        Header.on({
            'file': function (file) {
                panel.fire('file', [file]);
            },
        });
       

        API.on('success', {
            'compile': function (data) {
                MarkDoc.render(data.css);
            },
        });
    });



    /**
    * 渲染。
    */
    panel.on('render', function (node) {
        let { file, dest, } = node.data;

        Header.render(dest.file);

        API.compile({
            'file': file,
            'dest': dest.file,
        });
       
       
    });


    return {

    };

});



define('/HtmlTree/Main/JsLink/Content/API', function (require, module, exports) {
    const Emitter = require('@definejs/emitter');
    const Loading = require('@definejs/loading');
    const API = require('API');

    let emitter = new Emitter();

    let loading = new Loading({
        mask: 0,
    });


    return {
        on: emitter.on.bind(emitter),

        /**
        * 读取。
        */
        read(file) {
            let api = new API('FileSystem.read', {
                // proxy: '.json',
            });

            api.on({
                'request': function () {
                    loading.show('加载中...');
                },

                'response': function () {
                    loading.hide();
                },

                'success': function (file$item, json, xhr) {
                    let { content, } = file$item[file];
                    emitter.fire('success', 'read', [content]);
                },

                'fail': function (code, msg, json, xhr) {
                    definejs.alert('读取文件失败: {0}', msg);
                },

                'error': function (code, msg, json, xhr) {
                    definejs.alert('读取文件错误: 网络繁忙，请稍候再试');
                },
            });



            api.post({
                files: [file],
                content: true,
                info: false,
            });

        },

       

    };


});


define.panel('/HtmlTree/Main/JsLink/Content/Header', function (require, module, panel) {

    const File = require('File');


    let meta = {
        file: '',
    };

    panel.on('init', function () {
       
        panel.$on('click', {
            '[data-cmd="file"]': function (event) {
                panel.fire('file', [meta.file]);
            },
        });
    });



    /**
    * 渲染。
    */
    panel.on('render', function (file) {
        let icon = File.getIcon(file);
        
        meta.file = file;

        panel.fill({
            'icon': icon.html,
            'file': file,
        });
       
       
    });


    return {

    };

});



define.panel('/HtmlTree/Main/JsLink/Content/MarkDoc', function (require, module, panel) {
    const MarkDoc = require('MarkDoc');
    
    const $ = require('$');

    let markdoc = null;


    panel.on('init', function () {
        markdoc = new MarkDoc({
            'container': panel.$,
        });
        
       
    });



    /**
    * 渲染。
    */
    panel.on('render', function ({ content, file, }) {
        let ext = file.split('.').slice(-1)[0];

        markdoc.render({
            'content': content,
            'language': ext,
            'baseUrl': '',
            'code': {
                'format': true,
            },
        });

        
       
    });


    return {
        highlight(beginNo, endNo) {
            //高亮行号。
            let lis = [];

            markdoc.$.find(`ul.line-numbers>li`).each(function (index) {
                let li = this;

                if (beginNo <= index && index <= endNo) {
                    $(li).addClass('on');
                    lis.push(li);
                }
            });

            //滚动到可视范围。
            if (lis.length > 0) {
                setTimeout(() => {
                    lis[0].scrollIntoViewIfNeeded();
                }, 200);
            }

        },
    };

});



define.panel('/HtmlTree/Main/JsLink/Content', function (require, module, panel) {
    const File = require('File');
    const API = module.require('API');
    const Header = module.require('Header');
    const MarkDoc = module.require('MarkDoc');

    let meta = {
        file: '',
    };


    panel.on('init', function () {
       
        Header.on({
            'file': function (file) {
                panel.fire('file', [file]);
            },
        });
       

        API.on('success', {
            'read': function (content) {
                let { file, } = meta;
                MarkDoc.render({ file, content, });

            },
        });
    });



    /**
    * 渲染。
    */
    panel.on('render', function (node) {
        let { file, } = node.data;

        if (file == meta.file) {
            return;
        }
        
        meta.file = file;
        Header.render(file);
        API.read(file);
       
       
    });


    return {

    };

});



define('/HtmlTree/Main/JsLink/FileInfo/API', function (require, module, exports) {
    const Emitter = require('@definejs/emitter');
    const Loading = require('@definejs/loading');
    const API = require('API');

    let emitter = new Emitter();

    let loading = new Loading({
        mask: 0,
    });




    return {
        on: emitter.on.bind(emitter),

        /**
        * 读取。
        */
        read(file) {
            let api = new API('FileSystem.read', {
                // proxy: '.json',
            });

            api.on({
                'request': function () {
                    loading.show('加载中...');
                },

                'response': function () {
                    loading.hide();
                },

                'success': function (file$item, json, xhr) {
                    let item = file$item[file];

                    emitter.fire('success', 'read', [{ ...item, file, }]);
                },

                'fail': function (code, msg, json, xhr) {
                    definejs.alert('获取模块列表失败: {0}', msg);
                },

                'error': function (code, msg, json, xhr) {
                    definejs.alert('获取模块列表错误: 网络繁忙，请稍候再试');
                },
            });



            api.post({
                files: [file],
                content: true,
                info: true,
            });

        },



    };


});


define.panel('/HtmlTree/Main/JsLink/FileInfo', function (require, module, panel) {
    const $Date = require('@definejs/date');
    const File = require('File');
    const API = module.require('API');


    panel.on('init', function () {
        panel.$on('click', {
            '[data-cmd="file"]': function (event) {
                let file = this.innerText;
                panel.fire('file', [file]);
            },
        });

        API.on('success', {
            'read': function (data) {
                let { content, stat, md5, file, } = data;
                let lines = content.split('\n');
                let { names, dir, name, ext, isImage, icon, } = File.getInfo(file);
                let size = File.getSize(stat.size);
                let birthtime = $Date.format(stat.birthtimeMs, 'yyyy-MM-dd HH:mm:ss');
                let mtime = $Date.format(stat.mtimeMs, 'yyyy-MM-dd HH:mm:ss');


                panel.fill({
                    name,
                    file,
                    dir,
                    ext,
                    md5,
                    birthtime,
                    mtime,

                    'type': `${ext} 文件`,
                    'lines': lines.length,
                    'sizeValue': size.value,
                    'sizeDesc': size.desc,
                });
            },
        });

    });




    panel.on('render', function (item) {
        let { file, } = item.data;

        API.read(file);




    });




});



define('/HtmlTree/Main/JsLink/Rel/Data', function (require, module, exports) {




    return {
        get(node) {
            let { parent, } = node;
            let { data, } = parent;

            if (data.link) {
                let link = parent.data.link;
                let no = node.data.no;

                return {
                    'file': link.file,
                    'content': link.content,
                    'beginNo': no,
                    'endNo': no,
                };
            }

            if (data.block) {
                let master = parent.parent.data;

                return {
                    'file': master.file,
                    'content': master.content,
                    'beginNo': data.begin,
                    'endNo': data.end,
                };
            }


            if (data.type == 'MasterPage') {
                let master = parent.data;
                let no = node.data.no;

                return {
                    'file': master.file,
                    'content': master.content,
                    'beginNo': no,
                    'endNo': no,
                };
            }


            throw new Error('无法识别的 node 节点。');
        },
    };

});



define.panel('/HtmlTree/Main/JsLink/Rel/Header', function (require, module, panel) {

    const File = require('File');


    let meta = {
        file: '',
    };

    panel.on('init', function () {
       
        panel.$on('click', {
            '[data-cmd="file"]': function (event) {
                panel.fire('file', [meta.file]);
            },
        });
    });



    /**
    * 渲染。
    */
    panel.on('render', function (file) {
        let icon = File.getIcon(file);
        
        meta.file = file;

        panel.fill({
            'icon': icon.html,
            'file': file,
        });
       
       
    });


    return {

    };

});



define.panel('/HtmlTree/Main/JsLink/Rel/MarkDoc', function (require, module, panel) {
    const MarkDoc = require('MarkDoc');
    const $ = require('$');

    let markdoc = null;


    panel.on('init', function () {
        markdoc = new MarkDoc({
            'container': panel.$,
        });
        
       
    });



    /**
    * 渲染。
    */
    panel.on('render', function (content) {

        markdoc.render({
            'content': content,
            'language': 'html',
            'baseUrl': '',
            'code': {
                'format': true,
            },
        });

        
       
    });


    return {
        highlight(beginNo, endNo) {
            //高亮行号。

            let list = markdoc.$.find(`ul.line-numbers>li`).toArray();
            
            list = list.slice(beginNo, endNo + 1);

            list.forEach((li) => {
                $(li).addClass('on');
            });

            //滚动到可视范围。
            setTimeout(() => {
                list[0].scrollIntoViewIfNeeded();
            }, 200);

        },
    };

});



define.panel('/HtmlTree/Main/JsLink/Rel', function (require, module, panel) {
    const Data = module.require('Data');
    const Header = module.require('Header');
    const MarkDoc = module.require('MarkDoc');



    panel.on('init', function () {
       
        Header.on({
            'file': function (file) {
                panel.fire('file', [file]);
            },
        });
       
    });



    /**
    * 渲染。
    */
    panel.on('render', function (node) {
        let { file, content, beginNo, endNo, } = Data.get(node);
        
        Header.render(file);
        MarkDoc.render(content);
        MarkDoc.highlight(beginNo, endNo);
       
       
    });


    return {

    };

});



define.panel('/HtmlTree/Main/JsLink/Render', function (require, module, panel) {
    const MarkDoc = require('MarkDoc');

    let markdoc = null;


    panel.on('init', function () {
        markdoc = new MarkDoc({
            'container': panel.$,
        });
    });



    /**
    * 渲染。
    */
    panel.on('render', function (node) {
        let content = node.data.link.render;
        let tabs = node.data.tabs;

        //此时可能是 block 里的动态 link。
        if (tabs === undefined) {
            tabs = node.parent.data.tabs;
        }


        if (tabs > 0) {
            let lines = content.split('\n').map((line) => {
                return line.slice(tabs);
            });

            content = lines.join('\n');
        }

        
        markdoc.render({
            'content': content,
            'language': 'html',
            'baseUrl': '',
            'code': {
                'format': true,
            },
        });


        
    });


    return {

    };

});



define.panel('/HtmlTree/Main/JsLink/Tabs', function (require, module, panel) {
    const Tabs = require('Tabs');

    let allList = [
        { name: '基本信息', cmd: 'base', icon: 'fas fa-circle-info', },
        { name: '引用原文', cmd: 'rel', icon: 'fas fa-quote-left', },
        { name: '渲染内容', cmd: 'render', icon: 'fas fa-code', },
        { name: '文件信息', cmd: 'file', icon: 'fas fa-file', },
        { name: '文件内容', cmd: 'content', icon: 'fas fa-file-lines', },
        { name: '编译内容', cmd: 'compile', icon: 'fab fa-less', },
        


    ];


    let tabs = null;

    let meta = {
        cmd$module: null,
        list: [],
    };


    panel.on('init', function () {
        tabs = new Tabs({
            container: panel.$.get(0),
            storage: module.id,
        });


        tabs.on('change', function (item, index) {
            let { cmd, } = item;
            let { cmd$module, } = meta;

            if (cmd$module) {
                Object.keys(cmd$module).forEach((key) => {
                    let M = cmd$module[key];

                    if (key == cmd) {
                        panel.fire('change', [M]);
                    }
                    else {
                        M.hide();
                    }
                });
            }
            
            //后备方案。
            panel.fire('cmd', cmd, []);
        });

       
    });

    /**
    * 渲染。
    */
    panel.on('render', function (isLess) {

        meta.list = allList;

        //`compile` 页签针对 less 模块可见。
        if (!isLess) {
            meta.list = meta.list.filter((item) => {
                return item.cmd != 'compile';
            });
        }

        tabs.render(meta.list);
        tabs.active();

    });

    return {
        active(cmd) {
            let index = meta.list.findIndex((item) => {
                return item.cmd == cmd;
            });

            tabs.active(index);
        },

        map(cmd$module) {
            meta.cmd$module = cmd$module;
        },
    };


});

define.panel('/HtmlTree/Main/JsLink', function (require, module, panel) {
    const Tabs = module.require('Tabs');
    const Content = module.require('Content');
    const FileInfo = module.require('FileInfo');
    const BaseInfo = module.require('BaseInfo');
    const Rel = module.require('Rel');
    const Compile = module.require('Compile');
    const Render = module.require('Render');

    let meta = {
        item: null,
    };

    panel.on('init', function () {

        Tabs.map({
            'base': BaseInfo,
            'file': FileInfo,
            'content': Content,
            'rel': Rel,
            'compile': Compile,
            'render': Render,
        });

        Tabs.on({
            'change': function (M) {
                M.render(meta.item);
            },
        });



        [FileInfo, BaseInfo, Rel, Content, Compile, ].forEach((M) => {
            M.on({
                'file': function (file) {
                    panel.fire('file', [file]);
                },
                'id': function (id) {
                    panel.fire('id', [id]);
                },
            });
        });

        BaseInfo.on({
            'rel': function () {
                Tabs.active('rel');
            },
        });



    });


    /**
    * 渲染内容。
    */
    panel.on('render', function (item) {
        let isLess = item.data.link.type == 'LessLink';

        meta.item = item;
        Tabs.render(isLess);

    });




    return {
        
    };

});


define('/HtmlTree/Main/Nav/Data', function (require, module, exports) {

    
    function getIcon(item) { 
        let { fileIcon, dirIcon, } = item;
        if (fileIcon) {
            return fileIcon;
        }

        if (dirIcon) {
            return dirIcon.close;
        }

        return `FileIcon file html fab fa-html5`;
    }

    
    return {
        make(item) {
            let list = [item, ...item.parents].reverse();

            let names = list.map((item) => {
                return item.name;
            });


            let path = names.join('>');

            let icon = { html: `<i class="${getIcon(item)}"></i>`, };

            return {
                list,
                names,
                path,
                icon,
            };
        },
    }



});


define.panel('/HtmlTree/Main/Nav', function (require, module, panel) {
    const MenuNav = require('MenuNav');
    const Data = module.require('Data');


    let nav = null;



    let meta = {
        list: [],
        item: null,
        stat: null,
    };


    panel.on('init', function () {

        nav = new MenuNav({
            'container': panel.$,
        });

        nav.on({
            'item': function (names, index) {
                let item = meta.list[index];
                panel.fire('item', [item]);
            },
        });





    });


    /**
    * 渲染内容。
    *   opt = {
    *       
    *   };
    */
    panel.on('render', function (item) {
        
        let { list, names, path, icon, } = Data.make(item);

       
        meta.list = list;


        nav.render({ names, path, icon, });
    });




});


define.panel('/HtmlTree/Main', function (require, module, panel) {
    const Nav = module.require('Nav');
    const JsLink = module.require('JsLink');        //CssLink 和 LessLink 共用 JsLink。
    const HtmlLink = module.require('HtmlLink');
    const HtmlBlock = module.require('HtmlBlock');  //LessBlock 和 JsBlock 共用 HtmlBlock。
    const MasterPage = module.require('MasterPage');



    panel.on('init', function () {
        Nav.on({
            'item': function (item) {
                panel.fire('id', [item.id]);
            },
        });

        [JsLink, HtmlLink, HtmlBlock,].forEach((M) => {
            M.on({
                'file': function (file) {
                    panel.fire('file', [file]);
                },
                'id': function (id) {
                    panel.fire('id', [id]);
                },
            });
        });

        


    });


    /**
    * 渲染内容。
    */
    panel.on('render', function (item) {
        Nav.render(item);


        let { link, block, } = item.data;

        if (link) {
            if (link.type == 'HtmlLink') {
                JsLink.hide();
                HtmlLink.render(item);
            }
            else { // `CssLink`、`JsLink`、`LessLink`。
                JsLink.render(item);
                HtmlLink.hide();
            }

            HtmlBlock.hide();
        }
        else if (block) {
            JsLink.hide();
            HtmlLink.hide();
            HtmlBlock.render(item);
        }
        else {
            JsLink.hide();
            HtmlLink.hide();
            HtmlBlock.hide();
        }

    });




    return {
        resize(...args) {
            let w = args.reduce(function (sum, value) {
                return sum + value;
            }, 0);


            let calc = 'calc(100% - ' + w + 'px)';

            panel.$.css({
                'width': calc,
            });

        },
    };

});



define('/HtmlTree/Tree/Data', function (require, module, exports) {
    const File = require('File');



 
    function getNode(item, dir) {
        let { link, } = item;
        let list = link.list;
        let name = item.href;
        let icon = File.getIcon(item.file);


        if (!name) {
            name = item.file;

            if (dir && name.startsWith(dir)) {
                name = name.slice(dir.length);
            }
        }

        //只有 HtmlLink 有 list。
        if (list) {
            list = list.map((item) => {
                return getNode(item);
            });
        }

        return {
            'name': name,
            'id': link.id,
            'open': false,
            'fileIcon': icon.className,
            'data': item,
            'list': list,
        };

    }


    function getLinks(list) {
        list = list.map((item) => {
            let node = getNode(item);
            return node;
        });

        return list;
    }


    function getBlocks(list, dirIcon) {
        list = list.map((item) => {
            let { block, } = item;

            let list = block.list.map((item) => {
                return getNode(item, block.dir);
            });

            return {
                'name': block.id,
                'id': block.id,
                'open': false,
                'dirIcon': dirIcon,
                'data': item,
                'list': list,
            };
        });

        return list;
    }



    return {
        make(json) {

            let masters = json.masterBlock.list.map(({ master, }) => {
                let cssLinks = getLinks(master.cssLinks);
                let lessLinks = getLinks(master.lessLinks);
                let htmlLinks = getLinks(master.htmlLinks);
                let jsLinks = getLinks(master.jsLinks);

                let lessBlocks = getBlocks(master.lessBlocks, {
                    open: 'less-block far fa-list-alt',
                    close: 'less-block fas fa-list-alt',
                });

                let htmlBlocks = getBlocks(master.htmlBlocks, {
                    open: 'html-block far fa-list-alt',
                    close: 'html-block fas fa-list-alt',
                });

                let jsBlocks = getBlocks(master.jsBlocks, {
                    open: 'js-block far fa-list-alt',
                    close: 'js-block fas fa-list-alt',
                });




                return {
                    'name': master.file,
                    'id': master.id,
                    'open': true,
                    'data': master,

                    'list': [
                        ...cssLinks,
                        ...lessLinks,
                        ...lessBlocks,
                        ...htmlLinks,
                        ...htmlBlocks,
                        ...jsLinks,
                        ...jsBlocks,
                    ],
                };
            });


            return masters;
        },
    };


});


define.panel('/HtmlTree/Tree', function (require, module, panel) {
    const SidebarTree = require('SidebarTree');
    const Data = module.require('Data');

    let tree = null;

    panel.on('init', function () {

        tree = new SidebarTree({
            'container': panel.$,
            'width': panel.$.width(),
            // 'fileIcon': 'fas fa-file-alt',
            'dirIcon': {
                close: 'fas fa-file-alt',
                open: 'far fa-file-alt',
            },
        });

        tree.on({
            'item': function (...args) {

                panel.fire('item', args);
            },
            'dir': function (...args) {
                panel.fire('dir', args);
            },
            'resize': function () {
                let w = tree.$.outerWidth();

                panel.$.width(w);
                panel.fire('resize', [w]);
            },
            'fill': {
                'name': function (item) {

                    let { name, cid, list, } = item;
                    let text = `${cid} - ${name}`;

                    if (list.length > 0) {
                        text = `${text} <b class="child-count">(${list.length})</b>`
                    }

                    return text;
                },
            },
        });


    });

   


    /**
    * 渲染。
    *   
    */
    panel.on('render', function (json) {
        let list = Data.make(json);

        tree.render(list);
        
    });



    return {
        open: function (id) {
            tree.open(id);
        },
    };


});


define('/HtmlTree/API', function (require, module, exports) {
    const Emitter = require('@definejs/emitter');
    const Loading = require('@definejs/loading');
    const API = require('API');

    const Data = module.require('Data');


    let emitter = new Emitter();

    let loading = new Loading({
        mask: 0,
    });


    return {
        on: emitter.on.bind(emitter),

        /**
        * 获取。
        */
        get() {
            let api = new API('HtmlTree.parse', {
                // proxy: '.json',
            });


            api.on({
                'request': function () {
                    loading.show('加载中...');
                },

                'response': function () {
                    loading.hide();
                },

                'success': function (data, json, xhr) {
                    Data.make(data);
                    emitter.fire('success', 'get', [data]);
                },

                'fail': function (code, msg, json, xhr) {
                    definejs.alert(`获取解析数据失败 ${msg}`);
                },

                'error': function (code, msg, json, xhr) {
                    definejs.alert('获取解析错误: 网络繁忙，请稍候再试');
                },
            });

            api.get({
                usePack: false,
            });

           

        },

       

    };


});

define.view('/HtmlTree', function (require, module, view) {
    const SessionStorage = require('@definejs/session-storage');
    const API = module.require('API');
    const Tree = module.require('Tree');
    const Main = module.require('Main');

    let storage = new SessionStorage(module.id);


    view.on('init', function () {
        

        API.on('success', {
            'get': function (data) {
                let cid = storage.get('cid') || 1;

                Tree.render(data);
                Tree.open(cid);
            },
        });

        Tree.on({
            'item': function (item) {
                storage.set('cid', item.cid); //保存到 storage。
                Main.render(item);
            },
            'resize': function (w) {
                Main.resize(w, 6);
            },
        });

        Main.on({
            'file': function (file) {
                view.fire('file', [file]);
            },
            'id': function (id) {
                Tree.open(id);
            },
        })

        

       
    });


    /**
    * 渲染内容。
    */
    view.on('render', function () {
        
        API.get();

       
    });



});


define.panel('/Log/Filter/Dates', function (require, module, panel) {
    const DropCheckList = require('DropCheckList');


    let chk = null;


    panel.on('init', function () {

        chk = new DropCheckList({
            'container': panel.$,
            'text': '日期',
        });

        chk.on({
            'check': function (list) {
                panel.fire('check', [list]);
            },
        });



    });



    panel.on('render', function (list, item$checked) {

        list = list.map((item) => {

            let checked = item$checked[item];

            return {
                'text': item,
                'checked': checked,
                'value': item,
            };
        });

        chk.render(list);


    });



    return {

    };







});


define.panel('/Log/Filter/Types', function (require, module, panel) {
    const DropCheckList = require('DropCheckList');


    let chk = null;


    panel.on('init', function () {

        chk = new DropCheckList({
            'container': panel.$,
            'text': '类型',
        });

        chk.on({
            'check': function (list) {
                panel.fire('check', [list]);
            },
        });



    });





    panel.on('render', function (list, item$checked) {

        list = list.map((item) => {

            let checked = item$checked[item];

            return {
                'text': item,
                'checked': checked,
                'value': item,
            };
        });

        chk.render(list);


    });




    return {

    };






});


define.panel('/Log/Filter', function (require, module, panel) {
    const Types = module.require('Types');
    const Dates = module.require('Dates');

    let meta = {
        type$checked: {},
        date$checked: {},
    };

    panel.on('init', function () {
        function make(list) {
            let key$checked = {};

            list.forEach((item) => {
                key$checked[item.value] = item.checked;
            });

            return key$checked;
        }
        
        Types.on({
            'check': function (list) {
                meta.type$checked = make(list);

                panel.fire('change', [meta]);
            },
        });

        Dates.on({
            'check': function (list) {
                meta.date$checked = make(list);

                panel.fire('change', [meta]);
            },
        });
  
    });


    


    panel.on('render', function ({ dates, types, }) {
        let type$checked = meta.type$checked = {};
        let date$checked = meta.date$checked = {};


        dates.forEach((date) => { 
            date$checked[date] = true;
        });

        types.forEach((type) => {
            type$checked[type] = true;
        });

        Types.render(types, type$checked);
        Dates.render(dates, date$checked);

        panel.fire('change', [{ type$checked, date$checked, }]);


    });

    

    return {
        
    };






});


define.panel('/Log/Header', function (require, module, panel) {
    const CheckBox = require('CheckBox');


    let chks = [
        { id: 'time', cmd: 'time', checked: true, fireNow: true, text: '时间', },
        { id: 'color', cmd: 'color', checked: true, fireNow: true, text: '彩色', },
        { id: 'highlight', cmd: 'highlight', checked: true, fireNow: true, text: '高亮当前行', },
        { id: 'border', cmd: 'border', checked: false, fireNow: true, text: '边线', },
        { id: 'order', cmd: 'order', checked: false, fireNow: true, text: '序号', },
    ];

    panel.on('init', function () {
        panel.$on('click', {
            '[data-cmd]': function (event) {
                //`reload`、`clear`
                let { cmd, } = event.currentTarget.dataset;
                panel.fire(cmd, []);
            },
        });

        chks = chks.map((item) => {
            let chk = new CheckBox({
                'checked': item.checked,
                'fireNow': item.fireNow,
                'text': item.text,
                'container': panel.$.find(`[data-id="chk-${item.id}"]`),
            });

            chk.on('checked', function (checked) {
                panel.fire('check', [item.cmd, checked]);
            });

            return chk;
        });

  
    });




    panel.on('render', function () {
        chks.forEach((chk) => {
            chk.render();
        });
    });

    return {
        
    };






});


define('/Log/List/Template/Colors', function (require, module, exports) {


    let name$codes = {
        reset: [0, 0],

        bold: [1, 22],
        dim: [2, 22],
        italic: [3, 23],
        underline: [4, 24],
        inverse: [7, 27],
        hidden: [8, 28],
        strikethrough: [9, 29],

        black: [30, 39],
        red: [31, 39],
        green: [32, 39],
        yellow: [33, 39],
        blue: [34, 39],
        magenta: [35, 39],
        cyan: [36, 39],
        white: [37, 39],
        gray: [90, 39],

        brightRed: [91, 39],
        brightGreen: [92, 39],
        brightYellow: [93, 39],
        brightBlue: [94, 39],
        brightMagenta: [95, 39],
        brightCyan: [96, 39],
        brightWhite: [97, 39],

        bgBlack: [40, 49],
        bgRed: [41, 49],
        bgGreen: [42, 49],
        bgYellow: [43, 49],
        bgBlue: [44, 49],
        bgMagenta: [45, 49],
        bgCyan: [46, 49],
        bgWhite: [47, 49],
        bgGray: [100, 49],

        bgBrightRed: [101, 49],
        bgBrightGreen: [102, 49],
        bgBrightYellow: [103, 49],
        bgBrightBlue: [104, 49],
        bgBrightMagenta: [105, 49],
        bgBrightCyan: [106, 49],
        bgBrightWhite: [107, 49],
       

    };




    return {
        render(msg) {
            let html = msg;

            Object.keys(name$codes).forEach(function (name) {
                let codes = name$codes[name];
                let open = `\u001b[${codes[0]}m`;
                let close = `\u001b[${codes[1]}m`;

                html = html.split(open).join(`<span class="colors ${name}">`);
                html = html.split(close).join(`</span>`);
            });


            return html;
        },
    };
});



define('/Log/List/Template/HTML', function (require, module, exports) {


    return {
        render(msg) {

            if (typeof msg != 'string') {
                return '';
            }

            // let reg = /[&'"<>\/\\\-\x00-\x09\x0b-\x0c\x1f\x80-\xff]/g;
            let reg = /[<>]/g;

            msg = msg.replace(reg, function (r) {
                return "&#" + r.charCodeAt(0) + ";"
            });



            msg = msg.split(' ').join('<b class="empty"></b>');
            msg = msg.split('│').join('<b class="linkY">│</b>');
            msg = msg.split('\r\n').join('<br />');
            msg = msg.split('\n').join('<br />');
          
            return msg
        },
    };
});




define('/Log/List/API', function (require, module, exports) {
    const $Date = require('@definejs/date');
    const API = require('API');

    return {

        /**
        * 获取列表。
        */
        get(date, fn) {
            let api = new API('Log.get', {
                // proxy: '.json',
            });

            api.on({
                'success': function (data, json, xhr) {
                    fn && fn(data);
                },

                'fail': function (code, msg, json, xhr) {
                    definejs.alert(`获取日志列表失败: ${msg}`);
                },

                'error': function (code, msg, json, xhr) {
                    definejs.alert('获取日志列表错误: 网络繁忙，请稍候再试');
                },
            });

            api.get({ date, });

        },



    };


});

define('/Log/List/Data', function (require, module, exports) {
    const $Date = require('@definejs/date');


    return exports = {

        parse(stat, filter) {
            let { date$info, } = stat;
            let { date$checked, type$checked, } = filter;

            let groups = [];
            let no = -1;
            let date$group = {};

            Object.entries(date$info).forEach(([date, info]) => {
                if (!date$checked[date]) {
                    return;
                }

                let total = 0;
                let error = 0;

                Object.entries(info.type$count).forEach(([type, count]) => {
                    if (!type$checked[type]) {
                        return;
                    }

                    total += count;

                    if (type == 'error') {
                        error += count;
                    }
                });

                if (total == 0) {
                    return;
                }


                no++;

                let group = {
                    no,
                    date,
                    total,
                    error,
                    filled: false,  //是否已填充。
                    list: [],
                };

                date$group[date] = group;
                groups.push(group);
            });

            

            return { groups, date$group, };

        },

        normalize(list) { 
            list = list.map((item) => {
                let { type, msg, } = item;
                let dt = $Date.format(item.time, 'yyyy-MM-dd HH:mm:ss').split(' ');
                let date = dt[0];
                let time = dt[1];

                return {
                    date, 
                    time,
                    type,
                    msg,
                };
            });

            return list;
        },


        //查找相同时间（精确到秒）的最大 index。
        findMaxIndex(list, index) { 
            index = Number(index);


            let maxIndex = -1;
            let len = list.length;
            let { time, } = list[index];

            for (let i = index + 1; i < len; i++) {
                let item = list[i];

                if (!item || item.time != time) {
                    return maxIndex;
                }
                
                maxIndex = i;
            }

            return maxIndex;
        },


     


      

    };
});



define('/Log/List/Template', function (require, module, exports) {
    const $String = require('@definejs/string');
    const Colors = module.require('Colors');
    const HTML = module.require('HTML');

    let type$icon = {
        input: `<i class="fas fa-terminal"></i>`,
        info: `<i class="fas fa-info-circle"></i>`,
        stdout: ``,
    };

    function getOrder(list, index) {
        let width = list.length.toString().length;
        let order = index + 1;

        order = order.toString();
        order = $String.padLeft(order, width, '0');

        return order;
    }

    return {
        init(panel) {
            let tpl = panel.template();

            tpl.process({
                '': function ({ groups, }) {
                    groups = this.fill('group', groups);
                    return { groups, };
                },

                'group': {
                    '': function (group, no) {
                        let { date, total, error, } = group;

                        return {
                            date,
                            total,
                            no,
                            hasError: error> 0 ? 'has-error': '',
                            items: `<li> loading... </li>`, //展开时再填充。
                        };
                    },

                    'item': {
                        '': function (item, index, info) {
                            let { time, type, msg, } = item;
                            let { list, no, } = info;

                            msg = HTML.render(msg);
                            msg = Colors.render(msg);

                         
                            let icon = type$icon[type] || '';
                            let prev = list[index - 1];
                            let order = getOrder(list, index);

                            time = prev && time == prev.time ? '' : this.fill('time', item);


                            return {
                                'no': no,
                                'index': index,
                                'order': order,
                                'time': time,
                                'sameTime': time ? '' : 'same-time', //time 为空说明时间一样。
                                'type': type,
                                'icon': icon,
                                'msg': msg,
                            };
                        },

                        'time': function (data) {
                            return {
                                'time': data.time,
                            };
                        },
                    },
                },
            });
        },

    };

});



define.panel('/Log/List', function (require, module, panel) {
    const $Date = require('@definejs/date');
    const API = module.require('API');
    const Data = module.require('Data');
    const Template = module.require('Template');

    let meta = {
        data: null,
        filter: null,
        date$group: null,
        groups: [],
    };


    panel.on('init', function () {
        Template.init(panel);



        panel.$on('click', {
            '[data-id="header"]': function (event) {
                let { no, } = this.dataset;
                let group = meta.groups[no];
                let $group = $(this.parentNode);
                let $ul = $group.find(`>ul`);

                $group.toggleClass('hide');

                //已填充，直接展开。
                if (group.filled) {
                    $ul.slideToggle('fast');
                    return;
                }

                //首次填充。
                $ul.slideDown('fast');

                setTimeout(() => {
                    API.get(group.date, function (list) {
                        list = Data.normalize(list);

                        list = list.filter(({ type, }) => {
                            return !!meta.filter.type$checked[type];
                        });
                        
                        console.log({ list });
                        group.list = list;

                        
                        let tpl = panel.template();
                        let info = { list, no, };
                        let html = tpl.fill('group', 'item', list, info);

                        $ul.html(html);
                        group.filled = true;
                    });

                }, 200);

            },

            '[data-cmd="time"]': function (event) {
                let li = this.parentNode;
                let { no, index, } = li.dataset;
                let { list, } = meta.groups[no];
                let $li = $(li);
                let $ul = $(li.parentNode);

                index = Number(index);

                let maxIndex = Data.findMaxIndex(list, index);

                if (maxIndex > -1) {
                    $li.toggleClass('fold-same-time');
                    $ul.find(`>li:lt(${maxIndex + 1}):gt(${index})`).slideToggle('fast');
                }

            },
        });

  
    });





    panel.on('render', function (stat, filter) {
        let { date$group, groups, } = Data.parse(stat, filter);
       
        meta.filter = filter;
        meta.date$group = date$group;
        meta.groups = groups;

        panel.fill({ groups, });

    });

    


    
    return {
        add(list) {
            if (meta.groups.length == 0) {
                panel.fire('reset');
                return;
            }

            list = Data.normalize(list);

            list = list.filter(({ type, }) => {
                return !!meta.filter.type$checked[type];
            });


            list.forEach((item) => {
                let { date, time, type, msg, } = item;
                let group = meta.date$group[date];

                if (!group) {
                   
                    panel.fire('reset');
                    return;
                }
     
                let { list, no, } = group;

                list.push(item);
                group.total++;

                let index = list.length - 1;
                let info = { list, no, };
                let tpl = panel.template();
                let html = tpl.fill('group', 'item', item, index, info);

                let $group = panel.$.find(`>li[data-group="${date}"]`);
                let $ul = $group.find('>ul');
                let $total = $group.find('[data-id="total"]');


                $ul.append(html);
                $total.html(`(${group.total})`);





            });


          
        },


        clear() {
            meta.groups = [];
            panel.$.html('');
        },

        check(key, checked) {
            if (key == 'time') {
                panel.$.toggleClass(`hide-${key}`, !checked);
            }
            else {
                panel.$.toggleClass(`show-${key}`, checked);
            }
        },

        
    };






});



define('/Log/API', function (require, module, exports) {
    const Emitter = require('@definejs/emitter');
    const Loading = require('@definejs/loading');
    const API = require('API');


    let emitter = new Emitter();

    let loading = new Loading({
        mask: 0,
    });



    function onSuccess(stat) { 
        let dates = [];
        let type$count = {};

        Object.entries(stat.date$info).forEach(([date, info]) => {
            dates.push(date);
            Object.assign(type$count, info.type$count);
        });

        let types = Object.keys(type$count);


        dates.sort();
        Object.assign(stat, { types, dates, });

        emitter.fire('success', 'get', [stat]);
    }

    return {
        on: emitter.on.bind(emitter),

        /**
        * 获取统计信息。
        */
        get() {
            let api = new API('Log.stat', {
                // proxy: '.json',
            });

            api.on({
                'request': function () {
                    loading.show('加载中...');
                },

                'response': function () {
                    loading.hide();
                },

                'success': function (stat, json, xhr) {
                    onSuccess(stat);
                },

                'fail': function (code, msg, json, xhr) {
                    definejs.alert('获取日志列表失败: {0}', msg);
                },

                'error': function (code, msg, json, xhr) {
                    definejs.alert('获取日志列表错误: 网络繁忙，请稍候再试');
                },
            });

            api.get();

        },


        clear() {
            let api = new API('Log.clear');

            api.on({
                'request': function () {
                    loading.show('处理中...');
                },

                'response': function () {
                    loading.hide();
                },

                'success': function (stat, json, xhr) {
                    onSuccess(stat);

                },

                'fail': function (code, msg, json, xhr) {
                    definejs.alert(`清空日志失败: ${msg}`);
                },

                'error': function (code, msg, json, xhr) {
                    definejs.alert('清空日志错误: 网络繁忙，请稍候再试');
                },
            });

            api.get();
        },



    };


});


define('/Log/SSE', function (require, module, exports) {
    const Emitter = require('@definejs/emitter');

    let emitter = new Emitter();
    let config = definejs.config('API');
    let sse = null;



    return exports = {


        on: emitter.on.bind(emitter),

        /**
        * 
        */
        open() {
            let url = `${config.url}sse/Log.watch`;


            //先关闭之前的。
            exports.close();

            sse = new EventSource(url);

            sse.addEventListener('open', function (event) {
                // console.log('on-open:', event);
            });

            //这个事件名是后端自定义的。
            sse.addEventListener('reset', function (event) {
                let data = JSON.parse(event.data);
                emitter.fire('reset', [data]);
            });

            //这个事件名是后端自定义的。
            sse.addEventListener('add', function (event) {
                let data = JSON.parse(event.data);
                emitter.fire('add', [data]);
            });


            sse.addEventListener('error', function (event) {
                let { data, } = event;

                //服务器可能已经关闭了，
                //这里也要关闭，否则会不断重发请求到服务器。
                if (data === undefined) {
                    // definejs.alert('服务器可能已经关闭。aaaaaaa');
                    exports.close();
                    return;
                }

                data = JSON.parse(data);
                data.msg = JSON.stringify(JSON.parse(data.msg), null, 4);

                emitter.fire('error', [data]);
            });




            sse.onmessage = function (event) {
                console.log('onmessage', event)
            };



        },


        


        close() {
            if (!sse) {
                return;
            }

            sse.close();
            sse = null;
            return true;
        },


    };


});

define.view('/Log', function (require, module, view) {
    const API = module.require('API');
    const SSE = module.require('SSE');
    const Filter = module.require('Filter');
    const Header = module.require('Header');
    const List = module.require('List');

    let meta = {
        stat: null,

    };










    view.on('init', function () {

        Header.on({
            'check': function (key, checked) {
                List.check(key, checked);
            },

            'reload': function () {
                API.get();
            },
            'clear': function () {
                definejs.confirm('确认要清空服务器端的日志列表？', function () {
                    API.clear();
                });
            },
        });

        Filter.on({
            'change': function (filter) {
                List.render(meta.stat, filter);
            },
        });
        


        List.on({
            'cmd': function (cmd, value) {
                panel.fire('cmd', [cmd, value]);
            },
            'reset': function () { 
                API.get();
            },
        });



        API.on('success', {
            'get': function (stat) {
                meta.stat = stat;

                Header.render();
                Filter.render(stat);
                SSE.open();
            },
        });
       




        SSE.on({
            'reset': function () {
                
            },

            'add': function (list) {
                List.add(list);
            },
        });
  
    });

    

    view.on('render', function () {
        API.get();

    });




});


define('/ModuleTree/API/Data', function (require, module, exports) {
    const $Date = require('@definejs/date');
    const File = require('File');
    const HtmlStat = require('HtmlStat');
    const ModuleStat = require('ModuleStat');


    



    return {
        make({ html, module, }) {

            [ html.file$info, module.file$info, ].forEach((file$info) => {
                Object.entries(file$info).forEach(([file, info]) => {
                    let { stat, } = info;
                    let { names, dir, name, ext, isImage, icon, } = File.getInfo(file);
                    let size = File.getSize(stat.size);

                    let atime = $Date.format(stat.atimeMs, 'yyyy-MM-dd HH:mm:ss');
                    let birthtime = $Date.format(stat.birthtimeMs, 'yyyy-MM-dd HH:mm:ss');
                    let ctime = $Date.format(stat.ctimeMs, 'yyyy-MM-dd HH:mm:ss');
                    let mtime = $Date.format(stat.mtimeMs, 'yyyy-MM-dd HH:mm:ss');


                    //增加几个字段。
                    Object.assign(info, {
                        file,
                        name, 
                        names,
                        icon,
                        ext,
                        dir,
                        size,
                        atime,
                        birthtime,
                        ctime,
                        mtime,
                    });
                });
            });

            

            let htmlStat = HtmlStat.parse(html.file$info);
            let moduleStat = ModuleStat.parse(module.file$info);

            htmlStat = { ...html, ...htmlStat, };
            moduleStat = { ...module, ...moduleStat, };

            return { htmlStat, moduleStat, };


        },
    };
});


define('/ModuleTree/Main/Content/API', function (require, module, exports) {
    const Emitter = require('@definejs/emitter');
    const Loading = require('@definejs/loading');
    const API = require('API');

    let emitter = new Emitter();

    let loading = new Loading({
        mask: 0,
    });




    return {
        on: emitter.on.bind(emitter),

        /**
        * 读取。
        */
        read(files) {
            let api = new API('FileSystem.read', {
                // proxy: '.json',
            });

            api.on({
                'request': function () {
                    loading.show('加载中...');
                },

                'response': function () {
                    loading.hide();
                },

                'success': function (data, json, xhr) {
                    console.log(data);
                    emitter.fire('success', 'read', [data]);
                },

                'fail': function (code, msg, json, xhr) {
                    definejs.alert('获取模块列表失败: {0}', msg);
                },

                'error': function (code, msg, json, xhr) {
                    definejs.alert('获取模块列表错误: 网络繁忙，请稍候再试');
                },
            });



            api.post({
                files,
                content: true,
                info: false,
            });

        },



    };


});


define.panel('/ModuleTree/Main/Content/Header', function (require, module, panel) {

    const File = require('File');


    let meta = {
        file: '',
    };

    panel.on('init', function () {
       
        panel.$on('click', {
            '[data-cmd="file"]': function (event) {
                panel.fire('file', [meta.file]);
            },
        });
    });



    /**
    * 渲染。
    */
    panel.on('render', function (file) {
        let icon = File.getIcon(file);
        
        meta.file = file;

        panel.fill({
            'icon': icon.html,
            'file': file,
        });
       
       
    });


    return {

    };

});



define.panel('/ModuleTree/Main/Content/MarkDoc', function (require, module, panel) {
    const MarkDoc = require('MarkDoc');

    let markdoc = null;

 

    panel.on('init', function () {
        markdoc = new MarkDoc({
            'container': panel.$,
        });

    });



    /**
    * 渲染。
    */
    panel.on('render', function (info) {
        if (!info) {
            markdoc.render({
                'content': '暂无内容',
                'language': '',
            });
            return;
        }

        let { content, file, } = info;
        let ext = file.split('.').slice(-1)[0];


        markdoc.render({
            'content': content,
            'language': ext,
            'baseUrl': '',
            'code': {
                'format': false,
            },
        });


       
    });


    return {
       

    };

});



define.panel('/ModuleTree/Main/Content/Tabs', function (require, module, panel) {
    const Tabs = require('@definejs/tabs');
    const Storage = require('@definejs/local-storage');

    let tabs = null;
    let storage = null;

    let list = [
        { name: 'JS', cmd: 'js', },
        { name: 'HTML', cmd: 'html', },
    ];

    let meta = {
        index: 0,
        list: [ ],
    };


    panel.on('init', function () {
        storage = new Storage(module.id);
        meta.index = storage.get('index') || 0;

        tabs = new Tabs({
            container: panel.$,
            activedClass: 'on',
            eventName: 'click',
            selector: '>li',
            // repeated: true, //这里要允许重复激活相同的项。
        });


        tabs.on('change', function (item, index) {
            meta.index = index;
            item = meta.list[index];
            storage.set('index', index);

            panel.fire(item.cmd);

        });


    });

    /**
    * 渲染。
    */
    panel.on('render', function ({ js, html, }) {
        meta.list = [];

        if (js) {
            meta.list.push(list[0]);
        }

        if (html) {
            meta.list.push(list[1]);
        }

        if (meta.list.length == 1) {
            meta.index = 0;
        }

        tabs.render(meta.list, function (item, index) {

            return {
                'index': index,
                'name': item.name,
            };
        });

        tabs.active(meta.index);

        panel.$.toggleClass('only-one', meta.list.length == 1);

    });


    return {

    };

});


define.panel('/ModuleTree/Main/Content', function (require, module, panel) {
    const Header = module.require('Header');
    const Tabs = module.require('Tabs');
    const MarkDoc = module.require('MarkDoc');
    const API = module.require('API');



    let meta = {
        js: null,
        html: null,
    };

    panel.on('init', function () {
        function render(info) {
            Header.render(info.file);
            MarkDoc.render(info);
        }


        Header.on({
            'file': function (file) {
                panel.fire('file', [file]);
            },
        });

        Tabs.on({
            'js': function () {
                render(meta.js);
            },
            'html': function () {
                render(meta.html);
            },
        });

        MarkDoc.on({
            'render': function (titles) {
                panel.fire('render', [titles]);
            },
        });


        API.on('success', {
            'read': function (file$item) {
                
                let { js, html, } = meta;

                if (js) {
                    js.content = file$item[js.file].content;
                }

                if (html) {
                    html.content = file$item[html.file].content;
                }

                console.log(meta)

                Tabs.render({ js, html, });
            },
        });


    });



    /**
    * 渲染。
    *   options = {
    *       content: '',    //文件内容。
    *       ext: '',        //如 `.json`。
    *       isImage: false, //是否为图片。
    *   };
    */
    panel.on('render', function ({ item, stat, }) {
        meta.item = item;
        meta.stat = stat;


        let { id, file, } = item.data.module;
        let { moduleStat, htmlStat, } = stat;
        let html = htmlStat.id$module[id];
        let files = [file];

        meta.js = { file, };
        meta.html = null;

        if (html) {
            let { file, } = html;

            files.push(file);
            meta.html = { file, };
        }

       

        API.read(files);
    });


    return {


    };
});



define.panel('/ModuleTree/Main/Dependent/Header', function (require, module, panel) {
    

    /**
    * 初始化时触发。
    * 即首次 render 之前触发，且仅触发一次。
    * 适用于创建实例、绑定事件等只需要执行一次的操作。
    */
    panel.on('init', function () {

       
    });




    panel.on('render', function (list) {
        
        panel.fill({
            'total': list.length,
        });
        

    });





});


define('/ModuleTree/Main/Dependent/List/GridView', function (require, module, exports) {
    const $ = require('$');
    const GridView = require('GridView');


    let fields = [
        { caption: '序号', name: 'order', width: 40, class: 'order', },
        { caption: '模块ID', name: 'id', width: 300, class: 'name', sort: true, },
        { caption: '定义方法', name: 'method', width: 110, class: 'file', sort: true, },
        { caption: '级别', name: 'level', width: 49, class: 'number level', sort: true, },
        { caption: '所在文件', name: 'file', width: 565, class: 'file', sort: true, },
        { caption: '所在行号', name: 'no', width: 75, class: 'number', sort: true, },
    ];



    return {

        render({ container, list = [], cmdClick, }) {
            // if (list.length == 0) {
            //     $(container).html('该模块没有被任何模块依赖。');
            //     return;
            // }


            let gridview = new GridView({
                container: container,
                fields: fields,
            });

            gridview.on('process', 'cell', {
                'order': function (cell, { no, }) {
                    return no + 1;
                },

                'id': function (cell) {
                    let { item, } = cell.row;
                    let html = `<a data-cmd="id">${item.id}</a>`;

                    return html;
                },

                'file': function (cell) {
                    let { item, } = cell.row;
                    let html = `<a data-cmd="file">${item.file}</a>`;

                    return html;
                },
                'no': function (cell) { 
                    let { item, } = cell.row;

                    let requires = item.requires.map((item) => {
                        return item.no + 1;
                    });

                    return requires.join(', ');
                },
            });

            gridview.on('click', 'cell', function (cell, { event, }) {
                let { cmd, } = event.target.dataset;

                if (cmd) {
                    event.stopPropagation();
                    cmdClick(cmd, cell);
                }

            });

            gridview.on('sort', {
                'id': function ({ a, b }) {
                    a = a.id.toUpperCase();
                    b = b.id.toUpperCase();
                    return { a, b, };
                },
                'no': function ({ a, b, }) {
                    a = a.requires[0].no;
                    b = b.requires[0].no;
                    return { a, b, };
                },
            });



            gridview.render(list);

            return gridview;
        },
    };
});


define.panel('/ModuleTree/Main/Dependent/List', function (require, module, panel) {
    const $ = require('$');
    const Data = module.require('Data');
    const GridView = module.require('GridView');



    let meta = {
        list: [],
    };

    panel.on('init', function () {

        panel.template({
            '': function ({ list, }) {
                if (!list.length) {
                    return this.fill('none', {});
                }

                return this.fill('item', list);
            },

            'item': {
                '': function (item, index) {
                    let total = item.list.length;
                    let tip = this.fill('tip', { total, });

                    return {
                        'no': index,
                        'id': item.id,
                        'total': total,
                        'tip': tip,
                    };
                },

                'tip': function ({ total, }) {
                    let tip =
                        total == 0 ? '该模块没有被任何模块依赖' : '';
                    
                    return tip ? { tip, } : '';
                 
                    
                },

            },
        });

        panel.$on('click', {
            'li[data-no] h3': function (event) {
                let li = this.parentNode.parentNode;
                let { no, } = li.dataset;
                let $li = $(li);
                let item = meta.list[no];
              

                $li.toggleClass('on');

                //已填充，直接展开。
                if (item.$gridview) {
                    item.$main.slideToggle('fast');
                    return;
                }


                //首次填充。
                item.$main = $li.find(`[data-id="main"]`);
                item.$gridview = $li.find(`[data-id="gridview"]`);


                GridView.render({
                    'container': item.$gridview,
                    'list': item.list,

                    'cmdClick': function (cmd, cell) {
                        panel.fire('cmd', [cmd, cell.row.item]);
                    },
                });
               
                setTimeout(() => {
                    item.$main.slideDown('fast');
                }, 100);

            },

            '[data-cmd="id"]': function (event) {
                let id = this.innerText;
                let { cmd, } = this.dataset;
                panel.fire('cmd', [cmd, { id, }]);
            },

           
        });

    });



 



    panel.on('render', function (list) {
        meta.list = list;

        panel.fill({ list, });
        

    });


    panel.on('show', function () { 
        panel.fire('show', [meta.list]);
    });




});


define('/ModuleTree/Main/Dependent/Outers/GridView', function (require, module, exports) {
    const $ = require('$');
    const GridView = require('GridView');


    let fields = [
        { caption: '序号', name: 'order', width: 40, class: 'order', },
        { caption: '模块ID', name: 'id', width: 300, class: 'name', sort: true, },
        { caption: '定义方法', name: 'method', width: 110, class: 'file', sort: true, },
        { caption: '级别', name: 'level', width: 49, class: 'number level', sort: true, },
        { caption: '所在文件', name: 'file', width: 565, class: 'file', sort: true, },
        { caption: '所在行号', name: 'no', width: 75, class: 'number', sort: true, },

    ];



    return {

        render({ container, list = [], cmdClick, }) {
            // if (list.length == 0) {
            //     $(container).html('该模块没有被任何模块依赖。');
            //     return;
            // }


            let gridview = new GridView({
                container: container,
                fields: fields,
            });

            gridview.on('process', 'cell', {
                'order': function (cell, { no, }) {
                    return no + 1;
                },

                'id': function (cell) {
                    let { item, } = cell.row;
                    let html = `<a data-cmd="id">${item.id}</a>`;

                    return html;
                },

                'file': function (cell) {
                    let { item, } = cell.row;
                    let html = `<a data-cmd="file">${item.file}</a>`;

                    return html;
                },

                'no': function (cell) {
                    let { item, } = cell.row;

                    let requires = item.requires.map((item) => {
                        return item.no + 1;
                    });

                    return requires.join(', ');
                },
            });

            gridview.on('click', 'cell', function (cell, { event, }) {
                let { cmd, } = event.target.dataset;

                if (cmd) {
                    event.stopPropagation();
                    cmdClick(cmd, cell);
                }

            });

            gridview.on('sort', {
                'id': function ({ a, b }) {
                    a = a.id.toUpperCase();
                    b = b.id.toUpperCase();
                    return { a, b, };
                },
                'no': function ({ a, b, }) { 
                    a = a.requires[0].no;
                    b = b.requires[0].no;
                    return { a, b, };
                },
            });


            gridview.render(list);

            return gridview;
        },
    };
});


define.panel('/ModuleTree/Main/Dependent/Outers', function (require, module, panel) {
    const $ = require('$');
    const Data = module.require('Data');
    const GridView = module.require('GridView');



    let meta = {
        list: [],
    };

    panel.on('init', function () {

        panel.template({
            '': function ({ list, }) {
                if (!list.length) {
                    return this.fill('none', {});
                }

                return this.fill('item', list);
            },

            'item': {
                '': function (item, index) {
                    let total = item.list.length;
                    let tip = this.fill('tip', { total, });

                    return {
                        'no': index,
                        'id': item.id,
                        'total': total,
                        'tip': tip,
                    };
                },

                'tip': function ({ total, }) {
                    let tip =
                        total == 0 ? '该模块没有被任何模块依赖' : '';
                    
                    return tip ? { tip, } : '';
                 
                    
                },

            },
        });

        panel.$on('click', {
            'li[data-no] h3': function (event) {
                let li = this.parentNode.parentNode;
                let { no, } = li.dataset;
                let $li = $(li);
                let item = meta.list[no];
              

                $li.toggleClass('on');

                //已填充，直接展开。
                if (item.$gridview) {
                    item.$main.slideToggle('fast');
                    return;
                }


                //首次填充。
                item.$main = $li.find(`[data-id="main"]`);
                item.$gridview = $li.find(`[data-id="gridview"]`);


                GridView.render({
                    'container': item.$gridview,
                    'list': item.list,

                    'cmdClick': function (cmd, cell) {
                        panel.fire('cmd', [cmd, cell.row.item]);
                    },
                });
               
                setTimeout(() => {
                    item.$main.slideDown('fast');
                }, 100);

            },

            '[data-cmd="id"]': function (event) {
                let id = this.innerText;
                let { cmd, } = this.dataset;
                panel.fire('cmd', [cmd, { id, }]);
            },

           
        });

    });



 



    panel.on('render', function (list) {
        meta.list = list;

        panel.fill({ list, });
        

    });


    panel.on('show', function () { 
        panel.fire('show', [meta.list]);
    });




});


define.panel('/ModuleTree/Main/Dependent/Tabs', function (require, module, panel) {
    const Tabs = require('@definejs/tabs');
    const Storage = require('@definejs/local-storage');

    let tabs = null;
    let storage = null;

    let meta = {
        index: 0,

        list: [
            { name: '内部', cmd: 'inner', },
            { name: '外部', cmd: 'outer', },
        ],
    };


    panel.on('init', function () {
        storage = new Storage(module.id);
        meta.index = storage.get('index') || 0;

        tabs = new Tabs({
            container: panel.$,
            activedClass: 'on',
            eventName: 'click',
            selector: '>li',
            // repeated: true, //这里要允许重复激活相同的项。
        });


        tabs.on('change', function (item, index) {
            meta.index = index;
            item = meta.list[index];
            storage.set('index', index);

            panel.fire(item.cmd);

        });


    });

    /**
    * 渲染。
    */
    panel.on('render', function (index) {

        tabs.render(meta.list, function (item, index) {
            return {
                'index': index,
                'name': item.name,
            };
        });

        if (typeof index == 'number') {
            meta.index = index;
        }
        else {
            index = meta.index;
        }

        tabs.active(index);

    });


    return {
        
    };

});


define('/ModuleTree/Main/Dependent/Data', function (require, module, exports) {


    return {

        get({ item, stat, }) {

            let {
                id$module,
                level$ids,
                outer$dependents,
            } = stat.moduleStat;

            let publics = [];
            let outers = [];


            if (!item.parent) { //根节点，则是显示全部被依赖的模块。
                //过滤掉空串。
                publics = level$ids['1'].filter((id) => {
                    return !!id;
                });

                outers = Object.keys(outer$dependents);
            }
            else { //非根节点，则显示此节点所依赖的公共模块。
                publics = item.data.module.publics;
                outers = item.data.module.outers;
            }

            publics.sort(function (a, b) {
                a = a.toLowerCase();
                b = b.toLowerCase();
                return a > b ? 1 : -1;
            });

            outers.sort(function (a, b) {
                a = a.toLowerCase();
                b = b.toLowerCase();
                return a > b ? 1 : -1;
            });



            publics = publics.map((id) => {
                let $main = null;
                let $gridview = null;
                let { dependents, id$dependents, } = id$module[id];

                let list = dependents.map((id) => {
                    let { method, level, file, } = id$module[id];
                    let requires = id$dependents[id];

                    return { id, method, level, file, requires, };
                });

                return { id, list, $main, $gridview, };

            });

            outers = outers.map((id) => {
                let $main = null;
                let $gridview = null;
                let dependents = outer$dependents[id];

                let id0 = id;

                let list = dependents.map((id) => {
                    let { method, level, file, id$requires, } = id$module[id];
                    let requires = id$requires[id0];

                    return { id, method, level, file, requires, };
                });


                return { id, list, $main, $gridview, };
            });
            console.log({ publics, outers, });

            return { publics, outers, };



        },
    };
});


define.panel('/ModuleTree/Main/Dependent', function (require, module, panel) {
    const Data = module.require('Data');
    const Tabs = module.require('Tabs');
    const Header = module.require('Header');
    const Outers = module.require('Outers');
    const List = module.require('List');


    panel.set('show', false);
    

    panel.on('init', function () {
        Tabs.on({
            'inner': function () { 
                List.show();
                Outers.hide();
            },

            'outer': function () { 
                List.hide();
                Outers.show();
            },
        });
       

        [List, Outers, ].forEach((M) => {
            M.on({
                'show': function (list) { 
                    Header.render(list);
                },
                'cmd': function (cmd, item) {
                    let value = item[cmd];      //cmd 为 `id`、`file`。
                    panel.fire(cmd, [value]);
                },
            });
        });
       
        

    });




    panel.on('render', function ({ item, stat, }) {
        let { publics, outers, } = Data.get({ item, stat, });

        List.render(publics);
        Outers.render(outers);
        Tabs.render();
        
        panel.show();
    });





});



define.panel('/ModuleTree/Main/FileInfo', function (require, module, panel) {


    panel.on('init', function () {
        panel.template(function (info, index) {
          
            return {
                'icon': info.icon.html,
                'name': info.name,
                'file': info.file,
                'ext': info.ext,
                'md5': info.md5,
                'dir': info.dir,
                'lines': info.lines,
                'length': info.length,
                'byteLength': info.byteLength,
                'modules': info.modules.length,
                'type': `${info.ext} 文件`,
                'size': info.size.value,
                'sizeDesc': info.size.desc,
                'birthtime': info.birthtime,
                'mtime': info.mtime,
            };
        });
    });

    panel.on('init', function () { 
        panel.$on('click', {
            '[data-cmd="file"]': function (event) {
                let file = this.innerText;
                panel.fire('file', [file]);
            },
        });
    });




    panel.on('render', function ({ item, stat, }) {

        let { htmlStat, moduleStat, } = stat;
        let { module, html, } = item.data;

        let info = moduleStat.file$info[module.file];
        let list = [info];

        if (html) {
            info = htmlStat.file$info[html.file];
            list = [...list, info];
        }
        
        panel.fill(list);



    });





});


define.panel('/ModuleTree/Main/List/Filter/ChildDependents', function (require, module, panel) {
    const DropCheckList = require('DropCheckList');

    let chk = null;

    let list = [
        { text: 'N > 0', checked: true, value: 'N>0', },
        { text: 'N = 0', checked: true, value: 'N=0', },
        { text: 'N < 0', checked: true, value: 'N<0', },
    ];

    panel.on('init', function () {

        chk = new DropCheckList({
            'container': panel.$,
            'text': '私有生产者数 - 直接子模块数',
        });

        chk.on({
            'check': function (list) {
                panel.fire('check', [list]);
            },
            'fill': function (list) {
                panel.fire('check', [list]);
            },
        });


       
    });



    panel.on('render', function () {

        

        

        chk.render(list);


    });



    return {
        
    };







});


define.panel('/ModuleTree/Main/List/Filter/Childs', function (require, module, panel) {
    const DropCheckList = require('DropCheckList');


    let chk = null;

   
    panel.on('init', function () {
        chk = new DropCheckList({
            'container': panel.$,
            'text': '直接子模块',
        });

        chk.on({
            'check': function (list) {
                panel.fire('check', [list]);
            },
            'fill': function (list) {
                panel.fire('check', [list]);
            },
        });


       
    });



    panel.on('render', function (items) {
        
        let list = items.map((item) => {
            return {
                'text': item.name,
                'checked': true,
                'value': item.data.id,
            };
        });

        chk.render(list);

    });



    return {
        
    };







});


define.panel('/ModuleTree/Main/List/Filter/Dependents', function (require, module, panel) {
    const DropCheckList = require('DropCheckList');

    let chk = null;

    let list = [
        { text: 'N = 0', checked: true, value: 'N=0', },
        { text: 'N > 0', checked: true, value: 'N>0', },
    ];

    panel.on('init', function () {

        chk = new DropCheckList({
            'container': panel.$,
            'text': '消费者数',
        });

        chk.on({
            'check': function (list) {
                panel.fire('check', [list]);
            },
            'fill': function (list) {
                panel.fire('check', [list]);
            },
        });


       
    });



    panel.on('render', function () {

        

        

        chk.render(list);


    });



    return {
        
    };







});


define.panel('/ModuleTree/Main/List/Filter/Fields', function (require, module, panel) {
    const DropCheckList = require('DropCheckList');


    let chk = null;

   
    panel.on('init', function () {
        chk = new DropCheckList({
            'container': panel.$,
            'text': '显示列',
        });

        chk.on({
            'check': function (list) {
                panel.fire('check', [list]);
            },
            'fill': function (list) {
                panel.fire('check', [list]);
            },
        });


       
    });



    panel.on('render', function (fields) {
        
        let list = fields.map((field, index) => {
            return {
                'checked': true,
                'text': field.caption,
                'value': index + 1,
            };
        });

        chk.render(list);

    });



    return {
        
    };







});


define.panel('/ModuleTree/Main/List/Filter/HtmlFile', function (require, module, panel) {
    const DropCheckList = require('DropCheckList');

    let chk = null;
    let list = [
        { text: 'N = 0', checked: true, value: 'N=0', },
        { text: 'N = 1', checked: true, value: 'N=1', },
    ];

    panel.on('init', function () {

        chk = new DropCheckList({
            'container': panel.$,
            'text': 'html 文件',
        });

        chk.on({
            'check': function (list) {
                panel.fire('check', [list]);
            },
            'fill': function (list) {
                panel.fire('check', [list]);
            },
        });


       
    });



    panel.on('render', function () {


        chk.render(list);


    });



    return {
        
    };







});


/*
* 
*/
define.panel('/ModuleTree/Main/List/Filter/Keyword', function (require, module, panel) {
  
    /**
    * 初始化时触发。
    * 即首次 render 之前触发，且仅触发一次。
    * 适用于创建实例、绑定事件等只需要执行一次的操作。
    */
    panel.on('init', function () {
       

        panel.$.on('input', 'input', function () {
            

            panel.fire('change', [this.value]);
        });

    });



    /**
    * 渲染时触发。
    * 即外界显式调用 render() 时触发，且每次调用都会触发一次。
    * 外界传进来的参数会原样传到这里。
    */
    panel.on('render', function () {


    });




});





define.panel('/ModuleTree/Main/List/Filter/Levels', function (require, module, panel) {
    const DropCheckList = require('DropCheckList');

    let chk = null;


    panel.on('init', function () {

        chk = new DropCheckList({
            'container': panel.$,
            'text': '级别',
        });

        chk.on({
            'check': function (list) {
                panel.fire('check', [list]);
            },
            'fill': function (list) {
                panel.fire('check', [list]);
            },
        });


       
    });



    panel.on('render', function (list) {

        list = list.map((level) => {
            return {
                'text': `${level} 级`,
                'checked': true,
                'value': level,
            };
        });

        chk.render(list);


    });



    return {
        
    };







});


define.panel('/ModuleTree/Main/List/Filter/Methods', function (require, module, panel) {
    const DropCheckList = require('DropCheckList');


    let chk = null;


    panel.on('init', function () {

        chk = new DropCheckList({
            'container': panel.$,
            'text': '定义方法',
        });

        chk.on({
            'check': function (list) {
                panel.fire('check', [list]);
            },
            'fill': function (list) {
                panel.fire('check', [list]);
            },
        });



    });



    panel.on('render', function (list) {
        
        list = list.map((item) => {

            return {
                'text': item,
                'checked': true,
                'value': item,
            };
        });

        chk.render(list);


    });



    return {

    };







});


define.panel('/ModuleTree/Main/List/Filter', function (require, module, panel) {
    const Keyword = module.require('Keyword');
    const Fields = module.require('Fields');
    const Childs = module.require('Childs');
    const ChildDependents = module.require('ChildDependents');
    const Dependents = module.require('Dependents');
    const Levels = module.require('Levels');
    const Methods = module.require('Methods');
    const HtmlFile = module.require('HtmlFile');


    let meta = {
        keyword: '',
        field$checked: null,
        child$checked: null,
        childDependent$checked: null,
        dependent$checked: null,
        level$checked: null,
        method$checked: null,
        html$checked: null,

    };

    panel.on('init', function () {
        let tid = null;

        //防抖。
        function fireChange() {
            if (tid) {
                clearTimeout(tid);
            }

            tid = setTimeout(function () {
                panel.fire('change', [meta]);
            }, 200);
        }

        function make(list) {
            let key$checked = {};

            list.forEach((item) => {
                key$checked[item.value] = item.checked;
            });

            return key$checked;
        }

        Keyword.on({
            'change': function (keyword) {
                meta.keyword = keyword;
                fireChange();
            },
        });

        Fields.on({
            'check': function (list) {
                meta.field$checked = make(list);
                fireChange();
            },
        });

        Childs.on({
            'check': function (list) {
                meta.child$checked = make(list);
                fireChange();
            },
        });


        ChildDependents.on({
            'check': function (list) {
                meta.childDependent$checked = make(list);
                fireChange();
            },
        });

        Dependents.on({
            'check': function (list) {
                meta.dependent$checked = make(list);
                fireChange();
            },
        });

        Levels.on({
            'check': function (list) {
                meta.level$checked = make(list);
                fireChange();
            },
        });


        Methods.on({
            'check': function (list) {
                meta.method$checked = make(list);
                fireChange();
            },
        });

        HtmlFile.on({
            'check': function (list) {
                meta.html$checked = make(list);
                fireChange();
            },
        });

        
  
    });



    panel.on('render', function (data, fields) {
        // Fields.render(fields); //暂时隐藏，因为 gridview 还没实现显示/隐藏指定的列。
        
        Keyword.render();
        Childs.render(data.childs);
        ChildDependents.render();
        Dependents.render();
        Levels.render(data.levels);
        Methods.render(data.methods);

        HtmlFile.render();



    });

    

    return {
        
        
    };






});


define.panel('/ModuleTree/Main/List/GridView', function (require, module, panel) {
    const GridView = require('GridView');

    let tpl = null;
    let gridview = null;

    let meta = {
        keyword: '',
        keywordHtml: '',
    };

    let fields = [
        { caption: '序号', name: 'order', width: 40, class: 'order', },
        { caption: '模块ID', name: 'id', width: 300, class: 'name', sort: true, },
        { caption: '模块名称', name: 'name', width: 71, class: 'name', sort: true, },
        { caption: '定义方法', name: 'method', width: 110, class: 'file', sort: true, },
        { caption: '级别', name: 'level', width: 48, class: 'number level', sort: true, },
        { caption: '消费者', name: 'dependents', width: 59, class: 'number dependents', sort: true, },
        { caption: '公共生产者', name: 'publics', width: 48, class: 'number publics', sort: true, },
        { caption: '私有生产者', name: 'privates', width: 48, class: 'number privates', sort: true, },
        { caption: '直接子模块', name: 'childs', width: 48, class: 'number childs', sort: true, },
        { caption: '全部子模块', name: 'children', width: 48, class: 'number children', sort: true, },
        { caption: '同级模块', name: 'siblings', width: 71, class: 'number siblings', sort: true, },
        { caption: '所在的 js 文件', name: 'file', width: 520, class: 'file', sort: true, },
        { caption: '关联的 html 文件', name: 'htmlFile', width: 520, class: 'file', sort: true,},
    ];



    panel.on('init', function () {
        tpl = panel.template();

        gridview = new GridView({
            container: panel.$,
            fields: fields,
            meta: true,
        });

        gridview.on('process', 'row', function (row) {
            let item = row.data;
            let list = [];

            if (item.dependents == 0) {
                list.push('error dependents');
            }

            if (item.childs != item.privates) {
                list.push('error childs privates');
            }

            list = list.join(' ');
            list = list.split(' ');
            list = [...new Set(list)];
            row.class = list.join(' ');
        });

        gridview.on('process', 'cell', {
            'order': function (cell, { no, }) {
                return no + 1;
            },

            'id': function (cell) {
                let { id, } = cell.row.item;
                let text = module.data.none;
                let { keyword, keywordHtml, } = meta;

                if (id) {
                    text = id;

                    if (keyword) {
                        text = text.split(keyword).join(keywordHtml);
                    }
                }

                
                let html = tpl.fill('href', {
                    'cmd': 'id',
                    'value': id,
                    'text': text,
                });

                return html;
            },
            'file': function (cell) {
                let { file, } = cell.row.item;
                let text = file;
                let { keyword, keywordHtml, } = meta;

                if (keyword) {
                    text = text.split(keyword).join(keywordHtml);
                }


                let html = tpl.fill('href', {
                    'cmd': 'file',
                    'value': file,
                    'text': text,
                });

                return html;
            },
            'htmlFile': function (cell) {
                let { htmlFile, } = cell.row.item;
                let text = htmlFile;
                let { keyword, keywordHtml, } = meta;

                if (keyword) {
                    text = text.split(keyword).join(keywordHtml);
                }

                let html = tpl.fill('href', {
                    'cmd': 'file',
                    'value': htmlFile,
                    'text': text,
                });

                return html;
            },


        });

        gridview.on('click', 'cell', function (cell, { event, }) {
            let { cmd, value, } = event.target.dataset;

            if (!cmd) {
                return;
            }


            panel.fire('cmd', [cmd, value]);
            event.stopPropagation();
        });

        gridview.on('sort', {
            'id': function ({ a, b, }) {
                a = a.id.toUpperCase();
                b = b.id.toUpperCase();
                return { a, b, };
            },

            'name': function ({ a, b, }) {
                a = a.name.toUpperCase();
                b = b.name.toUpperCase();
                return { a, b, };
            },

            'file': function ({ a, b, }) {
                a = a.file.toUpperCase();
                b = b.file.toUpperCase();
                return { a, b, };
            },
            'htmlFile': function ({ a, b, }) {
                a = a.htmlFile.toUpperCase();
                b = b.htmlFile.toUpperCase();
                return { a, b, };
            },
        });


    });


    /**
    * 渲染内容。
    *   list: [],       //必选，数据列表。
   
    */
    panel.on('render', function (list, { keyword, }) {

        meta.keyword = keyword;
        meta.keywordHtml = `<span class="keyword">${keyword}</span>`;

        gridview.render(list);

        // //内部分页。
        // gridview.render(list, {
        //     no: 1,
        //     size: 20,
        // });

        console.log(gridview);

        // setInterval(function () { 
        //     gridview.meta.table.toggleColumn('id');

        // },2000);

    });


    return {
        fields,
    };


});



define.panel('/ModuleTree/Main/List/Header', function (require, module, panel) {
 

    /**
    * 初始化时触发。
    * 即首次 render 之前触发，且仅触发一次。
    * 适用于创建实例、绑定事件等只需要执行一次的操作。
    */
    panel.on('init', function () {


       
    });




    panel.on('render', function (list) {

        panel.fill({
            'count': list.length,
        });
        

    });





});



define('/ModuleTree/Main/List/Data', function (require, module, exports) {
    
    let meta = {
        item: null,
        stat: null,
    };

   
    return {
        /**
        *
        */
        init({ item, stat, }) {
            meta.item = item;
            meta.stat = stat;
          
            let { list, children, } = item;
            let methods = new Set();
            let levels = new Set();

            children.forEach((item) => {
                let { level, method, } = item.data.module;

                methods.add(method);
                levels.add(level);
            });

            return {
                'methods': [...methods],
                'levels': [...levels],
                'childs': list,             //直接子节点。
            };
           
        },

        /**
        * 
        * @param {*} opt 
        * @returns 
        */
        filter(opt = {}) {
            let {
                keyword = '',
                child$checked = null,
                childDependent$checked = null,
                dependent$checked = null,
                level$checked = null,
                method$checked = null,
                html$checked = null,
            } = opt;

            let { item, stat, } = meta;
            let list = item.children;

            //非根节点，则要包括当前节点。
            if (item.parent) {
                list = [item, ...list];
            }

            list = list.map((item) => {
                let { id, module, html, } = item.data;
                let htmlFile = html ? html.file : '';

                let {
                    file,
                    level,
                    method,
                    children = [],
                    childs = [],
                    dependents = [],
                    parents = [],
                    privates = [],
                    publics = [],
                    siblings = [],
                } = module;




                if (typeof dependents == 'string') {
                    dependents = [dependents];
                }


                if (child$checked) {
                    let found = [id, ...parents].some((id) => {
                        return child$checked[id];
                    });

                    if (!found) {
                        return;
                    }
                }

                //被依赖模块数。
                if (dependent$checked) {
                    let N = dependents.length;
                    //`N=0` 没有勾选。
                    if (!dependent$checked['N=0'] && N == 0) {
                        return;
                    }

                    //`N>0` 没有勾选。
                    if (!dependent$checked['N>0'] && N > 0) {
                        return;
                    }
                }


                //所依赖私有模块数 - 直接子模块数
                if (childDependent$checked) {
                    let N = privates.length -childs.length;

                    //`N > 0` 没有勾选。
                    if (!childDependent$checked['N>0'] && N > 0) {
                        return;
                    }

                    //`N = 0` 没有勾选。
                    if (!childDependent$checked['N=0'] && N == 0) {
                        return;
                    }

                    //`N < 0` 没有勾选。
                    if (!childDependent$checked['N<0'] && N < 0) {
                        return;
                    }
                }


                if (level$checked && !level$checked[level]) {
                    return;
                }

                if (method$checked && !method$checked[method]) {
                    return;
                }

                //所在 html 文件。
                if (html$checked) {
                    let N = htmlFile ? 1 : 0;

                    //`N = 0` 没有勾选。
                    if (!html$checked['N=0'] && N == 0) {
                        return;
                    }

                    //`N = 1` 没有勾选。
                    if (!html$checked['N=1'] && N == 1) {
                        return;
                    }

                }

                return {
                    id,
                    method,
                    level,
                    file,
                    htmlFile,
                    'name': module.name,
                    'dependents': dependents.length,    //
                    'childs': childs.length,            //直接子模块数。
                    'children': children.length,
                    'publics': publics.length,
                    'privates': privates.length,        //所依赖私有模块数。
                    'siblings': siblings.length,
                };
            });

           
            list = list.filter((item) => {
                if (!item) {
                    return false;
                }

                let { id, file, htmlFile, } = item;

                if (keyword) {
                    let includes =
                        id.includes(keyword) ||
                        file.includes(keyword) ||
                        htmlFile.includes(keyword);
                    
                    return includes;
                }
                
                return true;
            });

           

            return list;
        },
    };



});



define.panel('/ModuleTree/Main/List', function (require, module, panel) {
    const Header = module.require('Header');
    const Data = module.require('Data');
    const Filter = module.require('Filter');
    const GridView = module.require('GridView');

    panel.set('show', false);
    

    panel.on('init', function () {
       

        Filter.on({
            'change': function (filter) {
                let { keyword, } = filter;
                let list = Data.filter(filter);

                Header.render(list);
                GridView.render(list, { keyword, });

                // GridView.toggleFields(opt.field$checked);
            },
        });

        GridView.on({
            'cmd': function (cmd, value) {
                panel.fire(cmd, [value]);
            },
        });
        

    });




    panel.on('render', function ({ item, stat, }) {
        let data = Data.init({ item, stat, });
        let fields = GridView.fields;

       
        Filter.render(data, fields);
        
        panel.show();
    });





});


define('/ModuleTree/Main/ModuleInfo/Groups/GridView', function (require, module, exports) {
    const GridView = require('GridView');

    let fields = [
        { caption: '序号', name: 'order', width: 40, class: 'order', },
        { caption: '模块ID', name: 'id', width: 400, class: 'name', sort: true, },
        { caption: '定义方法', name: 'method', width: 110, class: 'file', sort: true, },
        { caption: '所在文件', name: 'file', width: 600, class: 'file', sort: true, },
    ];

    return {
        create({ container, tpl, click, }) { 

            let gridview = new GridView({ container, fields, });


            gridview.on('process', 'cell', {
                'order': function (cell, { no, }) {
                    return no + 1;
                },

                'id': function (cell) {
                    let { item, } = cell.row;

                    let html = tpl.fill('group', 'href', {
                        'cmd': 'id',
                        'text': item.id,
                    });

                    return html;
                },

                'file': function (cell) {
                    let { item, } = cell.row;

                    let html = tpl.fill('group', 'href', {
                        'cmd': 'file',
                        'text': item.file,
                    });

                    return html;
                },


            });

            gridview.on('click', 'cell', function (cell, { event, }) {
                let { cmd, } = event.target.dataset;
                let { item, } = cell.row;

                if (cmd) {
                    click(cmd, item);
                    event.stopPropagation();
                }

            });

            gridview.on('sort', {
                'id': function ({ a, b }) {
                    a = a.id.toUpperCase();
                    b = b.id.toUpperCase();
                    return { a, b, };
                },
            });


            return gridview;
        },
    };
  

  



});



define.panel('/ModuleTree/Main/ModuleInfo/Base', function (require, module, panel) {

    let none = module.data.none;

    let meta = {
        item: null,
    };

    panel.on('init', function () {
        panel.$on('click', {
            '[data-cmd="item"]': function (event) {
                let item = meta.item.parent;
                panel.fire('item', [item]);
            },
        });

    });




    panel.on('render', function ({ item, }) {
   
        meta.item = item;

        let { module, } = item.data;
        let { id, parent, name, method, factory, dependents, level, } = module;

        
        if (parent === '') {
            parent = none;
        }


        panel.fill({
            'id': id || none,
            'name': name || none,
            'parent': parent || '',
            'method': method,
            'factory': factory.type,
            'dependents': dependents.length,
            'level': level,
        });

    });





});



define.panel('/ModuleTree/Main/ModuleInfo/Groups', function (require, module, panel) {

    const GridView = module.require('GridView');


    function click(cmd, item) {
        let value = item[cmd];      //cmd 为 `id`、`file`。
        panel.fire(cmd, [value]);
    }

    let list = [
        { name: '被依赖的模块', key: 'dependents', },
        { name: '所依赖的公共模块', key: 'publics', },
        { name: '所依赖的私有模块', key: 'privates', },
        { name: '直接子模块', key: 'childs', },
        { name: '全部子模块', key: 'children', },
        { name: '兄弟模块', key: 'siblings', },
    ];


    panel.on('init', function () {

        panel.template({
            '': function ({ groups, }) {
                groups = this.fill('group', groups);
                return { groups, };
            },

            'group': function ({ name, }, index) {
                return { name, index, };
            },
        });


    });




    panel.on('render', function ({ item, stat, }) {
        let { module, } = item.data;
        let { id$module, } = stat.moduleStat;

        let groups = list.map(({ name, key, }) => {
            let list = module[key].map((id) => {
                return id$module[id];
            });

            return { name, list, };
        });

        panel.fill({ groups, });


        
        groups.forEach(({ list, }, index) => {
            let container = panel.$.find(`[data-id="gridview-${index}"]`);
            let tpl = panel.template();
            let gridview = GridView.create({ container, tpl, click, });

            gridview.render(list);

        });




    });





});



define.panel('/ModuleTree/Main/ModuleInfo', function (require, module, panel) {
    const Base = module.require('Base');


    const Groups = module.require('Groups');


    panel.on('init', function () {
        [Base, Groups,].forEach((M) => {
            M.on({
                'item': function (item) {
                    panel.fire('item', [item]);
                },
                'id': function (id) {
                    panel.fire('id', [id]);
                },
                'file': function (file) {
                    panel.fire('file', [file]);
                },
            });
        });

    });




    panel.on('render', function ({ item, stat, }) {
        Base.render({ item, stat, });

        Groups.render({ item, stat, });;


    });





});


define('/ModuleTree/Main/Nav/Data', function (require, module, exports) {
    
    return {
        make(item) {
            let list = [item, ...item.parents].reverse();

            let names = list.map((item) => {
                return item.name;
            });


            let { module, } = item.data;
            let path = '/';
            let icon = { type: 'dir', ext: '', };


            if (module) {
                let { file, id, } = module;
                let ext = file.split('.').slice(-1)[0];

                path = id || '/';
                icon = { type: 'file', ext: `.${ext}`, };
            }
           
            return {
                list,
                names,
                path,
                icon,
            };
        },
    }



});


define.panel('/ModuleTree/Main/Nav', function (require, module, panel) {
    const MenuNav = require('MenuNav');


    let meta = {
        item: null,
    };

    let nav = null;



    panel.on('init', function () {
        nav = new MenuNav({
            'container': panel.$,
        });

        nav.on({
            'item': function ({ names, index, }) {
                console.log({ index, names, });

                let parents = meta.item.parents.slice(0).reverse(); //复制一份再反转。
                let target = parents[index];
                let { id, } = target.data;

                panel.fire('path', [id]);
            },

            'text': function (text) {
                panel.fire('path', [text]);
            },
        });
    });


    /**
    * 渲染内容。
    */
    panel.on('render', function (item) {
        let { id, parents, name, data, } = item;
        let root = parents.slice(-1)[0];
        let path = root ? `${root.name}/${id}` : `${name}/`;
        let text = data.id;

        meta.item = item;

        nav.render({ path, text, });

    });



});


define.panel('/ModuleTree/Main/Stat/GridView', function (require, module, panel) {
    const GridView = require('GridView');

    let gridview = null;
    let tpl = null;


    panel.on('init', function () {
        tpl = panel.template();

        gridview = new GridView({
            container: panel.$,

            fields: [
                { caption: '', name: 'group', width: 5, class: 'group', minWidth: 5, maxWidth: 5, dragable: false, },
                { caption: '序号', name: 'order', width: 40, class: 'order', },
                { caption: '类型', name: 'name', width: 200, class: 'name', sort: true, },
                { caption: '个数', name: 'count', width: 300, class: 'count number', sort: true, },
                { caption: '大小', name: 'size', width: 300, class: 'size number', sort: true, },
                { caption: '行数', name: 'line', width: 300, class: 'line number', sort: true, },
            ],

        });

        let lastGroup = '';

        gridview.on('process', 'row', function (row, { no, }) { 
            row.class = row.item.group;

            let { group, } = row.item;
            row.class = group;

            if (lastGroup != group) {
                row.class += ' group-begin';
                lastGroup = group;
            }

            
        });


        gridview.on('process', 'cell', {
            'order': function (cell, { no, }) {
                return no;
            },

            'group': function (cell) {
                return '';
            },
            'count': function (cell) {
                let { count, } = cell.row.item;
                let html = tpl.fill('cell', count);
                return html;
            },

            'size': function (cell) {
                let { size, } = cell.row.item;
                let html = tpl.fill('cell', size);
                return html;
            },


            'line': function (cell) {
                let { line, } = cell.row.item;
                let html = tpl.fill('cell', line);
                return html;
            },

        });

        gridview.on('sort', {
            //恢复分组。
            '': function ({ list, }) { 
                const $Array = require('@definejs/array');

                let group$items = {};
                let newList = [];

                list.forEach((item) => {
                    let { group, } = item;
                    $Array.add(group$items, group, item);
                });

                //让 `all` 这组置顶。
                newList = [...group$items['all']];

                Object.entries(group$items).forEach(([group, items]) => {
                    if (group == 'all') {
                        return;
                    }

                    newList = [...newList, ...items];
                });

                return newList;


            },

            'name': function ({ a, b, }) {
                a = a.name.toUpperCase();
                b = b.name.toUpperCase();
                return { a, b, };
            },

            'count': function ({ a, b, }) {
                a = a.count.value;
                b = b.count.value;
                return { a, b, };
            },

            'size': function ({ a, b, }) {
                a = a.size.raw;
                b = b.size.raw;
                return { a, b, };
            },

            'line': function ({ a, b, }) {
                a = a.line.value;
                b = b.line.value;
                return { a, b, };
            },


        });



    });


    /**
    * 渲染内容。
    *   list: [],                   //必选，数据列表。
    */
    panel.on('render', function (list) {


        gridview.render(list);



    });



});



define('/ModuleTree/Main/Stat/Data', function (require, module, exports) {
    const $Array = require('@definejs/array');
    const File = require('File');

    function getPercent(value, total) { 
        if (Array.isArray(value)) {
            value = value.length;
        }

        if (Array.isArray(total)) {
            total = total.length;
        }

        let percent = value / total * 100;

        percent = percent.toFixed(2);

        if (0<percent && percent < 0.2) {
            percent = 0.2;
        }

        return percent;
    }

    function getSize(ids, moduleStat) { 
        let { id$module, file$info, } = moduleStat;
        let total = 0;

        ids.forEach((id) => {
            if (typeof id == 'object') {
                id = id.data.module.id;
            }

            let { file, } = id$module[id];
            let { size, } = file$info[file];
            total += size.raw;
        });

        let size = File.getSize(total);

        return size;

    }


    function getLines(ids, moduleStat) { 
        let { id$module, file$info, } = moduleStat;
        let total = 0;

        ids.forEach((id) => {
            if (typeof id == 'object') {
                id = id.data.module.id;
            }

            let { file, } = id$module[id];
            let { lines, } = file$info[file];

            total += lines
        });

        return total;
    }

    return {
        
        get({ item, stat, }) {

            let { children, } = item;

            if (item.id != '/') {
                children = [item, ...children];
            }

            let { moduleStat, } = stat;

            
            let method$ids = {};        //记录模块的定义方法对应的模块列表。 即按定义方法把模块进行归类。
            let level$ids = {};         //层级对应的模块列表。
            let factory$ids = {};
            let name$ids = {};
            let dir$ids = {};
            let outer$ids = {};
            let public$ids = {};

          
            let totalSize = getSize(children, moduleStat);
            let totalLines = getLines(children, moduleStat);

            console.log({ totalSize, totalLines, });
        
            let list = [{
                
                group: 'all',
                name: '全部模块',
                count: {
                    value: children.length,
                    desc: '个',
                    percent: 0,
                },
                size: {
                    ...totalSize,
                    percent: 0,
                },

                line: {
                    value: totalLines,
                    desc: '行',
                    percent: 0,
                },
            }];

            function add(group, key$ids, fn) {
                Object.entries(key$ids).forEach(([key, ids]) => {
                    let size = getSize(ids, moduleStat);
                    let name = key;

                    if (fn) {
                        name = fn(key) || key;
                    }

                    let lines = getLines(ids, moduleStat);

                    list.push({
                        'group': group,
                        'name': name,
                        'count': {
                            value: ids.length,
                            desc: '个',
                            percent: getPercent(ids, children),
                        },
                        'size': {
                            ...size,
                            percent: getPercent(size.raw, totalSize.raw),
                        },

                        'line': {
                            value: lines,
                            desc: '行',
                            percent: getPercent(lines, totalLines),
                        },
                    });
                });
            }

        

            children.forEach(({ data, }) => {
                let { dir, factory, file, id, level, method, name, outers, publics, } = data.module;

                $Array.add(method$ids, method, id);
                $Array.add(level$ids, level, id);
                $Array.add(factory$ids, factory.type, id);
                $Array.add(name$ids, name, id);
                $Array.add(dir$ids, dir, id);

                
                outers.forEach((outer) => {
                    $Array.add(outer$ids, outer, id);
                });

                publics.forEach((public) => {
                    $Array.add(public$ids, public, id);
                });
            });


            add('method', method$ids, function (method) {
                return `定义方式为 ${method}`;
            });
            
            add('level', level$ids, function (level) { 
                return `${level}级模块`;
            });

            add('factory', factory$ids, function (factory) {
                return `导出对象为 ${factory}`;
            });

          
            add('outer', outer$ids, function (outer) {
                return `依赖 ${outer}`;
            });
            add('public', public$ids, function (public) {
                return `依赖 ${public}`;
            });

            add('name', name$ids, function (name) {
                return `.../${name}`;
            });
            // add('dir', dir$ids);
        

            return list;
        },

        

    };

});


define.panel('/ModuleTree/Main/Stat', function (require, module, panel) {

    const Data = module.require('Data');
    const GridView = module.require('GridView');


    panel.on('init', function () {

    });


    /**
    * 渲染内容。
    */
    panel.on('render', function ({ item, stat, }) {
       
        console.log({item, stat});

        let list = Data.get({ item, stat, });

        console.log(list)

        GridView.render(list);

      

    });




    return {
        
    };

});



define.panel('/ModuleTree/Main/Tree/Header', function (require, module, panel) {

    const CheckBox = require('CheckBox');

 

    let chks = [
        { id: 'value', text: '文件', chk: null, checked: false, },
        { id: 'icon', text: '图标', chk: null, checked: false, },
        { id: 'tab', text: '缩进', chk: null, checked: true, },
        { id: 'color', text: '彩色', chk: null, checked: true, },
        { id: 'hover', text: '悬停', chk: null, checked: true, },
    ];



    /**
    * 初始化时触发。
    * 即首次 render 之前触发，且仅触发一次。
    * 适用于创建实例、绑定事件等只需要执行一次的操作。
    */
    panel.on('init', function () {

        chks.forEach((item) => {
            let chk = new CheckBox({
                'fireNow': true,
                'container': panel.$.find(`[data-id="chk-${item.id}"]`),
                'text': item.text,
            });

            chk.on('checked', function (checked) {
                item.checked = checked;
                
                panel.fire('check', [{
                    [item.id]: checked,
                }]);
            });

            item.chk = chk;
        });
        

        panel.$on('click', '[data-cmd]', function (event) {
            let { cmd, } = event.target.dataset;
            panel.fire('cmd', cmd, []);
        });

       
    });




    panel.on('render', function () {

        chks.forEach((item) => {
            item.chk.render(item);
        });

    });





});



define.panel('/ModuleTree/Main/Tree/Main', function (require, module, panel) {
    const $String = require('@definejs/string');
    const $ = require('$');
    const TextTree = require('TextTree');
    const Clipboard = require('Clipboard');

    const { none, } = module.data;

 
    let tree = null;




    panel.on('init', function () {
        tree = new TextTree({
            'container': panel.$,
        });


        tree.on('cmd', {
            'key': function (item, event) { 
                panel.fire('id', [item.data.id]);
            },
            'value': function (item, event) { 
                panel.fire('file', [item.data.file]);
            },
        });

     
    });

   


    panel.on('render', function (item) {
        let currentId = null;
        let nodeId = 'current-' + $String.random();
        let list = [];

        //非根节点
        if (item.parent) {
            let { parents, } = item;
            list = parents.slice(0).reverse();//需要复制一份再反转，否则会影响原来的。
            list = [...list, item,];
            currentId = item.data.module.id;
        }


        list = [...list, item, ...item.children,];

        list = list.slice(1).map((item, index) => {
            let { id, file, names, } = item.data.module;

            let keys = names.map((key) => {
                return key || none;
            });


            return {
                'id': id === currentId ? nodeId : '',
                'keys': keys,
                'value': file,
                'data': { id, file, }, //自定义数据，方便后续访问。
            };
        });

        tree.render(list);

        
        if (typeof currentId == 'string') {
            $(`#${nodeId}`).addClass('on');
        }


        panel.fire('render');


    });


    return {
        check(opt) {
            tree.toggle(opt);
        },

        copy() {
            let value = tree.toString();
            Clipboard.copy(value);
        },
        
    };



});



define.panel('/ModuleTree/Main/Tree', function (require, module, panel) {
    const Header = module.require('Header');
    const Main = module.require('Main');



    panel.on('init', function () {
        Header.on('check', function (opt) {
            Main.check(opt);
        });

        Header.on('cmd', {
            'copy' : function () {
                Main.copy();
            },
        });


        Main.on({
            'id': function (id) {
                panel.fire('id', [id]);
            },
            'file': function (file) {
                panel.fire('file', [file]);
            },

            'render': function () {
                Header.render();
            },
        });

    });




    panel.on('render', function ({ item, stat, }) {

        Main.render(item);
        

    });





});



define.panel('/ModuleTree/Main/Tabs', function (require, module, panel) {
    const Tabs = require('Tabs');


    let allList = [
        { name: '统计', cmd: 'Stat', icon: 'fas fa-chart-bar', root: true, },
        { name: '依赖关系', cmd: 'Dependent', icon: 'fas fa-share-nodes', root: true, },
        { name: '模块列表', cmd: 'List', icon: 'fas fa-list', root: true, },
        { name: '组织架构', cmd: 'Tree', icon: 'fas fa-folder-tree', root: true, },
        { name: '模块信息', cmd: 'ModuleInfo', icon: 'fas fa-circle-info', },
        { name: '文件信息', cmd: 'FileInfo', icon: 'fas fa-file', },
        { name: '文件内容', cmd: 'Content', icon: 'fas fa-file-lines', },

    ];


    let tabs = null;

    let meta = {
        cmd$module: null,
        list: [],
    };


    panel.on('init', function () {

        tabs = new Tabs({
            container: panel.$.get(0),
            storage: module.id,
        });


        tabs.on('change', function (item, index) {
            let { cmd, } = item;
            let { cmd$module, } = meta;

            if (cmd$module) {
                Object.keys(cmd$module).forEach((key) => {
                    let M = cmd$module[key];

                    if (key == cmd) {
                        panel.fire('change', [M]);
                    }
                    else {
                        M.hide();
                    }
                });
            }

            //后备方案。
            panel.fire('cmd', cmd, []);
        });

       
    });

    /**
    * 渲染。
    */
    panel.on('render', function (item) {
        meta.list = allList;

        if (!item.parent) {
            meta.list = meta.list.filter((item) => {
                return item.root;
            });
        }

        tabs.render(meta.list);

        tabs.active();

    });


    return {
        map(cmd$module) {
            meta.cmd$module = cmd$module;
        },
    };


});

define.panel('/ModuleTree/Main', function (require, module, panel) {
    const Nav = module.require('Nav');
    const Tabs = module.require('Tabs');

    const Stat = module.require('Stat');
    const Content = module.require('Content');
    const Dependent = module.require('Dependent');
    const FileInfo = module.require('FileInfo');
    const List = module.require('List');
    const ModuleInfo = module.require('ModuleInfo');
    const Tree = module.require('Tree');

    let meta = {
        item: null,
        stat: null,
    };

    

    panel.on('init', function () {
        let modules = { Stat, Content, Dependent, FileInfo, List, ModuleInfo, Tree, };

        Nav.on({
            'path': function (path) {
                panel.fire('path', [path]);
            },
        });
      

        Tabs.map(modules);

        Tabs.on({
            'change': function (M) {
                M.render(meta);
            },
        });


        Object.values(modules).forEach((M) => {
            M.on({
                'item': function (item) {
                    panel.fire('item', [item]);
                },
                'id': function (id) {
                    panel.fire('id', [id]);
                },
                'file': function (file) {
                    panel.fire('file', [file]);
                },
            });
        });


    });


    /**
    * 渲染内容。
    */
    panel.on('render', function (item, stat) {
        
        meta.item = item;
        meta.stat = stat;

        Nav.render(item);
        Tabs.render(item);

    });




    return {

        resize(...args) {
            let w = args.reduce(function (sum, value) {
                return sum + value;
            }, 0);

            panel.$.css({
                width: `calc(100% - ${w}px)`,
            });

        },
    };

});



define('/ModuleTree/Tree/Data', function (require, module, exports) {
    const MenuTree = require('MenuTree');
    const none = module.data.none;


    let meta = {
        id$node: {},
    };
    
    function getFile(id) {
        if (id === '') {
            return none;
        }

        if (id.startsWith('/')) {
            return `${none}${id}`;
        }

        return id;
    }


    return exports = {
        /**
        */
        make({ htmlStat, moduleStat, }) {

            let root = {
                id: '/',
                name: '模块树',
                open: true,
                dirIcon: {
                    close: 'fas fa-folder',
                    open: 'fas fa-folder-open',
                },
            };

            

            let file$id = {};

            let files = Object.keys(moduleStat.id$module).map((id) => {
                let file = getFile(id);

                file$id[file] = id;

                return file;
            });

            files.sort(function (a, b) {
                a = a.toLowerCase();
                b = b.toLowerCase();
                return a > b ? 1 : -1;
            });

            let list = MenuTree.parse({ root, files, }, function (item) {
                if (item.id == '/') {
                    meta.id$node['/'] = item;
                    return;
                }

                
                let file = item.id;

                if (file.endsWith('/')) {
                    file = file.slice(0, -1);
                }

                let id = file$id[file];
                let module = moduleStat.id$module[id];
                let html = htmlStat.id$module[id]; //可能为空。

                meta.id$node[id] = item;

                Object.assign(item.data, {
                    id,
                    module,
                    html,
                });

            });
            
            return list;


        },

        //
        getNode(id) { 
            return meta.id$node[id];
        },


    };


});


define.panel('/ModuleTree/Tree', function (require, module, panel) {
    const SidebarTree = require('SidebarTree');

    const Data = module.require('Data');
   


    let tree = null;

    panel.on('init', function () {

        tree = new SidebarTree({
            'container': panel.$,
            'width': panel.$.width(),
            'dirIcon': {
                close: 'fas fa-file-alt',
                open: 'far fa-file-alt',
            },
            'fileIcon': 'fas fa-file',
        });

        tree.on({
            'item': function (item) {
                panel.fire('item', [item]);
            },
            'dir': function (item) {
                panel.fire('dir', [item]);
            },
            'resize': function () {
                let w = tree.$.outerWidth();

                panel.$.width(w);
                panel.fire('resize', [w]);
            },
        });


    });




    /**
    * 渲染。
    *   
    */
    panel.on('render', function ({ htmlStat, moduleStat, }) {
        let list = Data.make({ htmlStat, moduleStat, });

        tree.render(list);
    });


    return {

        open(id) {
            let node = Data.getNode(id);
            tree.open(node.id);
        },
    };


});


define('/ModuleTree/API', function (require, module, exports) {
    const Emitter = require('@definejs/emitter');

    const Loading = require('@definejs/loading');
    const API = require('API');
    const Data = module.require('Data');


    let emitter = new Emitter();

    let loading = new Loading({
        mask: 0,
    });




    return {
        on: emitter.on.bind(emitter),

        /**
        * 获取。
        */
        get() {
            let api = new API('ModuleSystem.parse', {
                // proxy: '.json',
            });

            api.on({
                'request': function () {
                    loading.show('加载中...');
                },

                'response': function () {
                    loading.hide();
                },

                'success': function (data, json, xhr) {
                    data = Data.make(data);

                    emitter.fire('success', 'get', [data]);
                },

                'fail': function (code, msg, json, xhr) {
                    definejs.alert('获取模块列表失败: {0}', msg);
                },

                'error': function (code, msg, json, xhr) {
                    definejs.alert('获取模块列表错误: 网络繁忙，请稍候再试');
                },
            });

            api.get();

        },



    };


});

define.view('/ModuleTree', function (require, module, view) {
    const SessionStorage = require('@definejs/session-storage');
    const API = module.require('API');
    const Tree = module.require('Tree');
    const Main = module.require('Main');

    let storage = null;

    let meta = {
        id: '',
        stat: null,         //从后台获取到的所有统计数据。
    };


    view.on('init', function () {
        storage = new SessionStorage(module.id);

        API.on('success', {
            'get': function (stat) {
                let id = storage.get('id') || '/';

                meta.stat = stat;

                Tree.render(stat);
                Tree.open(id);
            },
        });

        Tree.on({
            'item': function (item) {
                storage.set('id', item.data.id); //这里取的是 mid，保存到 storage。
                Main.render(item,  meta.stat);
                
            },
            'resize': function (w) {
                Main.resize(w, 6);
            },
        });


        

        Main.on({
            'item': function (item) {
                Tree.open(item.id);
            },

            'id': function (id) {
                if (id.startsWith('@definejs/')) {
                    let file = `/f/definejs/src/${id}`;
                    view.fire('file', [file]);
                }
                else {
                    Tree.open(id);
                }
            },

            'path': function (id) {
                Tree.open(id);
            },

            'file': function (file) {
                view.fire('file', [file]);
            },
        });

       
    });


    /**
    * 渲染内容。
    *   id: '',   //渲染完成后要打开的模块 id。
    */
    view.on('render', function (id) {
        
        if (id) {
            storage.set('id', id);
        }


        API.get();

       
    });



});


define.panel('/Setting/Header/List', function (require, module, panel) {

    let list = [
        { name: '显示', value: 'show', icon: 'fas fa-window-maximize', },
        { name: '隐藏', value: 'hide', icon: 'far fa-window-maximize', },
    ];


    panel.on('init', function () {

        panel.template(function (item, index) {
            return {
                'index': index,
                'name': item.name,
                'icon': item.icon,
                'value': item.value,
            };
        });

        panel.$on('click', {
            '[type="radio"]': function (event) {
                let { checked, value, } = event.target;
                
                panel.fire('check', [value, list]);
            },
        });
    });


    panel.on('render', function (value) {
       
        panel.fill(list);

        panel.$.find(`[type="radio"][value="${value}"]`).click();

    });



    return {
        
    };

});


define.panel('/Setting/Header', function (require, module, panel) {
    const Header = require('Settings.Header');
    const List = module.require('List');


    panel.on('init', function () {


        List.on({
            'check': function (value, list) {
                Header.set(value);
            },
        });
    });


    panel.on('render', function () {

        let value = Header.get();

        List.render(value);

    });



    return {

    };

});


define.panel('/Setting/Local/List', function (require, module, panel) {

    let list = [
        { name: '简体中文', value: 'chinese', icon: 'fas fa-flag red', },
        { name: 'English', value: 'english', icon: 'fas fa-flag-usa blue', },
    ];


    panel.on('init', function () {

        panel.template(function (item, index) {
            return {
                'index': index,
                'name': item.name,
                'icon': item.icon,
                'value': item.value,
            };
        });

        panel.$on('click', {
            '[type="radio"]': function (event) {
                let { checked, value, } = event.target;
                
                panel.fire('check', [value, list]);
            },
        });
    });


    panel.on('render', function (value) {
       
        panel.fill(list);

        panel.$.find(`[type="radio"][value="${value}"]`).click();

    });



    return {
        
    };

});


define.panel('/Setting/Local', function (require, module, panel) {
    const Local = require('Settings.Language');
    const List = module.require('List');

    panel.on('init', function () {

        List.on({
            'check': function (value, list) {
                Local.set(value);
            },
        });
        
    });


    panel.on('render', function () {

        let value = Local.get();

        List.render(value);

    });



    return {
        
    };

});


define.panel('/Setting/Theme/List', function (require, module, panel) {

    let list = [
        { name: 'Blue', value: 'blue', },
        { name: 'Light', value: 'light', },
    ];


    panel.on('init', function () {

        panel.template(function (item, index) {
            return {
                'index': index,
                'name': item.name,
                'value': item.value,
            };
        });

        panel.$on('click', {
            '[type="radio"]': function (event) {
                let { checked, value, } = event.target;
                
                panel.fire('check', [value, list]);
            },
        });
    });


    panel.on('render', function (value) {
       
        panel.fill(list);

        panel.$.find(`[type="radio"][value="${value}"]`).click();

    });



    return {
        
    };

});


define.panel('/Setting/Theme', function (require, module, panel) {
    const Theme = require('Settings.Theme');
    const List = module.require('List');


    panel.on('init', function () {


        List.on({
            'check': function (value, list) {
                Theme.set(value);
            },
        });
    });


    panel.on('render', function () {

        let value = Theme.get();

        List.render(value);

    });



    return {
        
    };

});


define.view('/Setting', function (require, module, view) {
    const Header = module.require('Header');
    const Theme = module.require('Theme');
    const Local = module.require('Local');

 

    view.on('init', function () {

        
  
    });


    view.on('render', function () {
        Header.render();
        Theme.render();
        Local.render();
    });



    return {

    };

});



define('/Terminal/Command/FileList', function (require, module, exports) {
    const Loading = require('@definejs/loading');
    const Emitter = require('@definejs/emitter');
    const API = require('API');


    let emitter = new Emitter();

    let loading = new Loading({
        mask: 0,
    });


    return {

        on: emitter.on.bind(emitter),

        /**
        * 读取指定文件系统信息。
        */
        get() {
            let api = new API('FileSystem.list', {
                // proxy: '.json',
            });

            api.on({
                'request': function () {
                    loading.show('加载中...');
                },

                'response': function () {
                    loading.hide();
                },

                'success': function (data, json, xhr) {
                    emitter.fire('success', [data]);
                },

                'fail': function (code, msg, json, xhr) {
                    definejs.alert('获取文件列表失败: {0}', msg);
                },

                'error': function (code, msg, json, xhr) {
                    definejs.alert('获取文件列表错误: 网络繁忙，请稍候再试');
                },
            });

            api.get();

        },


    };


});


define('/Terminal/Command/Source', function (require, module, exports) {
    const Query = require('@definejs/query');
    const Emitter = require('@definejs/emitter');

    let emitter = new Emitter();
    let config = definejs.config('API');
    let source = null;



    return exports = {

        on: emitter.on.bind(emitter),

        /**
        * 
        */
        open: function (cmd) {
            let args = cmd.split(' ');

            cmd = args[0];
            args = args.slice(1);

            let url = Query.add(`${config.url}sse/Terminal.exec`, {
                'cmd': cmd,
                'args': JSON.stringify(args),
            });



            //先关闭之前的。
            exports.close();

            source = new EventSource(url);

            source.addEventListener('open', function (event) {
                // console.log('on-open:', event);
            });

            //这个事件名是后端自定义的。
            source.addEventListener('stdout', function (event) {
                let data = JSON.parse(event.data);

                emitter.fire('stdout', [data]);
            });


            source.addEventListener('error', function (event) {
                let { data, } = event;

                //服务器可能已经关闭了，
                //这里也要关闭，否则会不断重发请求到服务器。
                if (data === undefined) {
                    // definejs.alert('服务器可能已经关闭了。')
                    exports.close();
                    return;
                }

                data = JSON.parse(data);

                data.msg = JSON.stringify(JSON.parse(data.msg), null, 4);
            

                emitter.fire('error', [data]);
            });

            source.addEventListener('stderr', function (event) {
                let data = JSON.parse(event.data);

                emitter.fire('stderr', [data]);
            });


           
            source.onmessage = function (event) {
                console.log('onmessage', event)
            };

            

        },


        close() {
            if (!source) {
                return;
            }

            source.close();
            source = null;
            return true;
        },


    };


});

define('/Terminal/Footer/History', function (require, module, exports) {
    const LocalStorage = require('@definejs/local-storage');

    let storage = new LocalStorage(module.id);
    let list = storage.get('list') || [];



    let meta = {
        index: list.length,
    };


    return {
        get(step) {
            let index = meta.index + step;

            if (index < 0 || index >= list.length) {
                return;
            }

            meta.index = index;
            return list[index];
        },

        push(value) {
            list.push(value);
            storage.set('list', list);

            meta.index = list.length;
        },
    };
});

define.panel('/Terminal/Footer/Input', function (require, module, panel) {


    let txt = null;


    panel.on('init', function () {

        txt = panel.$.get(0);

        panel.$.on('keyup', function (event) {
            let keyCode = event.keyCode;
            let value = event.target.value;

            //回车键。
            if (keyCode == 13 && value) {
                panel.fire('enter', [value]);
                event.target.value = '';
                return;
            }

        });

        //这里用 keydown 比较好。
        panel.$.on('keydown', function (event) {
            let keyCode = event.keyCode;

            //向上键或向下键。
            if (keyCode == 38 || keyCode == 40) {
                event.preventDefault();

                //-1: 向上。  +1: 向下。
                let step = keyCode - 39;
                panel.fire('move', [step]);
                return;
            }
        });



        panel.$.on('focusin', function () {
            panel.fire('focus', [true]);
        });

        panel.$.on('focusout', function () {
            panel.fire('focus', [false]);
        });
  
    });




    panel.on('render', function (value) {

        txt.value = value || '';

        setTimeout(() => {
            txt.focus();
        }, 200);

    });



    return {
        
    };






});


define('/Terminal/Logs/List/Colors', function (require, module, exports) {


    let name$codes = {
        reset: [0, 0],

        bold: [1, 22],
        dim: [2, 22],
        italic: [3, 23],
        underline: [4, 24],
        inverse: [7, 27],
        hidden: [8, 28],
        strikethrough: [9, 29],

        black: [30, 39],
        red: [31, 39],
        green: [32, 39],
        yellow: [33, 39],
        blue: [34, 39],
        magenta: [35, 39],
        cyan: [36, 39],
        white: [37, 39],
        gray: [90, 39],

        brightRed: [91, 39],
        brightGreen: [92, 39],
        brightYellow: [93, 39],
        brightBlue: [94, 39],
        brightMagenta: [95, 39],
        brightCyan: [96, 39],
        brightWhite: [97, 39],

        bgBlack: [40, 49],
        bgRed: [41, 49],
        bgGreen: [42, 49],
        bgYellow: [43, 49],
        bgBlue: [44, 49],
        bgMagenta: [45, 49],
        bgCyan: [46, 49],
        bgWhite: [47, 49],
        bgGray: [100, 49],

        bgBrightRed: [101, 49],
        bgBrightGreen: [102, 49],
        bgBrightYellow: [103, 49],
        bgBrightBlue: [104, 49],
        bgBrightMagenta: [105, 49],
        bgBrightCyan: [106, 49],
        bgBrightWhite: [107, 49],
       

    };




    return {
        render(msg) {
            let html = msg;

            Object.keys(name$codes).forEach(function (name) {
                let codes = name$codes[name];
                let open = `\u001b[${codes[0]}m`;
                let close = `\u001b[${codes[1]}m`;

                html = html.split(open).join(`<span class="colors ${name}">`);
                html = html.split(close).join(`</span>`);
            });


            return html;
        },
    };
});



define('/Terminal/Logs/List/File', function (require, module, exports) {

    const $String = require('@definejs/string');

    let meta = {
        fs: null,
        files: [],
    };


    function make(fs) {

        //已经处理过了。
        if (fs === meta.fs) {
            return meta;
        }


        let root = fs.dir;
        let list = Object.keys(fs.file$info);


        if (root.endsWith('/')) {
            root = root.slice(0, -1);
        }

        let files = list.map((item) => {
            let file = `${root}${item.name}`;
            return file;
        });

        //按长度进行倒序，可以避免一个短的文件名无意中成为另一个长的文件名的前缀。
        files = files.sort(function (a, b) {
            return a.length > b.length ? -1 : 1;
        });


      
        meta.fs = fs;
        meta.files = files;

        return meta;

    }



    return {

        render(msg, fs) {
            //不存在文件系统对照数据，则原样返回。
            if (!fs) {
                return msg;
            }


            let { files,  } = make(fs);


            files.forEach((file, index) => {
                let html = `<a data-cmd="file" data-value="{${index}}">{${index}}</a>`;

                msg = $String.replaceAll(msg, file, html);

            });


            msg = $String.format(msg, files);


            return msg;
        },
    };
});



define('/Terminal/Logs/List/HTML', function (require, module, exports) {


    return {
        render(msg) {

            if (typeof msg != 'string') {
                return '';
            }

            // let reg = /[&'"<>\/\\\-\x00-\x09\x0b-\x0c\x1f\x80-\xff]/g;
            let reg = /[<>]/g;

            msg = msg.replace(reg, function (r) {
                return "&#" + r.charCodeAt(0) + ";"
            });



            msg = msg.split(' ').join('<b class="empty"></b>');
            msg = msg.split('│').join('<b class="linkY">│</b>');
            msg = msg.split('\r\n').join('<br />');
            msg = msg.split('\n').join('<br />');
          
            return msg
        },
    };
});



define.panel('/Terminal/Logs/Header', function (require, module, panel) {
    const CheckBox = require('CheckBox');


    let chks = [
        { id: 'time', cmd: 'time', checked: true, fireNow: true, text: '时间', },
        { id: 'color', cmd: 'color', checked: true, fireNow: true, text: '彩色', },
        { id: 'highlight', cmd: 'highlight', checked: false, fireNow: true, text: '高亮当前行', },
        { id: 'border', cmd: 'border', checked: false, fireNow: true, text: '边线', },
    ];

    panel.on('init', function () {
        panel.$on('click', {
            '[data-cmd]': function (event) {
                let { cmd, } = event.currentTarget.dataset;

                panel.fire('cmd', cmd, []);
            },
        });

        chks = chks.map((item) => {
            let chk = new CheckBox({
                'checked': item.checked,
                'fireNow': item.fireNow,
                'text': item.text,
                'container': panel.$.find(`[data-id="chk-${item.id}"]`),
            });

            chk.on('checked', function (checked) {
                panel.fire('check', item.cmd, [checked]);
            });

            return chk;
        });

  
    });




    panel.on('render', function () {
        chks.forEach((chk) => {
            chk.render();
        });
    });

    return {
        close(closed) {
            
        },
    };






});


define.panel('/Terminal/Logs/List', function (require, module, panel) {
    const $Date = require('@definejs/date');
    const Colors = module.require('Colors');
    const File = module.require('File');
    const HTML = module.require('HTML');
   
    let tpl = null;
    let list = [];

    let type$icon = {
        input: `<i class="fas fa-terminal"></i>`,
        info: `<i class="fas fa-info-circle"></i>`,
        stdout: ``,
    };


    panel.on('init', function () {
        
        tpl = panel.template();

        panel.$on('click', {
            '[data-cmd]': function (event) {
                let { cmd, value, } = event.target.dataset;
               
                panel.fire('cmd', [cmd, value]);
            },
        });

  
    });


    


    panel.on('render', function (stdout, fs) {
        let { msg, time, type, } = stdout;

        list.push(stdout);

        time = $Date.format(time, 'HH:mm:ss');
        msg = HTML.render(msg);
        msg = Colors.render(msg);
        msg = File.render(msg, fs);

        type = type || 'stdout';


        let icon = type$icon[type] || '';
        let index = list.length - 1;
        let prev = list[index - 1];
        let isSameTime = false;

        if(prev){
            let time0 = $Date.format(prev.time, 'HH:mm:ss');
            isSameTime = time == time0;
        }

        let html = tpl.fill({
            'time': time,
            'same-time': isSameTime ? 'same' : '',
            'index': index,
            'msg': msg,
            'type': type,
            'icon': icon,
        });


        panel.$.append(html);
        panel.$.find(`[data-index="${index}"]`).get(0).scrollIntoViewIfNeeded();
        
    });

    return {
        add(type, msg) {
            panel.render({
                'type': type,
                'time': Date.now(),
                'msg': msg,
            });
        },

        clear() {
            list = [];
            panel.$.html('');
        },

        showTime(checked) {
            panel.$.toggleClass('hide-time', !checked);
        },

        showColor(checked) {
            panel.$.toggleClass('show-color', checked);
        },

        showHighlight(checked) {
            panel.$.toggleClass('show-highlight', checked);
        },

        showBorder(checked) {
            panel.$.toggleClass('show-border', checked);
        },

        
    };






});


define('/Terminal/Command', function (require, module, exports) {
    const Emitter = require('@definejs/emitter');
    const Source = module.require('Source');
    const FileList = module.require('FileList');

    let emitter = new Emitter();


    let meta = {
        cmd: '',
        fs: null,
        init: false,
    };


    function init() {
        if (meta.init) {
            return;
        }

        meta.init = true;

        FileList.on('success', function (fs) {
            meta.fs = fs;
            Source.open(meta.cmd);
        });


        Source.on('stdout', function (data) {
            data.type = 'stdout';
            emitter.fire('data', [data, meta.fs]);
        });

        Source.on('stderr', function (data) {
            data.type = 'stderr';
            emitter.fire('data', [data, meta.fs]);
        });

        Source.on('error', function (data) {
            data.type = 'error';
            emitter.fire('data', [data, meta.fs]);
        });
    }



    return {
        on: emitter.on.bind(emitter),


        run(cmd) {
            meta.cmd = cmd;
            init();

            if (meta.fs) {
                Source.open(cmd);
            }
            else {
                FileList.get();
            }
        },

        close() {
            return Source.close();
        },
    };
});

define.panel('/Terminal/Footer', function (require, module, panel) {
    const History = module.require('History');
    const Input = module.require('Input');




    panel.on('init', function () {
        


        Input.on({
            'enter': function (value) {
                History.push(value);
                panel.fire('submit', [value]);
            },

            'focus': function (focused) {
                panel.$.toggleClass('focus', focused);
            },

            'move': function (step) {
                let value = History.get(step);
                Input.render(value);
            },
        });
  
    });




    panel.on('render', function () {
       
        Input.render('');

        // panel.fire('change', ['webpart md5 htdocs']);

    });

    return {
        
    };






});


define.panel('/Terminal/Logs', function (require, module, panel) {
    const Header = module.require('Header');
    const List = module.require('List');

   

    panel.on('init', function () {
        
        Header.on({
            'cmd': {
                'clear': function () {
                    List.clear();
                },
                'close': function () {
                    panel.fire('close');
                },
            },

            'check': {
                'time': function (checked) {
                    List.showTime(checked);
                },
                'color': function (checked) {
                    List.showColor(checked);
                },
                'highlight': function (checked) {
                    List.showHighlight(checked);
                },
                'border': function (checked) {
                    List.showBorder(checked);
                },
            },
        });

        

        List.on({
            'cmd': function (cmd, value) {
                panel.fire('cmd', [cmd, value]);
            },
        });
  
    });




    panel.on('render', function (stdout, fs) {
        Header.render();
        List.render(stdout, fs);
        
    });



    return {
        add(cmd) {
            if (cmd == 'clear') {
                List.clear();
                return;
            }
           

            List.add('input', cmd);
            panel.fire('add', [cmd]);
        },

        close(closed) {
            if (closed) {
                List.add('info', '已断开连接');
            }
        },
    };






});


define.view('/Terminal', function (require, module, view) {
    const Command = module.require('Command');
    const Logs = module.require('Logs');
    const Footer = module.require('Footer');


    view.on('init', function () {

        Command.on('data', function (data, fs) {
            Logs.render(data, fs);
        });

        Logs.on({
            'cmd': function (cmd, value) {
                view.fire('cmd', cmd, [value]);
            },

            'close': function () {
                let closed = Command.close();
                Logs.close(closed);
            },

            'add': function (cmd) {
                Command.run(cmd);
            },
        });

        Footer.on({
            'submit': function (cmd) {
                Logs.add(cmd);
            },
        });
  
    });


    view.on('render', function () {
        Footer.render();
    });




});



define('/Tool/JS/Editor/CMD', function (require, module, exports) {

    //把一些额外命令收拢到该模块，
    //主要是为了父模块更简洁些。

    let editor = null;



    /**
    * 使用特定的标记去包裹编辑器中所有选中的文本。
    * 如用 `**` 去加粗。
    *   options = {
    *       empty: false,   //是否允许操作空选中。 如果指定为 true，则会插入为 beginTag + endTag 的内容。
    *   };
    */
    function wrap(beginTag, endTag, options) {
        if (typeof endTag == 'object') {
            options = endTag;
            endTag = '';
        }


        endTag = endTag || beginTag;
        options = options || { empty: false, };


        let list = editor.getSelections();

        let values = list.map(function (item) {

            //没有选中时。
            if (!item) {
                return options.empty ? beginTag + endTag : item;
            }

            if (item.startsWith(beginTag) && item.endsWith(endTag)) {

                return item.slice(beginTag.length, 0 - endTag.length);
            }

            return beginTag + item + endTag;
        });


        editor.replaceSelections(values, list);

        if (list.length < 2) {
            editor.focus();
        }

    }





    return {

        init: function (edt) {
            editor = edt;
        },


        //插入横线。
        hr: function () {
            let hr = '----------\n';
            let info = editor.getCursor(); //info = { line: 100, ch: 12, xRel: 1, };

            //如果所在的光标不是在行的首字符，则在前面加多一个换行。
            if (info.ch > 0) {
                hr = '\n' + hr;
            }

            editor.replaceSelection(hr);
        },


        redo: function () {
            editor.redo();
        },

        undo: function () {
            editor.undo();
        },

        bold: function () {
            wrap('**');
        },

        italic: function () {
            wrap('*');

        },

        code: function () {
            wrap('`');
        },
       

        link: function () {
            wrap('[', '](http://)', { empty: true, });
        },


        image: function () {
            wrap('![', '](http://)', { empty: true, });
        },


        quote: function () {
            let list = editor.getSelections();
            let values = list.map(function (item) {
                if (!item) {
                    return '\n\n> \n\n';
                }

                return '\n\n> ' + item + '\n\n';
                
            });

            editor.replaceSelections(values, list);

            if (values.length < 2) {
                editor.focus();
            }
            
        },

        ol: function () {
            let list = editor.getSelections();

            let values = list.map(function (item) {
                if (!item) {
                    return '\n 1. ';
                }

                let lines = item.split('\n');

                lines = lines.map(function (line, index) {
                    //取消作为列表 item。
                    let matchs =
                        line.match(/^ \d\. /g) ||
                        line.match(/^\d\. /g);

                    if (matchs) {
                        return line.slice(matchs[0].length);
                    }


                    let no = index + 1;

                    return ' ' + no + '. ' + line;
                });

                return lines.join('\n');
               

            });

            editor.replaceSelections(values, list);

        },

        ul: function () {
            let list = editor.getSelections();

            let values = list.map(function (item) {
                if (!item) {
                    return '\n - ';
                }

                


                let lines = item.split('\n');

                lines = lines.map(function (line, index) {
                    //取消作为列表 item。
                    if (line.startsWith(' - ')) {
                        return line.slice(3);
                    }

                    //取消作为列表 item。 
                    if (line.startsWith('- ')) {
                        return line.slice(2);
                    }

                    return ' - ' + line;
                });

                return lines.join('\n');


            });

            editor.replaceSelections(values, list);

        },

        

    };





});



define('/Tool/JS/Editor/File', function (require, module, exports) {
    const $Date = require('@definejs/date');
    const $String = require('@definejs/string');
    const Loading = require('@definejs/loading');
    const File = require('File');

    let loading = new Loading({
        mask: 0,
    });





    return {

        /**
        * 上传粘贴板中的文件。
        *   file: File,         //必选，DOM 节点中的 input[type="file"] 元素中获取到的对象。
        *   done: function,     //可选，上传完成后的回调。
        */
        upload: function (file, done) {
            let now = new Date();
            let date = $Date.format(now, 'yyyy-MM-dd');
            let time = $Date.format(now, 'HHmmss');

            let dir = 'upload/paste/' + date + '/';
            let name = time + '-' + $String.random(4) + '.png';


            loading.show('上传中...');


            File.upload({
                'file': file,
                'dir': dir,
                'name': name,

                'done': function (data) {
                    loading.hide();

                    if (!data) {
                        definejs.alert('上传失败');
                        return;
                    }

                    let sample = '![]({dest})';
                    let md = $String.format(sample, data);

                    done && done(md, data);

                },
            });
        },

        /**
        * 
        */
        paste: function () {

        },
    };





});



define('/Tool/JS/Editor/Table', function (require, module, exports) {
  

    function map(count, fn) {
        let list = [];
        let item = null;

        for (let i = 0; i < count; i++) {
            item = fn(i, i == count - 1);

            if (item !== null) {
                list.push(item);
            }
        }

        return list;
    }



    return {
        /**
        * 创建表格。
        *   options = {
        *       row: 0,
        *       cell: 0,
        *   };
        * 最终效果如: 
        *   |  列1  |  列2  |  列3  |
        *   |-------|-------|-------|
        *   |       |       |   1   |
        *   |       |       |   2   |
        *   |       |       |   3   |
        * 每列的最后一个单元格要加点内容，才能把整行的高度撑开。
        * 特别是最后一行的最后一个单元格，必须要有点内容，否则会丢失它。
        * 为了直观，就干脆加行号当内容算了。
        */
        create: function (options) {
            let row = options.row;
            let cell = options.cell;


            //表头。 如:
            //|  列1  |  列2  |  列3  |
            let headers = map(cell, function (index, isLast) {
                let item = '|  列' + (index + 1) + '  ';

                if (isLast) {
                    item += '|';
                }

                return item;
            });


            //分隔线。 如: 
            //|-------|-------|-------|
            let spliters = map(cell, function (index, isLast) {
                let item = '|-------';

                if (isLast) {
                    item += '|';
                }

                return item;
            });


            //表体行。 如:
            //|       |       |   1   |
            //|       |       |   2   |
            //|       |       |   3   |
            let rows = map(row, function (no) {
                let order = no + 1;

                let cells = map(cell, function (index, isLast) {

                    return isLast ? '|   ' + order + '   |' : '|       ';
                });

                return cells;
            });


            let table = [
                headers,
                spliters,
                ...rows,
            ];

            table = table.join('\n');
            table = table.replace(/,/g, ''); //去掉里面的逗号。

            table = '\n\n' + table + '\n\n'; //前后插入多两个空行，可以解决在文本行内插入表格的问题。


            return table;

        },
    };





});



define.panel('/Tool/JS/Editor', function (require, module, panel) {
    const File = module.require('File');
    const CMD = module.require('CMD');
    const Table = module.require('Table');
    const Headers = module.require('Headers');

    let passive = false;    //是否被动的滚动。 即是否由于外面调用而引起的滚动。
    let editor = null;
    let doc = null;
    let txt = panel.$.find('textarea').get(0);

    let ext$mode = {
        '.js': 'javascript',
        '.json': 'javascript',
        '.css': 'css',
        '.less': 'css',
        '.htm': 'htmlmixed',
        '.html': 'htmlmixed',
    };

    let meta = {
        ext: '',

    };



    panel.on('init', function () {

        editor = CodeMirror.fromTextArea(txt, {
            mode: 'gfm',
            //mode: 'css',
            //theme: 'midnight',
            cursorHeight: 1,
            lineNumbers: true,
            lineWrapping: true,         //是否自动换行。
            styleActiveLine: true,
            smartIndent: false,
            indentUnit: 4,
            tabSize: 4,
            
            //viewportMargin: Infinity, //全部生成 DOM 节点，能性能消耗很大。
        });

        doc = editor.getDoc();




        editor.on('scroll', function () {
            if (passive) {
                passive = false;
                return;
            }

            let info = editor.getScrollInfo();
            panel.fire('scroll', [info]);

        });




        editor.on('change', function () {
            let doc = editor.getDoc()
            let value = doc.getValue();

            value = value.split('\t').join('    ');

            panel.fire('change', [{
                'content': value,
                'ext': meta.ext,
            }]);
            
        });


        panel.$.on('keydown', function (event) {
            //metaKey 为 MacOS 的 `command` 键。
            let isSave = (event.ctrlKey || event.metaKey) && event.key == 's';

            if (!isSave) {
                return;
            }

            event.preventDefault();
            panel.fire('save');
        });

        CMD.init(editor);

        
    });


    //这个事件要放在外面才能监听到文件。
    panel.$.on('paste', function (event) {
        let clipboardData = event.originalEvent.clipboardData;
        let file = clipboardData.files[0];

        if (!file || file.type != 'image/png') {
            return;
        }
       
        File.upload(file, function (md, data) {
            editor.replaceSelection(md);
        });

    });



    /**
    * 渲染。
    *   opt = {
    *       content: '',    //内容。
    *       ext: '',        //扩展名，以此来确定类型。 如 '.json'。
    *   };
    */
    panel.on('render', function (opt = {}) {
        let content = opt.content || ``;
        let ext = opt.ext || '.js';
        let mode = ext$mode[ext.toLowerCase()] || 'gfm';

        meta.ext = ext;

        editor.setOption('mode', mode);

        doc.setValue(content); //会触发 editor.change 事件。


        //详见：http://www.91r.net/ask/8349571.html
        setTimeout(function () {
            editor.refresh();
        }, 100);

    
      
    });




    let exports ={
        /**
        *   preview = {
        *       top: 0,         //
        *       height: 0,      //
        *   };
        */
        scroll: function (preview) {
            let info = editor.getScrollInfo();
            let top = (info.height - info.clientHeight) * preview.top / (preview.height - info.clientHeight);

            passive = true;
            editor.scrollTo(0, top);
        },

        setTheme: function (name) {
            editor.setOption('theme', name);
        },

        call: function (name) {
            CMD[name]();
        },

       

        set: function (key, value) {
            editor.setOption(key, value);
        },

        highlight(no) {
            const $ = require('$');
            let $lines = panel.$.find(`.CodeMirror-code[role="presentation"]>div`);

            $lines.removeClass('on');
            $($lines[no - 1]).addClass('on');
           
        },
    };


    return exports;

});


define('/Tool/JS/Header/Switch', function (require, module, exports) {
    const $Object = require('@definejs/object');
    const Storage = require('@definejs/local-storage');
    const $ = require('$');

    let storage = new Storage(module.id);


    let meta = {
        panel: null,
        act$on: null,
    };
    
    
    return {
        init(panel) {
            meta.panel = panel;

            meta.act$on = storage.get() || {
                'crlf': false,
                'fullscreen': false,
            };

            $Object.each(meta.act$on, function (act, on) {
                let $el = panel.$.find(`[data-cmd="switch:${act}"]`);

                //先置反，点击时再置反就得正。                
                meta.act$on[act] = !on;

                $el.click();
            });


        },

        toggle(el) {
            let { panel, act$on, } = meta;

            let { cmd, } = el.dataset;
            let act = cmd.split(':')[1];
            let on = act$on[act] = !act$on[act];

            storage.set(act$on);

            $(el).toggleClass('on', on);
            panel.fire('switch', act, [on]);
        },
    };

});
define.panel('/Tool/JS/Header', function (require, module, panel) {
    const CheckBox = require('CheckBox');
    const Switch = module.require('Switch');




   

    panel.on('init', function () {
        

        panel.$.on('click', '[data-cmd]', function (event) {
            let { cmd, } = this.dataset;
            
            let list = cmd.split(':');
            let target = list.length > 1 ? list[0] : '';
            let act = list.length > 1 ? list[1] : cmd;

            if (!target) {
                panel.fire('cmd', cmd, []);
                return;
            }


            //针对 editor 的。
            if (target == 'editor') {
                panel.fire('editor', [act]);
                return;
            }

            if (target == 'switch') {
                Switch.toggle(this);
                return;
            }

        });


       

      
    });



    /**
    * 渲染。
    */
    panel.on('render', function () {
        Switch.init(panel);

        

    });


    return {
        set(md5) {
            panel.$.find('[data-id="md5"]').html(md5);
            panel.$.find('[data-cmd="copy"]').toggle(!!md5);
        },
    };


});



define.panel('/Tool/JS/Preview', function (require, module, panel) {
    const MarkDoc = require('MarkDoc');

    let $div = panel.$.find('[data-id="markdoc"]');
    let passive = false;    //是否被动的滚动。 即是否由于外面调用而引起的滚动。
    let markdoc = null;

    //需要保持为代码模式展示的。 
    let exts = [ '.json', '.js', '.css', '.less', '.html', '.htm', ];
    //let headers = [];
  


    panel.on('init', function () {
        markdoc = new MarkDoc({
            'container': $div.get(0),
        });

        markdoc.on('hash', function (href) {
            panel.fire('hash', [href]);
        });


        markdoc.on('render', function (info) {
            let list = markdoc.getOutlines();
            panel.fire('render', [list]);

        });



        panel.$.on('scroll', function (event) {
            if (passive) {
                passive = false;
                return;
            }

            let height = $div.outerHeight();
            let top = panel.$.get(0).scrollTop;

            panel.fire('scroll', [{
                'height': height,
                'top': top,
            }]);

        });

        panel.$on('click', {
            '[data-cmd="compile"]': function (event) {
                panel.fire('compile');
            },
        });

       
    });



    /**
    * 渲染。
    *   opt = {
    *       content: '',                    //文件内容。
    *       ext: '',                        //如 `.json`。
    *       minify: false,                  
    *   };
    */
    panel.on('render', function (opt) {
        panel.$.toggleClass('markdoc-mode', !!opt);

        if (!opt) {
            return;
        }


        let { content, ext, minify, } = opt;
        let language = '';

        if (exts.includes(ext)) {
            language = ext.slice(1);
        }

        markdoc.render({
            'content': content,
            'language': language,
            'sample': minify ? 'code' : 'pre',
            
            'code': {
                'language': false,
                'numbers': !minify,
            },
        });

        markdoc.$.toggleClass('minify', minify);


        

    });

    return {

        /**
        *   editor = {
        *       left: 0,            //
        *       top: 0,             //
        *       height: 0,          //
        *       width: 0,           //
        *       clientHeight: 0,    //
        *   };
        */
        scroll(editor) {
            let height = $div.outerHeight();
            let top = (height - editor.clientHeight) * editor.top / (editor.height - editor.clientHeight);

            passive = true;
            panel.$.get(0).scrollTo(0, top);
        },


        
       
      
       

    };



});



define.panel('/Tool/JS/Themes/List', function (require, module, panel) {
    const Tabs = require('@definejs/tabs');

    let tabs = null;

    let list = [
        { name: 'default', },
        { name: 'custom', desc: '深色', },
        { name: '3024-day', },
        { name: '3024-night', desc: '深色', },
        { name: 'ambiance-mobile', },
        { name: 'ambiance', desc: '深色', },
        { name: 'base16-dark', desc: '深色', },
        { name: 'base16-light', },
        { name: 'blackboard', desc: '深色', },
        { name: 'cobalt', desc: '深色', },
        { name: 'eclipse', },
        { name: 'elegant', },
        { name: 'erlang-dark', desc: '深色', },
        { name: 'lesser-dark', desc: '深色', },
        { name: 'mbo', desc: '深色', },
        { name: 'mdn-like', },
        { name: 'midnight', desc: '深色', },
        { name: 'monokai', desc: '深色', },
        { name: 'neat', },
        { name: 'neo', },
        { name: 'night', desc: '深色', },
        { name: 'paraiso-dark', desc: '深色', },
        { name: 'paraiso-light', },
        { name: 'pastel-on-dark', desc: '深色', },
        { name: 'rubyblue', desc: '深色', },
        { name: 'solarized', },
        { name: 'the-matrix', desc: '深色', },
        { name: 'tomorrow-night-eighties', desc: '深色', },
        { name: 'twilight', desc: '深色', },
        { name: 'vibrant-ink', desc: '深色', },
        { name: 'xq-dark', desc: '深色', },
        { name: 'xq-light', },
    ];



    panel.set('show', false);

    panel.on('init', function () {
        
        tabs = new Tabs({
            container: panel.$,
            selector: '>li',
            activedClass: 'on',
        });

        tabs.on('change', function (item, index) {
          

            item = list[index];
            panel.fire('item', [item, index]);
        });



        panel.$.on('click', '[data-index]', function (event) {
            let index = + this.dataset.index;
            tabs.active(index);
        });

        panel.template({
            '': function (data) {
                let items = this.fill('item', data.list);

                return {
                    'items': items,
                };
            },

            'item': {
                '': function (item, index) {
                    let desc = this.fill('desc', item);

                    return {
                        'index': index,
                        'name': item.name,
                        'desc': desc,
                    };
                },

                'desc': function (item) {
                    return item.desc ? { 'desc': item.desc, } : '';
                },
            },
        });
    });




    panel.on('render', function (index) {
        
        panel.fill({ 'list': list, });

        if (typeof index == 'number') {
            tabs.active(index);
        }

       
    });


    return {
        active: function (index) {
            tabs.active(index);
        },

        slide: function (visible, fn) {
            if (!visible) {
                panel.$.slideUp('fast', fn);
                return;
            }

            //向下弹出以展示。
            panel.$.slideDown('fast', function () {
                //把当前选中的项滚到可视范围内。
                let index = tabs.getActivedIndex();
                let li = panel.$.find(`li[data-index="${index}"]`).get(0);
              
                li.scrollIntoViewIfNeeded();

                fn && fn();
            });
        },
    };


});


define.panel('/Tool/JS/Themes/Mask', function (require, module, panel) {
    const Masker = require('@definejs/masker');

    let mask = null;
    let visible = false;
   

    panel.on('init', function () {
        mask = new Masker({
            volatile: true, //易消失。
            opacity: 0,
            //opacity: 0.04,

            //'z-index': -1, //测试。
        });

        mask.on({
            'hide': function () {
                visible = false;
                panel.fire('hide');
            },
            'show': function () {
                visible = true;
                panel.fire('show');
            },
        });

    });






    panel.on('render', function () {
       
    });



    return {
        toggle: function () {
            if (!visible) {
                mask.show();
            }
            else {
                mask.hide();
            }
        },
    };


});


define.panel('/Tool/JS/Themes', function (require, module, panel) {
    const Storage = require('@definejs/local-storage');
    const List = module.require('List');
    const Mask = module.require('Mask');
   

    let storage = null;

    panel.set('show', false);

    panel.on('init', function () {
        storage = new Storage(module.id);

        Mask.on({
            'show': function () {
                panel.$.addClass('show');
                List.slide(true);
            },

            'hide': function () {
                List.slide(false);
                panel.$.removeClass('show');
            },
        });

        List.on({
            'item': function (item, index) {
                storage.set('index', index);
                panel.fire('item', [item.name]);
            },
        });
    });



    panel.on('render', function (index) {
        if (typeof index == 'number') {
            storage.set('index', index);
        }
        else {
            index = storage.get('index') || 1;
        }

        List.render(index);
        Mask.render();

    });


    return {
        toggle: function () {
            Mask.toggle();
        },
    };

    

});



define('/Tool/JS/API', function (require, module, exports) {
    const Emitter = require('@definejs/emitter');
    const Loading = require('@definejs/loading');
    const API = require('API');


    let emitter = new Emitter();

    let loading = new Loading({
        mask: 0,
    });




    return {
        on: emitter.on.bind(emitter),

        /**
        * 压缩。
        */
        minify: function (content) {
            let api = new API('JS.minify', {
                // proxy: '.json',
            });


            api.on({
                'request': function () {
                    loading.show('压缩中...');
                },

                'response': function () {
                    loading.hide();
                },

                'success': function (data, json, xhr) {
                    emitter.fire('success', [data]);
                },

                'fail': function (code, msg, json, xhr) {
                    let error = json.data;

                    definejs.alert(`压缩 js 失败: ${msg}，所在行号：${error.line}`, function () {
                        emitter.fire('fail', [error]);
                    });
                },

                'error': function (code, msg, json, xhr) {
                    definejs.alert('压缩 js 错误: 网络繁忙，请稍候再试');
                },
            });


            api.post({
                'content': content,
            });



        },
       

    };


});


define('/Tool/JS/Data', function (require, module, exports) {
    const Storage = require('@definejs/local-storage');

    let storage = new Storage(module.id);

    let defaultContent =
        
`//请输入 js 代码内容。
function test() {
    
}
`;

    
    
    let meta = {
        'content': storage.get('content') || defaultContent,
    };


    return exports = {

        get() {
            return meta.content;
        },

        set(content) {
            meta.content = content;
            storage.set('content', content);

            return content;
        },
        

      
    };


});



define.panel('/Tool/JS', function (require, module, panel) {
    const Clipboard = require('Clipboard');

    const Data = module.require('Data');
    const API = module.require('API');
    const Editor = module.require('Editor');
    const Preview = module.require('Preview');
    const Themes = module.require('Themes');
    const Header = module.require('Header');



    let meta = {
        content: '',
        js: '',
    };

    panel.on('init', function () {

        API.on({
            'success': function ({ js, md5, }) {
                meta.js = js;

                Header.set(md5);

                Preview.render({
                    'content': js,
                    'ext': '.js',
                    'minify': true,
                });
            },
            'fail': function (error) {
                Editor.highlight(error.line);
            },
        });


        Header.on({
            'cmd': {
                'themes': function () {
                    Themes.toggle();
                },
                'copy': function () {
                    Clipboard.copy(meta.js);
                },
            },


            'editor': function (cmd) {
                Editor.call(cmd);
            },

            'switch': {
                'crlf': function (on) {
                    Editor.set('lineWrapping', on);
                },
                'fullscreen': function (on) {
                    panel.fire('fullscreen', [on]);
                },
                'column': function (on) {
                    panel.$.toggleClass('full-editor', !on);
                },
            },
            
        });

        Themes.on({
            'item': function (name) {
                Editor.setTheme(name);
            },
        });


        Editor.on({
            'scroll': function (info) {
                Preview.scroll(info);
            },

            //填充内容、修改内容时，都会触发。
            'change': function ({ content, }) {
                meta.content = content;
                Data.set(content);
                Header.set('');
                Preview.render();
            },
        });


        Preview.on({
            'compile': function () {
                API.minify(meta.content);
            },
            'scroll': function (info) {
                Editor.scroll(info);
            },
        });

       


    });


    /**
    * 渲染内容。
    * 处理的优先级如下：
    */
    panel.on('render', function (value) {
        let content = value || Data.get();

        Editor.render({ content, });
        Header.render();
        Themes.render();

        if (value) {
            API.minify(value);
        }

    });



});


define('/Tool/Less/Editor/CMD', function (require, module, exports) {

    //把一些额外命令收拢到该模块，
    //主要是为了父模块更简洁些。

    let editor = null;



    /**
    * 使用特定的标记去包裹编辑器中所有选中的文本。
    * 如用 `**` 去加粗。
    *   options = {
    *       empty: false,   //是否允许操作空选中。 如果指定为 true，则会插入为 beginTag + endTag 的内容。
    *   };
    */
    function wrap(beginTag, endTag, options) {
        if (typeof endTag == 'object') {
            options = endTag;
            endTag = '';
        }


        endTag = endTag || beginTag;
        options = options || { empty: false, };


        let list = editor.getSelections();

        let values = list.map(function (item) {

            //没有选中时。
            if (!item) {
                return options.empty ? beginTag + endTag : item;
            }

            if (item.startsWith(beginTag) && item.endsWith(endTag)) {

                return item.slice(beginTag.length, 0 - endTag.length);
            }

            return beginTag + item + endTag;
        });


        editor.replaceSelections(values, list);

        if (list.length < 2) {
            editor.focus();
        }

    }





    return {

        init: function (edt) {
            editor = edt;
        },


        //插入横线。
        hr: function () {
            let hr = '----------\n';
            let info = editor.getCursor(); //info = { line: 100, ch: 12, xRel: 1, };

            //如果所在的光标不是在行的首字符，则在前面加多一个换行。
            if (info.ch > 0) {
                hr = '\n' + hr;
            }

            editor.replaceSelection(hr);
        },


        redo: function () {
            editor.redo();
        },

        undo: function () {
            editor.undo();
        },

        bold: function () {
            wrap('**');
        },

        italic: function () {
            wrap('*');

        },

        code: function () {
            wrap('`');
        },
       

        link: function () {
            wrap('[', '](http://)', { empty: true, });
        },


        image: function () {
            wrap('![', '](http://)', { empty: true, });
        },


        quote: function () {
            let list = editor.getSelections();
            let values = list.map(function (item) {
                if (!item) {
                    return '\n\n> \n\n';
                }

                return '\n\n> ' + item + '\n\n';
                
            });

            editor.replaceSelections(values, list);

            if (values.length < 2) {
                editor.focus();
            }
            
        },

        ol: function () {
            let list = editor.getSelections();

            let values = list.map(function (item) {
                if (!item) {
                    return '\n 1. ';
                }

                let lines = item.split('\n');

                lines = lines.map(function (line, index) {
                    //取消作为列表 item。
                    let matchs =
                        line.match(/^ \d\. /g) ||
                        line.match(/^\d\. /g);

                    if (matchs) {
                        return line.slice(matchs[0].length);
                    }


                    let no = index + 1;

                    return ' ' + no + '. ' + line;
                });

                return lines.join('\n');
               

            });

            editor.replaceSelections(values, list);

        },

        ul: function () {
            let list = editor.getSelections();

            let values = list.map(function (item) {
                if (!item) {
                    return '\n - ';
                }

                


                let lines = item.split('\n');

                lines = lines.map(function (line, index) {
                    //取消作为列表 item。
                    if (line.startsWith(' - ')) {
                        return line.slice(3);
                    }

                    //取消作为列表 item。 
                    if (line.startsWith('- ')) {
                        return line.slice(2);
                    }

                    return ' - ' + line;
                });

                return lines.join('\n');


            });

            editor.replaceSelections(values, list);

        },

        

    };





});



define('/Tool/Less/Editor/File', function (require, module, exports) {
    const $Date = require('@definejs/date');
    const $String = require('@definejs/string');
    const Loading = require('@definejs/loading');
    const File = require('File');

    let loading = new Loading({
        mask: 0,
    });





    return {

        /**
        * 上传粘贴板中的文件。
        *   file: File,         //必选，DOM 节点中的 input[type="file"] 元素中获取到的对象。
        *   done: function,     //可选，上传完成后的回调。
        */
        upload: function (file, done) {
            let now = new Date();
            let date = $Date.format(now, 'yyyy-MM-dd');
            let time = $Date.format(now, 'HHmmss');

            let dir = 'upload/paste/' + date + '/';
            let name = time + '-' + $String.random(4) + '.png';


            loading.show('上传中...');


            File.upload({
                'file': file,
                'dir': dir,
                'name': name,

                'done': function (data) {
                    loading.hide();

                    if (!data) {
                        definejs.alert('上传失败');
                        return;
                    }

                    let sample = '![]({dest})';
                    let md = $String.format(sample, data);

                    done && done(md, data);

                },
            });
        },

        /**
        * 
        */
        paste: function () {

        },
    };





});



define('/Tool/Less/Editor/Table', function (require, module, exports) {
  

    function map(count, fn) {
        let list = [];
        let item = null;

        for (let i = 0; i < count; i++) {
            item = fn(i, i == count - 1);

            if (item !== null) {
                list.push(item);
            }
        }

        return list;
    }



    return {
        /**
        * 创建表格。
        *   options = {
        *       row: 0,
        *       cell: 0,
        *   };
        * 最终效果如: 
        *   |  列1  |  列2  |  列3  |
        *   |-------|-------|-------|
        *   |       |       |   1   |
        *   |       |       |   2   |
        *   |       |       |   3   |
        * 每列的最后一个单元格要加点内容，才能把整行的高度撑开。
        * 特别是最后一行的最后一个单元格，必须要有点内容，否则会丢失它。
        * 为了直观，就干脆加行号当内容算了。
        */
        create: function (options) {
            let row = options.row;
            let cell = options.cell;


            //表头。 如:
            //|  列1  |  列2  |  列3  |
            let headers = map(cell, function (index, isLast) {
                let item = '|  列' + (index + 1) + '  ';

                if (isLast) {
                    item += '|';
                }

                return item;
            });


            //分隔线。 如: 
            //|-------|-------|-------|
            let spliters = map(cell, function (index, isLast) {
                let item = '|-------';

                if (isLast) {
                    item += '|';
                }

                return item;
            });


            //表体行。 如:
            //|       |       |   1   |
            //|       |       |   2   |
            //|       |       |   3   |
            let rows = map(row, function (no) {
                let order = no + 1;

                let cells = map(cell, function (index, isLast) {

                    return isLast ? '|   ' + order + '   |' : '|       ';
                });

                return cells;
            });


            let table = [
                headers,
                spliters,
                ...rows,
            ];

            table = table.join('\n');
            table = table.replace(/,/g, ''); //去掉里面的逗号。

            table = '\n\n' + table + '\n\n'; //前后插入多两个空行，可以解决在文本行内插入表格的问题。


            return table;

        },
    };





});



define.panel('/Tool/Less/Editor', function (require, module, panel) {
    const File = module.require('File');
    const CMD = module.require('CMD');
    const Table = module.require('Table');
    const Headers = module.require('Headers');

    let passive = false;    //是否被动的滚动。 即是否由于外面调用而引起的滚动。
    let editor = null;
    let doc = null;
    let txt = panel.$.find('textarea').get(0);

    let ext$mode = {
        '.js': 'javascript',
        '.json': 'javascript',
        '.css': 'css',
        '.less': 'css',
        '.htm': 'htmlmixed',
        '.html': 'htmlmixed',
    };

    let meta = {
        ext: '',

    };



    panel.on('init', function () {

        editor = CodeMirror.fromTextArea(txt, {
            mode: 'gfm',
            //mode: 'css',
            //theme: 'midnight',
            cursorHeight: 1,
            lineNumbers: true,
            lineWrapping: true,         //是否自动换行。
            styleActiveLine: true,
            smartIndent: false,
            indentUnit: 4,
            tabSize: 4,
            
            //viewportMargin: Infinity, //全部生成 DOM 节点，能性能消耗很大。
        });

        doc = editor.getDoc();




        editor.on('scroll', function () {
            if (passive) {
                passive = false;
                return;
            }

            let info = editor.getScrollInfo();
            panel.fire('scroll', [info]);

        });




        editor.on('change', function () {
            let doc = editor.getDoc()
            let value = doc.getValue();

            value = value.split('\t').join('    ');

            panel.fire('change', [{
                'content': value,
                'ext': meta.ext,
            }]);
            
        });


        panel.$.on('keydown', function (event) {
            //metaKey 为 MacOS 的 `command` 键。
            let isSave = (event.ctrlKey || event.metaKey) && event.key == 's';

            if (!isSave) {
                return;
            }

            event.preventDefault();
            panel.fire('save');
        });

        CMD.init(editor);

        
    });


    //这个事件要放在外面才能监听到文件。
    panel.$.on('paste', function (event) {
        let clipboardData = event.originalEvent.clipboardData;
        let file = clipboardData.files[0];

        if (!file || file.type != 'image/png') {
            return;
        }
       
        File.upload(file, function (md, data) {
            editor.replaceSelection(md);
        });

    });



    /**
    * 渲染。
    *   opt = {
    *       content: '',    //内容。
    *       ext: '',        //扩展名，以此来确定类型。 如 '.json'。
    *   };
    */
    panel.on('render', function (opt = {}) {
        let content = opt.content || ``;
        let ext = opt.ext || '.less';
        let mode = ext$mode[ext.toLowerCase()] || 'gfm';

        meta.ext = ext;

        editor.setOption('mode', mode);

        doc.setValue(content); //会触发 editor.change 事件。


        //详见：http://www.91r.net/ask/8349571.html
        setTimeout(function () {
            editor.refresh();
        }, 100);

    
      
    });




    let exports ={
        /**
        *   preview = {
        *       top: 0,         //
        *       height: 0,      //
        *   };
        */
        scroll: function (preview) {
            let info = editor.getScrollInfo();
            let top = (info.height - info.clientHeight) * preview.top / (preview.height - info.clientHeight);

            passive = true;
            editor.scrollTo(0, top);
        },

        setTheme: function (name) {
            editor.setOption('theme', name);
        },

        call: function (name) {
            CMD[name]();
        },

       

        set: function (key, value) {
            editor.setOption(key, value);
        },

        highlight(no) {
            const $ = require('$');
            let $lines = panel.$.find(`.CodeMirror-code[role="presentation"]>div`);

            $lines.removeClass('on');
            $($lines[no - 1]).addClass('on');
           
        },
    };


    return exports;

});


define('/Tool/Less/Header/Switch', function (require, module, exports) {
    const $Object = require('@definejs/object');
    const Storage = require('@definejs/local-storage');
    const $ = require('$');

    let storage = new Storage(module.id);


    let meta = {
        panel: null,
        act$on: null,
    };
    
    
    return {
        init(panel) {
            meta.panel = panel;

            meta.act$on = storage.get() || {
                'crlf': true,
                'fullscreen': false,
                'column': true,
            };

            $Object.each(meta.act$on, function (act, on) {
                let $el = panel.$.find(`[data-cmd="switch:${act}"]`);

                //先置反，点击时再置反就得正。                
                meta.act$on[act] = !on;

                $el.click();
            });


        },

        toggle(el) {
            let { panel, act$on, } = meta;

            let { cmd, } = el.dataset;
            let act = cmd.split(':')[1];
            let on = act$on[act] = !act$on[act];

            storage.set(act$on);

            $(el).toggleClass('on', on);
            panel.fire('switch', act, [on]);
        },
    };

});
define.panel('/Tool/Less/Header', function (require, module, panel) {
    const CheckBox = require('CheckBox');
    const Switch = module.require('Switch');




    let chks = [
        { id: 'minify', text: '压缩', checked: false, chk: null, },
    ];

    panel.on('init', function () {
        chks.forEach((item) => {
            let chk = new CheckBox({
                'fireNow': true,
                'container': panel.$.find(`[data-id="chk-${item.id}"]`),
                'text': item.text,
            });

            chk.on('checked', function (checked) {
                panel.fire('check', [{
                    [item.id]: checked,
                }]);
            });

            item.chk = chk;
        });


        panel.$.on('click', '[data-cmd]', function (event) {
            let { cmd, } = this.dataset;
            
            let list = cmd.split(':');
            let target = list.length > 1 ? list[0] : '';
            let act = list.length > 1 ? list[1] : cmd;

            if (!target) {
                panel.fire('cmd', cmd, []);
                return;
            }


            //针对 editor 的。
            if (target == 'editor') {
                panel.fire('editor', [act]);
                return;
            }

            if (target == 'switch') {
                Switch.toggle(this);
                return;
            }

        });


       

      
    });



    /**
    * 渲染。
    */
    panel.on('render', function () {
        Switch.init(panel);

        chks.forEach((item) => {
            item.chk.render({
                'checked': item.checked,
            });
        });

    });


    return {
        set(md5) {
            panel.$.find('[data-id="md5"]').html(md5);

            panel.$.find('[data-cmd="copy"]').toggle(!!md5);
        },
    };


});



define.panel('/Tool/Less/Preview', function (require, module, panel) {
    const MarkDoc = require('MarkDoc');

    let $div = panel.$.find('[data-id="markdoc"]');
    let passive = false;    //是否被动的滚动。 即是否由于外面调用而引起的滚动。
    let markdoc = null;

    //需要保持为代码模式展示的。 
    let exts = [ '.json', '.js', '.css', '.less', '.html', '.htm', ];
    //let headers = [];
  


    panel.on('init', function () {
        markdoc = new MarkDoc({
            'container': $div.get(0),
        });

        markdoc.on('hash', function (href) {
            panel.fire('hash', [href]);
        });


        markdoc.on('render', function (info) {
            let list = markdoc.getOutlines();
            panel.fire('render', [list]);

        });



        panel.$.on('scroll', function (event) {
            if (passive) {
                passive = false;
                return;
            }

            let height = $div.outerHeight();
            let top = panel.$.get(0).scrollTop;

            panel.fire('scroll', [{
                'height': height,
                'top': top,
            }]);

        });

        panel.$on('click', {
            '[data-cmd="compile"]': function (event) {
                panel.fire('compile');
            },
        });

       
    });



    /**
    * 渲染。
    *   opt = {
    *       content: '',                    //文件内容。
    *       ext: '',                        //如 `.json`。
    *       minify: false,                  
    *   };
    */
    panel.on('render', function (opt) {
        panel.$.toggleClass('markdoc-mode', !!opt);

        if (!opt) {
            return;
        }


        let { content, ext, minify, } = opt;
        let language = '';

        if (exts.includes(ext)) {
            language = ext.slice(1);
        }

        markdoc.render({
            'content': content,
            'language': language,
            'sample': minify ? 'code' : 'pre',
            
            'code': {
                'language': false,
                'numbers': !minify,
            },
        });

        markdoc.$.toggleClass('minify', minify);


        

    });

    return {

        /**
        *   editor = {
        *       left: 0,            //
        *       top: 0,             //
        *       height: 0,          //
        *       width: 0,           //
        *       clientHeight: 0,    //
        *   };
        */
        scroll(editor) {
            let height = $div.outerHeight();
            let top = (height - editor.clientHeight) * editor.top / (editor.height - editor.clientHeight);

            passive = true;
            panel.$.get(0).scrollTo(0, top);
        },


        
       
      
       

    };



});



define.panel('/Tool/Less/Themes/List', function (require, module, panel) {
    const Tabs = require('@definejs/tabs');

    let tabs = null;

    let list = [
        { name: 'default', },
        { name: 'custom', desc: '深色', },
        { name: '3024-day', },
        { name: '3024-night', desc: '深色', },
        { name: 'ambiance-mobile', },
        { name: 'ambiance', desc: '深色', },
        { name: 'base16-dark', desc: '深色', },
        { name: 'base16-light', },
        { name: 'blackboard', desc: '深色', },
        { name: 'cobalt', desc: '深色', },
        { name: 'eclipse', },
        { name: 'elegant', },
        { name: 'erlang-dark', desc: '深色', },
        { name: 'lesser-dark', desc: '深色', },
        { name: 'mbo', desc: '深色', },
        { name: 'mdn-like', },
        { name: 'midnight', desc: '深色', },
        { name: 'monokai', desc: '深色', },
        { name: 'neat', },
        { name: 'neo', },
        { name: 'night', desc: '深色', },
        { name: 'paraiso-dark', desc: '深色', },
        { name: 'paraiso-light', },
        { name: 'pastel-on-dark', desc: '深色', },
        { name: 'rubyblue', desc: '深色', },
        { name: 'solarized', },
        { name: 'the-matrix', desc: '深色', },
        { name: 'tomorrow-night-eighties', desc: '深色', },
        { name: 'twilight', desc: '深色', },
        { name: 'vibrant-ink', desc: '深色', },
        { name: 'xq-dark', desc: '深色', },
        { name: 'xq-light', },
    ];



    panel.set('show', false);

    panel.on('init', function () {
        
        tabs = new Tabs({
            container: panel.$,
            selector: '>li',
            activedClass: 'on',
        });

        tabs.on('change', function (item, index) {
          

            item = list[index];
            panel.fire('item', [item, index]);
        });



        panel.$.on('click', '[data-index]', function (event) {
            let index = + this.dataset.index;
            tabs.active(index);
        });

        panel.template({
            '': function (data) {
                let items = this.fill('item', data.list);

                return {
                    'items': items,
                };
            },

            'item': {
                '': function (item, index) {
                    let desc = this.fill('desc', item);

                    return {
                        'index': index,
                        'name': item.name,
                        'desc': desc,
                    };
                },

                'desc': function (item) {
                    return item.desc ? { 'desc': item.desc, } : '';
                },
            },
        });
    });




    panel.on('render', function (index) {
        
        panel.fill({ 'list': list, });

        if (typeof index == 'number') {
            tabs.active(index);
        }

       
    });


    return {
        active: function (index) {
            tabs.active(index);
        },

        slide: function (visible, fn) {
            if (!visible) {
                panel.$.slideUp('fast', fn);
                return;
            }

            //向下弹出以展示。
            panel.$.slideDown('fast', function () {
                //把当前选中的项滚到可视范围内。
                let index = tabs.getActivedIndex();
                let li = panel.$.find(`li[data-index="${index}"]`).get(0);
              
                li.scrollIntoViewIfNeeded();

                fn && fn();
            });
        },
    };


});


define.panel('/Tool/Less/Themes/Mask', function (require, module, panel) {
    const Masker = require('@definejs/masker');

    let mask = null;
    let visible = false;
   

    panel.on('init', function () {
        mask = new Masker({
            volatile: true, //易消失。
            opacity: 0,
            //opacity: 0.04,

            //'z-index': -1, //测试。
        });

        mask.on({
            'hide': function () {
                visible = false;
                panel.fire('hide');
            },
            'show': function () {
                visible = true;
                panel.fire('show');
            },
        });

    });






    panel.on('render', function () {
       
    });



    return {
        toggle: function () {
            if (!visible) {
                mask.show();
            }
            else {
                mask.hide();
            }
        },
    };


});


define.panel('/Tool/Less/Themes', function (require, module, panel) {
    const Storage = require('@definejs/local-storage');
    const List = module.require('List');
    const Mask = module.require('Mask');
   

    let storage = null;

    panel.set('show', false);

    panel.on('init', function () {
        storage = new Storage(module.id);

        Mask.on({
            'show': function () {
                panel.$.addClass('show');
                List.slide(true);
            },

            'hide': function () {
                List.slide(false);
                panel.$.removeClass('show');
            },
        });

        List.on({
            'item': function (item, index) {
                storage.set('index', index);
                panel.fire('item', [item.name]);
            },
        });
    });



    panel.on('render', function (index) {
        if (typeof index == 'number') {
            storage.set('index', index);
        }
        else {
            index = storage.get('index') || 1;
        }

        List.render(index);
        Mask.render();

    });


    return {
        toggle: function () {
            Mask.toggle();
        },
    };

    

});



define('/Tool/Less/API', function (require, module, exports) {
    const Emitter = require('@definejs/emitter');
    const Loading = require('@definejs/loading');
    const API = require('API');


    let emitter = new Emitter();

    let loading = new Loading({
        mask: 0,
    });




    return {
        on: emitter.on.bind(emitter),

        /**
        * 编译。
        */
        compile: function (opt) {
            let api = new API('Less.compile', {
                // proxy: '.json',
            });


            api.on({
                'request': function () {
                    loading.show('编译中...');
                },

                'response': function () {
                    loading.hide();
                },

                'success': function (data, json, xhr) {
                    emitter.fire('success', [data]);
                },

                'fail': function (code, msg, json, xhr) {
                    let error = json.data;

                    definejs.alert(`编译 less 失败: ${msg}，所在行号：${error.line}`, function () {
                        emitter.fire('fail', [error]);
                    });
                },

                'error': function (code, msg, json, xhr) {
                    definejs.alert('编译 less 错误: 网络繁忙，请稍候再试');
                },
            });


            api.post({
                'content': opt.content,
                'minify': opt.minify,
            });



        },
       

    };


});


define('/Tool/Less/Data', function (require, module, exports) {
    const Storage = require('@definejs/local-storage');

    let storage = new Storage(module.id);

    let defaultContent =
        
`//请输入 less 内容。
body {
	color: red;
    div {
    	font-size: 16px;
    }
}
`;

    
    
    let meta = {
        'content': storage.get('content') || defaultContent,
    };


    return exports = {

        get() {
            return meta.content;
        },

        set(content) {
            meta.content = content;
            storage.set('content', content);

            return content;
        },
        

      
    };


});



define.panel('/Tool/Less', function (require, module, panel) {
    const Clipboard = require('Clipboard');

    const Data = module.require('Data');
    const API = module.require('API');
    const Editor = module.require('Editor');
    const Preview = module.require('Preview');
    const Themes = module.require('Themes');
    const Header = module.require('Header');



    let meta = {
        content: '',
        minify: false,
        css: '',
    };

    panel.on('init', function () {

        API.on({
            'success': function ({ css, md5, }) {
                meta.css = css;

                Header.set(md5);

                Preview.render({
                    'content': css,
                    'ext': '.css',
                    'minify': meta.minify,
                });
            },
            'fail': function (error) {
                Editor.highlight(error.line);
            },
        });


        Header.on({
            'cmd': {
                'themes': function () {
                    Themes.toggle();
                },
                'copy': function () {
                    Clipboard.copy(meta.css);
                },
            },


            'editor': function (cmd) {
                Editor.call(cmd);
            },

            'switch': {
                'crlf': function (on) {
                    Editor.set('lineWrapping', on);
                },
                'fullscreen': function (on) {
                    panel.fire('fullscreen', [on]);
                },
                'column': function (on) {
                    panel.$.toggleClass('full-editor', !on);
                },
            },

            'check': function (key$checked) {
                meta.minify = key$checked['minify'];
                Header.set('');
                Preview.render();
            },
        });

        Themes.on({
            'item': function (name) {
                Editor.setTheme(name);
            },
        });


        Editor.on({
            'scroll': function (info) {
                Preview.scroll(info);
            },

            //填充内容、修改内容时，都会触发。
            'change': function ({ content, }) {
                meta.content = content;
                Data.set(content);
                Header.set('');
                Preview.render();
            },
        });


        Preview.on({
            'compile': function () {
                API.compile(meta);
            },
            'scroll': function (info) {
                Editor.scroll(info);
            },
        });

       


    });


    /**
    * 渲染内容。
    * 处理的优先级如下：
    */
    panel.on('render', function (value) {
        let content = value || Data.get();

        Editor.render({ content, });
        Header.render();
        Themes.render();

        if (value) {
            API.compile(meta);
        }

    });



});


define('/Tool/MD5/API', function (require, module, exports) {
    const Emitter = require('@definejs/emitter');
    const Loading = require('@definejs/loading');
    const API = require('API');


    let emitter = new Emitter();

    let loading = new Loading({
        mask: 0,
    });




    return {
        on: emitter.on.bind(emitter),

        /**
        * 获取。
        */
        get: function (content) {
            let api = new API('Crypto.md5', {
                // proxy: '.json',
            });

            api.on({
                'request': function () {
                    loading.show('加载中...');
                },

                'response': function () {
                    loading.hide();
                },

                'success': function (data, json, xhr) {
                    emitter.fire('success', [data,]);
                },

                
                'fail': function (code, msg, json, xhr) {
                    definejs.alert('获取 MD5 信息失败: {0}', msg);
                },

                'error': function (code, msg, json, xhr) {
                    definejs.alert('获取 MD5 信息错误: 网络繁忙，请稍候再试');
                },
            });

            api.post({
                'content': content,
            });

        },

       

    };


});


define.panel('/Tool/MD5/Input', function (require, module, panel) {
  
    

    panel.on('init', function () {
       
        panel.$on('click', {
            'button': function () {
                let value = panel.$.find('textarea').val();

                //因为在 `@webpart/master` 里用的是 `\r\n`，这里也保持一致。
                value = value.split('\n').join('\r\n');

                panel.fire('submit', [value]);
            },
        });


    });

    panel.on('render', function () {
        

    });


    return {

    };
});


define.panel('/Tool/MD5/Output', function (require, module, panel) {
  
    

    panel.on('init', function () {
       

    });

    panel.on('render', function ({ md5, }) {
        
        panel.fill({ md5, });
    });


    return {

    };
});


define.panel('/Tool/MD5', function (require, module, panel) {
    const API = module.require('API');
    const Input = module.require('Input');
    const Output = module.require('Output');
    

    panel.on('init', function () {
       
        Input.on({
            'submit': function (content) {
                API.get(content);
            },
        });

        API.on({
            'success': function ({ md5, }) {
                Output.render({ md5, });
            },
        });

    });

    panel.on('render', function () {

        Input.render();

    });


    return {

    };
});


define.panel('/Tool/QRCode/Main/Input', function (require, module, panel) {
  
    

    panel.on('init', function () {
       
        panel.$on('click', {
            'button': function () {
                let value = panel.$.find('textarea').val();
                panel.fire('submit', [value]);
            },
        });


    });

    panel.on('render', function () {
        

    });


    return {

    };
});


define.panel('/Tool/QRCode/Main/Output', function (require, module, panel) {
  
    

    panel.on('init', function () {
       

    });

    panel.on('render', function (server, url) {
        let baseUrl = `http://${server.host}:${server.port}`;
        let qr = `${baseUrl}${server.qrcode.path}?url=${encodeURIComponent(url)}`;

        let src = `${qr}&size=10`;
        let href = `${qr}&size=10&margin=4`;


        panel.fill({
            'url': url,
            'src': src,
            'href': href,
        });

    });


    return {

    };
});


define.panel('/Tool/QRCode/Statics/List', function (require, module, panel) {
    
    

    panel.on('init', function () {
        
        panel.template(function (item, index) {
            
            let { qrcode, url, } = item;
            
            let qr = `${qrcode}?url=${encodeURIComponent(url)}`;
            let src = `${qr}&size=10`;
            let href = `${qr}&size=10&margin=4`;

            return {
                'index': index,
                'url': url,
                'href': href,
                'src': src,
            };
        });
    });


    panel.on('render', function (list) {

        panel.fill(list);

    });


    return {

    };
});


define('/Tool/QRCode/API', function (require, module, exports) {
    const Emitter = require('@definejs/emitter');
    const Loading = require('@definejs/loading');
    const API = require('API');


    let emitter = new Emitter();

    let loading = new Loading({
        mask: 0,
    });




    return {
        on: emitter.on.bind(emitter),

        /**
        * 获取。
        */
        get: function () {
            let api = new API('Server.get', {
                // proxy: '.json',
            });

            api.on({
                'request': function () {
                    loading.show('加载中...');
                },

                'response': function () {
                    loading.hide();
                },

                'success': function (data, json, xhr) {
                    console.log(data);

                    data.host = data.host || 'localhost';

                    emitter.fire('success', 'get', [data,]);
                },

                'fail': function (code, msg, json, xhr) {
                    definejs.alert('获取服务器信息失败: {0}', msg);
                },

                'error': function (code, msg, json, xhr) {
                    definejs.alert('获取服务器信息错误: 网络繁忙，请稍候再试');
                },
            });

            api.get();

        },

       

    };


});


define.panel('/Tool/QRCode/Main', function (require, module, panel) {
    const Input = module.require('Input');
    const Output = module.require('Output');
    

    let meta = {
        server: null,
    };

    panel.on('init', function () {
       
        Input.on({
            'submit': function (url) {
                Output.render(meta.server, url);
            },
        });

    });

    panel.on('render', function (server) {
        
        meta.server = server;

        Input.render();

    });


    return {

    };
});


define.panel('/Tool/QRCode/Statics', function (require, module, panel) {
    const List = module.require('List');
    

    panel.on('init', function () {
        

    });

    panel.on('render', function (server) {

        let baseUrl = `http://${server.host}:${server.port}`;

        let list = server.statics.map((item) => {
            return {
                'url': `${baseUrl}${item}`,
                'qrcode': `${baseUrl}${server.qrcode.path}`,
            };
        });
        
        
        List.render(list);


    });


    return {

    };
});

define.panel('/Tool/QRCode', function (require, module, panel) {
    const API = module.require('API');
    const Main = module.require('Main');
    const Statics = module.require('Statics');


    panel.on('init', function () {
       

        API.on('success', {
            'get': function (server) {
                Main.render(server);
                Statics.render(server);
            },

        });
       
       

  
    });


    panel.on('render', function () {
        
        API.get();
    });




});



define.panel('/Tool/Tabs', function (require, module, panel) {
    const Tabs = require('Tabs');

    let tabs = null;

    let meta = {
        item: null,
        cmd$module: null,
        list: [
            { name: '二维码', icon: 'fas fa-qrcode', cmd: 'QRCode', },
            { name: '内容指纹', icon: 'fas fa-fingerprint', cmd: 'MD5' },
            { name: 'Less 编译', icon: 'fab fa-less', cmd: 'Less', },
            { name: 'JS 压缩', icon: 'fab fa-node-js', cmd: 'JS', },
        ],
    };


    panel.on('init', function () {

        tabs = new Tabs({
            container: panel.$.get(0),
            storage: module.id,
        });


        tabs.on('change', function (item, index) {
            let { cmd, } = item;
            let { cmd$module, } = meta;

            if (cmd$module) {
                Object.keys(cmd$module).forEach((key) => {
                    let M = cmd$module[key];

                    if (key == cmd) {
                        panel.fire('change', [M]);
                    }
                    else {
                        M.hide();
                    }
                });
            }

            //后备方案。
            panel.fire('cmd', cmd, []);
        });

       
    });

    /**
    * 渲染。
    */
    panel.on('render', function () {
        tabs.render(meta.list);
        tabs.active();
    });

    return {
        map(cmd$module) {
            meta.cmd$module = cmd$module;
        },
    };

});

define.view('/Tool', function (require, module, view) {
    const Tabs = module.require('Tabs');
    const JS = module.require('JS');
    const Less = module.require('Less');
    const MD5 = module.require('MD5');
    const QRCode = module.require('QRCode');


    let meta = {
        args: null,
    };
 

    view.on('init', function () {


        Tabs.map({ JS, Less, MD5, QRCode, });

        Tabs.on({
            'change': function (M) {
                M.render(meta.args);
            },
        });

        [JS, Less, MD5, QRCode,].forEach((M) => {
            M.on({
                'fullscreen': function (on) {
                    view.$.toggleClass('fullscreen', on);
                    view.fire('fullscreen', [on]);
                },
            });

        });


       
  
    });


    view.on('render', function (id, args) {
        meta.args = args || null;

        Tabs.render();

    });



    return {

    };

});

define.route('DocAdd', function (require, module) {
  

    return {
        'demo': function (file) {
            let url = `#!${file}`;

            window.open(url);
        },

       
       
    };

});

define.route('FileList', function (require, module) {
    const Master = module.require('Master');

    return {
        'demo': function (file) {
            window.open(`#!${file}`);
        },

        'open': function (file) {
            window.open(file);
        },
        
        'edit': function (file) {
            Master.open('DocAdd', [file]);
        },

        'compile-less': function (content) {
            let id = 'Less';
            let args = [content];
            Master.open('Tool', [id, args]);
        },


        'minify-js': function (content) {
            let id = 'JS';
            let args = [content];
            Master.open('Tool', [id, args]);
        },

       
      

       
    };

});

define.route('HtmlTree', function (require, module) {
    const Master = module.require('Master');

    return {
        'file': function (file) {
            console.log(module.id, file);
            Master.open('FileList', [file]);
        },
    };

    

});

define.route('MD5', function (require, module) {
    const Master = module.require('Master');

    return {
        'cmd': {
            'file': function (file) {
                Master.open('FileList', [file]);
            },

        },
    };

    

});

define.route('ModuleTree', function (require, module) {
    const Master = module.require('Master');

    return {
        'file': function (file) {
            console.log(module.id, file);
            Master.open('FileList', [file]);
        },
    };

    

});


define.route('SideMenus', function (require, module) {
    const Master = module.require('Master');

    return {
        'file': function (file) {
            Master.open('FileList', [file]);
        },
    };

});

define.route('Terminal', function (require, module) {
    const Master = module.require('Master');

    return {
        'cmd': {
            'file': function (file) {
                Master.open('FileList', [file]);
            },

        },
    };

    

});


/*
* 主控制器。
*/
definejs.launch(function (require, module, nav) {
    const Theme = require('Settings.Theme');
    const Router = module.require('Router');
    const Markdoc = module.require('Markdoc');
    const Master = module.require('Master');
    const Loading = module.require('Loading');

    

    Loading.show();

    Markdoc.on({
        'loading': function (visible) {
            Loading.toggle(visible);
        },
    });

    Master.on({
        'require': function (name) {
            return module.require(name);
        },

        //就绪后需要快速打开的视图，仅供开发使用。
        //每个人提交代码必须注释掉自己的那个视图。
        'ready': function () {
            // Master.open('FileList', []);
            // Master.open('ModuleTree', []);
            // Master.open('MD5', []);
            // Master.open('Terminal', []);
            // Master.open('Log', []);
            // Master.open('QRCode', []);
            // Master.open('DocAdd', []);
        },

        'render': function () {
            Loading.hide();
            Theme.set();
        },
    });

    Router.on({
        'master': function (view) {
            Markdoc.hide();
            Master.render(view);
        },
        'markdoc': function (url) {
            Master.hide();
            Markdoc.render(url);
        },
    });

    Router.render();



    // const Panel = require('Panel');
    // const $ = require('$');

    // let prefix = './';
    // let key = 'panel';
    // let list = $(`[data-${key}^="${prefix}"]`).toArray();

    // console.log(list)

    // Panel.pad(list, { key, prefix, });

    // Panel.pad();
   

  
});





})(
    top,
    parent,
    window, 
    document,
    location,
    localStorage,
    sessionStorage,
    window.console || {
        log: function () {},
        dir: function () {},
        clear: function () {},
        error: function () {},
        info: function () {},
        debug: function () {},
        warn: function () {}
    },
    history,
    setTimeout,
    setInterval,

    definejs,
    definejs.require('AppModule').define,

    Array, 
    Boolean,
    Date,
    Error,
    Function,
    Math,
    Number,
    Object,
    RegExp,
    String
    /*, undefined */
);
