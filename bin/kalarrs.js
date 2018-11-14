#!/usr/bin/env node
'use strict';

const {version, description} = require('../package.json');
const path = require('path');
const program = require('commander');
const programUtil = require('../lib/util/programs-util');
const gitUtil = require('../lib/util/git-util');
const yarnUtil = require('../lib/util/yarn-util');
const serverlessUtil = require('../lib/util/serverless-util');

program
    .version(version)
    .description(description);

program
    .command('global <subCommand>')
    .action(async (subCommand) => {
        switch (subCommand.toLowerCase()) {
            case 'serverless':
            case 'sls':
                await programUtil.checkNodeVersion(8.10);
                if (process.platform === 'darwin') await programUtil.checkForHomebrewInstall();
                await programUtil.checkForYarnInstall();
                await programUtil.checkForServerlessInstall();
                await programUtil.checkForDotNetCoreCliInstall();
                const hasPython = process.platform === 'darwin' ? await programUtil.checkForPythonInstall() : null;
                const hasAwsCli = await programUtil.checkForAwsCliInstall(hasPython);
                await programUtil.checkForAwsProfile(hasAwsCli);
                break;

            default:
                throw new Error(`Unrecognized global command ${subCommand}`);
        }
    });

program
    .command('workspace <subCommand>')
    .option('-p, --path <path>', 'path to workspace')
    .description('init a @kalarrs serverless workspace')
    .action(async (subCommand, cmd) => {
        switch (subCommand.toLowerCase()) {
            case 'init':
                const workspacePath = cmd.path ? path.join(process.cwd(), cmd.path) : process.cwd();

                const hasGit = await gitUtil.checkForInit(workspacePath);
                if (hasGit) await gitUtil.checkIfWorkspaceFilesIgnored(workspacePath);

                //await webstormUtil.useES6(); // TODO : Add .idea/misc.xml which sets Javascript to ES6
                //await webstormUtil.addEditorConfig(); // TODO: Add .editorconfig

                const hasYarn = await yarnUtil.checkForInit(workspacePath);
                if (hasYarn) await yarnUtil.checkForWorkspaceDependencies(workspacePath);
                if (hasYarn) await yarnUtil.installPackages();

                await serverlessUtil.checkForWorkspaceUserYaml(workspacePath);
                await serverlessUtil.checkForWorkspaceDevEnvYaml(workspacePath);
                await serverlessUtil.checkForWorkspaceServerlessYaml(workspacePath);
                break;
            default:
                throw new Error(`Unrecognized workspace command ${cmd}`);
        }
    });

program
    .command('project <subCommand>')
    .option('-p, --path <path>', 'path to workspace')
    .description('create a @kalarrs serverless project from a template')
    .action(async (subCommand, cmd) => {
        switch (subCommand.toLowerCase()) {
            case 'new':

                /* TODO: Creating a project
                    Input project name.
                    Choose template type.
                    Choose template (hard coded list for now. Later can read from github.)
                    Clone using sls cli.
                    Check workspace for typescript in workspace if cloning from 'typescript' if not install latest typescript
                    Yarn install after cloning
                    Configure .idea for ts
                    Configure .idea for project folders :)
                */

                const workspacePath = cmd.path ? path.join(process.cwd(), cmd.path) : process.cwd();
                const projectPath = path.join(workspacePath, 'foo');

                const hasYarn = await yarnUtil.checkForInit(workspacePath);
                if (hasYarn) await yarnUtil.installPackages();

                break;
            default:
                throw new Error(`Unrecognized project command ${cmd}`);
        }
    });

program.parse(process.argv);
