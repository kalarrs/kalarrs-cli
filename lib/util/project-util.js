const {join} = require('path');
const {writeFile, exists} = require('fs');
const {prompt} = require('enquirer');
const logUtil = require('./log-util');
const {promisify} = require('util');
const writeFileAsync = promisify(writeFile);
const existsAsync = promisify(exists);

const tsconfig = require(join(__dirname, './tsconfig'));

module.exports = {
    projectName: async () => {
        let {projectName} = await prompt({
            name: 'projectName',
            type: 'input',
            message: 'What is the name of your project?'
        });

        // TODO : Could check to see folder exists in path
        // TODO : Could check for a valid folder name

        return projectName;
    },

    projectLanguage: async (multi = false) => {
        let {projectLanguage} = await prompt({
            name: 'projectLanguage',
            type: multi ? 'multiselect' : 'select',
            message: `${multi ? 'Which' : 'Pick a'} language`,
            choices: [
                {message: 'TypeScript', value: 'typescript'},
                {message: 'C#', value: 'csharp'},
                {message: 'Python', value: 'python'}
            ]
        });

        // TODO : Could check to see folder exists in path
        // TODO : Could check for a valid folder name

        return projectLanguage;
    },

    template: async (projectLanguage) => {
        switch (projectLanguage) {
            case 'typescript':
                let {template} = await prompt({
                    name: 'template',
                    type: 'select',
                    message: 'Pick a template',
                    choices: [
                        {message: 'empty', value: 'template'},
                        {message: 'api gateway (in-memory db)', value: 'basic-crud'},
                        {message: 'api gateway (mongodb)', value: 'mongo'},
                        {message: 'cloudwatch schedule (cron)', value: 'basic-event'},
                        {message: 'api gateway binary', value: 'binary'}
                    ]
                });

                return template;
            case 'c#':
            case 'python':
            default:
                logUtil.error(`No templates found for ${projectLanguage}`);
                throw new Error(`No templates found for ${projectLanguage}.`);

        }
    },

    async checkForTsconfig(srcPath) {
        const tsconfigPath = join(srcPath, 'tsconfig.json');
        if (!await existsAsync(tsconfigPath)) {
            await writeFileAsync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
        }
        logUtil.success(`tsconfig is present`);
        return true;
    }
};