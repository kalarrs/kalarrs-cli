const {promisify} = require('util');
const exec = require('child_process').exec;
const execAsync = promisify(exec);
const fileExistsAsync = promisify(fs.exists);
const makeDirectoryAsync = promisify(fs.mkdir);

module.exports = {
    async installPackages() {
        try {
            if (!await fileExistsAsync('node_modules')) await makeDirectoryAsync('node_modules');

            const command = `yarn`;
            await execAsync(command);

            return true;
        } catch (e) {
            return false;
        }
    },

    async checkForPackage(packageName) {
        try {
            const command = `yarn list --depth=0 --pattern=${packageName}`;
            const {stdout} = await execAsync(command);
            return stdout.toLowerCase().indexOf(packageName.toLowerCase()) > -1;
        } catch (e) {
            return false;
        }
    }
};