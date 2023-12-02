import tl from "azure-pipelines-task-lib/task.js";
import { basename, extname, join } from 'path';
import { v4 as uuidv4 } from "uuid";
import { transformFile, getOverrideItem } from './xmlTransform.js';
import { findPathItems, unzip, zip } from "./utility.js";

const getParameters = () => {
    const tempDirectory = tl.getVariable('Agent.TempDirectory') || "";
    if (!tempDirectory) {
        throw new Error('Agent.TempDirectory is not set');
    }

    const folderPath: string = tl.getInputRequired('folderPath');
    const targetFiles: string[] = (tl.getDelimitedInput('targetFiles', '\n', true) || []).map(x => x.trim());
    const overrides: string[] = (tl.getDelimitedInput('overrides', '\n', true) || []).map(x => x.trim());

    return {
        tempDirectory,
        folderPath,
        targetFiles,
        overrides
    };
};

const run = async () => {
    try {
        const params = getParameters();

        const packageFiles = await findPathItems([params.folderPath]);
        if (packageFiles.length == 0) {
            throw new Error(`No package found with search pattern: ${params.folderPath}`);
        }
        else if (packageFiles.length > 1) {
            throw new Error(`Multiple packages found with search pattern: ${params.folderPath}\n${packageFiles.join("\n")}`);
        }

        for (const packageFile of packageFiles) {
            const overrideItems = params.overrides.map(getOverrideItem);
            const isFolderBasedDeployment = tl.stats(packageFile).isDirectory();
            if (!isFolderBasedDeployment) {
                const fileName = basename(packageFile, extname(packageFile));
                const tempPackagePath = join(params.tempDirectory, uuidv4(), fileName);

                await unzip(packageFile, tempPackagePath);
                await transformFile(tempPackagePath, params.targetFiles, overrideItems);
                await zip(tempPackagePath, packageFile);
            }
            else {
                await transformFile(packageFile, params.targetFiles, overrideItems);
            }
        }
    }
    catch (err: any) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
};

run();