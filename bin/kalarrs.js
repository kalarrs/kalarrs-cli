#!/usr/bin/env node
'use strict';

const {version, description} = require('../package.json');
const program = require('commander');
const programUtil = require('../lib/util/programs-util');
const gitUtil = require('../lib/util/git-util');
const yarnUtil = require('../lib/util/yarn-util');
const serverlessUtil = require('../lib/util/serverless-util');

program
    .version(version)
    .description(description);

program
    .command('global <cmd>')
    .action(async (cmd) => {
        switch (cmd.toLowerCase()) {
            case 'serverless':
            case 'sls':
                if (!/^darwin/.test(process.platform)) throw 'This command can only be ran on OSX';

                await programUtil.checkNodeVersion(9);
                await programUtil.checkForHomebrewInstall();
                await programUtil.checkForYarnInstall();
                await programUtil.checkForServerlessInstall();
                await programUtil.checkForPythonInstall();
                const hasAwsCli = await programUtil.checkForAwsCliInstall();
                await programUtil.checkForAwsProfile(hasAwsCli);
                break;

            default:
                throw new Error(`Unrecognized global command ${cmd}`);
        }
    });

program
    .command('init')
    .option('-p, --path <path>', 'path to workspace')
    .description('init a @kalarrs serverless workspace')
    .action(async (path) => {
        const workspaceDir = path || process.cwd();

        await gitUtil.checkForInit();
        await gitUtil.checkIfWorkspaceFilesIgnored();

        //await webstormUtil.useES6(); // TODO : Add .idea/misc.xml which sets Javascript to ES6
        //await webstormUtil.addEditorConfig(); // TODO: Add .editorconfig

        await yarnUtil.checkForInit();
        await yarnUtil.checkForWorkspaceDependencies();
        await yarnUtil.installPackages();

        await serverlessUtil.checkForWorkspaceUserYaml(workspaceDir);
        await serverlessUtil.checkForWorkspaceDevEnvYaml(workspaceDir);
        await serverlessUtil.checkForWorkspaceServerlessYaml(workspaceDir);
    });

program.parse(process.argv);
