const {promisify} = require('util');
const exec = require('child_process').exec;
const execAsync = promisify(exec);
const chalk = require('chalk');
const semver = require('semver');
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

    async checkForPythonInstall() {
        await this.checkForDependency('Python', 'pip3 --version', 'brew update && brew install python3', true, async e => {
            if (e.stderr && /xcode-select/i.test(e.stderr)) {
                console.log(chalk.red('Xcode Developer tools are not installed'));
                console.log('We have executed', chalk.magenta('xcode-select --install'), 'for you. Install and tools and run the command again');
                await execAsync('xcode-select --install');
            }
            return true;
        });

        try {
            await execAsync(`cat ${os.homedir()}/.bash_profile | grep -i "Library/Python/3.6/bin"`);
        } catch (e) {
            await execAsync('echo "export PATH=$PATH:~/Library/Python/3.6/bin" >> ~/.bash_profile');
        }
    },

    checkForAwsCliInstall() {
        return this.checkForDependency('aws-cli', 'aws --version', 'pip3 install awscli --upgrade --user', true, e => {
            // AWS CLI returns aws-cli/1.11.190 Python/3.6.3 Darwin/17.3.0 botocore/1.7.48 for --version and it returns with exit code 1
            // If the error string includes the aws-cli/x.x.x then we have the CLI otherwise we don't.
            // This checks for that aws-cli/x.x.x and says to attempt install if we don't
            return !!(e.stderr && (!/aws-cli\/[\d]+\.[\d]+\.[\d]+/i.test(e.stderr) || /command not found/i.test(e.stderr)));
        });
    },

    sourceFile(path) {
        return execAsync(`source ${path}`);
    },

    async checkForDependency(name, checkCommand, installCommand, attemptAutomaticInstall = true, customErrorHandler = null) {
        try {
            if (await fileExistsAsync(`${os.homedir()}/.bash_profile`)) await this.sourceFile('~/.bash_profile');

            const commandResult = await execAsync(checkCommand);
            if (commandResult.stderr) throw commandResult;

            logUtil.success(`${name} installed`);
            return commandResult.stdout;

        } catch (e) {

            const hasCustomErrorHandler = customErrorHandler !== null && typeof(customErrorHandler) === 'function';
            const shouldAttemptInstall = hasCustomErrorHandler
                ? customErrorHandler(e, name)
                : (/command not found/i.test(e.stderr) || (/^gem list -i/i.test(e.cmd) && /false/i.test(e.stdout)));

            if (attemptAutomaticInstall && shouldAttemptInstall) {
                logUtil.error(`${name} not installed`);
                const answers = await prompt([{name: 'install', type: 'confirm', message: `Install ${name}?`}]);
                if (answers.install) {
                    console.log(`  Running ${chalk.cyan(installCommand)}`);
                    await execAsync(installCommand, {maxBuffer: 1024 * 1024});
                    return await this.checkForDependency(name, checkCommand, installCommand, false, customErrorHandler);
                }
            } else if (!hasCustomErrorHandler) {
                throw new Error(`Unable to run ${checkCommand}. Error: ${e.stderr}`);
            }
        }
    },

    async checkNodeVersion(minMajorVersion) {
        let command = 'node --version';
        const {stdout} = await execAsync(command);

        const majorVersion = semver.major(stdout);
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
