#!/usr/bin/env node
'use strict';

const {version, description} = require('../package.json');
const program = require('commander');
const programUtil = require('../lib/util/hy-sls-util');

program
    .version(version)
    .description(description);

program
    .command('global <cmd>')
    .action(async (cmd) => {
        switch (cmd.toLowerCase()) {
            case 'sls':
                if (!/^darwin/.test(process.platform)) throw 'This command can only be ran on OSX';

                await programUtil.checkNodeVersion(9);

                await programUtil.checkForHomebrewInstall();
                await programUtil.checkForYarnInstall();
                await programUtil.checkForServerlessInstall();
                await programUtil.checkForPythonInstall();
                await programUtil.checkForAwsCliInstall();

                await programUtil.checkForAwsProfile();

                break;

            default:
                throw new Error(`Unrecognized global command ${cmd}`);
        }
    });

program
    .command('sls')
    .option('-p, --path <path>', 'path to solution')
    .description('Config setting up a serverless solution')
    .action(async () => {
        throw new Error("NOT IMPLEMENTED!");
    });

program.parse(process.argv);
