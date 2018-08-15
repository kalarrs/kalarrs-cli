const fs = require('fs');
const path = require('path');
const {promisify} = require('util');
const {exec} = require('child_process');
const execAsync = promisify(exec);
const fileExistsAsync = promisify(fs.exists);
const mkdirAsync = promisify(fs.mkdir);
const chalk = require('chalk');
const {prompt} = require('inquirer');
const logUtil = require('./log-util');
const sshUtil = require('./ssh-util');
const os = require('os');

module.exports = {
    async checkForSolution({srcPath, solutionName}) {
        const solutionFilePath = `${srcPath}/${solutionName}.sln`;
        if (await fileExistsAsync(solutionFilePath)) {
            logUtil.success(`Solution ${srcPath} exists`);
            return true;
        }

        logUtil.error(`Error: You do not a solution file at ${solutionFilePath}`);

        let {create} = await
            prompt([{
                name: 'create',
                type: 'confirm',
                message: 'Would you like to create a solution file now? (y/n)'
            }]);

        if (!create) return false;

        const solutionCreated = await this.createSolution({srcPath, solutionName});
        if (solutionCreated) logUtil.success(`Solution ${solutionFilePath} created.`);
        else logUtil.error(`Error: Solution ${solutionFilePath} was not created.`);

        return solutionCreated;
    },

    async checkForProject({srcPath, projectName, type}) {
        const projectFilePath = `${srcPath}/${projectName}.csproj`;
        if (await fileExistsAsync(`${projectFilePath}`)) {
            logUtil.success(`Project ${srcPath} exists`);
            return true;
        }

        logUtil.error(`Error: You do not a cs project at ${projectFilePath}`);

        let {create} = await
            prompt([{
                name: 'create',
                type: 'confirm',
                message: 'Would you like to create the cs project now? (y/n)'
            }]);

        if (!create) return false;

        const projectCreated = await this.createProject({srcPath, projectName, type});
        if (projectCreated) logUtil.success(`Project ${projectFilePath} created.`);
        else logUtil.error(`Error: Project ${projectFilePath} was not created.`);

        return projectCreated;
    },

    async createSolution({srcPath, solutionName}) {
        try {
            const command = `dotnet new sln --name ${solutionName}`;
            console.log(`  Running ${chalk.cyan(command)}`);
            await execAsync(command, {cwd: srcPath || process.cwd()});
            return true;
        } catch (e) {
            return false;
        }
    },

    async createProject({srcPath, projectName, type}) {
        try {
            if (!await fileExistsAsync(srcPath)) await mkdirAsync(srcPath);
            const command = `dotnet new ${type} -lang c# -f netcoreapp2.0 --name ${projectName} -o ${srcPath || process.cwd()}`;
            console.log(`  Running ${chalk.cyan(command)}`);
            await execAsync(command, {cwd: srcPath || process.cwd()});
            return true;
        } catch (e) {
            console.log(e);
            return false;
        }
    },

    async addPackage(packageName) {
        try {
            const command = `dotnet add package ${packageName}`;
            console.log(`  Running ${chalk.cyan(command)}`);
            await execAsync(command, {cwd: srcPath || process.cwd()});
            return true;
        } catch (e) {
            console.log(e);
            return false;
        }
    }
};