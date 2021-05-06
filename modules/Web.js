
const File = require('@definejs/file');
const $String = require('@definejs/string');

let sample = `
definejs.config('API', {
    url: '{url}',
});
`;

module.exports = {

    start(htdocs, url) {
        let file = `${htdocs}config.api.js`;
        let content = $String.format(sample, { url, });

        File.write(file, content, null);

    },
};