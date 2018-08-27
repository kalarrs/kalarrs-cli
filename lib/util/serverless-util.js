const fs = require('fs');
const path = require('path');
const {promisify} = require('util');
const fileExistsAsync = promisify(fs.exists);
const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);
const readFileAsync = promisify(fs.readFile);
const os = require('os');
const {prompt} = require('inquirer');
const logUtil = require('./log-util');
const json2yaml = require('json2yaml');
const yamlToJson = require('js-yaml');
const serverlessUserFileName = 'serverless-user.yml';
const serverlessDevEnvFileName = 'dev.yml';
const serverlessConfigFileName = 'serverless.yml';
const PromptList = require('prompt-list');

module.exports = {
    promptForStage() {
        return new PromptList({
            name: 'stage',
            message: 'Which stage would you like to use?',
            default: 0,
            choices: ['dev', 'prod']
        }).run();
    },

    async requireServerlessPath() {
        const cwd = process.cwd();
        const projectPath = path.join(cwd, 'node_modules', 'serverless');
        const workspacePath = path.join(cwd, '../node_modules', 'serverless');
        const globalPath = path.join(os.homedir(), 'node_modules', 'serverless');

        if (await fileExistsAsync(projectPath)) return projectPath;
        else if (await fileExistsAsync(workspacePath)) return workspacePath;
        else if (await fileExistsAsync(globalPath)) return globalPath;

        throw new Error("Unable to find serverless. Did you forget to run yarn?");
    },

    async checkForWorkspaceUserYaml(workspaceRoot) {
        if (await fileExistsAsync(`${workspaceRoot}/${serverlessUserFileName}`)) {
            logUtil.success(`Workspace ${serverlessUserFileName}`);
            return true;
        }

        logUtil.error('Error: You do not have a ' + serverlessUserFileName + ' file.');

        let {create} = await
            prompt([{
                name: 'create',
                type: 'confirm',
                message: 'Would you like to create a ' + serverlessUserFileName + ' file now? (y/n)'
            }]);

        if (!create) return false;

        let {user} = await
            prompt([{
                name: 'user',
                type: 'input',
                message: `Please enter your username (first initial and last name e.g. 'ktopham')`
            }]);

        let data = {custom: {user}};
        await writeFileAsync(`${workspaceRoot}/${serverlessUserFileName}`, json2yaml.stringify(data));
        logUtil.success(`Workspace ${serverlessUserFileName}`);
        return true;
    },

    async checkForWorkspaceDevEnvYaml(workspaceRoot) {
        if (await fileExistsAsync(`${workspaceRoot}/.env/${serverlessDevEnvFileName}`)) {
            logUtil.success(`Workspace .env/${serverlessDevEnvFileName}`);
            return true;
        }

        logUtil.error(`Error: You do not have your .env/${serverlessDevEnvFileName} file configured.`);

        let {create} = await
            prompt([{
                name: 'create',
                type: 'confirm',
                message: 'Would you like to create a ' + serverlessDevEnvFileName + ' file now? (y/n)'
            }]);

        if (!create) return false;

        if (!await fileExistsAsync(`${workspaceRoot}/.env`)) await mkdirAsync(`${workspaceRoot}/.env`);

        let data = {provider: {environment: {value: undefined}}};
        await writeFileAsync(`${workspaceRoot}/.env/${serverlessDevEnvFileName}`, json2yaml.stringify(data));
        logUtil.success(`Workspace .env/${serverlessDevEnvFileName}`);
        return true;
    },

    async checkForWorkspaceServerlessYaml(workspaceRoot) {
        if (await fileExistsAsync(`${workspaceRoot}/${serverlessConfigFileName}`)) {
            logUtil.success(`Workspace ${serverlessConfigFileName}`);
            return true;
        }

        logUtil.error('Error: You do not a ' + serverlessConfigFileName + ' file.');

        let {create} = await
            prompt([{
                name: 'create',
                type: 'confirm',
                message: 'Would you like to create a ' + serverlessConfigFileName + ' file now? (y/n)'
            }]);

        if (!create) return false;


        let serverlessYaml = await readFileAsync(path.join(__dirname,'./serverless-workspace.yml'));
        let data = yamlToJson.safeLoad(serverlessYaml);

        let {api, profile} = await
            prompt([{
                name: 'api',
                type: 'input',
                message: `Please enter the name of your api`,
                default: 'api'
            }, {
                name: 'profile',
                type: 'input',
                message: `Please enter the name of your aws profile`,
                default: 'default'
            }]);
        data.provider.apiGatewayRestApiName = api + "-${self:provider.stage}";
        data.provider.profile = profile;

        await writeFileAsync(`${workspaceRoot}/${serverlessConfigFileName}`, json2yaml.stringify(data));
        logUtil.success(`Workspace ${serverlessConfigFileName}`);
        return true;
    }
};