const {prompt} = require('enquirer');
const logUtil = require('./log-util');

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

    projectLanguage: async () => {
        let {projectLanguage} = await prompt({
            name: 'projectLanguage',
            type: 'select',
            message: 'Pick a language',
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
                        {message: 'crud (in memory)', value: 'basic-crud'},
                        {message: 'crud (mongodb)', value: 'mongo'},
                        {message: 'cron (CloudWatch schedule)', value: 'basic-event'},
                        {message: 'binary api', value: 'binary'}
                    ]
                });

                return template;
            case 'c#':
            case 'python':
            default:
                logUtil.error(`Unable to init git`);
                throw new Error(`No templates found for ${projectLanguage}.`);

        }
    }
};