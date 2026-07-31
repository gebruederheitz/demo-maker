import path from 'node:path';
import fs from 'node:fs';
import syntaxHighlight from '@11ty/eleventy-plugin-syntaxhighlight';
import { EleventyRenderPlugin } from '@11ty/eleventy';
import markdownIt from 'markdown-it';

export default async function(eleventyConfig) {
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
                import.meta.dir,
                '_includes/_example.njk'
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
        const {default: customConfigBuilder} = await import('./.eleventy.custom.js');
        customReturns = customConfigBuilder(eleventyConfig, {sortedCollection,}) || {};
    }

    return {
        markdownTemplateEngine: 'njk',
        dir: {
            input: import.meta.dir,
            includes: '_includes',
            // layouts: '_layouts',
            output: path.resolve('../_demo'),
        },
        ...customReturns,
    };
}
