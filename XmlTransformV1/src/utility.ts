import { GlobOptionsWithFileTypesUnset, glob } from "glob";
import { createWriteStream } from 'fs';
import archiver from 'archiver';
import { Open } from 'unzipper';

export const findPathItems = async (pattern: string[], options?: GlobOptionsWithFileTypesUnset) => {
    if (options?.cwd) {
        console.log(`Searching items matching ${pattern} in the ${options.cwd} directory.`);
    }
    else {
        console.log(`Searching items matching ${pattern}.`);
    }

    const items = await glob(pattern, { absolute: true, windowsPathsNoEscape: true, ...options, });

    if (!items || items.length == 0) {
        console.log(`No matching items were found.`);
        return [];
    }
    else if (items.length == 1) {
        console.log(`Found 1 item: ${items[0]}`);
    }
    else {
        console.log(`Found ${items.length} items:\n${items.join("\n")}`);
    }

    return items;
};

export const zip = async (folderPath: string, targetFilePath: string): Promise<void> => {
    console.log(`Archiving package ${folderPath} to ${targetFilePath} file.`);
    const output = createWriteStream(targetFilePath);
    const archive = archiver('zip', { store: true });
    archive.pipe(output);
    archive.directory(folderPath, false);
    await archive.finalize();
};

export const unzip = async (zipFileLocation: string, unzipDirLocation: string): Promise<void> => {
    console.log(`Extracting package ${zipFileLocation} to ${unzipDirLocation} directory.`);
    const file = await Open.file(zipFileLocation);
    await file.extract({ path: unzipDirLocation });
};