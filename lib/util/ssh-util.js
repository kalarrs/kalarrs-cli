const {promisify} = require('util');
const {exec} = require('child_process');
const execAsync = promisify(exec);
const os = require('os');

module.exports = {
    async generateRsaKey({fileName, size, user}) {
        if (!(fileName && size && user)) throw new Error('You must provide a fileName, size and user when invoking hyUtil.generateRsaKey');
        await execAsync(`ssh-keygen -t rsa -b ${size} -C "${user}" -f ${os.homedir()}/.ssh/${fileName}`)
    },
    async readRsaKey(fileName) {
        const {stdout} = await execAsync(`cat ${os.homedir()}/.ssh/${fileName}.pub`);
        return stdout;
    }
};