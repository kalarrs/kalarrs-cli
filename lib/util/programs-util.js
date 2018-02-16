const {promisify} = require('util');
const exec = require('child_process').exec;
const execAsync = promisify(exec);
const chalk = require('chalk');
const {prompt} = require('inquirer');
const logUtil = require('./log-util');

module.exports = {
    checkForHomebrewInstall() {
        return this.checkForDependency('Home Brew', 'brew --version', '/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"');
    },

    checkForYarnInstall() {
        return this.checkForDependency('Yarn', 'yarn --version', 'brew update && brew install yarn');
    },

    checkForServerlessInstall() {
        return this.checkForDependency('Serverless', 'sls --version', 'yarn global add serverless --ignore-engines');
    },

    checkForPythonInstall() {
        // TODO : Support python3
        return this.checkForDependency('Python', 'pip --version', 'brew update && brew install python', true, e => {
            if (e.stderr && /xcode-select/i.test(e.stderr)) {
                console.log(chalk.red('Xcode Developer tools are not installed'));
                console.log('We have executed', chalk.magenta('xcode-select --install'), 'for you. Install and tools and run the command again');

                execAsync('xcode-select --install');
            } else {
                return this.checkForDependency('Python', 'pip --version', 'brew update && brew install python');
            }

            return e.stderr;
        });
    },

    checkForAwsCliInstall() {
        return this.checkForDependency('aws-cli', 'aws --version', 'pip install awscli --upgrade --user', true, e => {
            if (e.stderr && !/aws-cli\/[\d]+\.[\d]+\.[\d]+/i.test(e.stderr)) {
                throw new Error(`Unable to run 'aws --version'. Error: ${e.stderr}`);
            }

            logUtil.success(`${name} installed`);
            return e.stderr;
        });
    },

    async checkForDependency(name, checkCommand, installCommand, attemptAutomaticInstall = true, customErrorHandler = null) {
        try {
            const commandResult = await execAsync(checkCommand);

            if (commandResult.stderr) throw commandResult;

            logUtil.success(`${name} installed`);
            return commandResult.stdout;

        } catch (e) {

            if (customErrorHandler !== null && typeof(customErrorHandler) === 'function') return customErrorHandler(e);

            if (attemptAutomaticInstall && /command not found/i.test(e.stderr)) {
                logUtil.error(`${name} not installed`);
                const answers = await prompt([{name: 'install', type: 'confirm', message: `Install ${name}?`}]);
                if (answers.install) {
                    console.log(`  Running ${chalk.blue(installCommand)}`);
                    await execAsync(installCommand);
                    return await this.checkForDependency(name, checkCommand, installCommand, false);
                }
            } else {
                throw new Error(`Unable to run ${checkCommand}. Error: ${e.stderr}`);
            }
        }
    },

    async checkNodeVersion(minMajorVersion) {
        let command = 'node --version';
        const {stdout} = await execAsync(command);

        const majorVersion = parseInt(stdout.slice(1, 2));
        if (majorVersion < minMajorVersion) {

            logUtil.error(`Node min version ${minMajorVersion}. Current ${stdout.trim()}`);

            console.log(`${chalk.red(`Please update node to ${minMajorVersion}.x`)}`);
            console.log('https://nodejs.org/en/download');

        } else {
            logUtil.success(`Node ${stdout.trim()} is installed`);
        }
    },

    async checkForAwsProfile() {
        let {profileName} = await prompt([{
            name: 'profile',
            message: 'What is the name of your aws profile?'
        }]);

        if (!profileName) {
            console.log('Skipping AWS Profile');
            return;
        }

        try {
            const {stdout} = await execAsync(`aws configure get aws_access_key_id --profile ${profileName}`);

            logUtil.success('AWS profile setup');
            return stdout;
        } catch (e) {
            if (/could not be found/i.test(e.stderr)) {
                logUtil.error('AWS profile not setup');
                let answers = await prompt([{
                    name: 'setup',
                    type: 'confirm',
                    message: `Setup ${profileName} AWS profile?`
                }]);
                if (answers.setup) {
                    let answers = await prompt([
                        {name: 'accessKey', type: 'input', message: 'AWS Access Key', validate: (i) => i.length > 0},
                        {name: 'secretKey', type: 'input', message: 'AWS Secret Key', validate: (i) => i.length > 0}
                    ]);

                    if (!(answers.accessKey && answers.secretKey)) {
                        console.log(`${chalk.red('You must provide both an access key and secret key')}`);
                        return;
                    }

                    let commands = [
                        `aws configure set aws_access_key_id --profile ${profileName} ${answers.accessKey}`,
                        `aws configure set aws_secret_access_key --profile ${profileName} ${answers.secretKey}`,
                        `aws configure set region --profile ${profileName} us-west-2`
                    ];

                    const {stdout} = await execAsync(commands.join(' && '));
                    logUtil.success(`${profileName} AWS profile setup`);

                    return stdout;
                }
            } else {
                throw new Error(`Unable to run ${checkCommand}. Error: ${e.stderr}`);
            }
        }
    }
};
