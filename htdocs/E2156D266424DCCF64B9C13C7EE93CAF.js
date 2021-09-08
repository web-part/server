
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
        '/ModuleTree/API/Data',
        '/ModuleTree/Tree/Data',
        '/ModuleTree/Tree',
        '/ModuleTree/Main/ModuleInfo/Base',
    ], {
        none: '(app)',
    });

    define.data({
        'Settings.Header': 'hide',
        'Settings.Language': 'chinese',
        'Settings.Theme': 'light',
    });


    // KISP 内部模块所需要的默认配置
    definejs.config({
        'API': {
            /**
            * API 接口 Url 的主体部分。
            */
            // url: 'http://localhost:8000/api/',
            // url: `http://localhost:${location.port}/api/`,
            url: `${location.origin}/api/`,

        },

        'Proxy': {
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
    const Emitter = require('@definejs/emitter');
    const Loading = require('@definejs/loading');
    const API = require('API');


   

    return {
        create() {
            let emitter = new Emitter();

            let loading = new Loading({
                mask: 0,
            });

            return {
                on: emitter.on.bind(emitter),

                /**
                * 读取指定文件或目录的信息。
                */
                read: function (id, fn) {
                    let api = new API('FileList.read', {
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
                            emitter.fire('success', 'read', [data]);
                        },

                        'fail': function (code, msg, json, xhr) {
                            definejs.alert('获取文件内容失败: {0}', msg);
                        },

                        'error': function (code, msg, json, xhr) {
                            definejs.alert('获取文件内容错误: 网络繁忙，请稍候再试');
                        },
                    });

                    //如 `htdocs/a/b/test.js`，则取为 `/a/b/test.js`
                    if (!id.startsWith('/')) {
                        id = id.split('/').slice(1).join('/');
                    }

                    api.get({ 'id': id, });

                },



            };
        },
    };


   


});


define('File/Ext', function (require, module, exports) {
    

    return {
        //从名称中提取出后缀名
        get(name) {
            if (!name.includes('.')) {
                return '';
            }


            let ext = name.split('.').slice(-1)[0];
            
            ext = ext ? `.${ext}` : '';
            ext = ext.toLowerCase();

            return ext;
        },
    };
});


define('File/Icon', function (require, module, exports) {
    let ext$icon = {
        'dir': 'fa fa-folder',
        'file': 'fas fa-file-alt',

        '.css': 'fab fa-css3-alt',
        '.doc': 'fas fa-file-word',
        '.docx': 'fas fa-file-word',
        '.html': 'fab fa-html5',
        '.js': 'fab fa-node-js',
        '.json': 'fab fa-npm',
        '.less': 'fab fa-less',
        '.md': 'fab fa-markdown',
        '.map': 'fas fa-globe',

        '.bmp': 'fas fa-file-image',
        '.jpg': 'fas fa-file-image',
        '.png': 'fas fa-file-image',
    };

   
   

    return {
        get({ type, ext, }) {
            if (type == 'dir') {
                let icon = ext$icon['dir'];
                let className = `FileIcon dir ${icon}`;
                let html = `<i class="${className}"></i>`;
                return { type, icon, className, html, };
            }

            type = 'file';

            let extName = ext.slice(1);
            let icon = ext$icon[ext] || ext$icon['file'];
            let className = `FileIcon file ${extName} ${icon}`;
            let html = `<i class="${className}"></i>`;

            return { type, ext, extName, className, icon, html, };
        },

        
    };
});


define('File/Size', function (require, module, exports) {

    return {

        /**
        * 获取文件大小的描述。
        */
        getDesc: function (size) {
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









define('File', function (require, module, exports) {
    const API = module.require('API');
    const Ext = module.require('Ext');
    const Icon = module.require('Icon');
    const Size = module.require('Size');




    return {
        API: API.create,

        /**
        * 获取文件大小的描述。
        */
        getSizeDesc(...args) {
            return Size.getDesc(...args);
        },

        /**
        * 获取文件类型的图标。
        */
        getIcon(opt) {
            if (typeof opt == 'string') {
                opt = { 'name': opt, };
            }

            let { ext, type, name, } = opt;

            ext = ext || Ext.get(name);

            let icon = Icon.get({ ext, type, });
            return icon;
        },

        /**
        * 从文件名中获取后缀名。
        * @param {string} name 必选，文件名。
        * @returns 返回文件名的后缀名，以 `.` 开头，且已转换为小写。 如 `.json`。
        */
        getExt(name) {
            return Ext.get(name);
        },


    };

});








/**
* 
*/
define('GridView/Check', function (require, module, exports) {
    const $ = require('$');



    return {
        /**
        * 选中或取消选中指定的项。
        * 或者通过该项的状态自动进行选中或取消选中。
        * 已重载 check(meta, item);            //通过该项的状态自动进行选中或取消选中。
        * 已重载 check(meta, item, checked);   //选中或取消选中指定的项。
        */
        item: function (meta, item, checked) {
            let id = item[meta.primaryKey];
            let current = meta.current;
            let id$item = current.id$item;
            let list = new Set(current.list); //记录选中的 id，通过 Set() 可以去重。

            //未指定是否选中，则自动判断。
            if (checked === undefined) {
                checked = !id$item[id];
            }

            if (checked) {
                id$item[id] = item;
                list.add(id);
            }
            else {
                delete id$item[id];
                list.delete(id);
            }

            current.list = [...list];
            $('#' + meta.countId).html(list.size);


            //映射回具体的记录。
            list = meta.this.get();

            meta.emitter.fire('check', [{
                'item': item,
                'checked': checked,
                'list': list,
                'id$item': id$item,
            }]);

            return checked;
        },

        /**
        * 检查当前填充的列表和已选中的项的关系，看是否需要勾选表头的全选框。
        */
        all: function (meta) {
            let list = meta.list;
            let id$item = meta.current.id$item;
            let key = meta.primaryKey;
            let len = list.length;
            let allChecked = len > 0;   //如果有数据，则先假设已全部选中。

            //检查当前填充的列表，
            //只要发现有一项没有选中，则全选的就去掉。
            for (let i = 0; i < len; i++) {
                let item = list[i];
                let id = item[key];

                if (!id$item[id]) {
                    allChecked = false;
                    break;
                }
            }

            $('#' + meta.checkAllId).toggleClass('on', allChecked);
        },
    };
    
});




/**
* 
*/
define('GridView/Fields', function (require, module, exports) {


    const defaults = require('GridView.defaults');



    return {
        /**
        * 获取字段列表。
        */
        get: function (config) {
            let fields = config.fields;
            let check = config.check;
            let order = config.order;
            let list = [];
           
            //是否指定了显示复选框列。
            check = check === true ? defaults.check : check;

            //是否指定了显示序号列。
            order = order === true ? defaults.order : order;
         
            //复选框列。
            check && list.push({
                'name': check.name,
                'width': check.width,
                'caption': '',
                'class': check.class,
                'dragable': check.dragable,
            });


            //序号列。
            order && list.push({
                'name': order.name,
                'width': order.width,
                'caption': order.caption,
                'class': order.class,
                'dragable': order.dragable,
            });

            //其它字段。  field 里也许有其它字段，这里只挑出需要用到的。
            fields.forEach(function (field) {
                list.push({
                    'name': field.name,
                    'width': field.width,
                    'caption': field.caption,
                    'class': field.class,
                    'dragable': field.dragable,
                    'delegate': field.delegate,
                });
            });

            return list;
        },

        /**
        * 计算所有列宽的总和。
        */
        sumWidth: function (fields) {
            let sum = 0;

            fields.map(function (field) {
                sum += field.width;
            });

            return sum;
        },
    };
    
});




/**
* 
*/
define('GridView/Meta', function (require, module, exports) {
    const $String = require('@definejs/string');



    return {
        /**
        * 
        */
        create: function (config, others) {
            //全部列表数据数组。 如果指定该字段，则在组件内部进行分页。
            let all = config.all; 
            let total = all ? all.length : config.total;

            let meta = {
                //dom 节点中用到的 id，方便快速获取对应的 dom 节点。
                //一旦生成后，不会再变。 采用随机 id，可防止 id 冲突。
                'id': $String.random(),
                'pagerId': $String.random(),
                'tableId': $String.random(),
                'headerId': $String.random(),
                'counterId': $String.random(),
                'countId': $String.random(),
                'checkAllId': $String.random(),
                'nodataId': $String.random(),

                '$': null,              //jQuery 实例 。
                '$container': null,     //$(container)。
                '$nodata':  null,       //$(#nodataId)
                'table': null,          //Table 组件实例
                'pager': null,          //Pager 组件实例。
                'tpl': null,            //Template 组件实例。
                'resizer': null,        //Resizer 组件实例。
                'checkItem': null,      //是一个函数。 这里先占位。
                'checkAll': null,       //是一个函数。 这里先占位。

                'all': all,             //全部列表数据数组。 如果指定该字段，则在组件内部进行分页。
                'total': total,         //总记录数。 用于计算分页。

                'container': config.container,      //容器。
                'class': config.class,              //
                'no': config.no,                    //当前的页码。
                'size': config.size,                //正常模式下的分页大小。
                'sizes': config.sizes,              //可供选择的页码列表。
                'sumWidth': 0,                      //全部列的总宽。

                'check': config.check,              //是否启用复选框列。 可以指定为 true 或一个 {} 配置。
                'order': config.order,              //是否启用序号列。 可以指定为 true 或一个 {} 配置。
                'primaryKey': config.primaryKey,    //主键的键名。 如 `id`。
                'footer': !!config.footer,          //是否显示 footer。 确保是一个 boolean。

                'list': [],                         //当前填充到 UI 中的数据。
                'oldList': null,                    //用于切换到已选模式之前，备份 meta.list 的数据，以便用于切换回正常模式。
                'selectedMode': false,              //表示是否处于已选模式，如果是，则列表中显示的是已选的数据。
                'index$checkedJSON': '',                //切换显示指定的列。

                //选中的信息。
                'current': {
                    'list': [],         //记录选中的项的 id 集合。
                    'id$item': {},      //记录选中的项的 id 与 项的关系。
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
define('GridView/Pager', function (require, module, exports) {

    const Pager = require('Pager');

 


    return {

        create: function (meta) {
            let pager = new Pager({
                'container': '#' + meta.pagerId,    //分页控件的容器
                'total': meta.total,                //总的记录数，应该从后台取得该值。
                'size': meta.size,                  //每页的大小，即每页的记录数。
                'sizes': meta.sizes,
                //'min': 2,                           //总页数小于该值时，分页器会隐藏。 如果不指定，则一直显示。
            });


            pager.on({
                //翻页时会调用该方法，参数 no 是当前页码。
                //前端应根据当前页码去拉后台数据。
                'change': function (no, size) {
                    meta.no = no;
                    meta.size = size;
                    meta.selectedMode = false;  //翻页后重置为正常模式。
                    meta.emitter.fire('page', 'change', [no, size]);
                },

                //控件发生错误时会调用该方法，比如输入的页码有错误时
                'error': function (msg) {
                    meta.emitter.fire('page', 'error', [msg]);
                },
            });

            return pager;
           
        },

        /**
        * 从总列表中截取指定分页的列表数据。
        */
        list: function (all, no, size) {
            let begin = (no - 1) * size;
            let end = begin + size;
            let list = all.slice(begin, end);

            return list;
        },
    };
    
});




/**
* 
*/
define('GridView/Resizer', function (require, module, exports) {
    const $ = require('$');
    const TableResizer = require('TableResizer');


    return {
        create: function (meta) {
            //表体的调整器。
            let rsz = null;

            //表头的调整器。
            let resizer = new TableResizer({
                'table': '#' + meta.headerId,
                'fields': meta.fields,
            });

            //表头的全选。
            resizer.on('render', function () {
                let chk = '#' + meta.checkAllId;

                this.$.on('click', chk, function () {
                    let $chk = $(this);
                    let checked = !$chk.hasClass('on');

                    $chk.toggleClass('on', checked);

                    meta.table.column('check', function (cell) {
                        cell.ctrl.toggleClass('on', checked);
                        meta.checkItem(cell.row.data, checked);
                    });

                });
            });

            resizer.on({
                'render': function (width, fields) {
                    rsz = new TableResizer({
                        'table': meta.table.get('element'),
                        'dragable': false,
                        'fields': fields,
                    });

                    rsz.render();
                },

                'change': function (data) {
                    rsz.set(data);

                    // let containerWidth = meta.$container.width();
                    // let width = Math.max(containerWidth, data.width + 10);
                    // meta.$.width(width);

                    meta.$.width(data.width + 10);
                },
            });



            return resizer;
           
        },
    };
    
});




/**
* 
*/
define('GridView/Table', function (require, module, exports) {
    const $ = require('$');
    const Table = require('Table');



    return {

        create: function (meta) {
            let table = new Table({
                'container': '#' + meta.tableId,    //生成的表格 html 要塞进去的容器。
                'fields': meta.fields,              //字段列表。 item = { name, caption, width, class, };
                'order': false,                     //这里不通过 table 组件来自动生成序号，而是通过下面的的方式生成。
                'columnName': 'name',               //
            });

            table.on('process', {
                'row': function (row) {
                    row.value = row.data[meta.primaryKey];  //把主键的值(如 id)作为整行的值。
                    meta.emitter.fire('process', 'row', [row]);
                },

                'cell': {
                    '': function (cell) {
                        //先触发具体名称的单元格事件。
                        let values = meta.emitter.fire('process', 'cell', cell.name, [cell]);
                        let value = values.slice(-1)[0]; //以最后一个为准。

                        //再触发统一的单元格事件。
                        if (value === undefined) {
                            values = meta.emitter.fire('process', 'cell', [cell]);
                            value = values.slice(-1)[0]; //以最后一个为准。
                        }

                        //业务层没有绑定事件并返回一个有效值。
                        if (value === undefined) {
                            value = cell.row.data[cell.name];
                        }

                        cell.value = value;
                        return value;

                    },

                    //复选列。
                    'check': function (cell) {
                        let row = cell.row;
                        let checked = meta.current.id$item[row.value];

                        return meta.tpl.fill('check-item', {
                            'index': row.index,
                            'checked': checked ? 'on' : '',
                        });
                    },

                    //序号列。
                    'order': function (cell) {
                        let row = cell.row;
                        let order = row.index + 1;

                        //指定了不使用全局序号，或者当前处于已选模式下，则使用局部序号，即从 1 开始。
                        if (!meta.order.global || meta.selectedMode) {
                            return order;
                        }

                        //使用全局序号，即跟分页无关。
                        let base = (meta.no - 1) * meta.size;

                        return base + order;
                    },
                },

            });

       

            table.on('render', function () {

                table.$.on('click', '[data-cmd="check-item"]', function () {
                    let cid = this.parentNode.id;   //单元格 id。
                    let cell = table.get(cid);      //
                    let checked = meta.checkItem(cell.row.data);

                    $(this).toggleClass('on', checked);
                    meta.checkAll();
                });


            });



            table.on('fill', function (list) {
                meta.list = list;

                //启用了复选框列才执行。
                if (meta.check) {
                    meta.checkAll();

                    table.column('check', function (cell) {
                        cell.ctrl = $(cell.element).find('[data-cmd="check-item"]');
                    });
                }
            });

            table.on('click', {
                '': function (event) {
                    meta.emitter.fire('click', 'table', [table, event]);
                },

                'row': function (row, event) {
                    meta.emitter.fire('click', 'row', [row, event]);
                },

                'cell': function (cell, event) {
                    meta.emitter.fire('click', 'cell', cell.name, [cell, event]);
                    meta.emitter.fire('click', 'cell', [cell, event]);
                },
            });


            meta.fields.forEach(function (field) {
                let delegate = field.delegate;
                if (!delegate) {
                    return;
                }

                table.on('click', 'cell', field.name, delegate, function (cell, event, target) {
                    meta.emitter.fire('click', 'cell', cell.name, delegate, [cell, event, target]);

                });
            });
          


            return table;


           
        },
    };
    
});




/**
* 
*/
define('GridView/Template', function (require, module, exports) {
    const Template = require('@definejs/template');



    return {

        create: function (meta) {
            let tpl = new Template('#tpl-GridView');
            let fields = meta.fields;

            //如果指定了启用复选框列，则表头的首列生成一个全选的复选框。
            if (meta.check) {
                fields[0].caption = tpl.fill('check-all', {});
            }

            tpl.process({
                '': function () {
                    let header = this.fill('header', {
                        'fields': fields,
                    });

                    return {
                        'header': header,
                        'id': meta.id,
                        'class': meta.class,
                        'sumWidth': meta.sumWidth + 10,
                        'no-footer': meta.footer ? '' : 'no-footer',
                        'headerId': meta.headerId,
                        'tableId': meta.tableId,
                        'pagerId': meta.pagerId,
                        'counterId': meta.counterId,
                        'countId': meta.countId,
                        'checkAllId': meta.checkAllId,
                        'nodataId': meta.nodataId,
                    };
                },

                //表头。
                'header': {
                    '': function (data) {
                        let fields = data.fields;
                        let cells = this.fill('cell', fields);

                        return {
                            'cells': cells,
                        };
                    },

                    'cell': function (item, index) {
                        return {
                            'index': index,
                            'caption': item.caption,
                        };
                    },
                },

            });
           

            return tpl;
        },
    };
    
});




define('GridView.defaults', {
    size: 20,
    all: null,          //全部列表数据数组。 如果指定该字段，则在组件内部进行分页。
  
    class: '',
    primaryKey: 'id',
    footer: true,       //是否显示 footer。

    sizes: [10, 20, 30, 40, 50],//可供选择的分页大小列表。

    check: {
        name: 'check',
        width: 43,
        class: 'check',
        dragable: false,
    },

    order: {
        name: 'order',
        width: 50,
        caption: '序号',
        global: true,       //true: 使用全局序号，即跟分页无关。 false: 使用局部序号，即每页的序号都是从 1 开始。
        dragable: true,
        class: 'order',
    },

    
});



/**
* 带有翻页、固定表头的列表表格展示器组件。
*/
define('GridView', function (require, module, exports) {
    const $ = require('$');
    const Emitter = require('@definejs/emitter');
    const $Array = require('@definejs/array');
    const $Object = require('@definejs/object');

    const Template = module.require('Template');
    const Table = module.require('Table');
    const Pager = module.require('Pager');
    const Resizer = module.require('Resizer');
    const Fields = module.require('Fields');
    const Check = module.require('Check');
    const Meta = module.require('Meta');

    const defaults = require('GridView.defaults');
    let mapper = new Map();
    let emitterCounter = 0;



    /**
    * 构造器。
    *   config = {
    *       container: '',      //必选，生成的组件要塞进去的容器，是一个 jQuery 选择器。
    *       size: 10,           //必选，正常模式下的分页大小，即每页多少条记录。
    *       no: 1,              //必选，当前的页码。
    *       total: 0,           //必选，总的记录数。 如果指定了 all 为一个数组，则取 all.length。
    *       primaryKey: '',     //必选，列表数据中项的主键的键名。 因为每个项中有很多字段，须指定哪个字段是主键，如 `id`。
    *       fields: [           //必选，表格列的字段数组。
    *           {
    *               name: '',       //必选，列的编程名称。
    *               caption: '',    //必选，列的标题，直接显示在表头上的。
    *               width: 0,       //必选，列的宽度。
    *               class: '',      //可选，列的 css 类名。 该列的所有单元格都会应用此类名。 
    *               dragable: true, //可选，是否允许该列拖曳来调整列宽。 默认为允许，只有指定为 false 才禁用拖曳。
    *               delegate: '',   //可选，要进一步监听的委托事件。 如 `[data-cmd]`。
    *           },
    *       ],
    *       footer: true,       //可选，是否显示 footer 部分。
    *       class: '',          //可选，组件的 css 类名。
    *       all: null | [],     //可选，全部列表数据数组。 如果指定该字段，则在组件内部进行分页。 默认为 null。
    *       check: true | {     //可选，是否启用复选框列。 可以指定为 true 或 false 或一个 {} 配置。
    *           name: 'check',      //
    *           width: 43,          //
    *           class: 'check',     //
    *       },   
    *       order: true | {     //可选，是否启用序号列。 可以指定为 true 或 false 或一个 {} 配置。
    *           name: 'order',      //
    *           width: 50,          //
    *           caption: '序号',    //
    *           global: true,       //true: 使用全局序号，即跟分页无关。 false: 使用局部序号，即每页的序号都是从 1 开始。
    *       },   
    *   };
    */
    function GridView(config) {
        config = Object.assign({}, defaults, config);

        let emitter = new Emitter(this);
        let fields = Fields.get(config);
        let width = config.width;
        let sumWidth = Fields.sumWidth(fields);

        if (width == 'auto') {
            width = sumWidth + 264;
        }

        emitter.id = `GridView-Emitter-${emitterCounter++}`;

        let meta = Meta.create(config, {
            'emitter': emitter,         //
            'fields': fields,
            'width': width, //
            'sumWidth': sumWidth,
            'this': this,
            'checkItem': function (item, checked) {
                return Check.item(meta, item, checked);
            },
            'checkAll': function () {
                return Check.all(meta);
            },
        });
       
        mapper.set(this, meta);

        Object.assign(this, {
            'id': meta.id,
        });


        //全部列表数据数组。 
        //如果指定该字段，则在组件内部进行分页。
        if (meta.all) {
            this.on('pager', 'change', function (no, size) {
                //meta.all 可能会在 this.set() 中给改变。
                if (!meta.all) {
                    return;
                }

                let list = Pager.list(meta.all, no, size);
                this.fill(list);
            });
        }


    }



    //实例方法。
    GridView.prototype = {
        constructor: GridView,

        id: '',
        $: null,

        /**
        * 渲染。
        *   opt = {
        *       container: '',  //可选，渲染时再指定容器。
        *   };
        */
        render: function (opt = {}) {
            let meta = mapper.get(this);
            let container = meta.container = opt.container || meta.container;

            meta.tpl = Template.create(meta);
            meta.$container = $(container);
            
            // let containerWidth = meta.$container.width() - 10;
            // meta.sumWidth = Math.max(containerWidth, meta.sumWidth);

            let html = meta.tpl.fill(meta);

            meta.$container.html(html);
            meta.$ = this.$ = meta.$container.find(`#${meta.id}`);
            meta.$nodata = meta.$.find(`#${meta.nodataId}`);

            meta.table = Table.create(meta);
            meta.resizer = Resizer.create(meta);
            meta.pager = Pager.create(meta);

            meta.table.render();
            meta.resizer.render();
            meta.pager.render();

            //切换显示已选模式和正常模式。
            meta.$.on('click', '#' + meta.counterId, function () {
                let selectedMode = meta.selectedMode = !meta.selectedMode;
                let list = selectedMode ? meta.this.get() : meta.oldList;

                $(this).toggleClass('selected-mode', selectedMode);
                meta.table.fill(list);

            });

        },

        /**
        * 填充指定的列表数据。
        */
        fill: function (list, fn) {
            let meta = mapper.get(this);

            if (fn) {
                list = $Array.map(list, fn);
            }

            meta.oldList = list;
            meta.table.fill(list);
            meta.$nodata.toggle(list.length == 0);
            
            meta.emitter.fire('fill', [list]);
        },

        /**
        * 选中指定的项(多个)。
        */
        check: function (list) {
            let meta = mapper.get(this);

            list && list.forEach(function (item) {
                meta.checkItem(item, true);
            });

            meta.list && this.fill(meta.list);
        },


        /**
        * 清空所选。
        */
        clear: function () {
            let meta = mapper.get(this);
            let current = meta.current;
            if (!current.list.length) {
                return;
            }

            current.id$item = {};
            current.list = [];

            meta.table.column('check', function (cell) {
                cell.ctrl.removeClass('on');
            });

            $('#' + meta.checkAllId).removeClass('on');
            $('#' + meta.countId).html(0);

            meta.emitter.fire('clear');
        },

        /**
        * 设置属性。
        *   options = {
        *       all: null | [],     //
        *       no: 1,              //
        *       total: 0,           //
        *       size: 10,           //
        *   };
        */
        set: function (options) {
            let meta = mapper.get(this);
            let all = options.all;
            let page = $Object.filter(options, ['total', 'size', 'no']);

            if (!$Object.isEmpty(page)) {
                Object.assign(meta, page);
                meta.pager.render(page);
            }

            if (all) {
                meta.all = all;
            }
        },

        /**
        * 获取当前选中的列表数据。
        */
        get: function () {
            let meta = mapper.get(this);
            let list = meta.current.list || [];
            let id$item = meta.current.id$item;

            //映射回具体的记录。
            list = list.map(function (id) {
                return id$item[id];
            });

            return list;
        },

        /**
        * 跳转到指定的页码。
        */
        to: function (no) {
            let meta = mapper.get(this);
            meta.pager.to(no);
        },

        /**
        * 销毁。
        */
        destroy: function () {
            let meta = mapper.get(this);

            //已销毁。
            if (!meta) {
                return;
            }

            meta.emitter.destroy();
            meta.resizer.destroy();
            meta.table.destroy();
            meta.pager.destroy();
            meta.tpl.destroy();

            mapper.delete(this);

        },

        /**
        * 绑定事件。
        */
        on: function () {
            let meta = mapper.get(this);
            meta.emitter.on(...arguments);
        },


        /**
        * 切换显示指定的列。
        */
        toggleFields(index$checked) {
            if (!index$checked) {
                return;
            }

            
            let meta = mapper.get(this);
            let json = JSON.stringify(index$checked);
            
            if (json == meta.index$checkedJSON) {
                return;
            }

            meta.index$checkedJSON = json;

            let $header = $(`#${meta.headerId}`);
            let $body = $(`#${meta.tableId}>table`);
            let hideWidth = 0;

            function toggle(el) {
                let { index, } = el.dataset;
                let checked = index$checked[index];
                let field = meta.fields[index];

                if (typeof checked == 'boolean') {
                    $(el).toggle(checked);
                    return checked ? 0 : field.width;
                }

                return 0;
                
            }

            $header.find(`col`).each(function () {
                let width = toggle(this);
                hideWidth += width;
            });

            $header.find(`th`).each(function () {
                toggle(this);
            });

            $body.find(`col`).each(function () {
                toggle(this);
            });

            $body.find('>tbody>tr>td').each(function () {
                toggle(this);
            });

            //以下实现跟手动调整列宽时有冲突，体验不好，待改进。
            let w = meta.sumWidth - hideWidth;
            // console.log(w);
            // console.log($header.width());
            // console.log($body.width());
            // console.log(meta.$.width());
            // console.log(meta.sumWidth)
            
            $header.width(w);
            $body.width(w);
            meta.$.width(w + 10); 

            
        },

    };


    //同时提供静态成员。
    Object.assign(GridView, {});






    return GridView;

    
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


define.panel('MenuNav/Panel/Icon', function (require, module, panel) {
    const Panel = require('@definejs/panel');
    const File = require('File');

    


    return {
        create($meta) {
            let panel = new Panel(`[data-panel="${$meta.id}/Icon"]`);


            panel.on('init', function () {

            });


            /**
            * 渲染内容。
            */
            panel.on('render', function (icon) {
                let html = icon;

                if (icon && typeof icon == 'object') {
                    icon = File.getIcon(icon);
                    html = icon.html;
                }

                panel.$.html(html);


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
                path: '',
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
                        let path = txt.value;


                        if (path == meta.path) {
                            return;
                        }

                        //这个语句先提前设置为原先的值。 
                        //因为：
                        //1，如果新值不正确，外面一样会显示回原值的，但外面没机会告诉本界面，所以本界面可以提前先设置回原值。
                        //2，如果正确，则由外面再切换到新值，同时也会触发事件导致本界面设置成新值。
                        txt.value = meta.path;

                        meta.path = path;

                        panel.fire('change', [path]);
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
            panel.on('render', function (path) {

                meta.path = txt.value = path;

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


    return {
        create($meta) {
            const Icon = $Icon.create($meta);
            const List = $List.create($meta);
            const Text = $Text.create($meta);


            let panel = new Panel(`[data-panel="${$meta.id}"]`);


            let meta = {
                names: [],
                path: '',
            };


            panel.on('init', function () {

                List.on({
                    'item': function (index) {
                        let names = meta.names.slice(0, index + 1);
                        panel.fire('item', [names, index]);
                    },

                    'text': function () {
                        if (typeof meta.path == 'string') {
                            List.hide();
                            Text.show();
                        }
                    },
                });

                Text.on({
                    'blur': function () {
                        List.show();
                        Text.hide();
                    },
                    'change': function (path) {
                        let values = panel.fire('text', [path]);

                        //外部明确返回了 false，则表示归位。
                        if (values.includes(false)) {
                            Text.render(meta.path);
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
            *   };
            */
            panel.on('render', function (opt) {
                let { names, path, icon, } = opt;

              
               
                meta.names = names;
                meta.path = path;

                Icon.render(icon);
                List.render(names);
             

                if (typeof path == 'string') {
                    Text.render(path);
                }

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
                'item': function (names, index) {
                    meta.emitter.fire('item', [names, index]);
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

define('MenuTree/Data', function (require, module, exports) {
    const IDMaker = require('@definejs/id-maker');

    let idmaker = new IDMaker(module.parent.id);


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
                'name': item.name ,
                'open': item.open,
                'dirIcon': item.dirIcon,
                'fileIcon': item.fileIcon,
                'data': item.data,
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

        make(list, meta) {
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

            if (meta) {
                Object.assign(meta, data);
            }

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
        }
       
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




    return {
        bind: function (meta) {

            //点击菜单项。
            meta.$.on('click', '[data-cmd="item"]', function (event) {
                let li = this.parentNode;
                let { id, } = li.dataset;
                let item = meta.id$item[id];
                let $li = $(li);
                let $ul = $li.children('ul');

                let { current, } = meta;

                if (current) {
                    meta.$.find(`[data-id="${current.id}"]`).removeClass('on'); //灭掉旧的;
                }

                $li.addClass('on');
                meta.current = item;
                
                //点击的是一个目录。
                if (item.list.length > 0) {
                    if (item === current) {
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

                this.scrollIntoViewIfNeeded();

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

/**
* 
*/
define('MenuTree/Meta', function (require, module, exports) {
    const IDMaker = require('@definejs/id-maker');

    let idmaker = new IDMaker(module.parent.id);



    return {

        create: function (config, others) {
            let id = idmaker.next();
            
            let meta = {
                'id': id,

                'container': config.container, //可选。
                'dirIcon': config.dirIcon,
                'fileIcon': config.fileIcon,

                '$': null,
                'this': null,
                'emitter': null,
                'tpl': null,

               
                'list': [],         //
                'items': [],        //list 的一维数组。
                'id$item': {},      //id 作为主键关联到项。
                'cid$item': {},      //cid 作为主键关联到项。

                'current': null,       //当前激活的节点 item。
            };


            Object.assign(meta, others);



            return meta;
           
        },


    };
    
});





define('MenuTree/Template', function (require, module, exports) {
    const Template = require('@definejs/template');


   





    return {
        create: function (meta) {
           
            let tpl = new Template('#tpl-MenuTree');

            function fill(item, index) {
                let isDir = item.list.length > 0;
                let name = isDir ? 'dir' : 'file';
                let html = tpl.fill('root', name, item);

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

                    let roots = this.fill('root', meta.list);

                    return {
                        'id': meta.id,
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
                        let { open, id, } = item;
                        let items = item.list.map(fill);
                        let current = meta.current;
                        let dirIcon = item.dirIcon || meta.dirIcon;

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
                            'display': open ? 'display: block;' : 'display: none;',
                            'icon': open ? dirIcon.open : dirIcon.close,
                            'items': items,
                        };
                    },

                    'file': function (item, index) {
                        let { id, fileIcon, } = item;
                        let { current, } = meta;

                        let name = getName(item);


                        return {
                            'id': id,
                            'name': name,
                            'icon': fileIcon || meta.fileIcon,
                            'on': current && id == current.id ? 'on' : '',
                        };
                    },
                },
            });




            return tpl;

        },

    };
});

define('MenuTree.defaults', {

    //可选。
    container: null,

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

    const defaults = require('MenuTree.defaults');
    const mapper = new Map();



    class MenuTree {
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

        render(list = []) {
            let meta = mapper.get(this);

            if (meta.$) {
                if (list.length > 0) {
                    this.update(list);
                }

                return;
            }

            //首次渲染。
            meta.tpl = Template.create(meta);

            if (meta.container && list.length > 0) {
                let html = this.fill(list);
                $(meta.container).html(html);
            }

            meta.$ = this.$ = $(`#${meta.id}`);
            Events.bind(meta);

        }

        /**
        * 填充数据以生成 HTML。
        * 仅生成并返回 HTML 以供外部进一步使用。
        */
        fill(list) {
            let meta = mapper.get(this);

            Data.make(list, meta);

            let html = meta.tpl.fill({}); //填充全部。
            return html;
        }


        /**
        * 更新数据。
        */
        update(list) {
            let meta = mapper.get(this);

            Data.make(list, meta);

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

        on(...args) {
            let meta = mapper.get(this);
            meta.emitter.on(...args);
        }

    }




    return MenuTree;
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



define('Pager/Events', function (require, module) {

    
    return {

        bind: function (meta) {

            let txtId = meta.txtId;
            let sizerId = meta.sizerId;
            let pager = meta.this;


            function jump() {
                let txt = document.getElementById(txtId);
                let no = +txt.value;
                pager.to(no);
            }


            //点击页码按钮
            meta.$.on('click', '[data-no]', function () {
                let li = this;
                if ($(li).hasClass('active')) {
                    return;
                }

                let no = +li.getAttribute('data-no');

                pager.to(no);
            });


            //点击确定。
            meta.$.on('click', '[data-button="to"]', function () {
                jump();
            });


            //点击上一页。
            meta.$.on('click', '[data-button="previous"]', function () {
                pager.previous();
            });

            //点击下一页。
            meta.$.on('click', '[data-button="next"]', function () {
                pager.next();
            });

            //点击每页大小。
            meta.$.on('change', '#' + sizerId, function () {
                let index = this.selectedIndex;
                let size = meta.sizes[index];

                pager.render({ 'size': size, 'no': 1, });
                pager.to(1);
            });


            //页面输入框中的键盘过滤。
            meta.$.on('keydown', '#' + txtId, function (event) {
                let keyCode = event.keyCode;
                console.log(keyCode);

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



define('Pager/JumpNo', function (require, module) {


    /**
    * 根据总页数、当前页和上一页预测出要跳转的页码。
    * @param {number} count 总页数。
    * @param {number} cno 当前激活的页码。
    * @param {number} last 上一页的页码。
    * @return {number} 返回一个跳转的页码。
    */
    function get(count, cno, last) {

        if (count <= 1) { // 0 或 1
            return count;
        }

        if (cno == count) {
            return count - 1;
        }

        var no;

        if (cno > last) {
            no = cno + 1;
        }
        else {
            no = cno - 1;
            if (no < 1) {
                no = 2;
            }
        }

        return no;

    }



    return {
        'get': get,
    };




});




define('Pager/Regions', function (require, module) {


    /**
    * 根据总页数和当前页计算出要填充的区间。
    * @param {number} count 总页数。
    * @param {number} no 当前激活的页码。
    * @return {Array} 返回一个区间描述的数组。
    */
    function get(count, no) {

        if (count <= 10) {
            return [
                {
                    'from': 1,
                    'to': count,
                    'more': false,
                }
            ];
        }

        if (no <= 3) {
            return [
                {
                    'from': 1,
                    'to': 5,
                    'more': true,
                }
            ];
        }

        if (no <= 5) {
            return [
                {
                    'from': 1,
                    'to': no + 2,
                    'more': true,
                }
            ];
        }

        if (no >= count - 1) {
            return [
                {
                    'from': 1,
                    'to': 2,
                    'more': true,
                },
                {
                    'from': count - 5,
                    'to': count,
                    'more': false,
                }
            ];
        }

        return [
            {
                'from': 1,
                'to': 2,
                'more': true,
            },
            {
                'from': no - 2,
                'to': no + 2,
                'more': no + 2 != count,
            }
        ];
    }



    return {
        'get': get,
    };




});




define('Pager/Sizes', function (require, module) {

    
    return {

        get: function (sizes, size) {
            size = size || sizes[0];
            sizes = [size, ...sizes];
            sizes = [...new Set(sizes)];

            sizes.sort(function (x, y) {
                return x > y ? 1 : -1;
            });

            return sizes;
        },

    };


});




define('Pager/Template', function (require, module) {
    const Template = require('@definejs/template');
    const $Array = require('@definejs/array');

    let tpl = new Template('#tpl-Pager');


    tpl.process({
        '': function (data) {
            let no = data.no;
            let count = data.count;

            let regions = this.fill('region', data.regions, no);
            let sizes = this.fill('size', data.sizes, data.size);

            return {
                'regions': regions,
                'sizes': sizes,

                'count': data.count,
                'total': data.total,
                'ulId': data.ulId,
                'txtId': data.txtId,
                'sizerId': data.sizerId,
                'toNo': data.toNo,

                'first-disabled-class': no == Math.min(1, count) ? 'disabled' : '',
                'final-disabled-class': no == count ? 'disabled' : '',
                'jump-disabled-class': count == 0 ? 'disabled' : '',
            };
        },

        'region': {
            '': function (region, index, no) {
                let from = region.from;
                let to = region.to;
                let items = $Array.pad(from, to + 1);

                items = this.fill('item', items, no);

                let more = region.more || '';
                if (more) {
                    more = this.fill('more', {});
                }

                let html = items + more;
                return html;
                
            },

            'item': function (no, index, cno) {
                let active = no == cno ? 'active' : '';

                return {
                    'no': no,
                    'active': active,
                };
            },

            'more': function (data) {
                return data;
            },
        },

        'size': function (item, index, size) {
            this.fix('selected');

            return {
                'value': item,
                'selected': item == size ? 'selected="selected"' : '',
            };
        },

    });



    return tpl;



});



define('Pager.defaults', {
    container: '',  //组件的容器。
    total: 0,       //总记录数。
    current: 1,     //当前页码，从 1 开始。
    size: 20,       //分页的大小，即每页的记录数。
    min: 0,         //总页数小于该值时，分页器会隐藏。 如果不指定或指定为 0，则一直显示。
    sizes: [10, 20, 30, 40, 50],      //可供选择的分页大小列表。
});



/**
* 标准分页控件。 
*/
define('Pager', function (require, module) {
    const $ = require('$');
    const Emitter = require('@definejs/emitter');
    const $String = require('@definejs/string');

    const Events = module.require('Events');
    const JumpNo = module.require('JumpNo');
    const Regions = module.require('Regions');
    const Sizes = module.require('Sizes');

    const defaults = require('Pager.defaults');
    let mapper = new Map();




    /**
    * 根据指定配置信息创建一个分页器实例。
    * @param {Object} config 传入的配置对象。 其中：
    * @param {string|DOMElement} container 分页控件的 DOM 元素容器。
    * @param {number} [no=1] 当前激活的页码，默认从 1 开始。
    * @param {number} size 分页大小，即每页的记录数。
    * @param {number} total 总的记录数。
    * @param {number} min 总页数小于该值时，分页器会隐藏。 
        如果不指定，则一直显示。
    * @param {function} change 页码发生变化时的回调函数。
        该函数会接受到当前页码的参数；并且内部的 this 指向当前 Pager 实例。
    * @param {function} error 控件发生错误时的回调函数。
        该函数会接受到错误消息的参数；并且内部的 this 指向当前 Pager 实例。
    */
    function Pager(config) {
        config = Object.assign({}, defaults, config);

        let id = $String.random();
        let emitter = new Emitter(this);
        let size = config.size ;
        let sizes = Sizes.get(config.sizes, size);

        let meta = {
            'id': id,                           //
            'txtId': $String.random(),          //
            'ulId': $String.random(),           //
            'sizerId': $String.random(),        //
            '$': null,                          //         
            'ctn': config.container,            //当前组件的容器。
            'no': config.no || 1,               //当前页码，从 1 开始。
            'size': size,                       //分页的大小，即每页的记录数。
            'total': config.total || 0,         //总的记录数。
            'min': config.min || 0,             //总页数小于该值时，分页器会隐藏。 如果不指定或指定为 0，则一直显示。
            'count': 0,                         //总页数，计算得到。
            'last': 0,                          //上一次的页码。
            'sizes': sizes,                     //可供选择的分页大小列表。
            'emitter': emitter,                 //
            'this': this,                       //引用自身，方便内部子模块使用。
        };

        mapper.set(this, meta);

        Object.assign(this, {
            'id': id,
            'meta': meta,
            '$': meta.$,
        });

    }


    Pager.prototype = { //实例方法
        constructor: Pager,

        id: '',
        $: null,

        /**
        * 
        */
        render: function (options) {
            options = options || {};

            let meta = mapper.get(this);
            let total = typeof options.total == 'number' ? options.total : meta.total;
            let size = typeof options.size == 'number' ? options.size : meta.size;
            let min = typeof options.min == 'number' ? options.min : meta.min;
            let no = typeof options.no == 'number' ? options.no : meta.no;
            let count = Math.ceil(total / size);                //总的页数，计算得到，向上取整。   
            let bind = !!meta.$;                                //是否已绑定。

            //共 0 页的时候。
            if (count == 0) {
                meta.$ && meta.$.hide();
                return;
            }

            //页码超出范围。
            if (no < 1 || no > count) {
                meta.emitter.fire('error', ['输入的页码值只能从 1 到 ' + count]);
                return false;
            }

            meta.$ = this.$ = $(meta.ctn);
            meta.count = count;
            meta.no = no;
            meta.total = total;
            meta.size = size;
            meta.min = min;


            //首次渲染，绑定事件。
            if (!bind) {
                Events.bind(meta);
            }


            if (count < min) {
                meta.$.hide();
                return;
            }

            
             
            let Template = module.require('Template');
            let regions = Regions.get(count, no);
            let toNo = JumpNo.get(count, no, meta.last);

            let html = Template.fill({
                'regions': regions,
                'no': no,
                'count': count,
                'total': total,
                'toNo': toNo,
                'txtId': meta.txtId,
                'sizerId': meta.sizerId,
                'sizes': meta.sizes,
                'size': meta.size,
            });

            meta.$.html(html).show(); //要重新显示出来，之前可能隐藏了
        },


        /**
        * 跳转到指定页码的分页。
        * @param {number} no 要跳转的页码。
        *   指定的值必须为从 1 ~ max 的整数，其中 max 为本控件最大的页码值。
        *   如果指定了非法值，则会触发 error 事件。
        */
        to: function (no) {
            let meta = mapper.get(this);
            let emitter = meta.emitter;
            let isValid = (/^\d+$/).test(no);

            if (!isValid) {
                emitter.fire('error', ['输入的页码必须是数字']);
                return;
            }

            no = parseInt(no);

            isValid = this.render({ 'no': no });
            if (isValid === false) {
                return;
            }

            meta.last = meta.no;
            meta.no = no;


            emitter.fire('change', [no, meta.size]);
        },


        /**
        * 跳到上一页。
        */
        previous: function () {
            let meta = mapper.get(this);
            let no = meta.no - 1;
            if (no < 1) {
                return;
            }

            this.to(no);
        },

        /**
        * 跳到下一页。
        */
        next: function () {
            let meta = mapper.get(this);
            let no = meta.no + 1;
            let count = meta.count;
            if (no > count) {
                return;
            }

            this.to(no);
        },

        /**
        * 跳到第一页。
        */
        first: function () {
            this.to(1);
        },

        /**
        * 跳到最后一页。
        */
        final: function () {
            let meta = mapper.get(this);
            let no = meta.count;
            this.to(no);
        },

        /**
        * 刷新当前页。
        */
        refresh: function () {
            let meta = mapper.get(this);
            let no = meta.no;
            this.to(no);
        },

        /**
        * 给本控件实例绑定事件。
        */
        on: function () {
            let meta = mapper.get(this);
            let emitter = meta.emitter;
            let args = Array.from(arguments);
            emitter.on(args);
        },

        /**
        * 销毁本控件实例。
        */
        destroy: function () {
            let meta = mapper.get(this);
            let emitter = meta.emitter;

            emitter.off();
            meta.$ && meta.$.html('').undelegate();
            mapper.delete(this);
        },
    };

    return Pager;

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
                    'item': function (item) {
                        let id = item.id;

                        //空目录的指示文件。
                        if (id != '/' && id.endsWith('/')) {
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
            panel.on('render', function (list) {

                meta.item = null;
                meta.list = [];
                meta.index = -1;

                tree.render(list);


            });

            
            return panel.wrap({
                open: function (id) {
                    tree.open(id);
                },

                back: function () {
                    let index = meta.index - 1;
                    let item = meta.list[index];

                    if (!item) {
                        return;
                    }

                    meta.index = index - 1; //后退多一步，为 push 做准备。
                    this.open(item.id);
                },

                forward: function () {
                    let index = meta.index + 1;
                    let item = meta.list[index];

                    if (!item) {
                        return;
                    }

                    this.open(item.id);
                },

                up: function () {
                    let item = meta.item;
                    let parent = item ? item.parent : null;

                    if (!parent) {
                        return;
                    }

                    this.open(parent.id);
                },

                root: function () {
                    this.open(1); //cid 从 1 开始。
                },

                dirOnly: function (checked) {
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
            panel.on('render', function (list) {
                Header.render();
                Main.render(list);
                Resizer.render();


                if ($meta.header) {
                    Header.show();
                }

                if ($meta.resizer) {
                    Resizer.show();
                }
               


            });

            return panel.wrap( {
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

        render(options) {
            let meta = mapper.get(this);

            this.init();
            meta.panel.render(options);
        }

        on(...args) {
            let meta = mapper.get(this);
            meta.emitter.on(...args);
        }

        open(id) {
            let meta = mapper.get(this);

            meta.panel.open(id);
        }

    }




    return SidebarTree;
});


define('Table/Meta/Column', function (require, module, exports) {
    const $String = require('@definejs/string');

    return exports = {

 
        create: function (opt) {
            let id = $String.random();  //列 id。

            //列结构。
            let column = {
                'name': opt.name,       //列名。
                'caption': opt.caption, //标题名。
                'index': opt.index,     //列的索引值，即第几列。
                'field': opt.field,     //该列的字段域。
                'table': opt.table,     //表格实例的自身，方便业务使用。

                'id': id,               //列 id，虚拟的，不用于生成 DOM id。
                'cells': [],            //该列所包含的单元格集合。
                'data': {},             //用户自定义数据容器。
                'deps': [],             //
                'infers': [],           //
                'type': 'Table.Column', //类型。
                'change': null,         //

                //对当前的所有单元格进行求和。
                'sum': function (fn) {
                    let sum = 0;

                    column.cells.map(function (cell, index) {
                        let value = fn ? fn.call(opt.table, cell, index) : cell.value;

                        if (value === null) {
                            return;
                        }

                        value = value || 0;

                        sum += value;
                    });

                    return sum;
                },
            };

            return column;
        },



    };

});




/**
* 
*/
define('Table/Meta', function (require, module, exports) {
    const $String = require('@definejs/string');

    const Column = module.require('Column');


    return {

        create: function (config, others) {
            let count = config.count || config.details.length;
            let name$column = {};
            let id$column = {};


            let columns = config.fields.map(function (field, index) {
                let name = field[config.columnName];
                let caption = field[config.captionName];

                //列结构。
                let column = Column.create({
                    'name': name,           //列名。
                    'caption': caption,     //标题名。
                    'index': index,         //列的索引值，即第几列。
                    'field': field,         //该列的字段域。
                    'table': others.this,   //表格实例的自身，方便业务使用。
                });

                name$column[name] = column;
                id$column[column.id] = column;

                return column;
            });



            let meta = {
                'id': $String.random(),

                'fields': config.fields,            //列的字段数组。
                'columnName': config.columnName,    //列名所在的字段名。
                'captionName': config.captionName,  //列标题所在的字段名。
                'details': config.details,          //原始的详情列表数据。
                'container': config.container,            //表格的容器。
                'width': config.width,              //表格宽度。
                'class': config.class,              //css 类名。
                'order': config.order,              //序号列。
                'attributes': config.attributes,    //自定义属性。 会在 html 中生成 `data-` 的自定义属性。

                'count': count,                     //首次要生成的行数。
                'columns': columns,                 //所有的列集合。
                'id$column': id$column,             //用随机 id 关联列。
                'name$column': name$column,         //命名的列。

                'rows': [],                         //所有的行记录集合。
                'id$row': {},                       //用随机 id 关联表格行元数据。
                'id$cell': {},                      //用随机 id 关联单元格元数据。

                'emitter': null,                    //
                'tpl': null,                        //模板实例。
                'element': null,                    //对应的 DOM 元素。
                '$': null,
                '$tbody': null,                     //方便内部使用。
                '$container': null,                 //$(container)
                'this': null,                       //方便内部使用。
            };




            Object.assign(meta, others);


           

            return meta;
           
        },


    };
    
});






define('Table/Order', function (require, module, exports) {


    let defaults = {
        sample: '{order}',
        add: true,
        index: 0,
    };


    return exports = {

        normalize: function (config) {
            let order = config.order;

            if (!order) {
                return config;
            }

            if (order === true) {
                order = {};
            }

            order = Object.assign({}, defaults, order);


            let fields = config.fields.slice(0);
            let item = { [config.columnName]: 'order', caption: '序号', };
            let index = order.index;

            if (order.add) {
                fields.splice(index, 0, item); //在指定位置插入。
            }
            else {
                fields[index] = item;
            }

    
            config = Object.assign({}, config, {
                'order': order,
                'fields': fields,
            });

            return config;

        },


    };

});





define('Table/Reaction', function (require, module, exports) {
    const $Object = require('@definejs/object');
    

    function set(name$column, name, deps, change) {
        let column = name$column[name];

        if (!column) {
            console.warn('不存在名为 ' + name + ' 的列。');
            return;
        }

        if (change) {
            column.change = change;
        }

        if (!deps) {
            return;
        }

        //因为单元格直接引用了列中的 deps 对象，
        //这里要直接修改原对象，而不能设置为新的引用。
        //下面的 col.infers 也如此。
        column.deps.splice(0);      //清空原数组。
        column.deps.push(...deps);  //压进新元素。

        //反写到受影响的列中。
        deps.map(function (dep) {
            let col = name$column[dep];
            if (!col) {
                console.warn('不存在名为 ' + name + ' 的列。');
                return;
            }

            let infers = col.infers;

            infers = new Set(infers);
            infers.add(name);

            //infers = [...infers].map(function (name) {

            //});

            col.infers.splice(0);
            col.infers.push(...infers);
        });

    }



    return {
        /**
        * 设置列的单元格监听规则和处理函数。
        * 已重载 set({ name: { deps: [], change: fn } }); 批量混写的情况 。
        * 已重载 set({ name: deps }); 批量设置 deps 数组的情况。
        * 已重载 set({ name: change }); 批号设置 change 函数的情况。
        * 已重载 set(name, { deps: [], change: fn }); 单个混写的情况。
        * 已重载 set(name, change); 单个设置 change 函数的情况。
        * 已重载 set(name, deps); 单个设置 deps 数组的情况。
        */
        set: function (name, deps, change) {
            let name$column = this;

            //重载 set({  }); 批量的情况。
            if ($Object.isPlain(name)) {
                $Object.each(name, function (name, opt) {

                    //重载 set({ name: [] });
                    if (Array.isArray(opt)) {
                        set(name$column, name, opt, null);
                        return;
                    }

                    //重载 set({ name: function });
                    if (typeof opt == 'function') {
                        set(name$column, name, null, opt);
                        return;
                    }

                    set(name$column, name, opt.deps, opt.change);

                });

                return;
            }

            //重载 set(name, { }); 单个混合的情况。
            if ($Object.isPlain(deps)) {
                let opt = deps;
                set(name$column, name, opt.deps, opt.change);
                return;
            }


            //重载 set(name, change); 的情况。
            if (typeof deps == 'function') {
                change = deps;
                deps = null;
            }


            //单个分开的情况。
            set(name$column, name, deps, change);
            
        },

    };

});





define('Table/Row', function (require, module, exports) {
    const $String = require('@definejs/string');

    return exports = {
        /**
        * 创建并添加一个行记录，但不生成 html。
        */
        create: function (meta, detail) {
            let rows = meta.rows;
            let id = $String.random();  //行 id
            let index = rows.length;
            let data = Object.assign({}, detail);
            let name$cell = {};

            //行结构。
            let row = meta.id$row[id] = {
                'id': id,               //行 id。
                'index': index,         //行索引。
                'type': 'Table.Row',    //类型。
                'cells': null,          //单元格集合。
                'table': meta.this,     //表格实例的自身，方便业务使用。
                'element': null,        //对应的 DOM 元素。
                'data': data,           //用户自定义数据容器。
                'name$cell': name$cell, //命名的单元格集合。
                'value': null,          //该表格行的任意类型的值，由业务层写入。
                'title': '',            //title 提示。
                'class': '',            //css 类名。
                'attributes': {         //生成到 html 中以 `data-` 开头的自定义属性。
                    'index': index,
                },
            };

            //提供一个快捷方法用于访问指定单元格的值。
            row.valueOf = function (name) {
                return name$cell[name].value;
            };

            row.cells = meta.fields.map(function (field, index) {
                let id = $String.random();          //单元格 id
                let column = meta.columns[index];   //当前列。
                let isOrder = meta.order.index == index;  //是否为序号列。
                let name = field[meta.columnName];
                let caption = field[meta.captionName];

                //单元格结构。
                let cell = meta.id$cell[id] = {
                    'id': id,               //单元格 id。
                    'name': name,           //列名。
                    'caption': caption,     //标题名。
                    'type': 'Table.Cell',   //类型。
                    'row': row,             //单元格所在的行引用。
                    'field': field,         //单元格（列）的字段域。
                    'index': index,         //所在的列的索引值。
                    'isOrder': isOrder,       //是否为序号列。
                    'column': column,       //所在的列引用。
                    'table': meta.this,     //表格实例的自身，方便业务使用。
                    'ctrl': null,           //用户控件。
                    'element': null,        //对应的 DOM 元素。
                    'value': null,          //该单元格的任意类型的值，由业务层写入。
                    'data': {},             //用户自定义数据容器。
                    'deps': column.deps,    //引用列中的数组，要注意引用关系。
                    'infers': column.infers,//
                    'title': '',            //title 提示。
                    'html': '',             //单元格的 innerHTML。

                    'class': field.class || '',     //css 类名。

                    'attributes': {         //生成到 html 中以 `data-` 开头的自定义属性。
                        'index': index,
                        'name': name,
                    },
                };

                //传入源单元格，避免联动形成回路。
                //执行该方法，以告诉内部该 cell 发生了变化，从而产生联动。
                cell.change = function (value, srcs) {
                    srcs = srcs || [];
                    srcs.push(cell);

                    cell.value = value;

                    console.log(srcs);


                    //依次调用同一行受影响的单元格的 change() 方法。
                    cell.infers.map(function (name) {
                        let col = meta.name$column[name];
                        let infer = name$cell[name];    //受影响的单元格。
                        let change = col.change;        //受影响的单元格的处理器。

                        ////第一个条件表示是因为 src 单元格的变化导致当前单元格(cell)发生变化，
                        ////而当前单元格(cell)的变化又会导致 src 单元格(infer)变化，形成了回路。
                        //if (infer === src || !change) {
                        //    return;
                        //}

                        if (srcs.includes(infer) || !change) {
                            return;
                        }


                        let value = change.apply(infer, [cell, srcs]);

                        if (value !== undefined) {
                            infer.value = value;
                        }
                    });

                    meta.emitter.fire('change', cell.name, [cell]);
                    meta.emitter.fire('change', [cell]);

                };

                column.cells.push(cell);
                name$cell[name] = cell;

                return cell;
            });

            rows.push(row);


            return row;
        },


        add: function (meta, data) {
            let no = meta.rows.length;

            let row = exports.create(meta, data);
            let html = meta.tpl.fill('tr', row, no);

            //处理 UI 上的。
            meta.$tbody.append(html);
            row.element = document.getElementById(row.id);

            row.cells.map(function (cell) {
                cell.element = document.getElementById(cell.id);
            });

            return row;
        },

        /**
        * 删除一个指定行号的表格行。
        */
        remove: function (meta, no) {
            let rows = meta.rows;
            let row = rows[no];


            //从数据上删除。
            rows.splice(no, 1);
            delete meta.id$row[row.id];


            row.cells.map(function (cell) {
                let ctrl = cell.ctrl;

                ctrl && ctrl.destroy();
                delete meta.id$cell[cell.id];

                cell.ctrl = null;
                cell.element = null;
            });


            meta.columns.map(function (column, index) {
                column.cells.splice(no, 1);
            });


            //从 UI 上删除。
            let tr = row.element;
            tr && tr.parentNode.removeChild(tr);
            row.element = null;



            //被删除的那一行之后的所有序号需要调整。
            rows.slice(no).map(function (row, index) {
                index = row.index = index + no;

                //更新 tr 中的 `data-index`
                if ('index' in row.attributes) {
                    row.element.setAttribute('data-index', index);
                    row.attributes.index = index;
                }

                if (meta.order) {
                    let tpl = meta.tpl;
                   
                    row.cells.map(function (cell) {
                        if (!cell.isOrder) {
                            return;
                        }

                        let html = tpl.fill('tr', 'td', cell, 0, index);
                        cell.element.innerHTML = html;
                    });
                }

            });

      

            return row;

        },

        /**
        * 把指定行号的表格行向前或向后移动若干步。
        */
        move: function (meta, index, step) {
            let rows = meta.rows;
            let targetIndex = index + step;

            if (step == 0 || targetIndex < 0 || targetIndex > rows.length - 1) {
                return;
            }

            let current = rows[index];
            let target = rows[targetIndex];
            let tbody = current.element.parentNode;

            rows.splice(index, 1);
            rows.splice(targetIndex, 0, current);

            if (step > 0) {
                tbody.insertBefore(target.element, current.element);
            }
            else {
                tbody.insertBefore(current.element, target.element);
            }


            //需要调整序号。
            rows.map(function (row, index) {
                if (row.index == index) {
                    return;
                }

                row.index = index;

                //更新 tr 中的 `data-index`
                if ('index' in row.attributes) {
                    row.element.setAttribute('data-index', index);
                    row.attributes.index = index;
                }

                meta.order && row.cells.map(function (cell) {
                    if (!cell.isOrder) {
                        return;
                    }

                    let html = meta.tpl.fill('tr', 'td', cell, 0, index);
                    cell.element.innerHTML = html;
                });

            });

            meta.emitter.fire('move', [current, step]);


        },


    };

});





define('Table/Static', function (require, module, exports) {
    const $Object = require('@definejs/object');
    

    return exports = {
        /**
        * 迭代每个单元格，并执行回调函数。
        * 已重载 eachCell(cell, fn);
        * 已重载 eachCell(row, fn);
        * 已重载 eachCell(column, fn);
        * 已重载 eachCell(cells, fn);
        * 已重载 eachCell(colomns, fn);
        */
        eachCell: function (list, fn) {
            if (!Array.isArray(list)) {
                list = [list];
            }

            let cells = [];

            list.map(function (item) {
                switch (item.type) {
                    case 'Table.Cell':
                        cells.push(item);
                        break;

                    case 'Table.Column':
                    case 'Table.Row':
                        cells = cells.concat(item.cells);
                        break;

                    default:
                        throw new Error('无法识别的 type 值: ' + type);
                }
            });

            cells.map(fn);
        },

        /**
        * 迭代处理指定列的每个单元格，并执行回调函数。
        * 已重载 column(table, fn);
        * 已重载 column(row, fn);
        * 已重载 column(rows, fn);
        */
        column: function (table, name, fn) {
            let cells = [];

            if (Array.isArray(table)) { //rows
                let rows = table;
                rows.map(function (row) {
                    if (!exports.isRow(row)) {
                        return;
                    }

                    let cell = row.name$cell[name];
                    if (cell) {
                        cells.push(cell);
                    }
                });
            }
            else if (exports.isRow(table)) { //row
                let row = table;
                let cell = row.name$cell[name];

                if (cell) {
                    cells.push(cell);
                }
            }
            else { //table
                let name$column = table.get('name$column');
                let column = name$column[name];

                if (column) {
                    cells = column.cells || [];
                }
            }

            cells.map(function (cell, index) {
                fn(cell, index);
            });
        },

        isCell: function (item) {
            return $Object.isPlain(item) && item.type == 'Table.Cell';
        },

        isRow: function (item) {
            return $Object.isPlain(item) && item.type == 'Table.Row';
        },

        isColumn: function (item) {
            return $Object.isPlain(item) && item.type == 'Table.Column';
        },

    };

});





define('Table/Template', function (require, module) {
    const Template = require('@definejs/template');
    const $String = require('@definejs/string');


    function stringify(attributes) {
        if (!attributes) {
            return '';
        }

        attributes = Object.entries(attributes).map(function (item) {
            let key = item[0];
            let value = item[1];
            return 'data-' + key + '="' + value + '"';
        });

        return attributes.join(' ');
    }

    function getTitle(obj) {
        let title = obj.title;

        if (title === undefined || title === '') {
            return '';
        }

        return 'title="' + title + '"';
    }

    function getClass(obj) {
        let list = obj.class;
        if (Array.isArray(list)) {
            list = list.join(' ');
        }

        if (!list) {
            return '';
        }

        return 'class="' + list + '"';
       
    }


    return {
        create: function (meta) {
            let tpl = new Template('#tpl-Table');
            let emitter = meta.emitter;


            tpl.process({
                '': function () {
                    this.fix('attributes');

                    let width = meta.width || '';

                    if (width) {
                        width = 'width: ' + width + 'px;';
                    }

                    let rows = this.fill('tr', meta.rows);
                    let attributes = stringify(meta.attributes);
                    let cssClass = meta.class || '';

                    return {
                        'id': meta.id,
                        'class': cssClass + ' Table',
                        'width': width,
                        'rows': rows,
                        'attributes': attributes,
                    };
                },
                'tr': {
                    '': function (row, no) {
                        this.fix(['class', 'attributes', 'title']);

                        emitter.fire('process', 'row', [row, no]);

                        let attributes = stringify(row.attributes);
                        let cells = this.fill('td', row.cells, no);
                        let title = getTitle(row);
                        let cssClass = getClass(row);

                        return {
                            'id': row.id,
                            'class': cssClass,
                            'attributes': attributes,
                            'title': title,
                            'cells': cells,
                        };
                    },

                    'td': {
                        '': function (cell, index, no) {
                            this.fix(['class', 'attributes', 'title']);

                            let html = '';

                            if (cell.isOrder) {
                                html = $String.format(meta.order.sample, {
                                    'index': index,     //列索引。
                                    'no': no,           //行索引。
                                    'order': no + 1,    //行号。
                                });
                            }
                            else {
                                let values = emitter.fire('process', 'cell', cell.name, [cell, index]);
                                html = values.slice(-1)[0]; //以最后一个为准。

                                //具体命名单元格的事件没有返回值，则再次触发统一 cell 的事件。
                                if (html === undefined) {
                                    values = emitter.fire('process', 'cell', [cell, index]);
                                    html = values.slice(-1)[0]; //以最后一个为准。
                                }
                          

                                let type = typeof html;

                                if (type == 'number' || type == 'boolean') {
                                    html = String(html);
                                }
                            }

                            let display = cell.field.visible === false ? 'display: none;' : '';
                            let attributes = stringify(cell.attributes);
                            let title = getTitle(cell);
                            let cssClass = getClass(cell);

                            return {
                                'id': cell.id,
                                'cid': cell.column.id, //列 id
                                'html': html || '',
                                'class': cssClass,
                                'attributes': attributes,
                                'display': display,
                                'title': title,
                            };
                        },

                    },
                },
            });

            return tpl;

        },

    };

});



define('Table.defaults', {
    '$': null,          //表格的容器。
    'fields': [],       //列的字段数组。
    'width': 0,         //表格宽度。
    'widths': [],       //列的宽度。
    'class': '',        //css class 类名。
    'process': {},      //
    'order': false,     //
    'details': [],      //每一行的详情数据。
    'columnName': 'fieldName',  //列的名称所在的字段名，即从 field[columnName] 中读取的值作为列名。
    'captionName': 'caption',  //列的标题所在的字段名，即从 field[captionName] 中读取的值作为列标题，主要是为了方便调试时查看。
});



/**
* 自定义表格。
*/
define('Table', function (require, module, exports) {
    const $ = require('$');
    const Emitter = require('@definejs/emitter');
    const $Object = require('@definejs/object');

    const Reaction = module.require('Reaction');
    const Static = module.require('Static');
    const Template = module.require('Template');
    const Row = module.require('Row');
    const Order = module.require('Order');
    const Meta = module.require('Meta');

    const defaults = require('Table.defaults');
    let mapper = new Map();


    /**
    * 构造器。
    */
    function Table(config) {
        config = Object.assign({}, defaults, config);
        config = Order.normalize(config);

        let emitter = new Emitter(this);

        let meta = Meta.create(config, {
            'emitter': emitter,         //
            'this': this,               //方便内部使用。
        });

       

        meta.tpl = Template.create(meta);
        mapper.set(this, meta);


        Object.assign(this, {
            'id': meta.id,
            'meta': meta,
        });

        for (let i = 0; i < meta.count; i++) {
            this.new(meta.details[i]);
        }


        let reaction = config.reaction;
        if (reaction) {
            this.reaction(reaction);
        }

        //提供默认的单元格内容填充方式。
        this.on('process', 'cell', function (cell) {
            let item = cell.row.data || {};
            return item[cell.name];
        });

    }




    Table.prototype = {
        constructor: Table,

        id: '',
        $: null,

        render: function () {
            let meta = mapper.get(this);
            let rows = meta.rows;
            let html = meta.tpl.fill({});

            meta.$container = $(meta.container);

            if (!meta.$container.length) {
                throw new Error('不存在容器节点: ' + meta.container);
            }

            meta.$container.html(html);

            meta.rows.map(function (row) {
                row.element = document.getElementById(row.id);

                row.cells.map(function (cell) {
                    cell.element = document.getElementById(cell.id);
                });
            });

            meta.element = document.getElementById(meta.id);
            meta.$ = this.$ = $(meta.element);
            meta.$tbody = meta.$.find('>tbody');


           

            meta.fields.forEach(function (field, index) {
                let delegate = field.delegate;
                if (!delegate) {
                    return;
                }

                //统一转成数组来处理。
                //外面传进来的 delegate 支持为单个的字符串，也支持多个字符串组成的数组。
                let delegates = Array.isArray(delegate) ? delegate : [delegate];

                delegates.forEach(function (delegate) {
                    let selector = '>tr>td[data-name="' + field[meta.columnName] + '"] ' + delegate;

                    meta.$tbody.on('click', selector, function (event) {
                        let parents = $(this).parents().toArray();
                        let len = parents.length;

                        //向上追溯父节点，直到找到 id 符合注册的 cell 为止。
                        //该算法是安全的，因为 id 是内部随机生成的，跟外面的冲突的概率很小。
                        for (let i = 0; i < len; i++) {
                            let el = parents[i];
                            let id = el.id;
                            let cell = meta.id$cell[id]; //根据 id 能找到注册的 cell。

                            //触发四级事件。
                            if (cell) {
                                meta.emitter.fire('click', 'cell', cell.name, delegate, [cell, event, this]);
                                break;
                            }
                        }
                    });
                });
                
            });

            //单元格的点击事件。
            meta.$tbody.on('click', '>tr>td', function (event) {
                let cell = meta.id$cell[this.id];
                meta.emitter.fire('click', 'cell', cell.name, [cell, event]);
                meta.emitter.fire('click', 'cell', [cell, event]);
            });

            //表格行的点击事件。
            meta.$tbody.on('click', '>tr', function (event) {
                let row = meta.id$row[this.id];
                meta.emitter.fire('click', 'row', [row, event]);
            });

            //整个表格的点击事件。
            meta.$tbody.on('click', function (event) {
                meta.emitter.fire('click', [event]);
            });

            meta.emitter.fire('render', [rows]);

            return html;
        },

        /**
        * 创新并添加一个行记录，但不生成 html。
        */
        new: function (detail) {
            let meta = mapper.get(this);
            let row = Row.create(meta, detail);
            meta.emitter.fire('new', [row, detail]);
            return row;
        },


        /**
        * 添加一条或多条行记录。
        */
        add: function (data) {
            let meta = mapper.get(this);

            //重载 add([...]); 批量添加的情况。
            if (Array.isArray(data)) {
                let rows  = data.map(function (item) {
                    return Row.add(meta, item);
                });

                meta.emitter.fire('add', [rows]);
                return rows;
            }

            let row = Row.add(meta, data);
            meta.emitter.fire('add', [row]);

            return row;
        },



        /**
        * 移除指定索引值的行记录。
        * @param {Number} no 要移除的行号。 如果不指定，则为最后一行。
        */
        remove: function (no) {
            let meta = mapper.get(this);

            //如果不指定行号，则删除最后一行。
            if (typeof no != 'number') {
                no = meta.rows.length - 1;
            }

            let row = Row.remove(meta, no);

            meta.emitter.fire('remove', [row, no]);
        },

        /**
        * 把指定表格行向前或向后移动若干步。
        * 已重载 move(index, step);
        * 已重载 move(id, step);
        * 已重载 move(row, step);
        */
        move: function (item, step) {
            let meta = mapper.get(this);
            let type = typeof item;

            let row = type == 'number' ? meta.rows[item] :
                type == 'string' ? meta.id$row[item] :
                type == 'object' ? meta.id$row[item.id] : null;

            if (!row) {
                throw new Error('传入的参数 item 不属性当前 table 的表格行。');
            }

            Row.move(meta, row.index, step);
        },


        fill: function (list) {
            this.clear();

            let meta = mapper.get(this);

            let rows = list.map(function (item) {
                let row = this.new(item);
                return row;

            }, this);

            let html = meta.tpl.fill('tr', rows);
            meta.$tbody.html(html);


            rows.map(function (row) {
                row.element = document.getElementById(row.id);

                row.cells.map(function (cell) {
                    cell.element = document.getElementById(cell.id);
                });
            });

            meta.emitter.fire('fill', [list]);
        },


        clear: function () {
            let meta = mapper.get(this);

            meta.rows.map(function (row) {
                row.cells.map(function (cell) {
                    let ctrl = cell.ctrl;
                    ctrl && ctrl.destroy && ctrl.destroy();
                });
            });

            meta.columns.map(function (column) {
                column.cells.splice(0);
            });

            meta.id$row = {};
            meta.id$cell = {};
            meta.rows.splice(0);     //清空原数组。
            meta.$tbody.html('');
            meta.emitter.fire('clear');

        },


        /**
        * 获取指定的属性值。
        */
        get: function (key) {
            let meta = mapper.get(this);
            let rows = meta.rows;

            //重载 get(); 获取全部行。
            if (arguments.length == 0) {
                return rows;
            }

            //重载 get(no); 获取指定索引值的行。
            if (typeof key == 'number') {
                return rows[key];
            }

            switch (key) {
                case 'id$row':
                case 'id$cell':
                case 'id$column':
                case 'name$column':
                case 'rows':
                case 'columns':
                case 'element':
                case 'details':
                    return meta[key];

                case 'length':
                    return rows.length;
            }

            //此时作为 id 去判断。
            if (typeof key == 'string') {
                return meta.id$cell[key] || 
                    meta.id$row[key] || 
                    meta.id$column[key];
            }

        },

        set: function (key, value) {
            let meta = mapper.get(this);

            switch (key) {
                case 'width':
                    meta[key] = value;
                    break;
                //todo...
            }
        },

        column: function (name, fn) {
            let meta = mapper.get(this);
            let column = meta.name$column[name];

            if (!column) {
                console.warn('不存在名为 ' + name + ' 的列。');
                return;
            }

            column.cells.map(function (cell, index) {
                fn && fn(cell, index);
            });

            return column;
        },

        /**
        * 设置列的单元格监听规则和处理函数。
        * 已重载 reaction({ name: { deps: [], change: fn } }); 批量混写的情况 。
        * 已重载 reaction({ name: deps }); 批量设置 deps 数组的情况。
        * 已重载 reaction({ name: change }); 批号设置 change 函数的情况。
        * 已重载 reaction(name, { deps: [], change: fn }); 单个混写的情况。
        * 已重载 reaction(name, change); 单个设置 change 函数的情况。
        * 已重载 reaction(name, deps); 单个设置 deps 数组的情况。
        */
        reaction: function (name, deps, change) {
            let meta = mapper.get(this);
            Reaction.set.call(meta.name$column, ...arguments);
        },


        destroy: function () {
            let meta = mapper.get(this);

            //已销毁。
            if (!meta) {
                return;
            }

            let table = meta.element;

            meta.tpl.destroy();
            meta.emitter.destroy();
            table.parentNode.removeChild(table);
            meta.$tbody.off();
            meta.$.off();

            $Object.each(meta.id$cell, function (id, cell) {
                let ctrl = cell.ctrl;
                ctrl && ctrl.destroy && ctrl.destroy();
            });

            mapper.delete(this);

        },

        on: function () {
            let meta = mapper.get(this);
            meta.emitter.on(...arguments);
        },

  

    };


    //同时提供静态成员。
    Object.assign(Table, Static);


    return Table;

});




define('TableResizer/Mouse/Masker', function (require) {
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


define('TableResizer/Cols', function (require, module) {
    const Template = require('@definejs/template');

    let tpl = new Template('#tpl-TableResizer');

    tpl.process({
        'colgroup': {
            '': function (data) {
                let cols = this.fill('col', data.fields);

                return {
                    'cols': cols,
                };
            },

            'col': function (field, index) {
                return {
                    'index': index,
                    'width': field.width,
                    'display': field.visible ? '' : 'display: none;',
                };
            },
        },
    });


    return {
        fill: function ($table, fields) {
            let html = tpl.fill('colgroup', { 'fields': fields, });

            $table.prepend(html);

            let cols = $table.find('colgroup>col').toArray();
            return cols;
           
        },


    };

});




define('TableResizer/Fields', function (require, module) {

    return {
        normalize: function (list) {
            list = list.map(function (field, index) {
                field = Object.assign({}, field); //安全起见，避免多实例中互相影响。

                let visible = ('visible' in field) ? field.visible : true;  //如果不指定则默认为 true。
                let width = visible ? field.width || 0 : 0;

                field.visible = !!visible;
                field.dragable = field.dragable === false ? false : true; //只有显式指定了为 false 才禁用。

                field.width = field.width || 0;

                return field;

            });

            return list;
        },

        sum: function (list) {
            let sum = 0;

            list = list.map(function (field, index) {
                if (!field.visible) {
                    return;
                }

                sum += field.width;
            });

            return sum;
        },

    };

});



/**
* 
*/
define('TableResizer/Meta', function (require, module, exports) {
    const $String = require('@definejs/string');


    return {

        create: function (config, others) {

            let meta = {
                'id': $String.random(),         //
                'emitter': null,                //
                'table': null,                  //在 render() 后会变成 DOM 节点
                '$': null,                      //在 render() 后会变成 $() 对象。
                'this': null,                   //
                'selector': config.table,       //原始的 table 选择器。
                'dragable': config.dragable,    //是否允许拖曳。
                'rowspan': config.rowspan,      //最大跨行数。 如果表头有跨行合并单元格，则要指定为最大跨行数。
                'minWidth': config.minWidth,    //列所允许的最小宽度。
                'indexKey': config.indexKey,    //
                'cssClass': config.cssClass,    //
                'fields': null,                 //列字段集合数组。
                'width': 0,                     //表格总宽度。
                'cols': [],                     //col 节点集合。
                'id$index': {},                 //记录每个 resizer 对应的 index。
                'cell$ids': new Map(),          //记录单元格的对应的 resizer 集合。
            };

            Object.assign(meta, others);

            return meta;
           
        },


    };
    
});




define('TableResizer/Mouse', function (require, module, exports) {
    const $ = require('$');
    const Masker = module.require('Masker');


    let id$meta = {};       //
    let draging = false;    //表示鼠标左键是否已按下并还没释放。
    let tdWidth = 0;        //鼠标按下时的 td 宽度。
    let tableWidth = 0;
    let x = 0;              //鼠标按下时的 pageX 值。
    let cursor = '';        //鼠标按下时的 cursor 指针值。

    let id = '';            //鼠标按下时的 target 元素的 id 值。
    let $b = null;

    let body = document.body;


   






    $(body).on({
       
        //开始按下鼠标左键。
        'mousedown': function (event) {
            id = event.target.id;

            let meta = id$meta[id];

            if (!meta) {
                return;
            }

            let index = meta.id$index[id];
            let field = meta.fields[index];
            let isLast = index == meta.fields.length - 1; //是否为最后一列。

            draging = true;
            x = event.pageX;
            cursor = body.style.cursor;
            body.style.cursor = 'ew-resize';

            tdWidth = field.width;

            $b = $('#' + id + '>b');
            $b.addClass('on');
            $b.toggleClass('last', isLast);
            $b.html(tdWidth + 'px');

            Masker.show();
            
        },

        //按住鼠标左键进行移动。
        'mousemove': function (event) {
            if (!draging) {
                return;
            }

            let meta = id$meta[id];
            let dx = event.pageX - x;   //delta width
            let cw = tdWidth + dx;      //cell width

            if (cw < meta.minWidth) {   //单元格宽度不能小于指定的最小宽度。
                return;
            }
          


            let fields = meta.fields;
            let index = meta.id$index[id];
            let col = meta.cols[index];
            let tw = tableWidth = meta.width + dx;

            col.width = fields[index].width = cw;
            meta.$.width(tw);

            $b.html(cw + 'px');

            meta.emitter.fire('change', [{
                'index': index,
                'dx': dx,
                'tdWidth': cw,
                'width': tw,
                'fields': fields,
            }]);
        },

        //释放鼠标左键。
        'mouseup': function () {
            let meta = id$meta[id];
            if (!meta) {
                return;
            }

            meta.width = tableWidth;

            id = '';
            draging = false;

            body.style.cursor = cursor;
            Masker.hide();
            $b && $b.removeClass('on');
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


define('TableResizer/Rows', function (require, module) {
    const $Array = require('@definejs/array');

  
    return {

        get: function (table, rowspan) {
            let rows = Array.from(table.rows).slice(0, rowspan);

            let list = $Array.pad(0, rowspan).map(function () {
                return [];
            });
            

            rows.map(function (row, no) {
                let baseX = 0;
                let cells = list[no];
                let len = cells.length;

                if (len > 0) {
                    //查找空位。
                    baseX = cells.findIndex(function (cell) {
                        return !cell;
                    });

                    //没有空位，则在最后加上。
                    if (baseX < 0) {
                        baseX = len;
                    }
                }

                Array.from(row.cells).map(function (cell, index) {
                    let rowspan = cell.getAttribute('rowspan');
                    let colspan = cell.getAttribute('colspan');

                    rowspan = Number(rowspan) || 1;
                    colspan = Number(colspan) || 1;
                   

                    $Array.pad(0, rowspan).map(function (R) {
                        let y = R + no;
                        let cells = list[y];

                        $Array.pad(0, colspan).map(function (C) {
                            let x = baseX + C;
                            cells[x] = cell;
                        });
                    });


                    baseX += colspan;


                    if (cells[baseX]) {
                        baseX = cells.findIndex(function (cell) {
                            return !cell;
                        });

                        if (baseX < 0) {
                            baseX = cells.length;
                        }
                    }
                });
            });

            return list;


        },
    };

});



define('TableResizer.defaults', {
    dragable: true,   //�Ƿ����ҷ��
    rowspan: 1,       //���������� �����ͷ�п��кϲ���Ԫ����Ҫָ��һ�����ڵ��� 2 ��ֵ��
    minWidth: 20,     //������������С���ȡ�
    indexKey: 'data-target-index',
    cssClass: 'TableResizer',
    fields: [],
});



define('TableResizer', function (require, module) {
    const $ = require('$');
    const $String = require('@definejs/string');
    const Emitter = require('@definejs/emitter');
    const Template = require('@definejs/template');

    const Cols = module.require('Cols');
    const Mouse = module.require('Mouse');
    const Rows = module.require('Rows');
    const Fields = module.require('Fields');
    const Meta = module.require('Meta');

    const defaults = require('TableResizer.defaults');
    let mapper = new Map();
    let tpl = new Template('#tpl-TableResizer');


    function TableResizer(config) {
        config = Object.assign({}, defaults, config);

        let emitter = new Emitter(this);
        let fields = Fields.normalize(config.fields);
        let width = config.width || Fields.sum(fields);

        let meta = Meta.create(config, {
            'emitter': emitter,     //
            'this': this,           //
            'fields': fields,       //列字段集合。
            'width': width,         //表格总宽度。
        });

        mapper.set(this, meta);

        Object.assign(this, {
            'id': meta.id,
            'meta': meta,
        });

       
    }

    //实例方法。
    TableResizer.prototype = {
        constructor: TableResizer,

        id: '',
        $: null,


        render: function () {
            this.destroy(true); //弱销毁。

            let meta = mapper.get(this);

            meta.$ = this.$ = $(meta.selector);
            meta.$.addClass(meta.cssClass);

            let table = meta.table = meta.$.get(0);
            let rows = Rows.get(table, meta.rowspan);


            //指定了允许可拖曳，则在有效行(一般是第一行)的列之间生成 resizer 相应的 html。
            meta.dragable && rows.map(function (cells) {

                cells.map(function (cell, index) {
                    let id = $String.random();
                    let targetIndex = cell.getAttribute(meta.indexKey);

                    //指定了要关联的目标列索引值，则只创建和保留对应的 resizer。
                    if (targetIndex !== null) {
                        let ids = meta.cell$ids.get(cell) || [];
                        let nextIndex = ids.length;

                        ids.push(id);
                        meta.cell$ids.set(cell, ids);

                        if (nextIndex != targetIndex) {
                            return ;
                        }
                    }

                    let field = meta.fields[index];

                    let html = tpl.fill('resizer', {
                        'id': id,
                        'display': field.dragable === false ? 'display: none;' : '',
                    });

                    $(cell).append(html);

                    meta.id$index[id] = index;
                    Mouse.set(id, meta);

                    return;
                });
            });
            
            meta.cols = Cols.fill(meta.$, meta.fields);

            meta.$.width(meta.width);
            meta.emitter.fire('render', [meta.width, meta.fields]);

        },

        /**
        * 设置指定索引号的列宽和整个表格的宽度。
        */
        set: function (data) {
            let index = data.index;
            let width = data.width;
            let tdWidth = data.tdWidth;

            let meta = mapper.get(this);

            meta.fields[index].width = tdWidth;
            meta.cols[index].width = tdWidth;
            meta.width = width;

            meta.$.width(width);

        },


        on: function () {
            let meta = mapper.get(this);

            meta.emitter.on(...arguments);
        },

        destroy: function (weak) {
            let meta = mapper.get(this);

            Object.keys(meta.id$index).map(function (id) {
                Mouse.remove(id);

                let el = document.getElementById(id);
                el && el.parentNode.removeChild(el);
            });


            //当指定 weak 为 true 时，表示是弱销毁，一般是内部调用。
            if (!weak) {
                let cg = meta.$.find('>colgroup').get(0);
                cg && cg.parentNode.removeChild(cg);

                meta.emitter.destroy();
                meta.$.removeClass(meta.cssClass);
                mapper.delete(this);
            }
          
        },
    };

    return TableResizer;
});


define('TextTree/Events', function (require, module, exports) {

    const $ = require('$');

    let id$closed = {};

    //向下检查看是否有父亲节点是处于关闭状态。
    function checkParentClosed(id, id$parent) {
        let pid;
        let closed;

        do {
            pid = id$parent[id];
            closed = id$closed[pid];
            id = pid;
        }
        while (typeof pid == 'string' && !closed);
        
        return closed;
    }




    return {
        bind: function (meta) {

            let cmdSelector = `#${meta.id} [data-cmd]`;

            $(document.body).on('click', cmdSelector, function (event) {
                let { cmd, index, } = event.currentTarget.dataset;
                if (cmd == 'icon-dir') {
                    return;
                }

                index = Number(index);

                let item = meta.items[index];
                item = meta.id$item[item.id];

                meta.emitter.fire('cmd', cmd, [item]);
                meta.emitter.fire('cmd', [cmd, item]);
            });


            $(document.body).on('click', cmdSelector, function (event) {
                let { cmd, index, } = event.currentTarget.dataset;

                if (cmd != 'icon-dir') {
                    return;
                }


                let $icon = $(this);
                let item = meta.items[index];
                let { id, } = item;

                //剪头向右时，说明当明是折叠状态（即关闭状态），下一步需要展开。
                let needOpen = $icon.hasClass('closed');
                let liSelector = `#${meta.id} li[data-id^="${id}${meta.seperator}"]`;

                $icon.toggleClass('closed', !needOpen);
                id$closed[id] = !needOpen;

                console.log(id$closed)


                $(liSelector).each(function () {
                    let $li = $(this);
                  
                    //需要关闭。
                    if (!needOpen) {
                        $li.slideUp('fast');
                        return;
                    }


                    //需要打开。
                    let { id, } = this.dataset;
                    let isParentClosed = checkParentClosed(id, meta.id$parent);

                    if (isParentClosed) {
                        $li.slideUp('fast');
                    }
                    else {
                        $li.slideDown('fast');
                    }

                    
                });


                
            });
            
          



           
        },

    };
});

/**
* 
*/
define('TextTree/Meta', function (require, module, exports) {
    const $String = require('@definejs/string');
    const Tree = require('@definejs/tree');

    let count = 0;

    
    function makeData(list, seperator) {
        let id$item = {};
        let id$parent = {};
        let id$parents = {};
        let id$childs = {};
        let id$children = {};
        let id$siblings = {};
        let id$index = {};

        let ids = list.map((item, index) => {
            let { id, } = item;
            let names = id.split(seperator);
            let name = names.slice(-1)[0];
            let parent = null;
            let parents = [];

            id$item[id] = item;

            if (names.length > 1) {
                let pid = parent = names.slice(0, -1).join(seperator); //父模块 id。
                let childs = id$childs[pid] || [];

                childs.push(id);
                id$childs[pid] = childs;

                parents = names.map((name, index) => {
                    return names.slice(0, index + 1).join('/');
                });
                parents = parents.reverse();
                parents = parents.slice(1);
            }

            id$parent[id] = parent;
            id$parents[id] = parents;


            return id;
        });


        ids.forEach((id, index) => {
            //收集指定模块下的所有子模块（包括间接子模块）。
            let children = ids.filter((mid) => {
                return mid.startsWith(`${id}${seperator}`);
            });

            id$children[id] = children;
            id$index[id] = index;

            let parent = id$parent[id];

            if (typeof parent == 'string') {
                let childs = id$childs[parent] || [];

                //从兄弟结点中过滤掉自己。
                let siblings = childs.filter((mid) => {
                    return mid != id;
                });

                id$siblings[id] = [...new Set(siblings)];
            }
        });


        let info = { ids, id$item, id$children, id$childs, id$parent, id$parents, id$siblings, id$index, };

        console.log(info);
        return info;
    }



    return {

        create: function (config, others) {
            let id = `TextTree-${count++}-${$String.random(4)}`;

            let meta = {
                id,
                'seperator': config.seperator,
                'secondaryKey': config.secondaryKey,
                'container': config.container,
                'emptyText': config.emptyText,

                'showSecondary': config.showSecondary,
                'showIcon': config.showIcon,
                'showTab': config.showTab,
                'showColor': config.showColor,
                'showHover': config.showHover,
                
                'highlightIndex': -1, //当前高亮的项。


                'items': [],        //tree 渲染后对应的列表，排序可能跟传入的 list 不同，以渲染后的为准。
                'id$item': {},
                'id$index': {},
                'id$children': {},
                'id$childs': {},
                'id$parent': {},
                'id$parents': {},
                'id$siblings': {},

                'tree': null,
                '$': null,
                'this': null,
                'emitter': null,
                'tpl': null,

                'makeData': function (list, seperator) {
                    list = list || [];
                    seperator = seperator || meta.seperator;

                    let data = makeData(list, seperator);

                    Object.assign(meta, {
                        'id$item': data.id$item,
                        'id$index': data.id$index,
                        'id$children': data.id$children,
                        'id$childs': data.id$childs,
                        'id$parent': data.id$parent,
                        'id$parents': data.id$parents,
                        'id$siblings': data.id$siblings,
                    });

                    return data;
                },

                'toggleHideClass': function (cls, visible) {
                    if (!meta.$) {
                        return;
                    }

                    if (typeof visible == 'boolean') {
                        meta.$.toggleClass(cls, !visible);
                    }
                    else {
                        meta.$.toggleClass(cls);
                    }
                },


            };

            let { ids, } = meta.makeData(config.list);
            meta.tree = new Tree(ids, meta.seperator);

            Object.assign(meta, others);



            return meta;
           
        },


    };
    
});





define('TextTree/Template', function (require, module, exports) {
    const Template = require('@definejs/template');




    return {
        create: function (meta) {
            let tpl = new Template('#tpl-TextTree');

            function fill(name, data) {
                let html = tpl.fill(name, data);

                html = html.trim();
                html = html.split('\n').join('');
                return html;
            }

            tpl.process({
                '': function (data) {
                    let items = this.fill('item', data.list);

                    return {
                        'id': data.id,
                        'items': items,
                        'hide-tab': meta.showTab ? '' : 'hide-tab',
                        'hide-icon': meta.showIcon ? '' : 'hide-icon',
                        'hide-secondary': meta.showSecondary ? '' : 'hide-secondary',
                        'hide-color': meta.showColor ? '' : 'hide-color',
                        'hide-hover': meta.showHover ? '' : 'hide-hover',
                    };
                },


                'item': function (item, index) {
                    let { tabs, key, linker, id, } = item;
                    let children = meta.id$children[id] || [];
                    let isDir = children.length > 0;

                    key = key || meta.emptyText;
                    tabs = fill('tabs', item);
                    key = fill('key', { key, index, id, isDir, });
                    linker = fill('linker', item);

                    return {
                        id,
                        tabs,
                        linker,
                        key,
                        index,
                        'type': isDir ? 'dir' : 'file',
                        'not-found': meta.id$item[id] ? '' : 'not-found', //该项可能不存在。
                    };
                },

                'tabs': function (data) {
                    let { tabs, } = data;
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

                'key': {
                    '': function (data) {
                        let secondary = this.fill('secondary', data); //可能返回空串。
                        let icon = this.fill('icon', data);

                        return {
                            ...data,
                            icon,
                            secondary,
                        };
                    },

                    'icon': function ({ isDir, }) {

                        return {
                            'type': isDir ? 'dir': 'file',
                            'icon': isDir ? 'fas fa-angle-down' : 'far fa-circle',
                        };

                    },

                    'secondary': function (data) {
                        let { secondaryKey, } = meta;

                        //如果不指定对应的 key，则不生成 html 内容。
                        if (!secondaryKey) {
                            return '';
                        }

                        let index = data.index;
                        let item = meta.id$item[data.id];
                        if (!item) {
                            return {}
                        }

                        let secondary = item[secondaryKey];

                        return { secondary, secondaryKey, index, };
                    },
                },


            });


            return tpl;

        },

    };
});

define('TextTree.defaults', {
    seperator: '/',
    emptyText: '(app)',
    secondaryKey: '', //副内容的字段名，如果指定则显示。
    showSecondary: false,
    showIcon: false,
    showTab: false,
    showColor: false,
    showHover: false,
});

/**
* 菜单树。
*/
define('TextTree', function (require, module, exports) {
    const Emitter = require('@definejs/emitter');
    const $Object = require('@definejs/object');
    const $ = require('$');
    const Events = module.require('Events');
    const Meta = module.require('Meta');
    const Template = module.require('Template');

    const defaults = require('TextTree.defaults');
    let mapper = new Map();

    class TextTree {

        constructor(config) {
            config = Object.assign({}, defaults, config);

            let emitter = new Emitter(this);

            let meta = Meta.create(config, {
                'this': this,
                'emitter': emitter,
            });

            meta.tpl = Template.create(meta);

            mapper.set(this, meta);

            Object.assign(this, {
                'id': meta.id,
                '$': meta.$,
            });

            Events.bind(meta);

        }


        render(list) {
            let meta = mapper.get(this);

            if (list) {
                let { ids, } = meta.makeData(list);
                meta.tree.clear();

                ids.forEach((id) => {
                    let keys = id.split(meta.seperator);

                    meta.tree.set(keys);
                });
            }
            
            // debugger;
            // meta.tree = meta.tree.spawn(['htdocs']);
            
            let items = meta.tree.render(function (node, info) {
                let { key, nodes, keys, value, } = node;
                let { tabs, linker, content, } = info;
                let id = keys.join(meta.seperator);

                return { id, tabs, key, linker, };
            });

            meta.items = items;


            let html = meta.tpl.fill({
                'id': meta.id,
                'list': items,
            });


            if (meta.container) {
                $(meta.container).html(html);
                meta.$ = meta.this.$ = $(`#${meta.id}`);
            }

            return html;

        }

        toString(withSecondary) {
            let meta = mapper.get(this);

            //如果没有指定 withSecondary，则根据当前界面的状态来判断。
            if (withSecondary === undefined && meta.$) {
                withSecondary = !meta.$.hasClass('hide-secondary');
            }

            let texts = meta.tree.render(function (node, info) {
                let { key, nodes, keys, value, } = node;
                let { tabs, linker, content, } = info;
                let secondary = '';

                if (withSecondary) {
                    let id = keys.join(meta.seperator);
                    let item = meta.id$item[id];
                    secondary = item[meta.secondaryKey];
                }

                let s = `${tabs}${linker} ${key || meta.emptyText}`;

                if (secondary) {
                    s = s + ' ' + secondary;
                }

                return s;
            });

            let content = texts.join('\n');

            return content;
        }

        on(...args) {
            let meta = mapper.get(this);

            meta.emitter.on(...args);
        }

        toggle(opt) {
            let meta = mapper.get(this);

            if ($Object.isPlain(opt)) {
                $Object.each(opt, function (key, showValue) {
                    meta.toggleHideClass(`hide-${key}`, showValue);
                });
            }
            else {
                meta.$.toggle(opt);
            }
        }

        highlight(id) {
            let meta = mapper.get(this);
            let index = meta.id$index[id];

            if (index < 0) {
                console.warn(`不存在 id 为 ${id} 的项。`)
                return;
            }

            if (meta.highlightIndex) {
                meta.$.find(`[data-cmd="id"][data-index="${meta.highlightIndex}"]`).removeClass('on');
            }

            meta.$.find(`[data-cmd="id"][data-index="${index}"]`).addClass('on');
            meta.highlightIndex = index;
        }
        
    }

    

    return TextTree;
});

define('$', function (require, module, exports) {
    return window.definejs.require('jquery');
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





    


define('/Markdoc/API', function (require, module, exports) {
    const Emitter = require('@definejs/emitter');
    const API = require('API');

    let emitter = new Emitter();




    return {
        on: emitter.on.bind(emitter),


        /**
        * 读取指定文件或目录的信息。
        */
        read: function (id) {
            let api = new API('FileList.read', {
                // proxy: '.json',
            });

            api.on({
                'request': function () {
                    emitter.fire('loading', [true]);
                },

                'response': function () {
                    emitter.fire('loading', [false]);
                },

                'success': function (data, json, xhr) {
                    let { content, isImage, url, } = data;

                    if (isImage) {
                        //markdown 语法。 中括号之间要留个空格，才能在 markdoc 的源码中语法高亮。
                        content = `![ ](${url})`;
                    }

                    emitter.fire('success', [content]);
                },

                'fail': function (code, msg, json, xhr) {
                    definejs.alert('获取文件内容失败: {0}', msg);
                },

                'error': function (code, msg, json, xhr) {
                    definejs.alert('获取文件内容错误: 网络繁忙，请稍候再试');
                },
            });

            api.get({ 'id': id, });

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
        parse (sUrl) {
            let isOrigin = sUrl.startsWith('@');            //是否明确指定作为源码模式。
            let url = isOrigin ? sUrl.slice(1) : sUrl;      //
            let ext = url.split('.').slice(-1)[0];          //
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
    const API = module.require('API');
    const Header = module.require('Header');
    const Content = module.require('Content');
    const Url = module.require('Url');
    const Outline = module.require('Outline');
    const Tools = module.require('Tools');


    let meta = {
        info: null,
    };



    panel.on('init', function () {

        Header.on({
            'check': function (cmd, checked) {
                panel.$.toggleClass(`no-${cmd}`, !checked);
            },
        });
       


        API.on({
            'loading': function (visible) {
                panel.fire('loading', [visible]);
            },

            'success': function (content) {
                Content.render(content, meta.info);
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
        let info = meta.info = Url.parse(url);

        //切换普通模式和代码模式。
        panel.$.toggleClass('source', info.isCode);

        //针对代码模式的头部工具栏，仅代码模式时显示。
        Header.render(info);

        API.read(info.url);

       
        
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

        tabs.render(list);
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



define('/FileList/Body/Main/Icon/List/Data', function (require, module, exports) {
    const File = require('File');

    function sort(a, b) {
        a = a.name;
        b = b.name;

        return a == b ? 0 :
            a > b ? 1 : -1;
    }


    return {
        get(list) {
            let dirs = [];
            let files = [];

            list.forEach((item) => {
                let { data, } = item;
                let { name, type, } = data;
                let ext = File.getExt(name);
                let sname = name.split('/').slice(-1)[0];
                let oItem = { ...data, ext, sname, };
                let list = type == 'dir' ? dirs : files;

                list.push(oItem);
            });


            dirs = dirs.sort(sort);
            files = files.sort(sort);

            list = [...dirs, ...files,];

            return list;
        },
    };
});

define.panel('/FileList/Body/Main/Icon/List', function (require, module, panel) {
    const File = require('File');
    const Data = module.require('Data');
    

    let list = [];


    panel.on('init', function () {
       
        panel.template(function (item, index) {
            let icon = File.getIcon(item);

            return {
                'index': index,
                'icon': icon.html,
                'name': item.sname,
            };
        });

        panel.$on('click', {
            '[data-index]': function (event) {
                let index = + this.dataset.index;
                let item = list[index];

                panel.fire('item', [item]);
            },
        });

    });


    /**
    * 渲染内容。
    */
    panel.on('render', function (items) {
        list = Data.get(items);
        panel.fill(list);

    });




    return {
        
    };

});


define.panel('/FileList/Body/Main/Icon', function (require, module, panel) {

    const List = module.require('List');




    panel.on('init', function () {
       
        List.on({
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
    panel.on('render', function (opt) {

        List.render(opt.item.list);

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



    panel.on('render', function (list) {
        list = $Array.map(list, (item) => {
            let { type, name, } = item.data;

            return type == 'dir' ? {
                'text': item.name,
                'checked': true,
                'value': name,
            } : null;
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
        Name.render();
        CWD.render(meta.cwd);
        Files.render();
        Dirs.render();
        ChildDirs.render(item.list);
    });



});





define.panel('/FileList/Body/Main/List/Dir/GridView', function (require, module, panel) {
    const $Date = require('@definejs/date');
    const GridView = require('GridView');
    const File = require('File');


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
            primaryKey: 'id',
            check: false,
            order: true,
            class: '',
            footer: false,

            fields: [
                { caption: '路径', name: 'name', width: 600, class: 'name', dragable: true, delegate: '[data-cmd]', },
                { caption: '大小', name: 'size', width: 95, class: 'size number', dragable: true, },
                { caption: '文件数', name: 'files', width: 74, class: 'files number', dragable: true, },
                { caption: '目录数', name: 'dirs', width: 74, class: 'dirs number', dragable: true, },
            ],

        });

        gridview.on('process', 'row', function (row) {
            
        });

        gridview.on('process', 'cell', {
            'name': function (cell) {
                let item = cell.row.data;
                let name = item.name;
                let icon = File.getIcon(item.item);
                
                if (meta.keyword) {
                    name = name.split(meta.keyword).join(meta.keywordHtml);
                }

                let html = tpl.fill('name', {
                    'icon': icon.html,
                    'name': name,
                });

                return html;
            },
            'files': function (cell) {
                let item = cell.row.data;

                cell.class += ` files-${item.files}`;
            },
        });


        gridview.on('click', 'cell', {
            'name': {
                '': function (cell, event) {

                },

                '[data-cmd]': function (cell, event) {
                    event.stopPropagation();
                    let item = cell.row.data.item;
                    panel.fire('item', [item]);

                },
            },
        });

        gridview.on('click', 'table', function (table, event) {
            table.column('name', function (cell) {
                $(cell.element).removeClass('text');
            });
        });


        gridview.render();


    });


    /**
    * 渲染内容。
    *   list: [],       //必选，数据列表。
    *   opt: {          //可选。
    *       keyword: '' //高亮的关键词。
    *       root: '',   //根目录。
    *   },    
    */
    panel.on('render', function (list, opt = {}) {
        let keyword = meta.keyword = opt.keyword || '';
        let root = opt.root || '';

        if (keyword) {
            meta.keywordHtml = '<span class="keyword">' + keyword + '</span>';
        }

        list = list.map(function (item, index) {
            let isFile = item.type == 'file';
            let size = File.getSizeDesc(item.size);
            let {  name, } = item;

            if (isFile) {
      
            }
            else { //目录。
                name += '/';
            }


            return {
                'name': root + name,
                'size': size.value + ' ' + size.desc,
                'dirs': item.dirs.length,
                'files': item.files.length,
                'item': item, //点击时会用到。
            };

        });

        gridview.fill(list);

    });



});



define('/FileList/Body/Main/List/Dir/Data', function (require, module, exports) {

    let meta = {
        list: [],
        dirs: [],
    };

    function filter(list, data, fn) {
        if (data) {
            list = list.filter(fn);
        }

        return list;
    }

    return {

        init(list) {

            meta.list = list;

            meta.dirs = list.filter((item) => {
                return item.type == 'dir';
            });


            meta.dirs.forEach((item) => {
                let size = item.stat.size; //目录自身的大小。
                let dir = item.name;
                let files = [];
                let dirs = [];

                list.forEach((item) => {
                    let { name, stat, type, } = item;
                    let isChild = name.startsWith(`${dir}/`);

                    if (!isChild) {
                        return;
                    }

                    if (type == 'file') {
                        size += stat.size; //累加文件的大小。
                        files.push(item);
                    }
                    else {
                        dirs.push(item);
                    }

                });


                //增加字段。
                item.files = files;
                item.dirs = dirs;
                item.size = size;
            });
            
        },



        /**
        * 从列表数据中过滤出指定条件的子集。
        */
        filter: function (opt) {
            let {
                cwd = '',
                name = '',
                files$checked = null,
                dirs$checked = null,
                childDirs = null,
            } = opt;

            let list = meta.dirs;

            list = filter(list, name, function (item) {
                return item.name.includes(name);
            });

            
            //注意，根目录的 id 为字符串 '/'。
            list = filter(list, cwd, function (item) {
                
                let { name, } = item;

                //根目录的。
                if (cwd == '/') {
                    return !name.slice(1).includes('/');
                }

                //其它目录的。
                let suffix = name.slice(cwd.length + 1);
                return !suffix.includes('/');

            });

            list = filter(list, files$checked, function (item) {
                let N = item.files.length;

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
                let N = item.dirs.length;

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



            if (!cwd) {
                list = filter(list, childDirs, function (item) {
                    let { name, } = item;

                    let isOK = childDirs.some((dir) => {

                        return name == dir || name.startsWith(`${dir}/`)
                    });

                    return isOK;
                });
            }
            



            return list;

        },

    };

});


define.panel('/FileList/Body/Main/List/Dir', function (require, module, panel) {
    const Filter = module.require('Filter');
    const GridView = module.require('GridView');
    const Data = module.require('Data');



    let meta = {
        'root': '',
        'item': null,
    };



    panel.on('init', function () {
       
        Filter.on({
            'change': function (filter) {
                
                filter = Object.assign({}, filter, {
                    'cwd': filter.cwd ? meta.item.id : '',
                });


                let list = Data.filter(filter);

                GridView.render(list, {
                    'keyword': filter.name,
                    'root': meta.root,
                });

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
    panel.on('render', function (opt) {
        if (opt.item === meta.item) {
            panel.show();
            return;
        }

        
        meta.item = opt.item;
        meta.root = opt.root;

        Data.init(opt.list);
        Filter.render(opt.item);


    });




    return {
        
    };

});


/*
* 
*/
define.panel('/FileList/Body/Main/List/File/Filter/CWD', function (require, module, panel) {
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
                fireCheck(list);
            },
            'fill': function (list) {
                fireCheck(list);
            },
        });


       
    });



    panel.on('render', function (list) {
        list = $Array.map(list, (item) => {
            let { type, name, } = item.data;

            return type == 'dir' ? {
                'text': item.name,
                'checked': true,
                'value': name,
            } : null;
        });

        chk.render(list);

    });



    return {
        
    };







});


/*
* 
*/
define.panel('/FileList/Body/Main/List/File/Filter/Encoding', function (require, module, panel) {
    const DropCheckList = require('DropCheckList');

    let chk = null;

    let list = [
        { text: 'UTF8', checked: true, value: 'utf8', },
        { text: '其它', checked: true, value: 'other', },
    ];

    panel.on('init', function () {

        chk = new DropCheckList({
            'container': panel.$,
            'text': '编码',
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



    panel.on('render', function (exts) {

        list = exts.map((ext) => {
            return {
                'text': `${ext.slice(1)} 文件`,
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
    const Encoding = module.require('Encoding');
    const Name = module.require('Name');
    const CWD = module.require('CWD');
    const MD5 = module.require('MD5');
    const ChildDirs = module.require('ChildDirs');


    //当前选中的数据字段。
    let meta = {
        name: '',
        cwd: false, //是否仅限当前目录。
        ext$checked: null,
        encoding$checked: null,
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

        CWD.on({
            'change': function (checked) {
                change({ 'cwd': checked, });
            },
        });


        Type.on({
            'check': function (list) {
                change({
                    'ext$checked': make(list),
                });
            },
        });

        Encoding.on({
            'check': function (list) {
                change({
                    'encoding$checked': make(list),
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
    panel.on('render', function ({ exts, item, }) {
        
        Type.render(exts);
        Encoding.render();
        CWD.render(meta.cwd);
        Name.render();
        MD5.render();

        ChildDirs.render(item.list);

    });



});





define.panel('/FileList/Body/Main/List/File/GridView', function (require, module, panel) {
    const $Date = require('@definejs/date');
    const GridView = require('GridView');
    const File = require('File');


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
            primaryKey: 'id',
            check: false,
            order: true,
            class: '',
            footer: false,

            fields: [
                { caption: '路径', name: 'name', width: 600, class: 'name', dragable: true, delegate: '[data-cmd]', },
                { caption: '大小', name: 'size', width: 70, class: 'size number', dragable: true, },
                { caption: '编码', name: 'isUTF8', width: 80, class: 'utf8', dragable: true, },
                { caption: 'MD5', name: 'md5', width: 285, class: 'md5', dragable: true, },
            ],

        });

        gridview.on('process', 'row', function (row) {
            row.class = row.data.item.type;
        });



        gridview.on('process', 'cell', {
            'name': function (cell) {
                let item = cell.row.data;
                let name = item.name;
                let icon = File.getIcon(item.item);
                
                if (meta.keyword) {
                    name = name.split(meta.keyword).join(meta.keywordHtml);
                }

                let html = tpl.fill('name', {
                    'icon': icon.html,
                    'name': name,
                });

                return html;
            },

            'md5': function (cell) {
                let item = cell.row.data.item;
                let { md5, files, } = item;
                let lastItem = files.slice(-1)[0];

                if (files.length > 1) {
                    cell.class += ' repeat';

                    if (item === lastItem) {
                        cell.row.class += ' md5-group-bottom';
                    }
                }
            },
        });

       

        gridview.on('click', 'cell', {
            'name': {
                '': function (cell, event) {

                },

                '[data-cmd]': function (cell, event) {
                    event.stopPropagation();
                    let item = cell.row.data.item;
                    panel.fire('item', [item]);

                },
            },
        });

        gridview.on('click', 'table', function (table, event) {
            table.column('name', function (cell) {
                $(cell.element).removeClass('text');
            });
        });


        gridview.render();


    });


    /**
    * 渲染内容。
    *   list: [],       //必选，数据列表。
    *   opt: {          //可选。
    *       keyword: '' //高亮的关键词。
    *       root: '',   //根目录。
    *   },    
    */
    panel.on('render', function (list, opt = {}) {
        let keyword = meta.keyword = opt.keyword || '';
        let root = opt.root || '';

        if (keyword) {
            meta.keywordHtml = '<span class="keyword">' + keyword + '</span>';
        }

        gridview.$.toggleClass('md5-repeat-mode', opt.isMd5Mode);



        list = list.map(function (item, index) {
            let stat = item.stat;


            let birthtime = $Date.format(stat.birthtime, 'yyyy-MM-dd HH:mm:ss');
            let mtime = $Date.format(stat.mtime, 'yyyy-MM-dd HH:mm:ss');

            let isFile = item.type == 'file';
            let size = File.getSizeDesc(stat.size);
            let { isUTF8, name, } = item;

            if (isFile) {
                //name = name.startsWith('/') ? name.slice(1) : name; //根目录的文件，去掉首字符的 `/`。
            }
            else { //目录。
                name += '/';
            }


            return {
                'name': root + name,
                'typeDesc': isFile ? item.ext.slice(1) + ' 文件' : '目录',
                'size': size.value + ' ' + size.desc,
                'birthtime': birthtime,
                'mtime': mtime,
                'isUTF8': isFile ? (isUTF8 ? 'UTF8' : '其它') : '',
                'md5': item.md5,
                'item': item, //点击时会用到。
            };

        });




        gridview.fill(list);

    });



});



define('/FileList/Body/Main/List/File/Data', function (require, module, exports) {
    const $Array = require('@definejs/array');

    let meta = {
        list: [],
        files: [],
        exts: [],
        md5$files: {},
    };

    function filter(list, data, fn) {
        if (data) {
            list = list.filter(fn);
        }

        return list;
    }



    return {

        init(list) {

            let exts = new Set();

            meta.md5$files = {}; //这里每次都要重置。
            meta.list = list;

            meta.files = list.filter((item) => {
                if (item.type == 'dir') {
                    return false;
                }

                let { ext, md5, } = item;
                let { md5$files, } = meta;

                exts.add(ext.toLowerCase());
                $Array.add(md5$files, md5, item);

                //增加一个字段。
                //表示 md5 相同的文件的列表。
                item.files = md5$files[md5];


                

                return true;
            });

            meta.exts = [...exts,];



            return meta;

        },


       


        /**
        * 从列表数据中过滤出指定条件的子集。
        */
        filter: function ( opt) {

            let {
                cwd = '',
                name = '',
                ext$checked = null,
                encoding$checked = null,
                md5$checked = null,
                childDirs = null,
            } = opt;

            let list = meta.files;



            list = filter(list, name, function (item) {
                return item.name.includes(name);
            });

            list = filter(list, cwd, function (item) {
                let { name, } = item;

                //根目录的。
                if (cwd == '/') {
                    return !name.slice(1).includes('/');
                }

                //其它目录的。
                let suffix = name.slice(cwd.length + 1);
                return !suffix.includes('/');
            });

            list = filter(list, ext$checked, function (item) {
                let ext = item.ext.toLowerCase(); //这里要统一为小写。

                return ext$checked[ext];
            });


            list = filter(list, encoding$checked, function (item) {
                let encoding = item.isUTF8 ? 'utf8' : 'other';
                return encoding$checked[encoding];
            });

            list = filter(list, md5$checked, function (item) {
                let { md5, } = item;
                let files = meta.md5$files[md5];
                let N = files.length;

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

            if (!cwd) {
                list = filter(list, childDirs, function (item) {
                    let { name, } = item;

                    let isOK = childDirs.some((dir) => {

                        return name == dir || name.startsWith(`${dir}/`)
                    });

                    return isOK;
                });
            }
            


            
            let isMd5Mode = false;

            //此时仅要查看重复的文件。
            //则按 md5 值进行分组，让 md5 值相同的记录排在一起。
            if (md5$checked && md5$checked['N>1'] && !md5$checked['N=1']) {
                let md5$files = {};

                list.forEach((item) => {
                    let { md5, files, } = item;
                    md5$files[md5] = files;
                });

                isMd5Mode = true;
                list = [];

                Object.keys(md5$files).forEach((md5) => {
                    let files = md5$files[md5];

                    list = [...list, ...files,];
                });

            }



            return { list, isMd5Mode, };



        },

    };

});


define.panel('/FileList/Body/Main/List/File', function (require, module, panel) {
    const Filter = module.require('Filter');
    const GridView = module.require('GridView');
    const Data = module.require('Data');



    let meta = {
        'root': '',
        'item': null,
    };



    panel.on('init', function () {
       
        Filter.on({
            'change': function (filter) {
                
                filter = Object.assign({}, filter, {
                    'cwd': filter.cwd ? meta.item.id : '',
                });

                let {list, isMd5Mode, } = Data.filter(filter);

                GridView.render(list, {
                    'keyword': filter.name,
                    'root': meta.root,
                    'isMd5Mode': isMd5Mode,
                });

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
    panel.on('render', function (opt) {
        if (opt.item === meta.item) {
            panel.show();
            return;
        }
        
        let { exts, } = Data.init(opt.list);

        meta.item = opt.item;
        meta.root = opt.root;

        Filter.render({
            'exts': exts,
            'item': meta.item,
        });


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
        opt: null,  //render() 中传进来的 opt。
    };

    panel.on('init', function () {

        Tabs.on({
            'file': function () {
                File.render(meta.opt);
                Dir.hide();
            },
            'dir': function () {
                File.hide();
                Dir.render(meta.opt);
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
    *   opt = {
    *       list:  [],  //文件列表。
    *       item: {},   //当前菜单项。
    *       root: '',   //根目录。
    *   };
    */
    panel.on('render', function (opt) {
        meta.opt = opt;

        Tabs.render();

    });




    return {
        
    };

});



define.panel('/FileList/Body/Main/Tree/Header', function (require, module, panel) {
    const CheckBox = require('CheckBox');


    let chks = [
        // { id: 'file', text: '文件', chk: null, },
        { id: 'icon', text: '图标', chk: null,},
        { id: 'tab', text: '缩进', chk: null, },
        { id: 'color', text: '彩色', chk: null, },
        { id: 'hover', text: '悬停', chk: null, },
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

    let meta = {
        $view: null,
    };



    panel.on('init', function () {
        tree = new TextTree({
            'container': panel.$,
            // 'secondaryKey': 'id',   //如果不指定，则不生成对应的 html 内容。
        });

        tree.on('cmd', function (cmd, item) {
            panel.fire('cmd', [cmd, item,]);
        });

        
    });

   


    panel.on('render', function (opt) {
        let { id, list, } = opt;

        tree.render(list);

        if (typeof id == 'string') {
            tree.highlight(id);
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



define.panel('/FileList/Body/Main/Tree', function (require, module, panel) {
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
            'cmd': function (cmd, item) {
                panel.fire('cmd', cmd, [item,]);
            },

            'render': function () {
                Header.render({
                    // 'file': false,
                    'icon': false,
                    'tab': true,
                    'color': true,
                    'hover': false,
                });
            },
        });

    });




    panel.on('render', function (opt) {
        let { item, list, root, } = opt;

        
        list = list.map((item) => {
            let id = root + item.name;
            return {id,};
        });

        //要把当前节点向上所有的父节点都加进来。
        let id = item.id == '/' ? root : root + item.id;
        let names = id.split('/');

        let parents = names.map((name, index) => {
            let id = names.slice(0, index + 1).join('/');
            return {id,};
        });

        list = [...parents, ...list,];
        

        Main.render({
            'id': id,
            'list': list,
        });
        

    });





});



define.panel('/FileList/Body/Main/Tabs', function (require, module, panel) {
    const Tabs = require('@definejs/tabs');
    const Storage = require('@definejs/local-storage');


    let tabs = null;
    let storage = null;

    let meta = {
        index: 0,
        list: [
            { name: '平铺', cmd: 'icon', root: true, },
            { name: '列表', cmd: 'list', root: true, },
            { name: '架构', cmd: 'tree', root: true, },
        ],
        cmd$module: null,
    };


    panel.on('init', function () {
        storage = new Storage(module.id);
        meta.index = storage.get('index') || 0;

        tabs = new Tabs({
            container: panel.$.get(0),
            activedClass: 'on',
            eventName: 'click',
            selector: '>li',
            repeated: true, //这里要允许重复激活相同的项。
        });


        tabs.on('change', function (item, index) {
            meta.index = index;
            item = meta.list[index];

            storage.set('index', index);

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

        tabs.render(meta.list, function (item, index) {
            return {
                'index': index,
                'name': item.name,
            };
        });


        tabs.active(meta.index);

    });

    return {
        map(cmd$module) {
            meta.cmd$module = cmd$module;
        },
    };

});
define.panel('/FileList/Body/Main', function (require, module, panel) {
    const Tabs = module.require('Tabs');
    const Tree = module.require('Tree');
    const List = module.require('List');
    const Icon = module.require('Icon');

 


    let meta = {
        'root': '',
        'list': [],
        'item': null,
    };



    panel.on('init', function () {
        Tabs.map({
            'tree': Tree,
            'list': List,
            'icon': Icon,
        });

        Tabs.on({
            'change': function (M) {
                M.render(meta);
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
            'id': function (item) {
                let name = item.id.slice(meta.root.length);

                panel.fire('item', [{
                    'name': name || '/',
                }]);
            },
        })
        

    });


    /**
    * 渲染内容。
    *   opt = {
    *       list:  [],  //文件列表。
    *       item: {},   //当前菜单项。
    *       root: '',   //根目录。
    *   };
    */
    panel.on('render', function (opt) {
        let root = opt.root;

        if (root.endsWith('/')) {
            root = root.slice(0, -1); //去掉后缀 `/`。
        }

        meta.root = root;
        meta.list = opt.list;
        meta.item = opt.item;

        Tabs.render();

    });



    

    return {
       
    };

});


define('/FileList/Body/Nav/Data', function (require, module, exports) {
    
    return {
        make(data) {
            let { type, root, } = data;
            let name = type == 'file' ? data.name : data.item.id;
            let icon = type == 'file' ? data : data.item.data;

            let names = `${root}${name}`.split('/').filter((name) => {
                return !!name;
            });

            let path = names.join('/');
            

            return {
                names,
                path,
                icon,
            };
        },
    }



});


define.panel('/FileList/Body/Nav', function (require, module, panel) {
    const MenuNav = require('MenuNav');
    const Data = module.require('Data');



    let nav = null;

    let meta = {
        root: '',
    };


    panel.on('init', function () {
        
        nav = new MenuNav({
            'container': panel.$,
        });

        nav.on({
            'item': function (names, index) {
                console.log(index, names)

                let name = names.slice(1).join('/');
                let item = { 'name': `/${name}`, };
                
                panel.fire('item', [item]);
            },

            'text': function (path) {
                if (!path.startsWith(meta.root)) {
                    return false;
                }

                if (path.endsWith('/')) {
                    path = path.slice(0, -1);
                }

                let name = path.slice(meta.root.length);
                let item = { 'name': `/${name}`, };

                panel.fire('item', [item]);

            },

            'render': function (path) {
                panel.fire('render', [path]);
            },
        });
    });


    /**
    * 渲染内容。
    *   opt = {
    * 
    *   };
    */
    panel.on('render', function (data) {
        meta.root = data.root;

        data = Data.make(data);
        nav.render(data);

    });



});



define.panel('/FileList/Body/Preview/MarkDoc', function (require, module, panel) {
    const Escape = require('@definejs/escape');
    const MarkDoc = require('MarkDoc');

    let markdoc = null;

    //预览模式下，需要保持为代码模式展示的。 
    //但又跟源码模式不完全一样。
    let exts = ['.json', '.js', '.css', '.html', '.htm', '.less', ];

    panel.on('init', function () {
        markdoc = new MarkDoc({
            container: panel.$,

        });

        markdoc.on('render', function (info) {
           
            let list = markdoc.getOutlines();

            panel.fire('render', [list]);

        });
       
    });



    /**
    * 渲染。
    *   opt = {
    *       content: '',                    //文件内容。
    *       ext: '',                        //如 `.json`。
    *       type: 'source' | 'preview',     //是源码视图，还是预览视图。
    *       isImage: false,                 //是否为图片。 图片的则需要对样式进行微调。
    *   };
    */
    panel.on('render', function (opt) {
        let content = opt.content;
        let ext = opt.ext.toLowerCase();
        let language = '';
        let format = true;


        //以源码方式展示
        if (opt.type == 'source') {
            // content = Escape.html(content); //需要进行 html 编码。
            language = ext.slice(1);
            format = false; //不格式化代码，以保留源格式。
        }
        else { //预览模式
            if (exts.includes(ext)) {
                language = ext.slice(1); //强制变为代码模式。
            }
        }


        markdoc.render({
            'content': content,
            'language': language,
            'baseUrl': '',
            'code': {
                'format': format,
            },
        });

        panel.$.toggleClass('image', opt.isImage);

       
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
        { name: '源码', type: 'source', },
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
    const Tabs = module.require('Tabs');
    const MarkDoc = module.require('MarkDoc');

    let current = {}; //外面传进来的数据。



    panel.on('init', function () {
        Tabs.on({
            'change': function (type) {
                current.type = type;
                MarkDoc.render(current);
            },
        });

        MarkDoc.on({
            'render': function (titles) {
                panel.fire('render', [titles]);
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
    panel.on('render', function (options) {
        let isImage = options.isImage;
        let ext = isImage ? '.md' : options.ext; //如果是图片，则当成 `.md` 来展示。


        current = {
            'content': options.content,
            'ext': ext,
            'isImage': isImage,
            'type': '', //在 Tabs.change 会给写入。
        };

        Tabs.render();
    });


    return {
        get: function () {
            return current;
        },

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
            'render': function (path) {
                panel.fire('path', [path]);
            },
            'item': function (item) {
                panel.fire('item', [item]);
            },
        });

        Main.on({
            'item': function (item) {
                panel.fire('item', [item]);
            },
        });

        Preview.on({
            'render': function (titles) {
                panel.fire('outline', [titles]);
            },
        });

    });


    /**
    * 渲染内容。
    */
    panel.on('render', function (type, data) {
        Nav.render(data);

        if (type == 'file') {
            Main.hide();
            Preview.render(data);
        }
        else if (type == 'dir') {
            Preview.hide();
            Main.render(data);
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
  
    let copyExts = [
        '.css',
        '.less',
        '.sass',
        '.html',
        '.htm',
        '.txt',
        '.json',
        '.js',
        '.md',
    ];

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
        'open': function ({ detail, }) {
            return detail.type == 'file';
        },
        'edit': function ({ detail, }) {
            return detail.type == 'file';
        },
        'demo': function ({ detail, }) {
            return detail.type == 'file';
        },
        'copy': function ({ detail, }) {
            return detail.type == 'file' && copyExts.includes(detail.ext);
        },
        'compile-less': function ({ detail, }) {
            return detail.type == 'file' && detail.ext == '.less';
        },
        'minify-js': function ({ detail, }) {
            return detail.type == 'file' && detail.ext == '.js';
        },
        'delete': function ({ item, }) {
            return !!item.parent;
        },
    };









    return {
        make(opt) {
            let items = list.filter((item) => {
                let { cmd, } = item;
                let filter = cmd$filter[cmd];

                if (filter) {
                    return filter(opt);
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




    panel.on('render', function (opt) {
        let visible = meta.visible;
        let list = meta.list = Data.make(opt);

        panel.fill(list);
        panel.fire('detail', [visible]);
        storage.set('visible', visible);
    });





});



define.panel('/FileList/Sidebar/Outline', function (require, module, panel) {
    var Outline = require('Outline');


    var outline = null;


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
    const $Object = require('@definejs/object');
    const File = require('File');

    let images = [
        '.png',
        '.jpg',
        '.jpeg',
        '.gif',
        '.bmp',
    ];



    return {
        /**
        * 从列表数据中过滤出类型下拉列表。
        */
        get: function (list) {
            if (!list) {
                return [];
            }

            
            let type$count = {
                'dir': 0,
                'file': 0,
                'image': 0,
                'size': 0,
                'isUTF8': 0,
                'notUTF8': 0,
            };

            let ext$count = {};


            list.forEach(function (item, index) {
                let type = item.type;

                type$count[type]++;

                if (type == 'dir') {
                    return;
                }


                let ext = item.ext.toLowerCase();
                let utf8Key = item.isUTF8 ? 'isUTF8' : 'notUTF8';
               
                ext$count[ext] = (ext$count[ext] || 0) + 1;


                if (images.includes(ext)) {
                    type$count['image']++;
                }

                type$count['size'] += item.stat.size;
                type$count[utf8Key]++;


            });




            let items = [ { 'name': '全部', 'value': list.length, desc: '个', class: 'spliter', }, ];

            let size = type$count['size'];

            if (size) {
                size = File.getSizeDesc(size);
                items.push({ 'name': '大小', 'value': size.value, 'desc': size.desc, class: 'dir-size', });
            }

            type$count['dir'] && items.push({ 'name': '目录', 'value': type$count['dir'], desc: '个', });
            type$count['file'] && items.push({ 'name': '文件', 'value': type$count['file'], desc: '个', });

            items.push({ 'name': 'UTF8 编码', 'value': type$count['isUTF8'], desc: '个', });
            items.push({ 'name': '其它编码', 'value': type$count['notUTF8'], desc: '个', });

            type$count['image'] && items.push({ 'name': '图片', 'value': type$count['image'], desc: '个', });


            Object.keys($Object.sort(ext$count)).forEach(function (ext, index) {
                let count = ext$count[ext];
                let name = ext.slice(1) + ' 文件';

                let cssClass = index == 0 ? 'spliter' : '';
                items.push({ 'name': name, 'value': count, desc: '个', class: cssClass, });

            });

            


            return items;
        },

        

    };

});



define.panel('/FileList/Sidebar/Stat', function (require, module, panel) {
    const File = require('File');
    const $Date = require('@definejs/date');
    const Types = module.require('Types');


    panel.on('init', function () {
    

        panel.template({
            '': function (data) {
                let table = this.fill('table', data);
                return table;
            },

            'table': {
                '': function (data) {
                    let { stat, type, name, } = data;
                    let desc = type == 'dir' ? '目录' : data.ext.slice(1) + ' 文件';
                    let birthtime = $Date.format(stat.birthtime, 'yyyy-MM-dd HH:mm:ss');
                    let mtime = $Date.format(stat.mtime, 'yyyy-MM-dd HH:mm:ss');
                    let size = File.getSizeDesc(stat.size);
                    let types = Types.get(data.list);
                    let sname = name.split('/').slice(-1)[0];
                    let root = data.root.slice(0, -1);
                    
                    types = this.fill('type', types);

                    return {
                        'sname': sname,
                        'name': root + name,
                        'ext': data.ext,
                        'md5': data.md5,
                        'size': size.value,
                        'sizeDesc': size.desc,
                        'birthtime': birthtime,
                        'mtime': mtime,
                        'type': desc,
                        'types': types,
                    };
                },

                'type': function (item, index) {
                    return {
                        'name': item.name,
                        'value': item.value,
                        'desc': item.desc || '',
                        'class': item.class || '',
                    };

                },
            },
        });
    });




    panel.on('render', function (data) {
        
        panel.fill(data);

        panel.$.toggleClass('dir', data.type == 'dir');
    });





});



define.panel('/FileList/Sidebar/Tabs', function (require, module, panel) {
    const Tabs = require('@definejs/tabs');


    var list = [
        { name: '常规', type: 'general', },
        { name: '提纲', type: 'outline', },
    ];

    var currentIndex = 0;
    var tabs = null;


    panel.on('init', function () {
        tabs = new Tabs({
            container: panel.$.get(0),
            activedClass: 'on',
            eventName: 'click',
            selector: '>li',
            repeated: true, //这里要允许重复激活相同的项。
        });


        tabs.on('change', function (item, index) {
            currentIndex = index;
            item = list[index];

            panel.fire(item.type);
        });

       
    });

    /**
    * 渲染。
    *   options = {
    *       index: 0,
    *       outline: false,
    *   };
    */
    panel.on('render', function (options) {
        var index = options.index;
        var outline = options.outline;
        var items = outline ? list : list.slice(0, -1);

        tabs.render(items, function (item, index) {
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

        //不存在提纲，则强行回到 0。
        if (!outline) {
            index = 0;
        }

        tabs.active(index);

    });


});


define.panel('/FileList/Sidebar/TabsCopy', function (require, module, panel) {
    const Tabs = require('@definejs/tabs');


    var list = [
        { name: '常规', type: 'general', },
        { name: '提纲', type: 'outline', },
    ];

    var currentIndex = 0;
    var tabs = null;


    panel.on('init', function () {
        tabs = new Tabs({
            container: panel.$.get(0),
            activedClass: 'on',
            eventName: 'click',
            selector: '>li',
            repeated: true, //这里要允许重复激活相同的项。
        });


        tabs.on('change', function (item, index) {
            currentIndex = index;
            item = list[index];

            panel.fire(item.type);
        });

       
    });

    /**
    * 渲染。
    *   options = {
    *       index: 0,
    *       outline: false,
    *   };
    */
    panel.on('render', function (options) {
        var index = options.index;
        var outline = options.outline;
        var items = outline ? list : list.slice(0, -1);

        tabs.render(items, function (item, index) {
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

        //不存在提纲，则强行回到 0。
        if (!outline) {
            index = 0;
        }

        tabs.active(index);

    });


});


define.panel('/FileList/Sidebar', function (require, module, panel) {
    const Stat = module.require('Stat');
    const Operation = module.require('Operation');
    const Outline = module.require('Outline');
    const Tabs = module.require('Tabs');


    let meta = {
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
                panel.fire('operation', cmd);
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
    panel.on('render', function ({ detail, item, }) {
        let hasOutline = item.data.type == 'file' && !detail.isImage;

        Stat.render(detail);
        Operation.render({ detail, item, });


        Tabs.render({
            'outline': hasOutline,
        });


    });

    return {
        outline: function (titles) {
            Outline.render(titles);
        },
    };


});


define('/FileList/Tree/Data', function (require, module, exports) {
    const File = require('File');

    function getFileIcon(file) {
        let { className, } = File.getIcon({
            'name': file,
        });
        
        return className;

    }


    /**
    * 根据给定的目录名，递归搜索子目录和文件列表，组装成符合菜单树的数据结构。
    *   dir: '',            //要组装的目录名称。
    *   opt = {
    *       dir$files: {},  //某个目录对应的文件列表（仅当前层级，不包括子目录的）。
    *       dir$dirs: {},   //某个目录对应的子目录列表（仅当前层级，不包括子目录的）。
    *   };
    */
    function make(opt, dir) {
        let { dir$dirs, dir$files, } = opt;
        let dirs = dir$dirs[dir];

        let list = dirs.map(function (item) {
            let sdir = dir + '/' + item;
            sdir = sdir.replace(/\/+/g, '/'); //把多个 `/` 合并成一个。

            let list = make(opt, sdir); //递归。
            let files = dir$files[sdir];

            files = files.map(function (file) {
                let name = sdir + '/' + file; //完整名称。
                let icon = getFileIcon(file);

                return {
                    'name': file,
                    'id': name,
                    'fileIcon': icon,
                    'data': {
                        'type': 'file',
                        'name': name,       
                        'parent': sdir,
                    },
                };
            });

            list = [...list, ...files];

            //为了让空目录能以文件夹的图标展示（组件设计如此），需要增加一个虚拟的指示文件。
            //同时在父模块里转发它的点击到该虚拟文件的父目录中。
            if (!list.length) {
                list.push({
                    'name': '(空目录)',
                    'id': sdir + '/', 
                    'data': {
                        'type': 'file',
                        'name': '',
                        'parent': sdir,
                    },
                });
            }


            return {
                'name': item,
                'id': sdir,
                'data': {
                    'type': 'dir',
                    'name': sdir,   //完整名称。
                    'parent': dir,  //
                },
                'list': list,
            };
        });



        return list;
    }





    return {
        /**
        * 把 JSON 数据转成树节点列表，用于展示成菜单树。
        */
        make: function (opt) {
            let root = '/';
            let list = make(opt, root);


            //加上根目录的文件列表。
            let files = opt.dir$files[root];

            files = files.map(function (file) {
                let id = root + file;
                let icon = getFileIcon(file);

                return {
                    'name': file,
                    'id': id,
                    'fileIcon': icon,
                    'data': {
                        'type': 'file',
                        'name': id,
                        'parent': root,
                    },
                };
            });

            list = [...list, ...files];

            let name = opt.root.split('/').slice(-1)[0]; 

            return [
                {
                    'name': name,
                    'id': root,
                    'open': true,
                    'data': {
                        'type': 'dir',
                        'name': root,
                    },
                    'list': list,
                },
            ];
        },

     
    };


});


define.panel('/FileList/Tree', function (require, module, panel) {
    const SidebarTree = require('SidebarTree');
    const Data = module.require('Data');

 
    let tree = null;

    panel.on('init', function () {
       
        tree = new SidebarTree({
            'container': panel.$,
            'width': panel.$.width(),
        });

        tree.on({
            'item': function (...args) {

                panel.fire('item', args);
            },
            'dir': function (...args) {
                panel.fire('dir', args);
            },
            'resize': function (...args) {
                let w = tree.$.outerWidth();

                panel.$.width(w);
                panel.fire('resize', args);
            },
        });
       

    });

   


    /**
    * 渲染。
    *   opt = {
    *       dir$dirs: {},   //某个目录对应的子目录列表（仅当前层级，不包括子目录的）。
    *       dir$files: {},  //某个目录对应的文件列表（仅当前层级，不包括子目录的）。
    *   };
    */
    panel.on('render', function (opt) {
        let list = Data.make(opt);

        tree.render(list);
        
    });

    return {
        open: function (id) {
            tree.open(id);
        },
    };


});


define('/FileList/API', function (require, module, exports) {
    const Emitter = require('@definejs/emitter');
    const $String = require('@definejs/string');
    const Loading = require('@definejs/loading');
    const Toast = require('@definejs/toast');
    const API = require('API');


    let emitter = new Emitter();

    let loading = new Loading({
        mask: 0,
    });

    let toast = new Toast({
        duration: 1500,
        mask: 0,
    });


    return {
        on: emitter.on.bind(emitter),

        /**
        * 获取。
        */
        get: function () {
            let api = new API('FileList.get', {
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
                    emitter.fire('success', 'get', [data]);
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
        * 读取指定文件或目录的信息。
        */
        read: function (item) {
            let api = new API('FileList.read', {
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
                    let content = data.content;

                    if (data.isImage) {
                        let sample = '![ ]({url})';                   //markdown 语法。 中括号之间要留个空格，才能在 markdoc 的源码中语法高亮。

                        data.content = $String.format(sample, {
                            'url': data.url,
                        });

                        //data.ext = '.md';
                    }


                    let type = item.data.type;

                    let options = {
                        'detail': data,     //服务器读取到的信息。
                        'item': item,       //菜单项的信息。
                    };

                    emitter.fire('success', 'read', type, [options]);
                },

                'fail': function (code, msg, json, xhr) {
                    definejs.alert('获取文件内容失败: {0}', msg);
                },

                'error': function (code, msg, json, xhr) {
                    definejs.alert('获取文件内容错误: 网络繁忙，请稍候再试');
                },
            });

            api.get({'id': item.id, });

        },

        /**
       * 删除指定的文件或目录。
       */
        delete: function (item) {
            let type = item.data.type;

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

                let api = new API('FileList.delete');

                api.on({
                    'request': function () {
                        loading.show('删除中...');
                    },

                    'response': function () {
                        loading.hide();
                    },

                    'success': function (data, json, xhr) {
                        toast.show('删除成功', function (params) {
                            emitter.fire('success', 'delete', [{
                                'id': item.id,
                                'parent': item.parent.id,
                            }]);
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
                    'type': type,
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
    


    let storage = new SessionStorage(module.id);

    let meta = {
        item: { id: '/', },     //当前激活的菜单项。 在菜单树填充后首先激活根节点。
        detail: null,           //API.read(item) 的结果。
    };


    function formatId(root, id) {
        if (id == root) {
            return '/';
        }

        if (id.startsWith(`${root}/`)) {
            id = id.slice(root.length);
        }

        return id;
    }

    view.on('init', function () {

        API.on('success', {
            'get': function (data) {
                let id = formatId(data.root, meta.item.id);

                meta.item.id = id;

                Tree.render(data);
                Tree.open(id);
            },
            'read': {
                'dir': function ({ detail, item, }) {
                    Body.render('dir', {
                        'list': detail.list,
                        'item': item,
                        'root': detail.root,
                    });

                    Sidebar.render({ detail, item, });
                },

                'file': function ({ detail, item, }) {
                    meta.detail = detail;

                    Body.render('file', detail);
                    Sidebar.render({ detail, item, });
                },
            },
            'delete': function (data) {
                meta.item.id = data.parent;
                API.get();
            },
        });

        Tree.on({
            'item': function (item) {
                storage.set('id', item.id); //保存到 storage。
                meta.item = item;
                API.read(item);
            },
            'resize': function () {
                let w1 = Tree.$.outerWidth();
                let w2 = Sidebar.$.outerWidth();
                Body.resize(w1, w2, 6);
            },
        });



        Body.on({
            'outline': function (titles) {
                Sidebar.outline(titles);
            },
            'item': function (item) {
                Tree.open(item.name);
            },

            //path 发生变化时触发。
            'path': function (path) {
             
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
                API.get();
            },
            'delete': function () {
                API.delete(meta.item);
            },
            'open': function () {
                view.fire('open', [meta.detail.url]);
            },
            'edit': function () {
                view.fire('edit', [meta.item.id]);
            },
            'demo': function () {
                view.fire('demo', [meta.item.id]);
            },
            'copy': function () {
                Clipboard.copy(meta.detail.content);
            },
            'compile-less': function () {
                view.fire('compile-less', [meta.detail.content]);
            },
            'minify-js': function () {
                view.fire('minify-js', [meta.detail.content]);
            },
        });

       
       
    });


    /**
    * 渲染内容。
    *   file: '',   //渲染完成后要打开的文件。
    */
    view.on('render', function (file) {
        let id = file || storage.get('id') || '/';

        meta.path = id; //避免 view.show 事件中再次实际执行。
        meta.item = { 'id': id, }; //使用完全重新的方式。
        API.get();

       
    });




});



define('/Home/FileList/Main/Data', function (require, module, exports) {

    

    const imgExts = new Set([
        '.png',
        '.jpg',
        '.jpeg',
        '.gif',
        '.bmp',
    ]);


    function add(key$list, key, item) {
        let list = key$list[key];

        if (!list) {
            list = key$list[key] = [];
        }

        list.push(item);
    }


    return {
        
        parse(list) {
            let dirs = [];
            let files = [];
            let images = [];
            let ext$files = {};
            let size = 0;

            let utf8 = {
                is: 0,
                not: 0,
            };

            list.forEach((item) => {
                let { type, ext, stat, isUTF8, } = item;
                
                if (type == 'dir') {
                    dirs.push(item);
                    return;
                }
                

                files.push(item);
                add(ext$files, ext, item);

                if (imgExts.has(ext)) {
                    images.push(item);
                }

                size += stat.size;

                utf8[isUTF8 ? 'is' : 'not']++;

            });


            let exts = Object.keys(ext$files).map((ext) => {
                let files = ext$files[ext];
                return { ext, files, };
            });

            return {
                list,
                dirs,
                files,
                images,
                ext$files,
                exts,
                size,
                utf8,
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
            let api = new API('FileList.read', {
                // proxy: '.json',
            });

            api.on({
                'request': function () {
                    // loading.show('加载中...');
                },

                'response': function () {
                    // loading.hide();
                },

                'success': function (stat, json, xhr) {
                    emitter.fire('success', 'get', [stat]);
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
    const File = require('File');
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
                        list,
                        dirs,
                        files,
                        images,
                        ext$files,
                        exts,
                        size,
                        utf8,
                    } = data;

                    let types = this.fill('type', exts);

                    let sizeInfo = File.getSizeDesc(size);


                    return {
                        'all': list.length,
                        'sizeValue': sizeInfo.value,
                        'sizeDesc': sizeInfo.desc,
                        'dir': dirs.length,
                        'file': files.length,
                        'image': images.length,
                        'types': types,
                        'isUTF8': utf8.is,
                        'notUTF8': utf8.not,
                    };
                },

                'type': function (item, index) {
                    let { ext, files, } = item;

                    ext = ext.slice(1) || '(none)';

                    return {
                        'ext': ext,
                        'count': files.length,
                    };
                },
            },

        });


    });


    panel.on('render', function (data) {
        data = Data.parse(data.list);
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



define('/Home/JsModule/Main/Data', function (require, module, exports) {

    return {
        
        parse(stat) {
            let { ids, id$module, id$children, singles, level$ids, } = stat.moduleStat;

            let nones = [];         //空 id 的模块列表，一般只有一个，index.js 中的 launch()。
            let publics = [];       //公共模块列表。
            let privates = [];      //私有模块列表。
            
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

                let { level, } = id$module[id];
                let children = id$children[id] || [];
                let hasChild = children.length > 0;

                //有儿子的模块，即父模块。
                if (hasChild) {
                    parents.push(id);
                }

                if (level == 1) {
                    publics.push(id);
                }
                else { //二级或以上。
                    privates.push(id);
                }

                //按模块的定义方式。
                let module = id$module[id];
                let { method, } = module;

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


    let emitter = new Emitter();




    return {
        on: emitter.on.bind(emitter),

        /**
        * 获取。
        */
        get: function () {
            let api = new API('Stat.get', {
                // proxy: '.json',
            });

            api.on({
                'request': function () {
                    // loading.show('加载中...');
                },

                'response': function () {
                    // loading.hide();
                },

                'success': function (stat, json, xhr) {
                    emitter.fire('success', 'get', [stat]);
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
                args: JSON.stringify(['hello']),
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


define.panel('/HtmlTree/Main/HtmlBlock/BaseInfo/Children/GridView', function (require, module, panel) {
    const GridView = require('GridView');
 

    let gridview = null;
    let tpl = null;

    panel.on('init', function () {
        tpl = panel.template();

        gridview = new GridView({
            container: panel.$,
            primaryKey: 'id',
            check: false,
            order: true,
            class: '',
            footer: false,

            fields: [
                // { caption: 'id', name: 'id', width: 200, class: 'name', dragable: true, delegate: '[data-cmd]', },
                { caption: '节点名称', name: 'name', width: 300, class: 'name', dragable: true, delegate: '[data-cmd]', },
                { caption: '所在文件', name: 'file', width: 500, class: 'file', dragable: true, delegate: '[data-cmd]', },
                // { caption: '内容行数', name: 'lines', width: 74, class: 'number', dragable: true, delegate: '[data-cmd]', },
                // { caption: '下级个数', name: 'list', width: 74, class: 'number', dragable: true, delegate: '[data-cmd]', },
            ],

        });

        gridview.on('process', 'row', function (row) {


        });


        gridview.on('process', 'cell', {
            'name': function (cell) {
                let item = cell.row.data;

                let html = tpl.fill('href', {
                    'cmd': 'id',
                    'text': item.name,
                });

                return html;
            },

            'file': function (cell) {
                let item = cell.row.data;

                let html = tpl.fill('href', {
                    'cmd': 'file',
                    'text': item.file,
                });

                return html;
            },

          


        });

        gridview.on('click', 'cell', function (cell, event) {
            let cmd = event.target.dataset.cmd;

            if (cmd) {
                event.stopPropagation();
                panel.fire('cmd', [cmd, cell.row.data]);
            }

        });
       

        gridview.render();


    });


    /**
    * 渲染内容。
    *   list: [],       //必选，数据列表。
   
    */
    panel.on('render', function (list) {

      

        gridview.fill(list);

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
            primaryKey: 'id',
            check: false,
            order: true,
            class: '',
            footer: false,

            fields: [
                // { caption: 'id', name: 'id', width: 200, class: 'name', dragable: true, delegate: '[data-cmd]', },
                { caption: '节点名称', name: 'name', width: 300, class: 'name', dragable: true, delegate: '[data-cmd]', },
                { caption: '所在文件', name: 'file', width: 500, class: 'file', dragable: true, delegate: '[data-cmd]', },
                // { caption: '内容行数', name: 'lines', width: 74, class: 'number', dragable: true, delegate: '[data-cmd]', },
                // { caption: '下级个数', name: 'list', width: 74, class: 'number', dragable: true, delegate: '[data-cmd]', },
            ],

        });

        gridview.on('process', 'row', function (row) {


        });


        gridview.on('process', 'cell', {
            'name': function (cell) {
                let item = cell.row.data;

                let html = tpl.fill('href', {
                    'cmd': 'id',
                    'text': item.name,
                });

                return html;
            },

            'file': function (cell) {
                let item = cell.row.data;

                let html = tpl.fill('href', {
                    'cmd': 'file',
                    'text': item.file,
                });

                return html;
            },

          


        });

        gridview.on('click', 'cell', function (cell, event) {
            let cmd = event.target.dataset.cmd;

            if (cmd) {
                event.stopPropagation();
                panel.fire('cmd', [cmd, cell.row.data]);
            }

        });
       

        gridview.render();


    });


    /**
    * 渲染内容。
    *   list: [],       //必选，数据列表。
   
    */
    panel.on('render', function (list) {

      

        gridview.fill(list);

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
    const Tabs = require('@definejs/tabs');
    const Storage = require('@definejs/local-storage');


    let allList = [
        { name: '基本信息', cmd: 'base', },
        { name: '引用原文', cmd: 'rel', },
        { name: '渲染内容', cmd: 'render', },
    ];


    let tabs = null;
    let storage = null;

    let meta = {
        index: 0,
        list: [],
        cmd$module: null,
    };


    panel.on('init', function () {
        storage = new Storage(module.id);
        meta.index = storage.get('index') || 0;

        tabs = new Tabs({
            container: panel.$.get(0),
            activedClass: 'on',
            eventName: 'click',
            selector: '>li',
            repeated: true, //这里要允许重复激活相同的项。
        });


        tabs.on('change', function (item, index) {
            meta.index = index;
            item = meta.list[index];
            storage.set('index', index);

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

        tabs.render(meta.list, function (item, index) {
            return {
                'index': index,
                'name': item.name,
            };
        });


        //列表长度可能发生了变化。
        if (meta.index > meta.list.length - 1) {
            meta.index = 0;
        }

        tabs.active(meta.index);

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
            primaryKey: 'id',
            check: false,
            order: true,
            class: '',
            footer: false,

            fields: [
                // { caption: 'id', name: 'id', width: 200, class: 'name', dragable: true, delegate: '[data-cmd]', },
                { caption: '节点名称', name: 'name', width: 300, class: 'name', dragable: true, delegate: '[data-cmd]', },
                { caption: '所在文件', name: 'file', width: 500, class: 'file', dragable: true, delegate: '[data-cmd]', },
                // { caption: '内容行数', name: 'lines', width: 74, class: 'number', dragable: true, delegate: '[data-cmd]', },
                // { caption: '下级个数', name: 'list', width: 74, class: 'number', dragable: true, delegate: '[data-cmd]', },
            ],

        });

        gridview.on('process', 'row', function (row) {


        });


        gridview.on('process', 'cell', {
            'name': function (cell) {
                let item = cell.row.data;

                let html = tpl.fill('href', {
                    'cmd': 'id',
                    'text': item.name,
                });

                return html;
            },

            'file': function (cell) {
                let item = cell.row.data;

                let html = tpl.fill('href', {
                    'cmd': 'file',
                    'text': item.file,
                });

                return html;
            },

          


        });

        gridview.on('click', 'cell', function (cell, event) {
            let cmd = event.target.dataset.cmd;

            if (cmd) {
                event.stopPropagation();
                panel.fire('cmd', [cmd, cell.row.data]);
            }

        });
       

        gridview.render();


    });


    /**
    * 渲染内容。
    *   list: [],       //必选，数据列表。
   
    */
    panel.on('render', function (list) {

      

        gridview.fill(list);

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
            primaryKey: 'id',
            check: false,
            order: true,
            class: '',
            footer: false,

            fields: [
                // { caption: 'id', name: 'id', width: 200, class: 'name', dragable: true, delegate: '[data-cmd]', },
                { caption: '节点名称', name: 'name', width: 300, class: 'name', dragable: true, delegate: '[data-cmd]', },
                { caption: '所在文件', name: 'file', width: 500, class: 'file', dragable: true, delegate: '[data-cmd]', },
                // { caption: '内容行数', name: 'lines', width: 74, class: 'number', dragable: true, delegate: '[data-cmd]', },
                // { caption: '下级个数', name: 'list', width: 74, class: 'number', dragable: true, delegate: '[data-cmd]', },
            ],

        });

        gridview.on('process', 'row', function (row) {


        });


        gridview.on('process', 'cell', {
            'name': function (cell) {
                let item = cell.row.data;

                let html = tpl.fill('href', {
                    'cmd': 'id',
                    'text': item.name,
                });

                return html;
            },

            'file': function (cell) {
                let item = cell.row.data;

                let html = tpl.fill('href', {
                    'cmd': 'file',
                    'text': item.file,
                });

                return html;
            },

          


        });

        gridview.on('click', 'cell', function (cell, event) {
            let cmd = event.target.dataset.cmd;

            if (cmd) {
                event.stopPropagation();
                panel.fire('cmd', [cmd, cell.row.data]);
            }

        });
       

        gridview.render();


    });


    /**
    * 渲染内容。
    *   list: [],       //必选，数据列表。
   
    */
    panel.on('render', function (list) {

      

        gridview.fill(list);

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



define.panel('/HtmlTree/Main/HtmlLink/FileInfo', function (require, module, panel) {
    const File = require('File');
    const $Date = require('@definejs/date');
    const API = File.API();

    let meta = {
        file: '',
        dir: '',
    };


    panel.on('init', function () {
        panel.$on('click', {
            '[data-cmd="file"]': function (event) {
                panel.fire('file', [meta.file]);
            },

            '[data-cmd="dir"]': function (event) {
                panel.fire('file', [meta.dir]);
            },
        });

        API.on('success', {
            'read': function (data) {
                let name = meta.file.split('/').slice(-1)[0];
                let lines = data.content.split('\n');

                let { stat, } = data;
                let size = File.getSizeDesc(stat.size);
                let type = data.ext.slice(1) + ' 文件';
                let birthtime = $Date.format(stat.birthtime, 'yyyy-MM-dd HH:mm:ss');
                let mtime = $Date.format(stat.mtime, 'yyyy-MM-dd HH:mm:ss');


                panel.fill({
                    'name': name,
                    'file': meta.file,
                    'dir': meta.dir,
                    'ext': data.ext,
                    'md5': data.md5,
                    'type': type,
                    'lines': lines.length,
                    'size': size.value,
                    'sizeDesc': size.desc,
                    'birthtime': birthtime,
                    'mtime': mtime,
                    'isUTF8': data.isUTF8 ? '是' : '否',
                });
            },
        });

    });




    panel.on('render', function (item) {
        let { file, } = item.data;

        //传入的是同一个文件，则直接显示即可。
        if (file == meta.file) {
            return;
        }

        meta.file = file;
        meta.dir = file.split('/').slice(0, -1).join('/');
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
    const Tabs = require('@definejs/tabs');
    const Storage = require('@definejs/local-storage');


    let allList = [
        { name: '基本信息', cmd: 'base', },
        { name: '引用原文', cmd: 'rel', },
        { name: '渲染内容', cmd: 'render', },
        { name: '文件内容', cmd: 'content', },
        { name: '文件信息', cmd: 'file', },
    ];


    let tabs = null;
    let storage = null;

    let meta = {
        index: 0,
        list: [],
        cmd$module: null,
    };


    panel.on('init', function () {
        storage = new Storage(module.id);
        meta.index = storage.get('index') || 0;

        tabs = new Tabs({
            container: panel.$.get(0),
            activedClass: 'on',
            eventName: 'click',
            selector: '>li',
            repeated: true, //这里要允许重复激活相同的项。
        });


        tabs.on('change', function (item, index) {
            meta.index = index;
            item = meta.list[index];
            storage.set('index', index);

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

        tabs.render(meta.list, function (item, index) {
            return {
                'index': index,
                'name': item.name,
            };
        });


        //列表长度可能发生了变化。
        if (meta.index > meta.list.length - 1) {
            meta.index = 0;
        }

        tabs.active(meta.index);

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
                let html = getHtml(data.html);
                let dir = data.file.split('/').slice(0, -1).join('/');

                meta.dir = dir;

                return {
                    'type': data.link.type,
                    'href': data.href,
                    'file': data.file,
                    'tabs': data.tabs,
                    'no': data.no + 1,
                    'dir': dir,
                    'rel': html,
                    'parent': `${parent.cid} - ${parent.name}`,
                };
            },

            'block': function (node) {
                let { data, parent, } = node;

                let dir = data.file.split('/').slice(0, -1).join('/');

                meta.dir = dir;

                return {
                    'type': data.link.type,
                    'file': data.file,
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
                let file = meta.node.data.file;

                panel.fire('file', [file]);
            },

            '[data-cmd="dir"]': function (event) {
                panel.fire('file', [meta.dir]);
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



define.panel('/HtmlTree/Main/JsLink/BaseInfo', function (require, module, panel) {
    const Base = module.require('Base');


    panel.on('init', function () {
        [
            Base,
            
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
    panel.on('render', function ({ content, ext, }) {
        let language = ext.startsWith('.') ? ext.slice(1) : ext;

        markdoc.render({
            'content': content,
            'language': language,
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
    const API = File.API();
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
            'read': function (data) {
                MarkDoc.render(data);

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



define.panel('/HtmlTree/Main/JsLink/FileInfo', function (require, module, panel) {
    const File = require('File');
    const $Date = require('@definejs/date');
    const API = File.API();


    let meta = {
        file: '',
        dir: '',
    };


    panel.on('init', function () {
        panel.$on('click', {
            '[data-cmd="file"]': function (event) {
                panel.fire('file', [meta.file]);
            },

            '[data-cmd="dir"]': function (event) {
                panel.fire('file', [meta.dir]);
            },
        });

        API.on('success', {
            'read': function (data) {
                let file = meta.file;
                let name = file.split('/').slice(-1)[0];
                let lines = data.content.split('\n');

                let { stat, } = data;
                let size = File.getSizeDesc(stat.size);
                let type = data.ext.slice(1) + ' 文件';
                let birthtime = $Date.format(stat.birthtime, 'yyyy-MM-dd HH:mm:ss');
                let mtime = $Date.format(stat.mtime, 'yyyy-MM-dd HH:mm:ss');


                panel.fill({
                    'name': name,
                    'file': file,
                    'ext': data.ext,
                    'md5': data.md5,
                    'dir': meta.dir,
                    'type': type,
                    'lines': lines.length,
                    'size': size.value,
                    'sizeDesc': size.desc,
                    'birthtime': birthtime,
                    'mtime': mtime,
                    'isUTF8': data.isUTF8 ? '是' : '否',
                    'utf8Class': data.isUTF8,
                });
            },
        });

    });




    panel.on('render', function (item) {
        let { file, } = item.data;

        //传入的是同一个文件，则直接显示即可。
        if (file == meta.file) {
            return;
        }

        meta.file = file;
        meta.dir = file.split('/').slice(0, -1).join('/');
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
    const Tabs = require('@definejs/tabs');
    const Storage = require('@definejs/local-storage');


    let allList = [
        { name: '基本信息', cmd: 'base', },
        { name: '引用原文', cmd: 'rel', },
        { name: '渲染内容', cmd: 'render', },
        { name: '文件信息', cmd: 'file', },
        { name: '文件内容', cmd: 'content', },
        { name: '编译内容', cmd: 'compile',  },
    ];


    let tabs = null;
    let storage = null;

    let meta = {
        index: 0,
        list: [],
        cmd$module: null,
    };


    panel.on('init', function () {
        storage = new Storage(module.id);
        meta.index = storage.get('index') || 0;

        tabs = new Tabs({
            container: panel.$.get(0),
            activedClass: 'on',
            eventName: 'click',
            selector: '>li',
            repeated: true, //这里要允许重复激活相同的项。
        });


        tabs.on('change', function (item, index) {
            meta.index = index;
            item = meta.list[index];
            storage.set('index', index);

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

        

        tabs.render(meta.list, function (item, index) {
            return {
                'index': index,
                'name': item.name,
            };
        });


        //列表长度可能发生了变化。
        if (meta.index > meta.list.length - 1) {
            meta.index = 0;
        }

        tabs.active(meta.index);

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
    
    return {
        make(item) {
            let list = [item, ...item.parents].reverse();

            let names = list.map((item) => {
                return item.name;
            });


            let icon = {
                'type': item.list.length > 0 ? 'dir' : 'file',
                'name': item.data.file || '.html',
            };


            let path = names.join('>')

            return {
                list,
                names,
                // path,
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
                panel.fire('resize');
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
                    // debugger
                    console.log(data);
                    emitter.fire('success', 'get', [data]);
                },

                'fail': function (code, msg, json, xhr) {
                    
                    // definejs.alert('获取解析数据失败: {0}', msg);

                    // emitter.fire('success', 'get', [json]);
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

    let meta = {
        cid: 0,
    };


    view.on('init', function () {
        

        API.on('success', {
            'get': function (json) {
                Tree.render(json);
                Tree.open(meta.cid);
            },
        });

        Tree.on({
            'item': function (item) {
                console.log(item);

                meta.cid = item.cid;
                storage.set('cid', item.cid); //保存到 storage。

                Main.render(item);
            },
            'resize': function () {
                let w1 = Tree.$.outerWidth();
                Main.resize(w1, 6);
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
        
        meta.cid = storage.get('cid') || 1;


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


define.panel('/Log/Filter', function (require, module, panel) {
    const Types = module.require('Types');
    const Dates = module.require('Dates');

    let meta = {
        'type$checked': null,
        'date$checked': null,
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


    


    panel.on('render', function (data) {
        
        // meta.type$checked = null;
        // meta.date$checked = null;

        Types.render(data.names);
        Dates.render(data.dates);

        panel.fire('change', [meta]);


    });

    

    return {
        
        
    };






});


define.panel('/Log/Header', function (require, module, panel) {
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
        close(closed) {
            
        },
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



define('/Log/List/Template/File', function (require, module, exports) {

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


        let { list, root, } = fs;

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



define('/Log/List/Template', function (require, module, exports) {
    const Colors = module.require('Colors');
    const File = module.require('File');
    const HTML = module.require('HTML');

    let type$icon = {
        input: `<i class="fas fa-terminal"></i>`,
        info: `<i class="fas fa-info-circle"></i>`,
        stdout: ``,
    };

    let $meta = {
        panel: null,
        meta: null,
    };



    return {
        init(panel, meta) {
            $meta.panel = panel;
            $meta.meta = meta;

            let tpl = panel.template();
            let itemTpl = tpl.template('group', 'item');

            itemTpl.fix('datetime');


            tpl.process({
                '': function (data) {
                    let groups = this.fill('group', data.groups);

                    return { 'groups': groups, };
                },

                'group': {
                    '': function (group, no) {
                        let { list, } = group;
                        let info = { list, no, };
                        // let items = this.fill('item', list, info);

                        return {
                            'no': no,
                            'date': group.date,
                            'total': list.length,
                            // 'items': items,
                            // 'items': '加载中...', //展开时再填充。
                            'items': '<li> loading... </li>', //展开时再填充。
                        };
                    },

                    'item': {
                        '': function (item, index, info) {
                            let { date, time, name, msg, } = item;
                            let { list, no, baseIndex, } = info;

                            //如果指定了，则表示追加元素时需要修正索引。
                            if (typeof baseIndex == 'number') {
                                index = index + baseIndex;
                            }


                            msg = HTML.render(msg);
                            msg = Colors.render(msg);
                            msg = File.render(msg, meta.fs);

                            let type = name || 'stdout';
                            let icon = type$icon[type] || '';
                            let prev = list[index - 1];
                            let dt = `${date} ${time}`;

                            time = prev && time == prev.time ? '' : this.fill('time', item);


                            return {
                                'no': no,
                                'index': index,
                                'time': time,
                                'datetime': time ? '' : `data-dt="${dt}"`,
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

        fillGroup(no) {
            let { panel, meta, } = $meta;
            let group = meta.groups[no];

            let { date, list, } = group;
            let $ul = panel.$.find(`ul[data-group="${date}"]`);
            let tpl = panel.template();
            let info = { list, no, };
            let html = tpl.fill('group', 'item', list, info);

            $ul.html(html);
        },

        getGroup(no) {
            let { panel, meta, } = $meta;
            let group = meta.groups[no];

            let { date, list, } = group;
            let $ul = panel.$.find(`ul[data-group="${date}"]`);
            let filled = $ul.find('>li[data-index]').length > 0;


            return {
                date,
                list,
                $ul,
                filled,
                no,
            };

        },
    };

});



define.panel('/Log/List', function (require, module, panel) {
    const Template = module.require('Template');

    let meta = {
        list: [],
        groups: [],
        date$list: [],
        date$time$list: [],
    };

    function scrollToBottom() {
        let maxNo = meta.groups.length - 1;
        if (maxNo < 0) {
            return;
        }

        let maxIndex = meta.groups[maxNo].list.length - 1;

        let li = panel.$.find(`li[data-id="${maxNo}-${maxIndex}"]`).get(0);

        if (li) {
            li.scrollIntoViewIfNeeded();
        }
    }

    panel.on('init', function () {
        Template.init(panel, meta);


        panel.$on('click', {
            '[data-date]': function (event) {
                let { no, } = this.dataset;
                let $parent = $(this.parentNode);
                let { $ul, filled, } = Template.getGroup(no);

                $parent.toggleClass('hide');

                //已填充，直接展开。
                if (filled) {
                    $ul.slideToggle('fast');
                    return;
                }

                //首次填充。
                $ul.slideDown('fast');

                setTimeout(() => {
                    Template.fillGroup(no);
                }, 200);

            },

            '[data-cmd="datetime"]': function (event) {
                let li = this.parentNode;
                let { no, index, } = li.dataset;
                let group = meta.groups[no];
                let {date, time, } = group.list[index];
                let $ul = $(li.parentNode);

                $(li).toggleClass('fold-same-time');
                $ul.find(`li[data-dt="${date} ${time}"]`).slideToggle('fast');
            },
        });

  
    });


    


    panel.on('render', function (data) {
        meta.list = data.list;
        meta.groups = data.groups;
        meta.date$list = data.date$list;
        meta.date$time$list = data.date$time$list;


        panel.fill(meta);
        scrollToBottom();


    });

    

    return {
        add(data) {
            let { list, groups, } = data;
            let group = groups.length == 1 ? groups[0] : null;  //首组。
            let last = meta.groups.slice(-1)[0] || null;        //最后一组。
        
            //不符合直接在最后一组追加，则全部重新渲染。
            //全部重新渲染，代码简单，但性能不好。
            if (!group || !last || group.date != last.date) {
                return false;
            }

            //大多数情况都符合直接在最后一组追加。
            list = group.list;

            
            let no = meta.groups.length - 1;
            let { $ul, filled, } = Template.getGroup(no);

            if (!filled) {
                Template.fillGroup(no);
            }


            let tpl = panel.template();

            let html = tpl.fill('group', 'item', list, {
                'list': list,
                'no': no,
                'baseIndex': last.list.length, //追加数据，需要修正索引。
            });

            $ul.append(html);

            last.list = [...last.list, ...list,]; //合并分组。
            scrollToBottom();
            return true;
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


    return {
        on: emitter.on.bind(emitter),

        /**
        * 获取。
        */
        get: function () {
            let api = new API('Log.get', {
                // proxy: '.json',
            });

            api.on({
                'request': function () {
                    loading.show('加载中...');
                },

                'response': function () {
                    loading.hide();
                },

                'success': function (list, json, xhr) {
                    emitter.fire('success', 'get', [list]);
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
            let api = new API('Log.clear', {
                // proxy: '.json',
            });

            api.on({
                'request': function () {
                    loading.show('处理中...');
                },

                'response': function () {
                    loading.hide();
                },

                'success': function (data, json, xhr) {
                    emitter.fire('success', 'clear', []);
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

define('/Log/Data', function (require, module, exports) {
    const $Array = require('@definejs/array');
    const $Date = require('@definejs/date');


   


    


    return exports = {

        parse(list, filterOpt = {}) {
            let {
                date$checked = null,
                type$checked = null,
            } = filterOpt;

            let names = new Set();      //
            let dates = new Set();      //收集日期。
            let date$list = {};         //按日期进行分组。
            let date$time$list = {};     //按时间进行分组。

            

            list.forEach((item) => {
                if (!item) {
                    return;
                }


                let dt = $Date.format(item.time, 'yyyy-MM-dd HH:mm:ss').split(' ');
                let date = dt[0];   //日期部分。 如 `2021-06-18`
                let time = dt[1];   //时间部分。 如 `10:30:45`
                let { name, } = item;

                if (date$checked && !date$checked[date] ) {
                    return;
                }

                if (type$checked && !type$checked[name]) {
                    return;
                }


                names.add(name);
                dates.add(date);

                let oItem = {
                    'date': date,
                    'time': time,
                    'timestamp': item.time,
                    'name': name,
                    'msg': item.msg,
                };

                $Array.add(date$list, date, oItem);
                $Array.add(date$time$list, date, time, oItem);
            });

            let groups = [...dates].map((date) => {
                return {
                    'date': date,
                    'list': date$list[date] || [],
                };
            });


            return {
                'names': [...names,],
                'dates': [...dates,],
                'list': list,
                'groups': groups,
                'date$list': date$list,
                'date$time$list': date$time$list,
            };

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
        open: function () {
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
    const Data = module.require('Data');
    const Filter = module.require('Filter');
    const Header = module.require('Header');
    const List = module.require('List');

    let meta = {
        list: [],
    };



    view.on('init', function () {

        Header.on({
            'check': function (key, checked) {
                List.check(key, checked);
            },

            'cmd': {
                'reload': function () {
                    API.get();
                },
                'clear': function () {
                    definejs.confirm('确认要清空服务器端的日志列表？', function () {
                        API.clear();
                    });
                },
                'close': function () {
                    panel.fire('close');
                },
            },

            
        });

        Filter.on({
            'change': function (opt) {
                let data = Data.parse(meta.list, opt);
                List.render(data);
            },
        });
        



        List.on({
            'cmd': function (cmd, value) {
                panel.fire('cmd', [cmd, value]);
            },
        });

        API.on('success', {
            'get': function (list) {
                let data = Data.parse(list);

                meta.list = list;
                Header.render();
                Filter.render(data);
                
                SSE.open();
            },

            'clear': function () {
                List.clear();
            },
        });
       

        SSE.on({
            'reset': function (list) {
                List.render(list);
            },

            'add': function (list) {
                let data = Data.parse(list);
                let added = List.add(data);

                //添加失败
                if (!added) {
                    meta.list = [...meta.list, ...list];
                    data = Data.parse(meta.list);
                    Filter.render(data);
                    List.render(data);
                }

            },
        });
  
    });


    view.on('render', function () {
        API.get();

    });




});


define('/DocAdd/Data/API', function (require, module, exports) {
    const Emitter = require('@definejs/emitter');
    const Loading = require('@definejs/loading');
    const Toast = require('@definejs/toast');
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

        //获取详情
        read(id, done) {
            let api = new API('FileList.read');

            api.on({
                'request': function () {
                    loading.show('读取中...');
                },

                'response': function () {
                    loading.hide();
                },

                'success': function (data, json, xhr) {
                    emitter.fire('success', 'read', [data]);
                },

                'fail': function (code, msg, json) {
                    definejs.alert('读取失败: {0}', msg);
                },

                'error': function () {
                    definejs.alert('读取错误: 网络繁忙，请稍候再试');
                },
            });

            api.get({ 'id': id, });

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


define('/DocAdd/Data/Data', function (require, module, exports) {
    const Storage = require('@definejs/local-storage');
    const $Object = require('@definejs/object');

    let storage = new Storage(module.id);

    let meta = {
        item: null,
    };


    return exports = {

        get() {
            let item = meta.item;

            if (!item) {
                item = meta.item = storage.get() || { // name 可能有值。
                    'name': '',
                    'content': '',
                    'ext': '',
                };
            }

            return item;
        },

        set(key, value) {
            let data = $Object.isPlain(key) ?
                { ...key, } :
                { [key]: value, };

            data = $Object.filter(data, ['name', 'content', 'ext',]);
            
           
            let item = meta.item || {};
            let content = data.content;

            //editor 会把 `\r\n` 替换成一个 `\n`。
            //这里也要保持一致，否则会造成 content 一进一出后不相等。
            if (content) {
                data.content = content.split('\r\n').join('\n');
            }

            meta.item = Object.assign(item, data);
            storage.set(item);

            return item;
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
            status = meta.status = (status || meta.status);
            storage.set('status', status);

            // console.log(module.id, 'status:', status);

            this.panel.fire('status', status, []);
           
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



define.panel('/DocAdd/Data', function (require, module, panel) {
    const API = module.require('API');
    const Data = module.require('Data');
    const Status = module.require('Status');
   


    panel.on('init', function () {
        Status.panel = panel;

        API.on('success', {

            'read': function (data) {
                Data.set(data);
                Status.set('read');
                panel.fire('render', [data]);
            },

            'save': function (data, opt) {
                Data.set(data);
                Status.set('saved');
                panel.fire('save', [data, opt]);
            },
        });
    });

   

    panel.on('render', function ({ name, content, ext, }) {
        if (name) {
            Status.confirm(function () {
                API.read(name);
            });
            return;
        }

        //没指定内容，则从 storage 中读取。
        if (content === undefined) {
            let data = Data.get();

            Status.set();
            panel.fire('render', [data]);
            return;
        }


        //指定了新内容。
        Status.confirm(function () {
            let old = Data.get();

            let data = Data.set({
                'name': '',             //这个肯定为空的。
                'content': content,
                'ext': ext,
            });

            //指定了新的内容。
            let status =
                content === '' ? 'init' :
                content != old.content ? 'changed' : '';

            Status.set(status);
            panel.fire('render', [data]);
        });

       

    });






    let exports = {
       
        set(content) {
            let old = Data.get();

            let status =
                content === '' ? 'init' :
                content != old.content ? 'changed' : '';
           
            
            Status.set(status);
            Data.set('content', content);
        },

        /**
        * 
        * @param {*} name 
        * @returns 
        */
        save(name) {
            let data = Data.get();
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

    return exports;

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
        let content = opt.content || '';
        let ext = opt.ext || '.md';
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

    let $name = panel.$.find('[data-id="name"]');



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
                let file = $name.val();
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
    *       name: '',    //文件名称，即文件 id。
    *       ext: '',    //可选，后缀名。 主要针对 json 文件显示相应的按钮。
    *   };
    */
    panel.on('render', function (opt = {}) {
        let { name, ext, } = opt;
        let isEdit = !!name;

     
        $name.val(name);

        $name.attr({
            'disabled': isEdit,
            'title': isEdit ? '这是一个已存在的文件，不允许编辑其路径。' : '',
        });

        panel.$.toggleClass('edit-mode', isEdit);
        panel.$.toggleClass('json', ext == '.json');

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
            return Validater.check($name);
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
            'render': function (data) {
                Editor.render(data);
                Header.render(data);
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
    *   opt = {
    *       name: '', //必选。 文件 id。
    *   };
    *   //2, 来源于具体内容时。
    *   opt = {
    *       content: '',    //必选。 内容。
    *       ext: '',        //可选。 内容类型。
    *   };
    *   //3, 来源于 storage 时。
    *   opt: 不指定时。
    */
    view.on('render', function (opt = {}) {
        
        Data.render(opt);

       
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


define('/ModuleTree/API/Data', function (require, module, exports) {
    const $Object = require('@definejs/object');
    const none = module.data.none;


    function format(id$list) {
        let id$items = {};

        function pad(id) {
            if (id === '') {
                return `/${none}`;
            }

            if (id.startsWith('/') && id.length > 1) {
                return `/${none}${id}`;
            }

            if (id != '/') {
                return `/${id}`;
            }

            return id;
        }

        $Object.each(id$list, function (id, list) {
            id = pad(id);

            list = list.map(function (id) {
                
                if (id === '') {
                    id = none;
                }
                return id;
            });

            id$items[id] = list;
        });

        return id$items;
    }

    function checkIsDir(id$childs, id) {
        let childs = id$childs[id];
        let isDir = !!childs;

        return isDir;
    }




    return {
        make(data) {
            let { moduleStat, } = data;
            let { id$childs, id$parent, id$module, } = moduleStat;

            let dir$dirs = {
                '/': [],
            };

            let dir$files = {
                '/': [],
            };

            $Object.each(id$parent, function (id, parent) {
                if (parent || parent === '') {
                    return;
                }

                let isDir = checkIsDir(id$childs, id);

                if (isDir) {
                    dir$dirs['/'].push(id);
                }
                else {
                    dir$files['/'].push(id);
                }
            });


            $Object.each(id$childs, function (id, childs) {
                let dirs = [];
                let files = [];

                childs.forEach(function (id) {
                    let isDir = checkIsDir(id$childs, id);
                    let list = isDir ? dirs : files;
                    let { name, } = id$module[id];

                    list.push(name);
                });

                dir$dirs[id] = dirs;
                dir$files[id] = files;
            });

            dir$dirs = format(dir$dirs);
            dir$files = format(dir$files);

            return {
                dir$dirs,
                dir$files,
                root: '模块树',
            };
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

        let { content, ext, } = info;
        let language = ext.slice(1);


        markdoc.render({
            'content': content,
            'language': language,
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



    let meta = {
        jsInfo: null,
        htmlInfo: null,
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
                render(meta.jsInfo);
            },
            'html': function () {
                render(meta.htmlInfo);
            },
        });

        MarkDoc.on({
            'render': function (titles) {
                panel.fire('render', [titles]);
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

        let { id, } = item.data;
        let jsInfo = stat.moduleStat.id$info[id];
        let htmlInfo = stat.htmlStat.id$info[id];

        meta.jsInfo = jsInfo;
        meta.htmlInfo = htmlInfo;


        Tabs.render({
            'js': jsInfo,
            'html': htmlInfo,
        });
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




    panel.on('render', function (opt) {

        

    });





});


define('/ModuleTree/Main/Dependent/List/Data', function (require, module, exports) {

    function checkValid(id) {
        if (!id) {
            return false;
        }

        if (id.startsWith('@')) {
            return true;
        }

        if (id.includes('/')) {
            return false;
        }

        return true;
    }



    return {

        get({ item, stat, }) {
            let { id, } = item.data;

            let {
                ids,
                id$file,
                id$dependents,
                id$module,
            } = stat.moduleStat;



            let list = [];
           

            //非根节点，则显示此节点所依赖的公共模块。
            if (typeof id == 'string') {
                list = item.data.publics;
            }
            else { //根节点，则是显示全部被依赖的模块。
                let keys = Object.keys(id$dependents);
                list = [...ids, ...keys,];
                list = [...new Set(list)];
            }

            list = list.sort();

            list = list.map((id) => {
                if (!checkValid(id)) {
                    return null;
                }

                let module = id$module[id];
                let list = id$dependents[id] || [];

                if (typeof list == 'string') {
                    list = [list];
                }

                list = list.map((id) => {
                    let module = id$module[id];
                    let item = {
                        'id': id,
                        'file': id$file[id],
                        'method': module.method,
                        'level': module.level,
                    };

                    return item;

                });

                let found =
                    Array.isArray(module) ? 'more' :
                    id.startsWith('@') ? 'namespace' :
                    module ? '1' : '0';
                    

                return {
                    'id': id,
                    'module': module,
                    '$main': null,
                    '$gridview': null,
                    'found': found,
                    'list': list,
                };
            });

            let publics = [];
            let namespaces = [];

            list.forEach((item) => {
                if (!item) {
                    return;
                }

                if (item.id.startsWith('@')) {
                    namespaces.push(item);
                }
                else {
                    publics.push(item);
                }
            });

            // list = [...namespaces, ...publics,];
            list = [...publics, ...namespaces, ];

            return list;
        },
    };
});

define('/ModuleTree/Main/Dependent/List/GridView', function (require, module, exports) {
    const $ = require('$');
    const GridView = require('GridView');


    let fields = [
        { caption: '模块ID', name: 'id', width: 300, class: 'name', dragable: true, delegate: '[data-cmd]', },
        { caption: '定义方法', name: 'method', width: 110, class: 'file', dragable: true, delegate: '[data-cmd]', },
        { caption: '级别', name: 'level', width: 49, class: 'number level', dragable: true, },
        { caption: '所在文件', name: 'file', width: 400, class: 'file', dragable: true, delegate: '[data-cmd]', },
    ];



    return {

        render({ container, list = [], cmdClick, }) {
            // if (list.length == 0) {
            //     $(container).html('该模块没有被任何模块依赖。');
            //     return;
            // }


            let gridview = new GridView({
                container: container,
                primaryKey: 'id',
                check: false,
                order: true,
                class: '',
                footer: false,
                fields: fields,
            });

            gridview.on('process', 'cell', {
                'id': function (cell) {
                    let item = cell.row.data;
                    let html = `<a data-cmd="id" href="javascript:">${item.id}</a>`;

                    return html;
                },

                'file': function (cell) {
                    let item = cell.row.data;
                    let html = `<a data-cmd="file" href="javascript:">${item.file}</a>`;

                    return html;
                },
            });

            gridview.on('click', 'cell', function (cell, event) {
                let cmd = event.target.dataset.cmd;

                if (cmd) {
                    event.stopPropagation();
                    cmdClick(cmd, cell);
                }

            });


            gridview.render();
            gridview.fill(list);

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
                    let found = item.found;

                    let tip = this.fill('tip', { found, total, });

                    return {
                        'no': index,
                        'id': item.id,
                        'total': total,
                        'found': found,
                        'tip': tip,
                    };
                },

                'tip': function ({ found, total, }) {
                    let tip =
                        found == '0' ? '该模块不存在' :
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
                        panel.fire('cmd', [cmd, cell.row.data]);
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



 



    panel.on('render', function (opt) {
        console.log(module.id, opt);

        let list = meta.list = Data.get(opt);

        panel.fill({ list, });
        

    });





});



define.panel('/ModuleTree/Main/Dependent', function (require, module, panel) {
    const Header = module.require('Header');
    const List = module.require('List');

    panel.set('show', false);
    

    panel.on('init', function () {
       
        List.on({
            'cmd': function (cmd, item) {
                let value = item[cmd];      //cmd 为 `id`、`file`。
                panel.fire(cmd, [value]);
            },
        });
       
        

    });




    panel.on('render', function (opt) {

        Header.render(opt);
        List.render(opt);

        
        panel.show();
    });





});



define.panel('/ModuleTree/Main/FileInfo', function (require, module, panel) {
    const File = require('File');
    const $Date = require('@definejs/date');


    panel.on('init', function () {
        panel.$on('click', {
            '[data-cmd="file"]': function (event) {
                let file = this.innerText;
                panel.fire('file', [file]);
            },

            '[data-cmd="dir"]': function (event) {
                let dir = this.innerText;

                //去掉后缀 `/`。
                if (dir.endsWith('/')) {
                    dir = dir.slice(0, -1);
                }

                panel.fire('file', [dir]);
            },
        });

        panel.template(function (info, index) {
            let icon = File.getIcon(info.file);
            let size = File.getSizeDesc(info.size);
            let type = info.ext.slice(1) + ' 文件';
            let birthtime = $Date.format(info.stat.birthtime, 'yyyy-MM-dd HH:mm:ss');
            let mtime = $Date.format(info.stat.mtime, 'yyyy-MM-dd HH:mm:ss');

            return {
                'icon': icon.html,
                'name': info.name,
                'file': info.file,
                'ext': info.ext,
                'md5': info.md5,
                'dir': info.dir,
                'lines': info.lines,
                'type': type,
                'size': size.value,
                'sizeDesc': size.desc,
                'birthtime': birthtime,
                'mtime': mtime,
                'isUTF8': info.isUTF8 ? '是' : '否',
            };
        });

    });




    panel.on('render', function ({ item, stat, }) {
        console.log(item, stat);

       
        let { id, } = item.data;
        let jsInfo = stat.moduleStat.id$info[id];
        let htmlInfo = stat.htmlStat.id$info[id];
        let list = htmlInfo ? [jsInfo, htmlInfo] : [jsInfo];

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
            'text': '所依赖私有模块数 - 直接子模块数',
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
                'value': item.id,
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
            'text': '被依赖模块数',
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
    const Fields = module.require('Fields');
    const Childs = module.require('Childs');
    const ChildDependents = module.require('ChildDependents');
    const Dependents = module.require('Dependents');
    const Levels = module.require('Levels');
    const Methods = module.require('Methods');

    let meta = {
        field$checked: null,
        child$checked: null,
        childDependent$checked: null,
        dependent$checked: null,
        level$checked: null,
        method$checked: null,
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

        
  
    });



    panel.on('render', function (data, fields) {
        Fields.render(fields);
        Childs.render(data.childs);
        ChildDependents.render();
        Dependents.render();
        Levels.render(data.levels);
        Methods.render(data.methods);


    });

    

    return {
        
        
    };






});


define.panel('/ModuleTree/Main/List/GridView', function (require, module, panel) {
    const GridView = require('GridView');

    let tpl = null;
    let gridview = null;

    let fields = [
        { caption: '模块ID', name: 'id', width: 300, class: 'name', dragable: true, delegate: '[data-cmd]', },
        { caption: '定义方法', name: 'method', width: 110, class: 'file', dragable: true, delegate: '[data-cmd]', },
        { caption: '级别', name: 'level', width: 49, class: 'number level', dragable: true, },
        { caption: '被依赖模块数', name: 'dependents', width: 61, class: 'number dependents', dragable: true, },
        { caption: '所依赖公共模块数', name: 'publics', width: 73, class: 'number publics', dragable: true, },
        { caption: '所依赖私有模块数', name: 'privates', width: 73, class: 'number privates', dragable: true, },
        { caption: '直接子模块数', name: 'childs', width: 61, class: 'number childs', dragable: true, },
        { caption: '全部子模块数', name: 'children', width: 61, class: 'number children', dragable: true, },
        { caption: '同级模块数', name: 'siblings', width: 61, class: 'number siblings', dragable: true, },
        { caption: '所在的 js 文件', name: 'file', width: 400, class: 'file', dragable: true, delegate: '[data-cmd]', },
        // { caption: '关联的 html 文件', name: 'htmlFile', width: 400, class: 'file', dragable: true, delegate: '[data-cmd]', },
    ];


    function fillFile(file) {
        if (!file) {
            return '';
        }

        let list = Array.isArray(file) ? file : [file];

        let htmls = list.map((file) => {
            let html = tpl.fill('href', {
                'cmd': 'file',
                'text': file,
            });

            return html;
        });

        let html = htmls.join('<br />');



        return {
            'html': html,
            'count': list.length,
        };

    }

    panel.on('init', function () {
        tpl = panel.template();

        gridview = new GridView({
            container: panel.$,
            primaryKey: 'id',
            check: false,
            order: true,
            class: '',
            footer: false,
            fields: fields,
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
            'id': function (cell) {
                let item = cell.row.data;

                let html = tpl.fill('href', {
                    'cmd': 'id',
                    'text': item.id,
                });

                return html;
            },

            'file': function (cell) {
                let item = cell.row.data;
                let { html, count, } = fillFile(item.file);
                if (count > 1) {
                    cell.class += ' error';
                }

                return html;
            },

            'htmlFile': function (cell) {
                let item = cell.row.data;
                let { html, count, } = fillFile(item.htmlFile);
                if (count > 1) {
                    cell.class += ' error';
                }
                return html;
            },


        });

        gridview.on('click', 'cell', function (cell, event) {
            let cmd = event.target.dataset.cmd;

            if (!cmd) {
                return;
            }

            event.stopPropagation();

            let value = event.target.text;
            panel.fire('cmd', [cmd, value]);
        });

        gridview.render();


    });


    /**
    * 渲染内容。
    *   list: [],       //必选，数据列表。
   
    */
    panel.on('render', function (list) {

        gridview.fill(list);


    });


    return {
        fields,

        toggleFields(index$checked) {
            gridview.toggleFields(index$checked);
        },
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




    panel.on('render', function () {

        

    });





});



define('/ModuleTree/Main/List/Data0', function (require, module, exports) {
    let meta = {
        item: null,
        stat: null,
    };

   
    return {
        init({ item, stat, }) {
            console.log(item);

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

        filter(opt) {
            let {
                child$checked = null,
                childDependent$checked = null,
                dependent$checked = null,
                level$checked = null,
                method$checked = null,
            } = opt || {};

            let { item, stat, } = meta;
            let { id, children, } = item.data;
            let {
                ids,
                id$file,
                id$dependents,
                id$children,
                id$childs,
                id$publics,
                id$privates,
                id$parents,
                id$siblings,
                id$module,
            } = stat.moduleStat;

            if (typeof id == 'string') {
                ids = [id, ...children,];
            }

            let list = [];

            ids.forEach((id) => {
                let file = id$file[id];
                let htmlFile = stat.htmlStat.id$file[id];
                
                let dependents = id$dependents[id] || [];
                let childs = id$childs[id] || [];
                let children = id$children[id] || [];
                let siblings = id$siblings[id] || [];
                let publics = id$publics[id] || [];
                let privates = id$privates[id] || [];
                let parents = id$parents[id] || [];

                let module = id$module[id];
                let { level, method, } = module;

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
                    let N = privates.length - childs.length;

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


                let item = {
                    'id': id,
                    'file': file,
                    'method': method,
                    'level': level,
                    'childs': childs.length,            //直接子模块数。
                    'children': children.length,
                    'dependents': dependents.length,    //
                    'publics': publics.length,
                    'privates': privates.length,        //所依赖私有模块数。
                    'siblings': siblings.length,
                    'htmlFile': htmlFile,
                };

                list.push(item);
            });

            return list;
        },
    };



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
                child$checked = null,
                childDependent$checked = null,
                dependent$checked = null,
                level$checked = null,
                method$checked = null,
            } = opt;

            let { item, stat, } = meta;
            let list = item.children;

            //非根节点，则要包括当前节点。
            if (item.parent) {
                list = [item, ...list];
            }

            list = list.map((item) => {
                let {
                    id,
                    file,
                    module,
                    children = [],
                    childs = [],
                    dependents = [],
                    parents = [],
                    privates = [],
                    publics = [],
                    siblings = [],
                } = item.data;

                let htmlFile = stat.htmlStat.id$file[id];

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


                if (level$checked && !level$checked[module.level]) {
                    return;
                }

                if (method$checked && !method$checked[module.method]) {
                    return;
                }

                return {
                    'id': id,
                    'method': module.method,
                    'level': module.level,
                    'htmlFile': htmlFile,
                    'dependents': dependents.length,    //

                    'file': file,
                    'childs': childs.length,            //直接子模块数。
                    'children': children.length,
                    'publics': publics.length,
                    'privates': privates.length,        //所依赖私有模块数。
                    'siblings': siblings.length,
                };
            });

           
            list = list.filter((item) => {
                return !!item;
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
            'change': function (opt) {
                let list = Data.filter(opt);
                GridView.render(list);

                console.log(opt)
                GridView.toggleFields(opt.field$checked);
            },
        });

        GridView.on({
            'cmd': function (cmd, value) {
                panel.fire(cmd, [value]);
            },
        });
        

    });




    panel.on('render', function (opt) {
        let data = Data.init(opt);
        let fields = GridView.fields;

        Header.render();
        Filter.render(data, fields);
        
        panel.show();
    });





});


define.panel('/ModuleTree/Main/ModuleInfo/Children/GridView', function (require, module, panel) {
    const GridView = require('GridView');
 

    let gridview = null;
    let tpl = null;
  

    panel.on('init', function () {
        tpl = panel.template();

        gridview = new GridView({
            container: panel.$,
            primaryKey: 'id',
            check: false,
            order: true,
            class: '',
            footer: false,

            fields: [
                { caption: '模块ID', name: 'id', width: 400, class: 'name', dragable: true, delegate: '[data-cmd]', },
                { caption: '所在文件', name: 'file', width: 400, class: 'file', dragable: true, delegate: '[data-cmd]', },
            ],

        });

        gridview.on('process', 'row', function (row) {
            
            
        });

        gridview.on('process', 'cell', {
            'id': function (cell) {
                let item = cell.row.data;

                let html = tpl.fill('href', {
                    'cmd': 'id',
                    'text': item.id,
                });

                return html;
            },

            'file': function (cell) {
                let item = cell.row.data;

                let html = tpl.fill('href', {
                    'cmd': 'file',
                    'text': item.file,
                });

                return html;
            },


        });

        gridview.on('click', 'cell', function (cell, event) {
            let cmd = event.target.dataset.cmd;

            if (cmd) {
                event.stopPropagation();
                panel.fire('cmd', [cmd, cell.row.data]);
            }

        });

        gridview.render();


    });


    /**
    * 渲染内容。
    *   list: [],       //必选，数据列表。
   
    */
    panel.on('render', function (list) {

      

        gridview.fill(list);

    });



});


define.panel('/ModuleTree/Main/ModuleInfo/Childs/GridView', function (require, module, panel) {
    const GridView = require('GridView');
 

    let gridview = null;
    let tpl = null;

    panel.on('init', function () {
        tpl = panel.template();

        gridview = new GridView({
            container: panel.$,
            primaryKey: 'id',
            check: false,
            order: true,
            class: '',
            footer: false,

            fields: [
                { caption: '模块ID', name: 'id', width: 400, class: 'name', dragable: true, delegate: '[data-cmd]', },
                { caption: '所在文件', name: 'file', width: 400, class: 'file', dragable: true, delegate: '[data-cmd]', },
            ],

        });

        gridview.on('process', 'row', function (row) {


        });


        gridview.on('process', 'cell', {
            'id': function (cell) {
                let item = cell.row.data;

                let html = tpl.fill('href', {
                    'cmd': 'id',
                    'text': item.id,
                });

                return html;
            },

            'file': function (cell) {
                let item = cell.row.data;

                let html = tpl.fill('href', {
                    'cmd': 'file',
                    'text': item.file,
                });

                return html;
            },

          


        });

        gridview.on('click', 'cell', function (cell, event) {
            let cmd = event.target.dataset.cmd;

            if (cmd) {
                event.stopPropagation();
                panel.fire('cmd', [cmd, cell.row.data]);
            }

        });
       

        gridview.render();


    });


    /**
    * 渲染内容。
    *   list: [],       //必选，数据列表。
   
    */
    panel.on('render', function (list) {

      

        gridview.fill(list);

    });



});


define.panel('/ModuleTree/Main/ModuleInfo/Dependents/GridView', function (require, module, panel) {
    const GridView = require('GridView');
 

    let gridview = null;
    let tpl = null;
  

    panel.on('init', function () {
        tpl = panel.template();

        gridview = new GridView({
            container: panel.$,
            primaryKey: 'id',
            check: false,
            order: true,
            class: '',
            footer: false,

            fields: [
                { caption: '模块ID', name: 'id', width: 400, class: 'name', dragable: true, delegate: '[data-cmd]', },
                { caption: '所在文件', name: 'file', width: 400, class: 'file', dragable: true, delegate: '[data-cmd]', },
            ],

        });

        gridview.on('process', 'row', function (row) {


        });

        gridview.on('process', 'cell', {
            'id': function (cell) {
                let item = cell.row.data;

                let html = tpl.fill('href', {
                    'cmd': 'id',
                    'text': item.id,
                });

                return html;
            },

            'file': function (cell) {
                let item = cell.row.data;

                let html = tpl.fill('href', {
                    'cmd': 'file',
                    'text': item.file,
                });

                return html;
            },

        });

        gridview.on('click', 'cell', function (cell, event) {
            let cmd = event.target.dataset.cmd;

            if (cmd) {
                event.stopPropagation();
                panel.fire('cmd', [cmd, cell.row.data]);
            }

        });

        gridview.render();


    });


    /**
    * 渲染内容。
    *   list: [],       //必选，数据列表。
   
    */
    panel.on('render', function (list) {

      

        gridview.fill(list);

    });



});


define.panel('/ModuleTree/Main/ModuleInfo/Privates/GridView', function (require, module, panel) {
    const GridView = require('GridView');
 

    let gridview = null;
    let tpl = null;
  

    panel.on('init', function () {
        tpl = panel.template();

        gridview = new GridView({
            container: panel.$,
            primaryKey: 'id',
            check: false,
            order: true,
            class: '',
            footer: false,

            fields: [
                { caption: '模块ID', name: 'id', width: 400, class: 'name', dragable: true, delegate: '[data-cmd]', },
                { caption: '所在文件', name: 'file', width: 400, class: 'file', dragable: true, delegate: '[data-cmd]', },
            ],

        });

        gridview.on('process', 'row', function (row) {
            if (!row.data.file) {
                row.class = 'not-found';
            }
        });


        gridview.on('process', 'cell', {
            'id': function (cell) {
                let item = cell.row.data;

                let html = tpl.fill('href', {
                    'cmd': 'id',
                    'text': item.id,
                });

                return html;
            },

            'file': function (cell) {
                let item = cell.row.data;

                if (!item.file) {
                    return '不存在';
                }

                let html = tpl.fill('href', {
                    'cmd': 'file',
                    'text': item.file,
                });

                return html;
            },
            
        });

        gridview.on('click', 'cell', function (cell, event) {
            let cmd = event.target.dataset.cmd;

            if (cmd) {
                event.stopPropagation();
                panel.fire('cmd', [cmd, cell.row.data]);
            }
            
        });
       

        gridview.render();


    });


    /**
    * 渲染内容。
    *   list: [],       //必选，数据列表。
   
    */
    panel.on('render', function (list) {

      

        gridview.fill(list);

    });



});


define.panel('/ModuleTree/Main/ModuleInfo/Publics/GridView', function (require, module, panel) {
    const GridView = require('GridView');
 

    let gridview = null;
    let tpl = null;
  

    panel.on('init', function () {
        tpl = panel.template();

        gridview = new GridView({
            container: panel.$,
            primaryKey: 'id',
            check: false,
            order: true,
            class: '',
            footer: false,

            fields: [
                { caption: '模块ID', name: 'id', width: 400, class: 'name', dragable: true, delegate: '[data-cmd]', },
                { caption: '所在文件', name: 'file', width: 400, class: 'file', dragable: true, delegate: '[data-cmd]',},
            ],

        });

        gridview.on('process', 'row', function (row) {


        });
        
        gridview.on('process', 'cell', {
            'id': function (cell) {
                let item = cell.row.data;
                let id = item.id;

                let html = tpl.fill('href', {
                    'cmd': 'id',
                    'text': id,
                });

                return html;
            },

            'file': function (cell) {
                let item = cell.row.data;

                let html = tpl.fill('href', {
                    'cmd': 'file',
                    'text': item.file || '',
                });

                return html;
            },

        });

        gridview.on('click', 'cell', function (cell, event) {
            let cmd = event.target.dataset.cmd;

            if (cmd) {
                event.stopPropagation();
                panel.fire('cmd', [cmd, cell.row.data]);
            }

        });
       

        gridview.render();


    });


    /**
    * 渲染内容。
    *   list: [],       //必选，数据列表。
   
    */
    panel.on('render', function (list) {

      

        gridview.fill(list);

    });



});


define.panel('/ModuleTree/Main/ModuleInfo/Siblings/GridView', function (require, module, panel) {
    const GridView = require('GridView');
 

    let gridview = null;
    let tpl = null;
  

    panel.on('init', function () {
        tpl = panel.template();

        gridview = new GridView({
            container: panel.$,
            primaryKey: 'id',
            check: false,
            order: true,
            class: '',
            footer: false,

            fields: [
                { caption: '模块ID', name: 'id', width: 400, class: 'name', dragable: true, delegate: '[data-cmd]', },
                { caption: '所在文件', name: 'file', width: 400, class: 'file', dragable: true, delegate: '[data-cmd]', },
            ],

        });

        gridview.on('process', 'row', function (row) {
            
        });

        gridview.on('process', 'cell', {
            'id': function (cell) {
                let item = cell.row.data;

                let html = tpl.fill('href', {
                    'cmd': 'id',
                    'text': item.id,
                });

                return html;
            },

            'file': function (cell) {
                let item = cell.row.data;

                let html = tpl.fill('href', {
                    'cmd': 'file',
                    'text': item.file,
                });

                return html;
            },

        

        });

        gridview.on('click', 'cell', function (cell, event) {
            let cmd = event.target.dataset.cmd;

            if (cmd) {
                event.stopPropagation();
                panel.fire('cmd', [cmd, cell.row.data]);
            }

        });

        gridview.render();


    });


    /**
    * 渲染内容。
    *   list: [],       //必选，数据列表。
   
    */
    panel.on('render', function (list) {

      

        gridview.fill(list);

    });



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




    panel.on('render', function ({ item, stat, }) {
        let { module, parent, dependents = [], } = item.data;

        if (typeof dependents == 'string') {
            dependents = [dependents];
        }

        //这里要用全等。
        if (parent === '') {
            parent = none;
        }
        

        meta.item = item;
        
        panel.fill({
            'id': module.id,
            'name': module.name,
            'parent': parent || '',
            'method': module.method,
            'factory-type': module.factory.type,
            'dependents': dependents.length,
            'level': module.level,
        });

    });





});



define.panel('/ModuleTree/Main/ModuleInfo/Children', function (require, module, panel) {

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




    panel.on('render', function ({ item, stat, }) {
        let { id$file, } = stat.moduleStat;
        let { children = [], } = item.data;

        let list = children.map((id) => {
            let file = id$file[id];

            return {
                'id': id,
                'file': file,
            };
        });

        
        GridView.render(list);
        panel.show();
    });





});



define.panel('/ModuleTree/Main/ModuleInfo/Childs', function (require, module, panel) {

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




    panel.on('render', function ({ item, stat, }) {
        let { id$file, } = stat.moduleStat;
        let { childs = [], } = item.data;


        let list = childs.map((id) => {
            let file = id$file[id];


            return {
                'id': id,
                'file': file,
            };
        });

        
        GridView.render(list);
        panel.show();
    });





});



define.panel('/ModuleTree/Main/ModuleInfo/Dependents', function (require, module, panel) {

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




    panel.on('render', function ({ item, stat, } ) {
        let { id$file, } = stat.moduleStat;
        let { dependents = [], } = item.data;

        if (!Array.isArray(dependents)) {
            dependents = [dependents];
        }

        let list = dependents.map((id) => {
            let file = id$file[id];

            return {
                'id': id,
                'file': file,
            };
        });

        
        GridView.render(list);
        panel.show();
    });





});



define.panel('/ModuleTree/Main/ModuleInfo/Privates', function (require, module, panel) {

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




    panel.on('render', function ({ item, stat, }) {
        let { id$file, } = stat.moduleStat;
        let { id, privates = [], } = item.data;



        let list = privates.map((itemId) => {
            let sid = `${id}/${itemId}`;
            let file = id$file[sid];

            return {
                'id': sid,
                'file': file,
            };
        });

        
        GridView.render(list);
        panel.show();
    });





});



define.panel('/ModuleTree/Main/ModuleInfo/Publics', function (require, module, panel) {

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




    panel.on('render', function ({ item, stat, }) {

        let { id$file, } = stat.moduleStat;
        let { publics = [], } = item.data;


        let list = publics.map((id) => {
            let file = id$file[id];

            return {
                'id': id,
                'file': file,
            };
        });

        
        GridView.render(list);
        panel.show();
    });





});



define.panel('/ModuleTree/Main/ModuleInfo/Siblings', function (require, module, panel) {

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




    panel.on('render', function ({ item, stat, }) {
        let { id$file, } = stat.moduleStat;
        let { siblings = [], } = item.data;


        let list = siblings.map((id) => {
            let file = id$file[id];

            return {
                'id': id,
                'file': file,
            };
        });

        
        GridView.render(list);
        panel.show();
    });





});



define.panel('/ModuleTree/Main/ModuleInfo', function (require, module, panel) {
    const Base = module.require('Base');
    const Childs = module.require('Childs');
    const Children = module.require('Children');
    const Siblings = module.require('Siblings');
    const Publics = module.require('Publics');
    const Privates = module.require('Privates');
    const Dependents = module.require('Dependents');


    panel.on('init', function () {
        [
            Base,
            Childs,
            Children,
            Siblings,
            Publics,
            Privates,
            Dependents,
            
        ].forEach((M) => {
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




    panel.on('render', function (data) {
        Base.render(data);
        Childs.render(data);
        Children.render(data);
        Siblings.render(data);
        Publics.render(data);
        Privates.render(data);
        Dependents.render(data);
    });





});


define('/ModuleTree/Main/Nav/Data', function (require, module, exports) {
    
    return {
        make(item) {
            let list = [item, ...item.parents].reverse();

            let names = list.map((item) => {
                return item.name;
            });


            let icon = {
                'type': item.list.length > 0 ? 'dir' : 'file',
                'ext': '.js',
            };


            let path = item.data.id || '/';

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

            'text': function (id) {
                if (id == '/') {
                    panel.fire('item', [{ id, }]);
                    return;
                }

                let item = meta.stat.moduleStat.id$module[id];

                if (!item) {
                    return false; //归位。
                }
                
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
    panel.on('render', function ({ item, stat, }) {
        let { list, names, path, icon, } = Data.make(item);

        meta.item = item;
        meta.stat = stat;
        meta.list = list;

        
        nav.render({ names, path, icon, });
    });



});


define.panel('/ModuleTree/Main/Pair/Filter/HtmlFile', function (require, module, panel) {
    const DropCheckList = require('DropCheckList');

    let chk = null;
    let list = [
        { text: 'N = 0', checked: true, value: 'N=0', },
        { text: 'N = 1', checked: true, value: 'N=1', },
        { text: 'N > 1', checked: true, value: 'N>1', },
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


define.panel('/ModuleTree/Main/Pair/Filter/JsFile', function (require, module, panel) {
    const DropCheckList = require('DropCheckList');

    let chk = null;
    let list = [
        { text: 'N = 0', checked: true, value: 'N=0', },
        { text: 'N = 1', checked: true, value: 'N=1', },
        { text: 'N > 1', checked: true, value: 'N>1', },
    ];

    panel.on('init', function () {

        chk = new DropCheckList({
            'container': panel.$,
            'text': 'js 文件',
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


define.panel('/ModuleTree/Main/Pair/Filter', function (require, module, panel) {
    const JsFile = module.require('JsFile');
    const HtmlFile = module.require('HtmlFile');

    let meta = {
        js$checked: null,
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
       

        JsFile.on({
            'check': function (list) {
                meta.js$checked = make(list);
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



    panel.on('render', function (data) {
        
        JsFile.render();
        HtmlFile.render();
        


    });

    

    return {
        
        
    };






});


define.panel('/ModuleTree/Main/Pair/GridView', function (require, module, panel) {
    const GridView = require('GridView');
    const File = require('File');

    let tpl = null;
    let gridview = null;

    let fields = [
        { caption: '模块ID', name: 'id', width: 300, class: 'name', dragable: true, delegate: '[data-cmd]', },
        // { caption: '级别', name: 'level', width: 49, class: 'number level', dragable: true, },
        { caption: '所在的 js 文件', name: 'file', width: 400, class: 'file', dragable: true, delegate: '[data-cmd]', },
        { caption: '关联的 html 文件', name: 'htmlFile', width: 400, class: 'file', dragable: true, delegate: '[data-cmd]', },
    ];


    function fillFile(file) {
        if (!file) {
            return '';
        }

        let list = Array.isArray(file) ? file : [file];

        let htmls = list.map((file) => {
            let icon = File.getIcon(file);

            let html = tpl.fill('href', {
                'icon': icon.html,
                'cmd': 'file',
                'text': file,
            });

            return html;
        });

        let html = htmls.join('<br />');



        return {
            'html': html,
            'count': list.length,
        };

    }

    panel.on('init', function () {
        tpl = panel.template();

        gridview = new GridView({
            container: panel.$,
            primaryKey: 'id',
            check: false,
            order: true,
            class: '',
            footer: false,
            fields: fields,
        });

        gridview.on('process', 'row', function (row) {
            let item = row.data;
            if (item.htmlFile && !item.file) {
                row.class = 'error';
            }
        });

        gridview.on('process', 'cell', {
            'id': function (cell) {
                let item = cell.row.data;

                let html = tpl.fill('href', {
                    'icon': '',
                    'cmd': 'id',
                    'text': item.id,
                });

                return html;
            },

            'file': function (cell) {
                let item = cell.row.data;
                let { html, count, } = fillFile(item.file);
                if (count > 1) {
                    cell.class += ' error';
                }

                return html;
            },

            'htmlFile': function (cell) {
                let item = cell.row.data;
                let { html, count, } = fillFile(item.htmlFile);
                if (count > 1) {
                    cell.class += ' error';
                }
                return html;
            },


        });

        gridview.on('click', 'cell', function (cell, event) {
            let cmd = event.target.dataset.cmd;

            if (!cmd) {
                return;
            }

            event.stopPropagation();

            let value = event.target.text;
            panel.fire('cmd', [cmd, value]);
        });

        gridview.render();


    });


    /**
    * 渲染内容。
    *   list: [],       //必选，数据列表。
   
    */
    panel.on('render', function (list) {

        gridview.fill(list);


    });


    return {
     
    };


});



define.panel('/ModuleTree/Main/Pair/Header', function (require, module, panel) {
 

    /**
    * 初始化时触发。
    * 即首次 render 之前触发，且仅触发一次。
    * 适用于创建实例、绑定事件等只需要执行一次的操作。
    */
    panel.on('init', function () {


       
    });




    panel.on('render', function () {

        

    });





});



define('/ModuleTree/Main/Pair/Data', function (require, module, exports) {
    
    let meta = {
        item: null,
        stat: null,
    };

   
    return {
        /**
        *
        */
        init({ item, stat, }) {
            console.log(item);
            meta.item = item;
            meta.stat = stat;
        },

        /**
        * 
        * @param {*} opt 
        * @returns 
        */
        filter(opt = {}) {
            let {
                js$checked = null,
                html$checked = null,
            } = opt;

            let { item, stat, } = meta;
            let { moduleStat, htmlStat, } = stat;
            let { id, } = item.data;
            let ids = [...new Set([...moduleStat.ids, ...htmlStat.ids,])];
            let list = [];

            //非根节点，则要包括当前节点。
            if (item.parent) {
                let pid = id === '' ? '/' : id;

                list = ids.filter((mid) => {
                    return mid.startsWith(pid);
                });

                list = [id, ...list];
            }
            else { //根节点。
                list = ids;
            }


            list = list.map((id) => {
                let file = moduleStat.id$file[id];
                let htmlFile = htmlStat.id$file[id];

                //所在 js 文件。
                if (js$checked) {
                    let N =
                        typeof file == 'string' ? 1 :
                        Array.isArray(file) ? file.length : 0;

                    //`N = 0` 没有勾选。
                    if (!js$checked['N=0'] && N == 0) {
                        return;
                    }

                    //`N = 1` 没有勾选。
                    if (!js$checked['N=1'] && N == 1) {
                        return;
                    }

                    //`N > 1` 没有勾选。
                    if (!js$checked['N>1'] && N > 1) {
                        return;
                    }
                }


                //所在 html 文件。
                if (html$checked) {
                    let N =
                        typeof htmlFile == 'string' ? 1 :
                            Array.isArray(htmlFile) ? htmlFile.length : 0;

                    //`N = 0` 没有勾选。
                    if (!html$checked['N=0'] && N == 0) {
                        return;
                    }

                    //`N = 1` 没有勾选。
                    if (!html$checked['N=1'] && N == 1) {
                        return;
                    }

                    //`N > 1` 没有勾选。
                    if (!html$checked['N>1'] && N > 1) {
                        return;
                    }
                }

                return {
                    'id': id,
                    'htmlFile': htmlFile,
                    'file': file,
                };
            });

           
            list = list.filter((item) => {
                return !!item;
            });

           

            return list;
        },
    };



});



define.panel('/ModuleTree/Main/Pair', function (require, module, panel) {
    const Header = module.require('Header');
    const Data = module.require('Data');
    const Filter = module.require('Filter');
    const GridView = module.require('GridView');

    panel.set('show', false);
    

    panel.on('init', function () {
       

        Filter.on({
            'change': function (opt) {
                let list = Data.filter(opt);
                GridView.render(list);

               
            },
        });

        GridView.on({
            'cmd': function (cmd, value) {
                panel.fire(cmd, [value]);
            },
        });
        

    });




    panel.on('render', function (opt) {
        Data.init(opt);

        Header.render();
        Filter.render();
        
        panel.show();
    });





});



define.panel('/ModuleTree/Main/Tree/Header', function (require, module, panel) {

    const CheckBox = require('CheckBox');


 

    let chks = [
        { id: 'secondary', text: '文件', chk: null, },
        { id: 'icon', text: '图标', chk: null, },
        { id: 'tab', text: '缩进', chk: null, },
        { id: 'color', text: '彩色', chk: null, },
        { id: 'hover', text: '悬停', chk: null, },
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




    panel.on('render', function (id$checked) {

        chks.forEach((item) => {
            let checked = id$checked[item.id];

            item.chk.render({ checked, });
        });

    });





});



define.panel('/ModuleTree/Main/Tree/Main', function (require, module, panel) {
    const TextTree = require('TextTree');
    const Clipboard = require('Clipboard');
 
    let tree = null;




    panel.on('init', function () {
        tree = new TextTree({
            'container': panel.$,
            'secondaryKey': 'file',   //如果不指定，则不生成对应的 html 内容。
        });

        tree.on('cmd', function (cmd, item) {
            panel.fire('cmd', [cmd, item,]);
        });

     
    });

   


    panel.on('render', function (opt) {
        let { id, ids, id$file, } = opt;

        let list = ids.map((id) => {
            let file = id$file[id];
            return { id, file, };
        });
        
        tree.render(list);

        if (typeof id == 'string') {
            tree.highlight(id);
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
            'cmd': function (cmd, item) {
                let value = item[cmd];      //cmd 为 `id`、`file`。
                panel.fire(cmd, [value]);
            },

            'render': function () {
                Header.render({
                    'secondary': false,
                    'icon': false,
                    'tab': true,
                    'color': true,
                    'hover': false,
                });
            },
        });

    });




    panel.on('render', function ({ item, stat, }) {
        let { id, parents, children, } = item.data;
        let { ids,  id$file, } = stat.moduleStat;

        //针对非根节点。
        if (item.parent) {
            parents = parents.slice(0).reverse();//需要复制一份再反转，否则会影响原来的。
            ids = [...parents, id, ...children,];
        }
        

        Main.render({
            id,
            ids,
            id$file,
        });
        

    });





});



define.panel('/ModuleTree/Main/Tabs', function (require, module, panel) {
    const Tabs = require('@definejs/tabs');
    const Storage = require('@definejs/local-storage');


    let allList = [
        { name: '依赖关系', cmd: 'dependent', root: true, },
        { name: '模块列表', cmd: 'list', root: true, },
        { name: '组织架构', cmd: 'tree', root: true, },
        { name: '模块配对', cmd: 'pair', root: true, },
        { name: '模块信息', cmd: 'module', },
        { name: '文件信息', cmd: 'file', },
        { name: '文件内容', cmd: 'content', },
    ];


    let list = [];
    let tabs = null;
    let storage = null;

    let meta = {
        index: 0,
        cmd$module: null,
    };


    panel.on('init', function () {
        storage = new Storage(module.id);
        meta.index = storage.get('index') || 0;

        tabs = new Tabs({
            container: panel.$.get(0),
            activedClass: 'on',
            eventName: 'click',
            selector: '>li',
            repeated: true, //这里要允许重复激活相同的项。
        });


        tabs.on('change', function (item, index) {
            meta.index = index;
            item = list[index];
            storage.set('index', index);


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

        list = allList;

        if (isRoot) {
            list = list.filter((item) => {
                return item.root;
            });
        }

        tabs.render(list, function (item, index) {
            return {
                'index': index,
                'name': item.name,
            };
        });


        //列表长度可能发生了变化。
        if (meta.index > list.length - 1) {
            meta.index = 0;
        }

        tabs.active(meta.index);

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
    const Content = module.require('Content');
    const FileInfo = module.require('FileInfo');
    const ModuleInfo = module.require('ModuleInfo');
    const Tree = module.require('Tree');
    const List = module.require('List');
    const Dependent = module.require('Dependent');
    const Pair = module.require('Pair');

    let meta = {
        item: null,
        stat: null,
    };

    panel.on('init', function () {
        Nav.on({
            'item': function (item) {
                panel.fire('item', [item]);
            },
        });

        Tabs.map({
            'module': ModuleInfo,
            'file': FileInfo,
            'content': Content,
            'tree': Tree,
            'list': List,
            'dependent': Dependent,
            'pair': Pair,
        });

        Tabs.on({
            'change': function (M) {
                M.render(meta);
            },
        });



        [ModuleInfo, FileInfo, Tree, List, Dependent, Content, Pair, ].forEach((M) => {

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
    *   opt = {
    *       item: {},   //当前菜单项。
    *       stat: {},   //
    *   };
    */
    panel.on('render', function (opt) {
        let item = meta.item = opt.item;
        let isRoot = !item.parent;

        meta.stat = opt.stat;

        Nav.render(opt);

        Tabs.render(isRoot);

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



define('/ModuleTree/Tree/Data', function (require, module, exports) {
    const none = module.data.none;

    function sort(list) {
        let dirs = [];
        let files = [];

        //把目录节点和文件节点分类。
        list.forEach((item) => {
            let list = item.list.length > 0 ? dirs : files;
            list.push(item);
        });


        dirs.sort((a, b) => {
            return a.id > b.id ? 1 : -1;
        });

        files.sort((a, b) => {
            return a.id.toUpperCase() > b.id.toUpperCase() ? 1 : -1;
        });

        return [...dirs, ...files,];
    }

    function make(id, info) {
        let childs = info.id$childs[id] || [];
        let module = info.id$module[id];

        let list = childs.map((id) => {
            let item = make(id, info);
            return item;
        });

        list = sort(list);

        return {
            'id': id,
            'name': module.name || none,
            'open': false,
            'list': list,
            'data': {
                'id': id,
                'children': info.id$children[id],
                'childs': info.id$childs[id],
                'dependents': info.id$dependents[id],
                'file': info.id$file[id],
                'info': info.id$info[id],
                'module': info.id$module[id],
                'parent': info.id$parent[id],
                'parents': info.id$parents[id],
                'privates': info.id$privates[id],
                'publics': info.id$publics[id],
                'siblings': info.id$siblings[id],
            },
        };
    }

    


    return {
        /**
        */
        make: function (stat) {
            let info = stat.moduleStat;
            let { level$ids, } = info;

            //把一级的找出来。
            let roots = level$ids['1'].map((id) => {
                let root = make(id, info);
                return root;
            });


            roots = sort(roots);


            return [
                {
                    'id': '/',
                    'name': '模块树',
                    'open': true,
                    'dirIcon': {
                        close: 'fas fa-folder',
                        open: 'fas fa-folder-open',
                    },
                    'data': {},
                    'list': roots,
                }
            ];


        },


    };


});


define.panel('/ModuleTree/Tree', function (require, module, panel) {
    const SidebarTree = require('SidebarTree');
    const Data = module.require('Data');
    const none = module.data.none;


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
                panel.fire('resize');
            },
        });


    });




    /**
    * 渲染。
    *   
    */
    panel.on('render', function (stat) {
        let list = Data.make(stat);


        tree.render(list);

    });


    return {
        open: function (id) {
            tree.open(id);
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
        get: function () {
            let api = new API('Stat.get', {
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
                    
                    let tree = Data.make(stat);

                    emitter.fire('success', 'get', [stat, tree]);
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

    let storage = new SessionStorage(module.id);

    let meta = {
        item: null,         //当前激活的菜单项。在菜单树填充后首先激活根节点。
        stat: null,         //从后台获取到的所有统计数据。
    };


    view.on('init', function () {
        

        API.on('success', {
            'get': function (stat, tree) {
                meta.stat = stat;

                Tree.render(stat);
                Tree.open(meta.item.id);
            },
        });

        Tree.on({
            'item': function (item) {
                meta.item = item;
                storage.set('id', item.id); //保存到 storage。
                Main.render(meta);
                
            },
            'resize': function () {
                let w1 = Tree.$.outerWidth();
                Main.resize(w1, 6);
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

            'file': function (file) {
                view.fire('file', [file]);
            },



        });

       
    });


    /**
    * 渲染内容。
    *   id: '',   //渲染完成后要打开的节点。
    */
    view.on('render', function (id) {
        
        id = id || storage.get('id') || 1;

        meta.item = { id, };

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
        get: function () {
            let api = new API('FileList.read', {
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

            api.get({
                'id': '/',
            });

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


        let { list, root, } = fs;

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



define('/Tool/Main/JS/Editor/CMD', function (require, module, exports) {

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



define('/Tool/Main/JS/Editor/File', function (require, module, exports) {
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



define('/Tool/Main/JS/Editor/Table', function (require, module, exports) {
  

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



define.panel('/Tool/Main/JS/Editor', function (require, module, panel) {
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


define('/Tool/Main/JS/Header/Switch', function (require, module, exports) {
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
define.panel('/Tool/Main/JS/Header', function (require, module, panel) {
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



define.panel('/Tool/Main/JS/Preview', function (require, module, panel) {
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



define.panel('/Tool/Main/JS/Themes/List', function (require, module, panel) {
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


define.panel('/Tool/Main/JS/Themes/Mask', function (require, module, panel) {
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


define.panel('/Tool/Main/JS/Themes', function (require, module, panel) {
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



define('/Tool/Main/JS/API', function (require, module, exports) {
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


define('/Tool/Main/JS/Data', function (require, module, exports) {
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



define.panel('/Tool/Main/JS', function (require, module, panel) {
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


define('/Tool/Main/Less/Editor/CMD', function (require, module, exports) {

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



define('/Tool/Main/Less/Editor/File', function (require, module, exports) {
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



define('/Tool/Main/Less/Editor/Table', function (require, module, exports) {
  

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



define.panel('/Tool/Main/Less/Editor', function (require, module, panel) {
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


define('/Tool/Main/Less/Header/Switch', function (require, module, exports) {
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
define.panel('/Tool/Main/Less/Header', function (require, module, panel) {
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



define.panel('/Tool/Main/Less/Preview', function (require, module, panel) {
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



define.panel('/Tool/Main/Less/Themes/List', function (require, module, panel) {
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


define.panel('/Tool/Main/Less/Themes/Mask', function (require, module, panel) {
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


define.panel('/Tool/Main/Less/Themes', function (require, module, panel) {
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



define('/Tool/Main/Less/API', function (require, module, exports) {
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


define('/Tool/Main/Less/Data', function (require, module, exports) {
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



define.panel('/Tool/Main/Less', function (require, module, panel) {
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


define('/Tool/Main/MD5/API', function (require, module, exports) {
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


define.panel('/Tool/Main/MD5/Input', function (require, module, panel) {
  
    

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


define.panel('/Tool/Main/MD5/Output', function (require, module, panel) {
  
    

    panel.on('init', function () {
       

    });

    panel.on('render', function (data) {
        panel.fill({
            'md5': data.md5,
        });
    });


    return {

    };
});


define.panel('/Tool/Main/MD5', function (require, module, panel) {
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
            'success': function (md5) {
                Output.render(md5);
            },
        });

    });

    panel.on('render', function () {

        Input.render();

    });


    return {

    };
});


define.panel('/Tool/Main/QRCode/Main/Input', function (require, module, panel) {
  
    

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


define.panel('/Tool/Main/QRCode/Main/Output', function (require, module, panel) {
  
    

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


define.panel('/Tool/Main/QRCode/Statics/List', function (require, module, panel) {
    
    

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


define('/Tool/Main/QRCode/API', function (require, module, exports) {
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


define.panel('/Tool/Main/QRCode/Main', function (require, module, panel) {
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


define.panel('/Tool/Main/QRCode/Statics', function (require, module, panel) {
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

define.panel('/Tool/Main/QRCode', function (require, module, panel) {
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


define.panel('/Tool/Main', function (require, module, panel) {
    const QRCode = module.require('QRCode');
    const MD5 = module.require('MD5');
    const Less = module.require('Less');
    const JS = module.require('JS');


    let meta = {
        cmd$module: {},
    };

  

    panel.on('init', function () {
        

        [Less, JS, ].forEach((M) => {
            M.on({
                'fullscreen': function (on) {
                    panel.fire('fullscreen', [on]);
                },
            });
        });


    });


    /**
    * 渲染内容。
    *   item = {}   //当前菜单项。
    */
    panel.on('render', function (item, args) {
        let { cmd, } = item.data;
        let M = meta.cmd$module[cmd];

        if (M) {
            if (args) {
                M.render(...args);
            }
            else {
                M.show();
            }
        }
        else {
            args = args || [];
            M = meta.cmd$module[cmd] = module.require(cmd);
            M.render(...args);
        }


        [QRCode, MD5, Less, JS, ].forEach((item) => {
            if (item != M) {
                item.hide();
            }
        });

      

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



define('/Tool/Tree/Data', function (require, module, exports) {

    let list = [
        { name: '二维码', icon: 'fas fa-qrcode', panel: 'QRCode', },
        { name: '内容指纹', icon: 'fas fa-fingerprint', panel: 'MD5' },
        { name: 'Less 编译', icon: 'fab fa-less', panel: 'Less', },
        { name: 'JS 压缩', icon: 'fab fa-node-js', panel: 'JS', },
    ];



    return {
        /**
        * 把 JSON 数据转成树节点列表，用于展示成菜单树。
        */
        make: function (opt) {
            return list.map((item, index) => {
                return {
                    'name': item.name,
                    'id': item.panel,
                    'fileIcon': item.icon,
                    'open': false,

                    'data': {
                        'cmd': item.panel,
                    },
                };
            });

        },

     
    };


});


define.panel('/Tool/Tree', function (require, module, panel) {
    const SidebarTree = require('SidebarTree');
    const Data = module.require('Data');

 
    let tree = null;

    panel.on('init', function () {
       
        tree = new SidebarTree({
            'container': panel.$,
            'width': panel.$.width(),
            'header': false,
            'resizer': false,
        });

        tree.on({
            'item': function (...args) {

                panel.fire('item', args);
            },
            'dir': function (...args) {
                panel.fire('dir', args);
            },
            'resize': function (...args) {
                let w = tree.$.outerWidth();

                panel.$.width(w);
                panel.fire('resize', args);
            },
        });
       

    });

   


    /**
    * 渲染。
    */
    panel.on('render', function () {
        let list = Data.make();

        tree.render(list);
        
    });

    return {
        open: function (id) {
            tree.open(id);
        },
    };


});

define.view('/Tool', function (require, module, view) {
    const SessionStorage = require('@definejs/session-storage');
    const Tree = module.require('Tree');
    const Main = module.require('Main');

    let storage = null;


    let meta = {
        item: null,
        args: null,
    };
 

    view.on('init', function () {

        storage = new SessionStorage(module.id);

        Tree.on({
            'item': function (item) {
                console.log(item);

                let args = meta.args;

                meta.item = item;
                meta.args = null;

                storage.set('id', item.id); //保存到 storage。
                Main.render(item, args);

            },
            'resize': function () {
                let w1 = Tree.$.outerWidth();
                Main.resize(w1, 6);
            },
        });




      

        Main.on({
            'fullscreen': function (on) {
                view.$.toggleClass('fullscreen', on);
                view.fire('fullscreen', [on]);
            },
        });

  
    });


    view.on('render', function (id, args) {
        id = id || storage.get('id') || 1;
        meta.args = args || null;

        Tree.render();
        Tree.open(id);

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
            let url = `#!${file}`;
            window.open(url);
        },

        'open': function (url) {
            window.open(url);
        },
        
        'edit': function (name) {
            Master.open('DocAdd', [{ name, }]);
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
