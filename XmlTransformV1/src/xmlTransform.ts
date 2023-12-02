import tl from "azure-pipelines-task-lib/task.js";
import { promises } from "fs";
import { load } from "cheerio";
import { detectFile } from "chardet";
import { findPathItems } from "./utility.js";

interface IOverrideItem {
    selector: string,
    selectorRaw: string,
    attribute: string,
    index: number,
    value: string,
}

const isArrayPart = (text: string): boolean => (text.match(/^\[\d+\]$/) || "").length == 1;

const getSelector = (text: string): string => {
    return text.startsWith("[") && text.endsWith("]")
        ? text.substring(1, text.length - 1).trim()
        : text.replace(/\./g, " ").trim();
};

export const transformXml = (xml: string, overrideItems: IOverrideItem[]): string => {
    const $ = load(xml, { xmlMode: true, decodeEntities: false });
    for (const item of overrideItems) {
        const nodes = $(item.selector);
        if (nodes.length == 0) {
            tl.warning(`Selector not found: ${item.selectorRaw}`);
            continue;
        }

        const node = nodes[item.index];
        if (!node) {
            tl.warning(`Index out of range: ${item.selectorRaw}:[${item.index}]`);
            continue;
        }

        if (item.attribute) {
            $(node).attr(item.attribute, item.value);
        }
        else {
            $(node).text(item.value);
        }
    }

    return $.xml();
};

export const getOverrideItem = (text: string): IOverrideItem => {
    tl.debug(`Parsing override item: ${text}`);
    const parts1 = text.trim().split("=").map((item) => item.trim());
    if (parts1.length !== 2) {
        throw new Error(`Invalid override item: ${text}`);
    }

    const [key, value] = parts1;
    const overrideItem: IOverrideItem = { value: value, index: 0 } as IOverrideItem;

    const parts2 = key.split(":").map((item) => item.trim());
    if (parts2.length < 1 || parts2.length > 3) {
        throw new Error(`Invalid override item: ${text}`);
    }

    overrideItem.selector = getSelector(parts2[0]);
    overrideItem.selectorRaw = parts2[0];

    if (parts2.length == 2) {
        if (isArrayPart(parts2[1])) {
            overrideItem.index = parseInt(parts2[1].substring(1, parts2[1].length - 1));
        }
        else {
            overrideItem.attribute = parts2[1];
        }
    }
    else if (parts2.length == 3) {
        if (!isArrayPart(parts2[1])) {
            throw new Error(`Invalid override item: ${text}`);
        }
        overrideItem.index = parseInt(parts2[1].substring(1, parts2[1].length - 1));
        overrideItem.attribute = parts2[2];
    }

    tl.debug(`Parsed override item:\n${JSON.stringify(overrideItem)}`);
    return overrideItem;
};

export const transformFile = async (absolutePath: string, targetFiles: string[], overrideItems: IOverrideItem[]) => {
    if (!absolutePath || targetFiles.length == 0) {
        return;
    }

    var matchFiles = await findPathItems(targetFiles, { nodir: true, cwd: absolutePath });

    for (let file of matchFiles) {
        console.log("Transforming file: " + file);
        const encoding = await detectFile(file) as BufferEncoding;
        var fileContent = await promises.readFile(file, { encoding: encoding });

        fileContent = transformXml(fileContent, overrideItems);
        tl.debug("Transformed file content:\n" + fileContent);

        await promises.writeFile(file, fileContent, { encoding: encoding });
    }
}

