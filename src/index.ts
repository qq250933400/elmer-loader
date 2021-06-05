import htmlLoader from "./loader/HtmlLoader";
import tsLoader from "./loader/TPLoader";
// tslint:disable-next-line: no-implicit-dependencies
import { getOptions } from "loader-utils";


export default function(source: string):any {
    const options = getOptions(this);
    const fileName = this.resourcePath;
    if(/\.html/.test(fileName)) {
        return htmlLoader.call(this, source, options);
    } else {
        return tsLoader.call(this, source, options);
    }
}