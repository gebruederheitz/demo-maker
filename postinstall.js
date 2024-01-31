#! /usr/bin/env node
const { PlainTextLego } = require('@gebruederheitz/plaintextlego');
const path = require('path');
const fs = require('fs/promises');
const { existsSync } = require('fs');

module.exports = (async function() {
    const app = process.env.npm_config_root || process.env.npm_config_local_prefix;
    const lib = process.cwd();

    if (app === lib) {
        // Only run script when installing as another package's dependency
        return;
    }

    console.log("Updating files...")
    const copies = [];
    const fsOptions = { recursive: true };

    await fs.mkdir(`${app}/_includes/assets`, fsOptions);
    await fs.mkdir(`${app}/_includes/layouts`, fsOptions);
    await fs.mkdir(`${app}/_includes/components`, fsOptions);

    copies.push(fs.copyFile(`${lib}/index.js`, `${app}/.eleventy.js`));
    copies.push(fs.copyFile(`${lib}/_includes/_layout-base.njk`, `${app}/_includes/layouts/_layout-base.njk`));
    copies.push(fs.copyFile(`${lib}/_includes/_table-of-contents.njk`, `${app}/_includes/components/_table-of-contents.njk`));
    copies.push(fs.copyFile(`${lib}/_includes/_nav.njk`, `${app}/_includes/layouts/_nav.njk`));
    copies.push(fs.copyFile(`${lib}/_includes/_example.md`, `${app}/_includes/_example.njk`));
    copies.push(fs.cp(`${lib}/assets/css`, `${app}/_includes/assets/css`, fsOptions));

    await Promise.all(copies);

    const customCssPath = path.resolve(app, '_includes/assets/css/custom.css');
    if (!existsSync(customCssPath)) {
        await fs.writeFile(customCssPath, '/* Custom styles for the demo builder */\n');
    }

    console.log("Updating gitignore...")
    const gitIgnorePath = path.resolve(app, './.gitignore');
    if (!existsSync(gitIgnorePath)) {
        await fs.writeFile(gitIgnorePath, '');
    }
    // Until v1.2.0 the demo template was a markdown file
    // In higher releases this condition can be removed, as the references file
    // will be unlikely to exist – and will pop up in people's version control.
    if (existsSync(`${app}/_includes/_example.md`)) {
        await fs.unlink(`${app}/_includes/_example.md`);
    }
    const ptl = new PlainTextLego(gitIgnorePath);
    await ptl.run({
        'DEMO-MAKER': './git-ignores.txt',
    });

})();
