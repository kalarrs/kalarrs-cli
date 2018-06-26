const fs = require('fs');
const {promisify} = require('util');
const fileExistsAsync = promisify(fs.exists);
const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);
const readFileAsync = promisify(fs.readFile);
const {prompt} = require('inquirer');
const logUtil = require('./log-util');
const json2yaml = require('json2yaml');
const yamlToJson = require('js-yaml');
const serverlessUserFileName = 'serverless-user.yml';
const serverlessDevEnvFileName = 'dev.yml';
const serverlessFileName = 'serverless.yml';

module.exports = {
    async checkForWorkspaceUserYaml(workspaceRoot) {
        if (await fileExistsAsync(`${workspaceRoot}/${serverlessUserFileName}`)) {
            logUtil.success(`Workspace ${serverlessUserFileName}`);
            return;
        }

        logUtil.error('Error: You do not have a ' + serverlessUserFileName + ' file.');

        let {create} = await
            prompt([{
                name: 'create',
                type: 'confirm',
                message: 'Would you like to create a ' + serverlessUserFileName + ' file now? (y/n)'
            }]);

        if (create) {
            let {user} = await
                prompt([{
                    name: 'user',
                    type: 'input',
                    message: `Please enter your username (first initial and last name e.g. 'ktopham')`
                }]);

            let data = {custom: {user}};
            await writeFileAsync(`${workspaceRoot}/${serverlessUserFileName}`, json2yaml.stringify(data));
        }

    },

    async checkForWorkspaceDevEnvYaml(workspaceRoot) {
        if (!await fileExistsAsync(`${workspaceRoot}/.env`)) await mkdirAsync(`${workspaceRoot}/.env`);
        if (await fileExistsAsync(`${workspaceRoot}/.env/${serverlessDevEnvFileName}`)) {
            logUtil.success(`Workspace .env/${serverlessDevEnvFileName}`);
            return;
        }

        logUtil.error(`Error: You do not have your .env/${serverlessDevEnvFileName} file configured.`);

        let data = {provider: {environment: {value: undefined}}};
        await writeFileAsync(`${workspaceRoot}/.env/${serverlessDevEnvFileName}`, json2yaml.stringify(data));
    },

    async checkForWorkspaceServerlessYaml(workspaceRoot) {
        if (await fileExistsAsync(`${workspaceRoot}/${serverlessFileName}`)) {
            logUtil.success(`Workspace ${serverlessFileName}`);
            return;
        }

        logUtil.error('Error: You do not a ' + serverlessFileName + ' file.');

        let serverlessYaml = await readFileAsync('./serverless-workspace.yml');
        let data = yamlToJson.safeLoad(serverlessYaml);

        let {create} = await
            prompt([{
                name: 'create',
                type: 'confirm',
                message: 'Would you like to create a ' + serverlessFileName + ' file now? (y/n)'
            }]);

        if (create) {
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

            await writeFileAsync(`${workspaceRoot}/${serverlessFileName}`, json2yaml.stringify(data));
        }
    }
};