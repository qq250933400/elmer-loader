// tslint:disable-next-line: no-var-requires
const validateOptions = require("schema-utils");
// tslint:enable: no-implicit-dependencies
const schema = {
    properties:{
        test: {
            parse: "function",
            type: "string"
        }
    },
    type: "object"
};

export default function(source:string, options: any):string {
    const htmlParse = options.parse;
    const isTextMode = /^\<\!--TemplateLoader=Text--\>/.test(source);
    let resultData = "";
    let fileName = this.resourcePath;

    validateOptions(schema, options);
    fileName = fileName.replace(/\\/g, "/");

    if(/\/src\/index\.html$/i.test(fileName) || isTextMode) {
        resultData = source;
    } else {
        resultData = typeof htmlParse === "function" ? htmlParse(source) : source;
        if(typeof htmlParse === "function") {
            resultData  = htmlParse(source);
        } else  {
            throw  new Error("No parse found");
        }
    }
    return `export default ${JSON.stringify(resultData)}`;
}
