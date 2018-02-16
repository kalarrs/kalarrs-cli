const chalk = require('chalk');

module.exports = {
    success(message) {
        console.log(`[${chalk.green(`✓`)}] ${chalk.green(message)}`);
    },

    error(message) {
        console.log(`[${chalk.red(`x`)}] ${chalk.red(message)}`);
    },

    result(bool, message) {
        if (bool) this.success(message);
        else this.error(message);
    }
};
