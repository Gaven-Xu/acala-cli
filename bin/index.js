#!/usr/bin/env node

const chalk = require('chalk'); // 颜色处理
const program = require('commander'); // 快读定义命令行
const { resetStatsAndSkills } = require('../command/utils')
const pkg = require('../package.json'); // 读取package.json配置

program.version(pkg.version)
program.description(pkg.description)

// [file] 获取到的文件地址 会作为参数，传递给resetStatsAndSkills
program
  .command('reset [file]')
  .description('Reset stats & skills point')
  .action(resetStatsAndSkills)

program
  .command('hello')
  .description('test command')
  .action(() => {
    console.log(chalk.italic.cyan('\n', 'ACALA', pkg.version, '\n'))

  })

program.parse(process.argv);