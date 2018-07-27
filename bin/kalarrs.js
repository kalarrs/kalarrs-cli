#!/usr/bin/env node
'use strict';

const {version, description} = require('../package.json');
const path = require('path');
const program = require('commander');
const programUtil = require('../lib/util/programs-util');
const gitUtil = require('../lib/util/git-util');
const yarnUtil = require('../lib/util/yarn-util');
const serverlessUtil = require('../lib/util/serverless-util');
const dotnetUtil = require('../lib/util/dotnet-util');

program
    .version(version)
    .description(description);

program
    .command('global <subCommand>')
    .action(async (subCommand) => {
        switch (subCommand.toLowerCase()) {
            case 'serverless':
            case 'sls':
                if (!/^darwin/.test(process.platform)) throw 'This command can only be ran on OSX';

                await programUtil.checkNodeVersion(9);
                await programUtil.checkForHomebrewInstall();
                await programUtil.checkForYarnInstall();
                await programUtil.checkForServerlessInstall();
                const hasPython = await programUtil.checkForPythonInstall();
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
    .option('-n, --name <workspaceName>', 'workspace name')
    .option('-l, --language <language>', 'language of project')
    .description('@kalarrs workspace commands')
    .action(async (subCommand, cmd) => {
        switch (subCommand.toLowerCase()) {
            case 'init':
                const workspacePath = cmd.path ? path.join(cmd.path.startsWith('/') ? '' : process.cwd(), cmd.path) : process.cwd();

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

                switch (cmd.language) {
                    case 'c#':
                    case 'csharp':
                        const workspaceFolderName = cmd.workspaceName || path.basename(workspacePath);
                        await dotnetUtil.checkForSolution({
                            srcPath: workspacePath,
                            solutionName: workspaceFolderName
                        });
                        break;
                }

                break;
            default:
                throw new Error(`Unrecognized workspace command ${cmd}`);
        }
    });


program
    .command('project <subCommand>')
    .option('--workspace-path <workspacePath>', 'path to workspace')
    .option('-p, --path <path>', 'path to project')
    .option('-n, --name <projectName>', 'project name')
    .option('-l, --language <language>', 'language of project')
    .description('@kalarrs project commands')
    .action(async (subCommand, cmd) => {
        let projectPath = cmd.path ? path.join(cmd.path.startsWith('/') ? '' : process.cwd(), cmd.path) : process.cwd();
        const workspacePath = cmd.workspacePath ? path.join(cmd.workspacePath.startsWith('/') ? '' : process.cwd(), cmd.workspacePath) : path.join('../', projectPath);

        switch (subCommand.toLowerCase()) {
            case 'create':
                if (typeof cmd.name !== 'string') throw new Error("You must supply a project name.");

                if (projectPath === workspacePath && cmd.name) projectPath = projectPath + '/' + cmd.name;
                const projectFolderName = path.basename(projectPath);
                if (projectFolderName !== cmd.name) throw new Error('project name and the path do not match.');
                const workspaceFolderName = path.basename(workspacePath);

                // TODO : Project commands :)
                // `dotnet new classlib -lang c# -f netcoreapp2.0 --name ${projectName}`
                // TODO : move to src folder...

                // TODO : make src, local, & test (Configurable?)

                // TODO : Link project to project solution
                // TODO : Link project to workspace solution

                switch (cmd.language) {
                    case 'c#':
                    case 'csharp':

                        await serverlessUtil.checkForProjectFolder(projectPath);

                        const hasWorkspaceSolution = await dotnetUtil.checkForSolution({
                            srcPath: workspacePath,
                            solutionName: workspaceFolderName
                        });

                        const hasProjectSolution = await dotnetUtil.checkForSolution({
                            srcPath: workspacePath,
                            solutionName: projectFolderName
                        });

                        break;
                    default:
                        throw new Error(`Unrecognized language ${cmd.language}`);
                }

                break;
            default:
                throw new Error(`Unrecognized workspace command ${cmd}`);
        }
    });


program.parse(process.argv);
