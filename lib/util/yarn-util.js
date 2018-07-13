const fs = require('fs');
const {promisify} = require('util');
const exec = require('child_process').exec;
const execAsync = promisify(exec);
const fileExistsAsync = promisify(fs.exists);
const makeDirectoryAsync = promisify(fs.mkdir);
const logUtil = require('./log-util');

module.exports = {
    async checkForInit() {
        if (!await fileExistsAsync('package.json')) await this.initializeYarn();
    },

    async initializeYarn() {
        try {
            const command = 'yarn init';
            await execAsync(command);
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
                await addDevDependencies(dep);
            }
            logUtil.success(`Success: ${dep} is already installed.`);
        });
    }
};