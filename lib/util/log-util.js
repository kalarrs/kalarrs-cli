const chalk = require('chalk');

const checkMark = process.platform === 'win32' ? 'Y' : '✓';

module.exports = {
    success(message) {
        console.log(`[${chalk.green(checkMark)}] ${chalk.green(message)}`);
    },

    warn(message) {
        console.log(chalk.yellow(`[Warn] ${message}`))
    },

    error(message) {
        console.log(`[${chalk.red(`x`)}] ${chalk.red(message)}`);
    },

    result(bool, message) {
        if (bool) this.success(message);
        else this.error(message);
    }
};
