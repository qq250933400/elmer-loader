// tslint:disable-next-line: no-implicit-dependencies
import { getOptions } from "loader-utils";
// tslint:disable: no-var-requires
const fs = require("fs");
const path = require("path");
// tslint:disable-next-line: no-implicit-dependencies
const validateOptions = require("schema-utils");
// tslint:enable: no-implicit-dependencies

const getFilePath = (fileName:string):string => {
    const srcFile = (fileName||"").replace(/\\/g, "/");
    const lIndex = srcFile.lastIndexOf("/");
    return lIndex > 0 ? srcFile.substr(0, lIndex + 1) : srcFile;
};

const transformTypeScript = function(source: string, matchData: string, options:any): string {
    const jsonData = matchData.replace(/\@declareComponent\(/, "")
        .replace(/(\r\n)*\s*export\s{1,}class\s{1,}$/img, "")
        .replace(/(\r\n)*\s*class\s{1,}$/img, "")
        .replace(/\)\s*$/,"");
    const templateMatch = jsonData.match(/template\s*\:\s*\{[\s\S]*\}/img);
    const fileName = this.resourcePath;
    const filePath = getFilePath(fileName);
    if(templateMatch) {
        const templateCode = templateMatch[0];
        if(/fromLoader\s*\:\s*true\s*/igm.test(templateCode)) {
            const urlMatch = templateCode.match(/url\s*\:\s*(\'|\")([a-z0-9\/\.\\\s]*)(\'|\")\s*(\,|\r\n)/i);
            if(urlMatch) {
                const url = urlMatch[2];
                const tFileName = path.resolve(filePath, url);
                let htmlCode = "";
                if(fs.existsSync(tFileName)) {
                    htmlCode = fs.readFileSync(tFileName, "utf8");
                    if(options && typeof options.parse === "function") {
                        htmlCode = options.parse(htmlCode);
                    }
                } else {
                    htmlCode = `<h5>[TypeScript]Template Not Found.${tFileName}</h5>`;
                    throw new Error(htmlCode);
                }
                const replaceData = matchData.replace(urlMatch[0], `htmlCode: ${JSON.stringify(htmlCode)},`);
                return source.replace(matchData, replaceData);
            }
        }
    }
    return source;
};

const transformES5Script = function(source: string, matchData: string, options:any): string {
    const jsonData = matchData.replace(/_1.declareComponent\(/, "")
        .replace(/\}\)[\s\r\n]*$/,"}");
    const templateMatch = jsonData.match(/template\s*\:[\s\r\n]*\{[\s\S]*\}/img);
    const fileName = this.resourcePath;
    const filePath = getFilePath(fileName);
    if(templateMatch) {
        const templateCode = templateMatch[0];
        if(/fromLoader\s*\:\s*true\s*/igm.test(templateCode)) {
            const urlMatch = templateCode.match(/url\s*\:\s*(\'|\")([a-z0-9\/\.\\\s]*)(\'|\")\s*(\,|\r\n)/i);
            if(urlMatch) {
                const url = urlMatch[2];
                const tFileName = path.resolve(filePath, url);
                let htmlCode = "";
                if(fs.existsSync(tFileName)) {
                    htmlCode = fs.readFileSync(tFileName, "utf8");
                    if(options && typeof options.parse === "function") {
                        htmlCode = options.parse(htmlCode);
                    }
                } else {
                    htmlCode = `<h5>[ES5]Template Not Found.${tFileName}</h5>`;
                    throw new Error(htmlCode);
                }
                const replaceData = matchData.replace(urlMatch[0], `htmlCode: ${JSON.stringify(htmlCode)},`);
                return source.replace(matchData, replaceData);
            }
        }
    }
    return source;
};

const schema = {
    properties: {
        test: {
            parse: "function",
            type: "string"
        }
    },
    type: "object"
};

export default function(source:string): string {
    const options = getOptions(this);
    validateOptions(schema, options);
    let updateSource = source;
    let requireMatch = source.match(/require\(\s*[\"]{1}([0-9a-z\/\.\_\-\\]*\.(html|htm))\s*['"]{1}\s*\)/ig);
    if(/\@declareComponent\(\{/img.test(source)) {
        const checkMatch = source.match(/\@declareComponent\([\s\S]*(\s*export\s{1,}class\s{1,}|\s*class\s{1,})/img);
        if(checkMatch) {
            for(let i=0;i<checkMatch.length;i++) {
                updateSource = transformTypeScript.call(this, updateSource, checkMatch[i], options);
            }
        }
    } else if(/_1\.declareComponent\(/.test(source)) {
        const esMatch = source.match(/_1\.declareComponent\([\s\S]*\}\)/img);
        if(esMatch) {
            for(let i = 0;i<esMatch.length;i++) {
                updateSource = transformES5Script.call(this, updateSource, esMatch[i], options);
            }
        }
    } else {
        if(requireMatch) {
            // console.log(source.match(/require\(\s*[\"]{1}([0-9a-z\/\.\_\\]*\.(html|htm))\s*['"]{1}\s*\)/i));
            let fNameReg = /require\(\s*[\"]{1}([0-9a-z\/\.\_\-\\]*\.(html|htm))\s*['"]{1}\s*\)/i;
            let filePath = getFilePath(this.resourcePath);
            for(let i=0;i<requireMatch.length;i++) {
                let fNameM = requireMatch[i].match(fNameReg);
                let fName = fNameM ? fNameM[1] : "";
                let fNamePath = path.resolve(filePath, fName);
                if(fs.existsSync(fNamePath)) {
                    let fCode = fs.readFileSync(fNamePath, "utf8");
                    if(options && typeof options.parse === "function") {
                        if(/^\<\!--TemplateLoader=Text--\>/i.test(fCode)) {
                            fCode = options.parse(fCode);
                        }
                    }
                    source.replace(requireMatch[i], JSON.stringify(fCode));
                    // tslint:disable-next-line: no-console
                    console.log("[ImportSource] " + fNamePath);
                }
                fNameM = null;
                fName = null;
                fNamePath = null;
            }
            fNameReg = null;
            filePath = null;
        }
    }
    requireMatch = null;
    return updateSource;
}
