const fs = require('fs');
const {promisify} = require('util');
const {exec} = require('child_process');
const execAsync = promisify(exec);
const fileExistsAsync = promisify(fs.exists);
const chalk = require('chalk');
const {prompt} = require('inquirer');
const logUtil = require('./log-util');
const os = require('os');

module.exports = {
    async checkForInit() {
        if (!await fileExistsAsync('.git')) await this.initializeGitRepository();
    },

    async checkIfWorkspaceFilesIgnored() {
        if (!await this.checkIfIgnored('.serverless')) await this.addToIgnore('.serverless');
        if (!await this.checkIfIgnored('serverless-user.yml')) await this.addToIgnore('serverless-user.yml');
        if (!await this.checkIfIgnored('node_modules/')) await this.addToIgnore('node_modules/');
    },

    async initializeGitRepository() {
        try {
            const command = 'git init';
            await execAsync(command);
            return true;
        } catch (e) {
            return false;
        }
    },

    async checkIfIgnored(pattern) {
        try {
            const command = `git check-ignore ${pattern}`;
            await execAsync(command);
            return true;
        } catch (e) {
            return false;
        }
    },

    async addToIgnore(pattern) {
        try {
            const command = `printf "${pattern}\n" >> .gitignore`;
            await execAsync(command);
            return true;
        } catch (e) {
            return false;
        }
    },

    async checkForSshConfig(autoSetup = true) {

        try {
            const command = 'ssh -T git@github.com';
            const {stdout} = await execAsync(command);

            logUtil.success('Git Hub SSH setup');

            return stdout;
        } catch (e) {

            // SSH command seems to always return an error
            if (/successfully authenticated/i.test(e.stderr)) {
                logUtil.success('Git Hub SSH setup');
            } else {
                logUtil.error('Git Hub SSH not setup');
                if (autoSetup) {
                    let {setup} = await prompt([{
                        name: 'setup',
                        type: 'confirm',
                        message: 'Setup Git Hub SSH?'
                    }]);

                    if (setup) {
                        await this.useRsaKeyWithGitHub('id_rsa');
                        return await this.checkForSshConfig(false);
                    }
                }
            }
        }
    },

    async useRsaKeyWithGitHub(fileName) {
        let useExistingRsaKey = null;
        let hasExistingRsaKey = await fileExistsAsync(`${os.homedir()}/.ssh/${fileName}.pub`);

        if (hasExistingRsaKey) {
            let {useExisting} = await prompt([{
                name: 'useExisting',
                type: 'confirm',
                message: 'You already have an RSA key. Do you want to use it for Git Hub?'
            }]);
            useExistingRsaKey = useExisting;
        }

        if (hasExistingRsaKey && !useExistingRsaKey) return false;

        let {githubUser, githubPass} = await prompt([
            {
                name: 'githubUser',
                type: 'input',
                message: 'Git Hub Username (email)',
                validate: (i) => i.length > 0
            },
            {
                name: 'githubPass',
                type: 'password',
                message: 'Git Hub Password',
                validate: (i) => i.length > 0
            }
        ]);

        if (!(githubUser && githubPass)) {
            console.log(`${chalk.red('Please answer all prompts')}`);
            return false;
        }

        try {
            if (!hasExistingRsaKey) await rsaUtil.generateRsaKey({
                size: 4096,
                user: githubUser,
                fileName: fileName
            });
            const rsaKeyContent = await rsaUtil.readRsaKey(fileName);

            if (!rsaKeyContent) {
                console.log(`${chalk.red('Could not create RSA key. You will have to setup GitHub SSH manually. https://help.github.com/articles/adding-a-new-ssh-key-to-your-github-account')}`);
                return false;
            }

            await this.registerRsaKeyWithGitHub({
                user: githubUser,
                pass: githubPass,
                key: rsaKeyContent
            });
            return true;

        } catch (err) {
            throw new Error(`Unable to setup GitHub SSH. Error: ${err.stderr || err}`);
        }
    },

    async registerRsaKeyWithGitHub({user, pass, key}) {

        let {keyName} = await prompt([
            {
                name: 'keyName',
                type: 'input',
                message: 'Git Hub SSH Key Name',
                default: `Kalarrs-CLI-Generated-${os.hostname().replace('.local', '')}`,
                validate: (i) => i.length > 0
            }
        ]);

        if (!keyName) {
            console.log(`${chalk.red('Please answer all prompts')}`);
            return false;
        }

        let payload = {
            title: keyName,
            key: key
        };

        const {stdout} = await execAsync(`curl -u "${user}:${pass}" --data '${JSON.stringify(payload)}' https://api.github.com/user/keys`);
        const gitHubResponse = JSON.parse(stdout);

        if (!gitHubResponse.id && gitHubResponse.message) {

            switch (gitHubResponse.message.toLowerCase()) {
                case 'key is already in use':
                    // Do Nothing. We want to act like the registration was successful! Yay!
                    break;

                case 'bad credentials':
                    throw 'Bad Username/Password for GitHub';

                default:
                    throw 'Could not add RSA key to GitHub. You will have to do that manually https://help.github.com/articles/adding-a-new-ssh-key-to-your-github-account';
            }
        }
    }
};
