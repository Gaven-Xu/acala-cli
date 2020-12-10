const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const walkdir = require('walkdir');
const inquirer = require('inquirer'); // 暂停当前命令行，等待选择

const CHECKSUM_POS = 12;
const RESET_STATS_POS = 427;
const DEFAULT_SAVE_DIR = '/Applications/Diablo II/Save';

/**
 * @description chalk 重写样式化输出
 * @param {String} msg 
 * @returns {void}
 */
function _log(msg) {
  console.log(chalk.italic.cyan('[ACALA]'), msg)
}

/**
 * @description chalk 重写样式化输出 警告
 * @param {String} msg
 * @returns {void}
 */
_log.warn = function (msg) {
  console.log(chalk.italic.yellow('[ACALA][WARN]'), msg)
}

/**
 * @description chalk 重写样式化输出 报错
 * @param {String} msg
 * @returns {void}
 */
_log.error = function (msg) {
  console.log(chalk.italic.red('[ACALA][ERROR]'), msg)
}

/**
 * Calculate & write checksome to buffer.
 * @returns {Buffer} buffer
 */
async function selectD2sFile() {

  if (!fs.existsSync(DEFAULT_SAVE_DIR)) {

    // 未找到存档目录，退出
    _log.error(`Cannot find saves from "${DEFAULT_SAVE_DIR}"`);
    process.exit(0)

  } else {

    // 获取所有d2s存档文件
    const files = walkdir
      .sync(DEFAULT_SAVE_DIR)
      .filter(file => path.extname(file).toLowerCase() === '.d2s');

    // 找不到任何存档记录，退出
    if (!files || !files.length) {
      _log.error(`Cannot find any role in your game save dir "${DEFAULT_SAVE_DIR}"`)
      process.exit(0)
    }

    // 列出各存档文件，选择之后，存进result，作为处理的目标d2s文件
    const { result } = await inquirer.prompt([
      {
        type: 'list',
        message: 'Select your hero',
        name: 'result',
        choices: [
          ...files.map(file => ({
            name: path.basename(file).slice(0, path.basename(file).length - 4),
            value: file
          }))
        ]
      }
    ])

    _log(`your just chose ${result.name}`)

    return result

  }

}

module.exports.setChecksome = function (buffer) {
  buffer.writeUInt32BE(0, CHECKSUM_POS);
  let checksum = 0;
  for (let i = 0; i < buffer.length; i++) {
    checksum = (checksum << 1) + buffer.readUInt8(i) + Number(checksum < 0);
  }
  buffer.writeInt32LE(checksum, CHECKSUM_POS);
}

module.exports.resetStatsAndSkills = async function (filePath) {
  if (!filePath) {
    filePath = await selectD2sFile();
  }
  const buffer = fs.readFileSync(filePath);
  const isReset = buffer.readUInt8(RESET_STATS_POS) === 0x2;

  if (isReset) {
    _log(`No need to reset.`);
    _log.warn(`You can reset stats & skill points through Akara in normal Act 1.`);
    _log.warn(`Make sure you've completed the Den of Evil first.`);
    process.exit(0);
  } else {
    buffer.writeUInt8(0x2, RESET_STATS_POS);
    setChecksome(buffer);
    fs.writeFileSync(filePath, buffer);
    _log(`Done.`);
    _log.warn(`You can reset stats & skill points through Akara in normal Act 1.`);
    _log.warn(`Make sure you've completed the Den of Evil first.`);
  }
}
