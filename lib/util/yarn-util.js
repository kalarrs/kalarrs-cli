const {exists, mkdir, writeFile} = require('fs');
const {join} = require('path');
const {promisify} = require('util');
const {spawn} = require('child_process');
const {exec} = require('child_process');
const execAsync = promisify(exec);
const existsAsync = promisify(exists);
const mkdirAsync = promisify(mkdir);
const writeFileAsync = promisify(writeFile);
const {prompt} = require('enquirer');
const logUtil = require('./log-util');
const {onExit} = require('@rauschma/stringio');

module.exports = {
    async checkForInit(srcPath) {
        const packagePath = join(srcPath || process.cwd(), 'package.json');

        if (!await existsAsync(packagePath)) {
            logUtil.error('package.json was not found');
            let {useYarn} = await prompt({
                name: 'useYarn',
                type: 'confirm',
                message: `Would you like use yarn for package management?`
            });
            if (!useYarn) return false;

            let {setPackageValues} = await prompt({
                name: 'setPackageValues',
                type: 'confirm',
                initial: 'false',
                message: `Would you like enter values manually?`
            });

            if (setPackageValues) logUtil.warn('Please answer the questions below for the package.json');
            const hasYarnInit = await this.initializeYarn(srcPath, !setPackageValues);
            if (!hasYarnInit) {
                logUtil.error(`Unable to init yarn`);
                return false;
            }
        }
        logUtil.success(`Yarn is initialized`);
        return true;
    },

    async initializeYarn(srcPath, useDefaults = false) {
        try {
            const childProcess = spawn('yarn', useDefaults ? ['init', '-y'] : ['init'], {
                stdio: [process.stdin, process.stdout, process.stderr],
                cwd: srcPath || process.cwd()
            });
            await onExit(childProcess);
            return true;
        } catch (e) {
            return false;
        }
    },

    async install(cwd) {
        try {
            if (!await existsAsync('node_modules')) await mkdirAsync('node_modules');

            const command = `yarn`;
            await execAsync(command, {
                cwd
            });

            return true;
        } catch (e) {
            return false;
        }
    },

    async add({srcPath, packageName, dev = false}) {
        try {
            const command = `yarn add ${packageName} ${dev ? '--dev' : ''} --ignore-engines`;
            await execAsync(command, {cwd: srcPath || process.cwd()});
            return true;
        } catch (e) {
            return false;
        }
    },

    async checkForPackage({srcPath, packageName}) {
        try {
            const command = `yarn list --depth=0 --pattern=${packageName}`;
            const {stdout} = await execAsync(command, {cwd: srcPath || process.cwd()});
            return stdout.toLowerCase().indexOf(packageName.toLowerCase()) > -1;
        } catch (e) {
            return false;
        }
    },

    async checkForWorkspaceDevDependencies(srcPath) {
        const packageNames = [
            'serverless',
            '@kalarrs/serverless-domain-manager',
            '@kalarrs/serverless-shared-api-gateway',
            '@kalarrs/serverless-workspace-utils',
        ];
        return this.installPackages(srcPath, packageNames, true);
    },

    async installPackages(srcPath, packageNames = [], dev = false) {
        const packageChecks = [];

        // Running in parallel causes intermittent errors during install. So do these sequentially.
        for (let packageName of packageNames) {
            if (!await this.checkForPackage({srcPath, packageName})) {
                logUtil.error(`Error: ${packageName} is not installed.`);
                const isInstalled = await this.add({srcPath, packageName, dev});
                if (!isInstalled) {
                    packageChecks.push(false);
                    continue;
                }
            }
            logUtil.success(`Success: package ${packageName} is installed.`);
            packageChecks.push(true);
        }

        const hasAllPackages = packageChecks.every(i => i === true);

        if (hasAllPackages) logUtil.success(`Installed "${dev ? 'devDependencies' : 'dependencies'}" into ${srcPath}/package.json\n\t${packageNames.join("\n\t")}`);
        else logUtil.success(`Typescript node packages are not all present in ${srcPath}/package.json`);

        return hasAllPackages;
    },

    savePackage(srcPath, data) {
        return writeFileAsync(join(srcPath, 'package.json'), JSON.stringify(data, null, 2));
    }
};