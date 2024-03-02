import { execa } from 'soyo/compiled/execa'
import chalk from 'soyo/compiled/chalk'
import { IContext, IPkgSimple } from './interface'
import { join } from 'path'
import { existsSync } from 'fs'
import fsExtra from 'fs-extra'
import { copy } from './copy'

export const build = async (opts: IContext) => {
  const { cwd } = opts
  // remove dist
  console.log(chalk.blue(`Removing dist directory`))
  const distPath = join(cwd, 'dist')
  if (existsSync(distPath)) {
    await fsExtra.remove(distPath)
  }

  const pkgPath = join(cwd, 'package.json')
  const pkg = require(pkgPath) as IPkgSimple
  if (!pkg?.scripts?.build) {
    throw new Error('No build script found in package.json')
  }

  // run build
  console.log(chalk.cyan(`Running build script...`))
  const result = await execa('npm', ['run', 'build'], {
    cwd,
    stdio: 'inherit',
  })
  if (result.exitCode !== 0) {
    console.log(chalk.red(`Failed to build`))
    return
  }

  // run copy
  console.log(chalk.magenta(`Copy files to prepare the 'dist' directory`))
  await copy(opts)
}
