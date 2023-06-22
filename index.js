const path = require('path');
const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');
const { EleventyRenderPlugin } = require('@11ty/eleventy');

const defaultConfig = {
    appBasePath: '.',
    projectName: '/gh Docs & Demos',
}

module.exports = function(eleventyConfig, config = defaultConfig) {
    eleventyConfig.addLayoutAlias('basic', path.resolve(__dirname, '_includes/layout-base.njk'));

    const appSourcePath = path.resolve('.', 'src');

    eleventyConfig.addPassthroughCopy(path.resolve(appSourcePath, 'assets'));
    eleventyConfig.addPassthroughCopy({
        [`${path.resolve(__dirname, 'assets/css')}`]: 'assets/css'
    });
    eleventyConfig.setServerPassthroughCopyBehavior('copy');
    // eleventyConfig.setWatchThrottleWaitTime(500);


    eleventyConfig.addPlugin(syntaxHighlight);

    eleventyConfig.addCollection('demos', function (collectionApi) {
        return collectionApi.getFilteredByTag('demo').sort((a, b) => {
            const bNavOrder = b.data.navOrder || 99;
            const aNavOrder = a.data.navOrder || 99;
            return aNavOrder - bNavOrder;
        });
    });

    eleventyConfig.addGlobalData('projectName', config.projectName);
    eleventyConfig.addGlobalData('_navTemplatePath', path.resolve(__dirname, '_includes/_nav.njk'));
    eleventyConfig.addGlobalData('favicon', {
        small: path.resolve(appSourcePath, 'assets/icon/favicon-32.png'),
        large: path.resolve(appSourcePath, 'assets/icon/favicon-256.png'),
    });

    const compileFile = EleventyRenderPlugin.File;
    let templateConfig = {};

    eleventyConfig.on('eleventy.config', (config) => {
        templateConfig = config;
    });
    eleventyConfig.addAsyncShortcode(
        'include_demo',
        async function (partial, description) {
            const basePath = path.dirname(this.ctx.page.inputPath);
            const partialPath = path.resolve(basePath, partial);

            console.log(templateConfig);

            const exampleTemplatePath = path.resolve(
                __dirname,
                '_includes/_example.md'
            );

            const x = await compileFile(
                exampleTemplatePath,
                { templateConfig },
                'md,njk'
            );
            return x({
                ...this.ctx,
                includePath: partialPath,
                description,
            });
        }
    );

    const markdownIt = require('markdown-it');
    const options = {
        html: true,
        breaks: false,
        linkify: true,
    };
    const md = markdownIt(options);
    md.renderer.rules.table_open = function () {
        return '<table class="table table-bordered table-striped table-group-divider">';
    };
    md.disable('code');
    eleventyConfig.setLibrary('md', md);

    return {
        markdownTemplateEngine: 'njk',
    };
}
