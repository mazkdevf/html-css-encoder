const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const classMap = new Map();
const getRandomClassName = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 10; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return result;
};

function removeHTMLComments(html) {
    return html.replace(/<!--[\s\S]*?-->/g, '');
}

const escapeClassName = className => {
    return className.replace(/[^A-Za-z0-9\\\-]/g, match => '\\' + match);
};

const removeComments = content => {
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');
    content = content.replace(/\/\/.*\n/g, '');
    return content;
};

const convertHtmlAndCss = (htmlFilename, cssFilename) => {
    const htmlPath = path.join(__dirname, htmlFilename);
    const cssPath = path.join(__dirname, cssFilename);

    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    const $ = cheerio.load(htmlContent, { decodeEntities: false });

    $('*').html(removeHTMLComments($('*').html()));

    $('*[class]').each((index, element) => {
        const classNames = $(element).attr('class').split(' ');
        const newClassNames = [];

        classNames.forEach(className => {
            if (!classMap.has(className)) {
                classMap.set(className, getRandomClassName());
            }
            newClassNames.push(classMap.get(className));
        });

        $(element).attr('class', newClassNames.join(' '));
    });

    let cssContent = fs.readFileSync(cssPath, 'utf-8');
    cssContent = removeComments(cssContent);

    classMap.forEach((newClassName, oldClassName) => {
        const regex = new RegExp(`\\.${escapeClassName(oldClassName)}(?=\\s*\\{)`, 'g');
        cssContent = cssContent.replace(regex, `.${newClassName}`);
    });

    const newHtmlPath = path.join(__dirname, `enc_${htmlFilename}`);
    fs.writeFileSync(newHtmlPath, $.html(), 'utf-8');

    const newCssPath = path.join(__dirname, `enc_${cssFilename}`);
    fs.writeFileSync(newCssPath, cssContent, 'utf-8');
};

const htmlFilename = process.argv.find(arg => arg.startsWith('-html='))?.split('=')[1];
const cssFilename = process.argv.find(arg => arg.startsWith('-css='))?.split('=')[1];

if (htmlFilename && cssFilename) {
    convertHtmlAndCss(htmlFilename, cssFilename);
} else {
    console.log('Usage: node convert.js -html=filename.html -css=output.css');
}
