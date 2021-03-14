import htmlLoader from "./loader/HtmlLoader";
import tsLoader from "./loader/TPLoader";
// tslint:disable-next-line: no-implicit-dependencies
import { getOptions } from "loader-utils";


export default function(source: string):any {
    const options = getOptions();
    const fileName = this.resourcePath;
    if(/\.html/.test(fileName)) {
        return htmlLoader(source, options);
    } else {
        return tsLoader(source, options);
    }
}