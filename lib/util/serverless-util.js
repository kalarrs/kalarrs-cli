const {exists, writeFile, mkdir, readFile} = require('fs');
const path = require('path');
const {promisify} = require('util');
const {exec} = require('child_process');
const execAsync = promisify(exec);
const existsAsync = promisify(exists);
const writeFileAsync = promisify(writeFile);
const mkdirAsync = promisify(mkdir);
const readFileAsync = promisify(readFile);
const {prompt} = require('enquirer');
const logUtil = require('./log-util');
const json2yaml = require('json2yaml');
const yamlToJson = require('js-yaml');
const serverlessUserFileName = 'serverless-user.yml';
const serverlessDevEnvFileName = 'dev.yml';
const serverlessConfigFileName = 'serverless.yml';

module.exports = {
    async checkForWorkspaceUserYaml(workspaceRoot) {
        if (await existsAsync(`${workspaceRoot}/${serverlessUserFileName}`)) {
            logUtil.success(`Workspace ${serverlessUserFileName}`);
            return true;
        }

        logUtil.error('Error: You do not have a ' + serverlessUserFileName + ' file.');

        let {create} = await
            prompt({
                name: 'create',
                type: 'confirm',
                message: 'Would you like to create a ' + serverlessUserFileName + ' file now? (y/n)'
            });

        if (!create) return false;

        let {user} = await
            prompt({
                name: 'user',
                type: 'input',
                message: `Please enter your username (first initial and last name e.g. 'ktopham')`
            });

        let data = {custom: {user}};
        await writeFileAsync(`${workspaceRoot}/${serverlessUserFileName}`, json2yaml.stringify(data));
        logUtil.success(`Workspace ${serverlessUserFileName}`);
        return true;
    },

    async checkForWorkspaceDevEnvYaml(workspaceRoot) {
        if (await existsAsync(`${workspaceRoot}/.env/${serverlessDevEnvFileName}`)) {
            logUtil.success(`Workspace .env/${serverlessDevEnvFileName}`);
            return true;
        }

        logUtil.error(`Error: You do not have your .env/${serverlessDevEnvFileName} file configured.`);

        let {create} = await
            prompt({
                name: 'create',
                type: 'confirm',
                message: 'Would you like to create a ' + serverlessDevEnvFileName + ' file now? (y/n)'
            });

        if (!create) return false;

        if (!await existsAsync(`${workspaceRoot}/.env`)) await mkdirAsync(`${workspaceRoot}/.env`);

        let data = {provider: {environment: {value: undefined}}};
        await writeFileAsync(`${workspaceRoot}/.env/${serverlessDevEnvFileName}`, json2yaml.stringify(data));
        logUtil.success(`Workspace .env/${serverlessDevEnvFileName}`);
        return true;
    },

    async checkForWorkspaceServerlessYaml(workspaceRoot) {
        if (await existsAsync(`${workspaceRoot}/${serverlessConfigFileName}`)) {
            logUtil.success(`Workspace ${serverlessConfigFileName}`);
            return true;
        }

        logUtil.error('Error: You do not a ' + serverlessConfigFileName + ' file.');

        let {create} = await
            prompt({
                name: 'create',
                type: 'confirm',
                message: 'Would you like to create a ' + serverlessConfigFileName + ' file now? (y/n)'
            });

        if (!create) return false;


        let serverlessYaml = await readFileAsync(path.join(__dirname, './serverless-workspace.yml'));
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
    },

    async create(templateUrl, projectName) {
        if (!(templateUrl && templateUrl.length)) throw new Error('You must provide a template url');
        if (!(projectName && projectName.length)) throw new Error('You must provide a project path');
        await execAsync(`sls create --template-url=${templateUrl} --path ${projectName}`)
    }
};