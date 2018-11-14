const fs = require('fs');
const path = require('path');
const {promisify} = require('util');
const {spawn} = require('child_process');
const {exec} = require('child_process');
const execAsync = promisify(exec);
const fileExistsAsync = promisify(fs.exists);
const makeDirectoryAsync = promisify(fs.mkdir);
const {prompt} = require('enquirer');
const logUtil = require('./log-util');
const {onExit} = require('@rauschma/stringio');

module.exports = {
    async checkForInit(srcPath) {
        const packagePath = path.join(srcPath || process.cwd(), 'package.json');

        if (!await fileExistsAsync(packagePath)) {
            logUtil.error('package.json was not found');
            let {useYarn} = await prompt({
                name: 'useYarn',
                type: 'confirm',
                message: `Would you like use yarn for package management?`
            });
            if (!useYarn) return false;

            const hasYarnInit = await this.initializeYarn(srcPath);
            if (!hasYarnInit) {
                logUtil.error(`Unable to init yarn`);
                return false;
            }
        }
        logUtil.success(`Yarn is initialized`);
        return true;
    },

    async initializeYarn(srcPath) {
        try {
            const childProcess = spawn('yarn', ['init'], {
                stdio: [process.stdin, process.stdout, process.stderr],
                cwd: srcPath || process.cwd()
            });
            await onExit(childProcess);
            return true;
        } catch (e) {
            return false;
        }
    },

    async installPackages() {
        try {
            if (!await fileExistsAsync('node_modules')) await makeDirectoryAsync('node_modules');

            const command = `yarn`;
            await execAsync(command);

            return true;
        } catch (e) {
            return false;
        }
    },

    async addDevDependencies({srcPath, packageName}) {
        try {
            const command = `yarn add ${packageName} --dev --ignore-engines`;
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

    async checkForWorkspaceDependencies(srcPath) {
        const packageNames = [
            'serverless',
            '@kalarrs/serverless-domain-manager',
            '@kalarrs/serverless-shared-api-gateway',
            '@kalarrs/serverless-workspace-utils',
        ];
        const packageChecks = [];

        // Running in parallel causes intermittent errors during install. So do these sequentially.
        for (let packageName of packageNames) {
            if (!await this.checkForPackage({srcPath, packageName})) {
                logUtil.error(`Error: ${packageName} is not installed.`);
                const isInstalled = await this.addDevDependencies({srcPath, packageName});
                if (!isInstalled) {
                    packageChecks.push(false);
                    continue;
                }
            }
            logUtil.success(`Success: package ${packageName} is installed.`);
            packageChecks.push(true);
        }

        const hasAllPackages = packageChecks.every(i => i === true);

        if (hasAllPackages) logUtil.success(`Default node packages found in package.json`);
        else logUtil.success(`Default node packages are not all present in package.json`);

        return hasAllPackages;
    }
};