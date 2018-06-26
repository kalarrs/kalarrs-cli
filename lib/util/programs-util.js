const fs = require('fs');
const {promisify} = require('util');
const fileExistsAsync = promisify(fs.exists);
const exec = require('child_process').exec;
const execAsync = promisify(exec);
const chalk = require('chalk');
const semver = require('semver');
const {prompt} = require('inquirer');
const logUtil = require('./log-util');
const os = require('os');

module.exports = {
    checkForHomebrewInstall() {
        return this.checkForDependency('Home Brew', 'brew --version', '/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"')
            .then(r => r.installed);
    },

    checkForYarnInstall() {
        return this.checkForDependency('Yarn', 'yarn --version', 'brew update && brew install yarn').then(r => r.installed);
    },

    checkForServerlessInstall() {
        return this.checkForDependency('Serverless', 'sls --version', 'yarn global add serverless --ignore-engines').then(r => r.installed);
    },

    async checkForPythonInstall() {
        const {installed} = await this.checkForDependency('Python', 'pip3 --version', 'brew update && brew install python3', true, async e => {
            if (e.stderr && /xcode-select/i.test(e.stderr)) {
                console.log(chalk.red('Xcode Developer tools are not installed'));
                console.log('We have executed', chalk.magenta('xcode-select --install'), 'for you. Install and tools and run the command again');
                await execAsync('xcode-select --install');
            }
            return true;
        });

        if (installed) {
            try {
                await execAsync(`cat ${os.homedir()}/.bash_profile | grep -i "Library/Python/3.6/bin"`);
            } catch (e) {
                await execAsync('echo "export PATH=$PATH:~/Library/Python/3.6/bin" >> ~/.bash_profile');
            }
        }
        return installed;
    },

    checkForAwsCliInstall() {
        return this.checkForDependency('aws-cli', 'aws --version', 'pip3 install awscli --upgrade --user', true, e => {
            // AWS CLI returns aws-cli/1.11.190 Python/3.6.3 Darwin/17.3.0 botocore/1.7.48 for --version and it returns with exit code 1
            // If the error string includes the aws-cli/x.x.x then we have the CLI otherwise we don't.
            // This checks for that aws-cli/x.x.x and says to attempt install if we don't
            return !!(e.stderr && (!/aws-cli\/[\d]+\.[\d]+\.[\d]+/i.test(e.stderr) || /command not found/i.test(e.stderr)));
        }).then(r => r.installed);
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
            return {
                installed: true,
                ...commandResult
            };
        } catch (e) {
            const hasCustomErrorHandler = typeof customErrorHandler === 'function';
            const shouldAttemptInstall = hasCustomErrorHandler
                ? customErrorHandler(e, name)
                : (/command not found/i.test(e.stderr) || (/^gem list -i/i.test(e.cmd) && /false/i.test(e.stdout)));

            if (attemptAutomaticInstall && shouldAttemptInstall) {
                logUtil.error(`${name} not installed`);
                const {install} = await prompt([{name: 'install', type: 'confirm', message: `Install ${name}?`}]);
                if (install) {
                    console.log(`  Running ${chalk.cyan(installCommand)}`);
                    await execAsync(installCommand, {maxBuffer: 1024 * 1024});
                    return await this.checkForDependency(name, checkCommand, installCommand, false, customErrorHandler);
                }
            } else if (!hasCustomErrorHandler) {
                throw new Error(`Unable to run ${checkCommand}. Error: ${e.stderr}`);
            }

            return {
                installed: false,
            };
        }
    },

    async checkNodeVersion(minMajorVersion) {
        let command = 'node --version';
        const {stdout} = await execAsync(command);

        const majorVersion = semver.major(stdout);
        if (majorVersion < minMajorVersion) {
            logUtil.error(`Node min version ${minMajorVersion}. Current ${stdout.trim()}`);

            console.log(`${chalk.red(`Please update node to ${minMajorVersion}.x`)}`);
            console.log('Recommend running "brew install yarn"');
            return false;
        }

        logUtil.success(`Node ${stdout.trim()} is installed`);
        return true;
    },

    async checkForAwsProfile(hasAwsCli) {
        if (!hasAwsCli) {
            logUtil.warn('Skipping AWS profile check.');
            return null;
        }

        let {profileName} = await prompt([{
            name: 'profileName',
            message: 'What is the name of your aws profile?'
        }]);

        if (!profileName) {
            logUtil.warn('Skipping AWS Profile Check');
            return null;
        }

        const {installed} = await this.checkForDependency('aws profile', `aws configure get aws_access_key_id --profile ${profileName}`, null, false, async (e) => {
            console.log("CUSTOM", e);

            if (/could not be found/i.test(e.stderr)) {
                logUtil.error('AWS profile not setup');
                let {setup} = await prompt([{
                    name: 'setup',
                    type: 'confirm',
                    message: `Setup ${profileName} AWS profile?`
                }]);
                if (setup) {
                    let {accessKey, secretKey} = await prompt([
                        {name: 'accessKey', type: 'input', message: 'AWS Access Key', validate: (i) => i.length > 0},
                        {name: 'secretKey', type: 'input', message: 'AWS Secret Key', validate: (i) => i.length > 0}
                    ]);

                    if (!(accessKey && secretKey)) {
                        console.log(`${chalk.red('You must provide both an access key and secret key')}`);
                        return;
                    }

                    let commands = [
                        `aws configure set aws_access_key_id --profile ${profileName} ${accessKey}`,
                        `aws configure set aws_secret_access_key --profile ${profileName} ${secretKey}`,
                        `aws configure set region --profile ${profileName} us-west-2`
                    ];

                    const {stdout} = await execAsync(commands.join(' && '));
                    logUtil.success(`${profileName} AWS profile setup`);

                    return stdout;
                }
            }
        });
        return installed;
    }
};
