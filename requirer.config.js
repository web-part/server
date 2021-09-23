
//此配置文件用于命令行工具 `@definejs/cli` 中的命令 `definejs require`。
//以便进行依赖检查。
module.exports = {
    patterns: [
        '**/*.js',
        '!**/node_modules/**/*.js',
        '!test.js',

        //此目录不需要检查。
        '!htdocs/**/*.js',
    ],
};