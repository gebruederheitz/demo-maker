const path = require('path');
const fs = require('fs');
const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');
const { EleventyRenderPlugin } = require('@11ty/eleventy');

module.exports = function(eleventyConfig) {
    //-- PASSTHROUGH COPY
    eleventyConfig.addPassthroughCopy({
        '_includes/assets': 'assets',
    });
    eleventyConfig.setServerPassthroughCopyBehavior('copy');

    //-- SYNTAX HIGHLIGHTING
    eleventyConfig.addPlugin(syntaxHighlight);

    function sortedCollection(collectionName, collectionTag) {
        eleventyConfig.addCollection(collectionName, function (collectionApi) {
            return collectionApi.getFilteredByTag(collectionTag).sort((a, b) => {
                const bNavOrder = b.data.navOrder || 99;
                const aNavOrder = a.data.navOrder || 99;
                return aNavOrder - bNavOrder;
            });
        });
    }

    //-- SORT BY NAVORDER IN "DEMO" COLLECTION
    sortedCollection('demos', 'demo');

    //-- DEFINE PROJECT NAME
    let projectName = 'Demo & Documentation';
    try {
        const rawPkg = fs.readFileSync('./package.json').toString('utf8');
        const pkg = JSON.parse(rawPkg);
        if (pkg.config?.projectName) {
            projectName = pkg.config.projectName;
        }
    } catch (e) {
      // noop
    }
    eleventyConfig.addGlobalData('projectName', projectName);

    //-- DEFINE NAVIGATION TEMPLATE
    eleventyConfig.addGlobalData('_navTemplatePath', 'layouts/_nav.njk');

    //-- SET WHETHER CONTENT WIDTH SHOULD BE LIMITED
    eleventyConfig.addGlobalData('contentLimited', false);

    //-- SET UP FAVICONS
    if (fs.existsSync('./_includes/assets/icon/favicon-32.png')) {
        eleventyConfig.addGlobalData('favicon', {
            small: '/assets/icon/favicon-32.png',
            large: '/assets/icon/favicon-256.png',
        });
    }

    //-- "EXAMPLE" SHORTCODE (include_demo)
    const compileFile = EleventyRenderPlugin.File;
    let templateConfig = {};
    eleventyConfig.on('eleventy.config', (config) => {
        templateConfig = config;
    });
    eleventyConfig.addAsyncShortcode(
        'include_demo',
        async function (partial, description, highlightLang) {
            const basePath = path.dirname(this.ctx.page.inputPath);
            const partialPath = path.resolve(basePath, partial);
            const exampleTemplatePath = path.resolve(
                __dirname,
                '_includes/_example.md'
            );

            const render = await compileFile(
                exampleTemplatePath,
                { templateConfig },
                'njk'
            );
            return render({
                ...this.ctx,
                includePath: partialPath,
                description,
                highlightLang,
            });
        }
    );

    //-- MARKDOWN WITH PRETTY TABLES
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

    //-- LAYOUT ALIAS "basic"
    eleventyConfig.addLayoutAlias('basic', 'layouts/_layout-base.njk');

    //-- PER-PROJECT CUSTOM CONFIGURATION
    let customReturns = {};
    if (fs.existsSync('./.eleventy.custom.js')) {
        customReturns = require('./.eleventy.custom.js')(eleventyConfig, {
            sortedCollection,
        }) || {};
    }

    return {
        markdownTemplateEngine: 'njk',
        dir: {
            input: __dirname,
            includes: '_includes',
            // layouts: '_layouts',
            output: path.resolve('../_demo'),
        },
        ...customReturns,
    };
}
