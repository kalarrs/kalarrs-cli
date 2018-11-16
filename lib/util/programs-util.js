const {exists} = require('fs');
const {promisify} = require('util');
const existsAsync = promisify(exists);
const {exec} = require('child_process');
const execAsync = promisify(exec);
const chalk = require('chalk');
const semver = require('semver');
const {prompt} = require('enquirer');
const logUtil = require('./log-util');
const os = require('os');

module.exports = {
    checkForHomebrewInstall() {
        return this.checkForDependency('Home Brew', 'brew --version', '/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"')
            .then(r => r.installed);
    },

    checkForYarnInstall() {
        let installCommand;
        switch (process.platform) {
            case 'darwin':
                installCommand = 'brew update && brew install yarn';
                break;
            case 'win32':
                // installCommand = 'choco install awscli';
                installCommand = 'rundll32 url.dll,FileProtocolHandler https://yarnpkg.com/en/docs/install#windows-stable';
                break;
            default:
                throw new Error("unsupported platform.");
        }

        return this.checkForDependency('Yarn', 'yarn --version', installCommand).then(r => r.installed);
    },

    checkForServerlessInstall() {
        return this.checkForDependency('Serverless', 'sls --version', 'yarn global add serverless --ignore-engines').then(r => r.installed);
    },

    async checkForPythonInstall() {
        const minVersion = 3.6;
        const {installed, stdout} = await this.checkForDependency('Python 3.6.+', 'pip3 --version', 'brew update && brew install python3', true, async e => {
            if (e.stderr && /xcode-select/i.test(e.stderr)) {
                console.log(chalk.red('Xcode Developer tools are not installed'));
                console.log('We have executed', chalk.magenta('xcode-select --install'), 'for you. Install and tools and run the command again');
                await execAsync('xcode-select --install');
            }
            return true;
        });

        if (installed) {
            const pythonVersion = stdout.replace(/.*?\(python\s(.*?)\)/, '$1').trim();
            if (parseFloat(pythonVersion) < minVersion) {
                logUtil.error(`Python min version ${minVersion}+. Current ${pythonVersion}`);
                console.log(`${chalk.red(`Please update python to ${minVersion}+`)}`);
                return false;
            }
            try {
                await execAsync(`cat ${os.homedir()}/.bash_profile | grep -i "Library/Python/${pythonVersion}/bin"`);
            } catch (e) {
                await execAsync(`echo "\nexport PATH=~/Library/Python/${pythonVersion}/bin:\\$PATH" >> ~/.bash_profile`);
                logUtil.warn(`Python ${pythonVersion} has been added to your path. Please restart your terminal session and rerun.`);
                process.exit();
            }
        }
        return installed;
    },

    async checkForDotNetCoreCliInstall() {
        let {csharpProjects} = await prompt({
            name: 'csharpProjects', type: 'confirm', message: 'Do you want to support c# projects?'
        });

        if (!csharpProjects) return false;

        let installCommand;
        switch (process.platform) {
            case 'darwin':
                installCommand = 'brew update && brew tap caskroom/cask && brew cask install dotnet';
                break;
            case 'win32':
                // installCommand = 'choco install dotnetcore-sdk';
                installCommand = 'rundll32 url.dll,FileProtocolHandler https://www.microsoft.com/net/learn/get-started-with-dotnet-tutorial';
                break;
            default:
                throw new Error("unsupported platform.");
        }
        return this.checkForDependency('.NET core CLI', 'dotnet --version', installCommand, true).then(r => r.installed);
    },

    checkForAwsCliInstall(hasPython3) {
        let installCommand;
        let errorHandler = e => {
            // AWS CLI returns aws-cli/1.11.190 Python/3.6.3 Darwin/17.3.0 botocore/1.7.48 for --version and it returns with exit code 1
            // AWS CLI returns aws-cli/1.15.82 Python/2.7.9 Windows/8 botocore/1.10.81 for --version and it returns with exit code 1
            // If the error string includes the aws-cli/x.x.x then we have the CLI otherwise we don't.
            // This checks for that aws-cli/x.x.x and says to attempt install if we don't
            return !!(e.stderr && (!/aws-cli\/[\d]+\.[\d]+\.[\d]+/i.test(e.stderr) || /command not found/i.test(e.stderr)));
        };
        switch (process.platform) {
            case 'darwin':
                if (!hasPython3) {
                    logUtil.warn('Skipping check for AWS CLI. Python3 is required to install AWS CLI.');
                    return null;
                }
                installCommand = 'pip3 install awscli --upgrade --user';
                break;
            case 'win32':
                // installCommand = 'choco install awscli';
                installCommand = 'rundll32 url.dll,FileProtocolHandler https://docs.aws.amazon.com/cli/latest/userguide/awscli-install-windows.html';
                break;
            default:
                throw new Error("unsupported platform.");
        }
        return this.checkForDependency('AWS CLI', 'aws --version', installCommand, true, errorHandler).then(r => r.installed);
    },

    sourceFile(path) {
        return execAsync(`source ${path}`);
    },

    async checkForDependency(name, checkCommand, installCommand, attemptAutomaticInstall = true, customErrorHandler = null, successMessage = 'installed') {
        try {
            if (await existsAsync(`${os.homedir()}/.bash_profile`)) await this.sourceFile('~/.bash_profile');

            const commandResult = await execAsync(checkCommand);
            if (commandResult.stderr) throw new Error(commandResult);

            logUtil.success(`${name} ${successMessage}`);
            return {
                installed: true,
                ...commandResult
            };
        } catch (e) {
            const hasCustomErrorHandler = typeof customErrorHandler === 'function';
            const shouldAttemptInstall = hasCustomErrorHandler
                ? customErrorHandler(e, name)
                : (/(command not found|is not recognized as an internal or external command)/i.test(e.stderr) || (/^gem list -i/i.test(e.cmd) && /false/i.test(e.stdout)));

            if (hasCustomErrorHandler && shouldAttemptInstall === false) {
                logUtil.success(`${name} ${successMessage}`);
                return {
                    installed: true
                };
            } else if (attemptAutomaticInstall && shouldAttemptInstall) {
                logUtil.error(`${name} not installed`);
                const {install} = await prompt({name: 'install', type: 'confirm', message: `Install ${name}?`});
                if (install) {
                    console.log(`  Running ${chalk.cyan(installCommand)}`);
                    await execAsync(installCommand, {maxBuffer: 1024 * 1024});

                    if (process.platform === 'win32' && !hasCustomErrorHandler) customErrorHandler = () => {
                        logUtil.warn("Please exit this terminal session, create a new terminal session, then re-run the command once you've installed the software");
                        process.exit(0);
                    };
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

    async checkNodeVersion(versionRange) {
        let command = 'node --version';
        const {stdout} = await execAsync(command);

        if (semver.satisfies('8.12.0', versionRange)) {
            logUtil.error(`Node min version ${minMajorVersion}. Current ${stdout.trim()}`);

            console.log(`${chalk.red(`Please update node to ${minMajorVersion}.x`)}`);
            console.log('Recommend running "brew install yarn"');
            return false;
        }

        logUtil.success(`Node ${stdout.trim()} is installed. Satisfies ${versionRange}`);
        return true;
    },

    async checkForAwsProfile(hasAwsCli) {
        if (!hasAwsCli) {
            logUtil.warn('Skipping AWS Profile Check. The AWS CLI is required to perform profile check.');
            return null;
        }

        let {profileName} = await prompt({
            name: 'profileName',
            type: 'input',
            message: 'What is the name of your AWS profile?'
        });

        if (!profileName) {
            logUtil.warn('Skipping AWS Profile Check');
            return null;
        }

        const {installed} = await this.checkForDependency('AWS profile', `aws configure get aws_access_key_id --profile ${profileName}`, null, false, async (e) => {
            if (/could not be found/i.test(e.stderr)) {
                logUtil.error('AWS profile not setup');
                let {setup} = await prompt({
                    name: 'setup',
                    type: 'confirm',
                    message: `Setup ${profileName} AWS profile?`
                });
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
        }, 'configured');
        return installed;
    }
};
