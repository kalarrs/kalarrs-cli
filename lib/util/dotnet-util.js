const fs = require('fs');
const path = require('path');
const {promisify} = require('util');
const {exec} = require('child_process');
const execAsync = promisify(exec);
const fileExistsAsync = promisify(fs.exists);
const chalk = require('chalk');
const {prompt} = require('inquirer');
const logUtil = require('./log-util');
const sshUtil = require('./ssh-util');
const os = require('os');

module.exports = {
    async checkForSolution({srcPath, solutionName}) {
        if (await fileExistsAsync(`${srcPath}/${solutionName}.sln`)) {
            logUtil.success(`Solution ${srcPath} exists`);
            return true;
        }

        logUtil.error(`Error: You do not a solution file at ${srcPath}/${solutionName}.sln`);

        let {create} = await
            prompt([{
                name: 'create',
                type: 'confirm',
                message: 'Would you like to create a solution file now? (y/n)'
            }]);

        if (!create) return false;

        const solutionCreated = await this.createSolution({srcPath, solutionName});
        if (solutionCreated) logUtil.success(`Solution ${srcPath}/${solutionName}.sln created.`);
        else logUtil.error(`Error: Solution ${srcPath}/${solutionName}.sln was not created.`);

        return solutionCreated;
    },

    async createSolution({srcPath, solutionName}) {
        try {
            const command = `dotnet new sln --name ${solutionName}`;
            await execAsync(command, {cwd: srcPath || process.cwd()});
            return true;
        } catch (e) {
            return false;
        }
    }
};