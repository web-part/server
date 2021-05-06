

define('data.Sidebar', function (require, module, exports) {

    let list = [
        { name: '终端', icon: 'fas fa-terminal', view: 'Terminal', },
        { name: '文件资源', icon: 'fa fa-folder-open', view: 'FileList', },
        { name: '模块系统', icon: 'fa fa-sitemap', view: 'ModuleTree', },
        { name: '文件指纹', icon: 'fas fa-fingerprint', view: 'MD5', },
        { name: '日志', icon: 'fas fa-comment-dots', view: 'Log', },
        { name: '帮助手册', icon: 'fa fa-question-circle', view: 'DocHelp', },
        //{ name: '菜单树', icon: 'credit-card', view: 'MenuTree.demo', },

    ];


    return list;


});
