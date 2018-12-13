#!/usr/bin/env node
'use strict';

const {version, description} = require('../package.json');
const {join} = require('path');
const program = require('commander');
const programUtil = require('../lib/util/programs-util');
const gitUtil = require('../lib/util/git-util');
const yarnUtil = require('../lib/util/yarn-util');
const serverlessUtil = require('../lib/util/serverless-util');
const projectUtil = require('../lib/util/project-util');

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
                const workspacePath = cmd.path ? join(process.cwd(), cmd.path) : process.cwd();

                const hasGit = await gitUtil.checkForInit(workspacePath);
                if (hasGit) await gitUtil.checkIfWorkspaceFilesIgnored(workspacePath);

                //await webstormUtil.useES6(); // TODO : Add .idea/misc.xml which sets Javascript to ES6
                //await webstormUtil.addEditorConfig(); // TODO: Add .editorconfig

                const hasYarn = await yarnUtil.checkForInit(workspacePath);
                if (hasYarn) await yarnUtil.compareAndInstallPackages(workspacePath, yarnUtil.workspaceDevDependencies, true);

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
        // WOOT
        // https://stackoverflow.com/questions/42480949/what-do-the-curly-braces-do-in-switch-statement-after-case-in-es6
        switch (subCommand.toLowerCase()) {
            case 'new':
            case 'create': {
                /*
                    Configure .idea for ts
                    Configure .idea for project folders :)
                */

                const workspacePath = cmd.path ? join(process.cwd(), cmd.path) : process.cwd();
                const projectName = await projectUtil.projectName();
                const projectPath = join(workspacePath, projectName);
                const projectLanguage = await projectUtil.projectLanguage();
                const template = await projectUtil.template(projectLanguage);
                const templateUrl = `https://github.com/kalarrs/serverless-template-${projectLanguage}/tree/master/aws/${template}`;
                await serverlessUtil.create(templateUrl, projectName);

                const projectPackage = require(join(projectPath, 'package.json'));
                const {dependencies, devDependencies} = projectPackage;

                // Install dependencies and devDependencies into workspace, use layers to deploy dependencies to aws
                if (dependencies) await yarnUtil.compareAndInstallPackages(workspacePath, Object.keys(dependencies));
                if (devDependencies) await yarnUtil.compareAndInstallPackages(workspacePath, Object.keys(devDependencies), true);

                // Remove dependencies and devDependencies from project
                await yarnUtil.savePackage(projectPath, {
                    ...projectPackage,
                    dependencies: undefined,
                    devDependencies: undefined
                });

                const hasYarn = await yarnUtil.checkForInit(projectPath);
                if (hasYarn) await yarnUtil.install(projectPath);

                //await webstormUtil.autoCompileTypeScript(); // TODO : Add .idea/misc.xml which sets TypeScript to autocompile
                //await webstormUtil.configureProjectSourceFolders(); // TODO: Configure .idea/ to set sourceRoot on project dir and project/src dir

                break;
            }
            case 'init': {
                const projectPath = cmd.path ? join(process.cwd(), cmd.path) : process.cwd();
                const workspacePath = join(projectPath, '../');
                // TODO : Autodetect and fallback to asking if not detected.
                const projectLanguage = await projectUtil.projectLanguage();

                const projectPackage = require(join(projectPath, 'package.json'));
                const {dependencies, devDependencies} = projectPackage;

                // Install dependencies and devDependencies into workspace, use layers to deploy dependencies to aws
                if (dependencies) await yarnUtil.compareAndInstallPackages(workspacePath, Object.keys(dependencies));
                if (devDependencies) await yarnUtil.compareAndInstallPackages(workspacePath, Object.keys(devDependencies), true);

                // Remove dependencies and devDependencies from project
                await yarnUtil.savePackage(projectPath, {
                    ...projectPackage,
                    dependencies: undefined,
                    devDependencies: undefined
                });

                const hasYarn = await yarnUtil.checkForInit(projectPath);
                if (hasYarn) await yarnUtil.install(projectPath);

                //await webstormUtil.autoCompileTypeScript(); // TODO : Add .idea/misc.xml which sets TypeScript to autocompile
                //await webstormUtil.configureProjectSourceFolders(); // TODO: Configure .idea/ to set sourceRoot on project dir and project/src dir

                break;
            }
            default:
                throw new Error(`Unrecognized project command ${cmd}`);
        }
    });

program.parse(process.argv);
