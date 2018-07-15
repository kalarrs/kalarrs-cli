const fs = require('fs');
const path = require('path');
const {promisify} = require('util');
const exec = require('child_process').exec;
const execAsync = promisify(exec);
const fileExistsAsync = promisify(fs.exists);
const makeDirectoryAsync = promisify(fs.mkdir);
const {prompt} = require('inquirer');
const logUtil = require('./log-util');

module.exports = {
    async checkForInit(srcPath) {
        const packagePath = path.join(srcPath || process.cwd(), 'package.json');

        if (!await fileExistsAsync(packagePath)) {
            logUtil.error('package.json was not found');
            let {useYarn} = await prompt([{
                name: 'useYarn',
                type: 'confirm',
                message: `Would you like use yarn for package management?`
            }]);
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
            const command = 'yarn init';
            const {stdout} = await execAsync(command, {cwd: srcPath || process.cwd()});
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

    async addDevDependencies(pkg) {
        try {
            const command = `yarn add ${pkg} --dev --ignore-engines`;
            await execAsync(command);
            return true;
        } catch (e) {
            return false;
        }
    },

    async checkForPackage(packageName) {
        try {
            const command = `yarn list --depth=0 --pattern=${packageName}`;
            const {stdout} = await execAsync(command);
            return stdout.toLowerCase().indexOf(packageName.toLowerCase()) > -1;
        } catch (e) {
            return false;
        }
    },

    checkForWorkspaceDependencies() {
        [
            '@kalarrs/serverless-domain-manager',
            '@kalarrs/serverless-shared-api-gateway',
            '@kalarrs/serverless-workspace-utils',
            'serverless',
        ].reduce(async (dep) => {
            if (!await this.checkForPackage(dep)) {
                logUtil.error(`Error: ${dep} is not installed.`);
                await this.addDevDependencies(dep);
            }
            logUtil.success(`Success: ${dep} is already installed.`);
        });
    }
};