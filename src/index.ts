import { program } from 'commander'
import { join } from 'path'
import { copy } from './copy'
import { IContext, IPkgSimple } from './interface'
import { build } from './build'

export const main = async () => {
  const { name, description, version } = require(join(
    __dirname,
    '../package.json',
  )) as IPkgSimple
  const cwd = process.cwd()

  const context: IContext = {
    cwd,
    version,
  }

  program
    .command('copy')
    .description('Copy files to dist to prepare the publish directory')
    .alias('c')
    .action(() => {
      copy(context)
    })

  program
    .command('build')
    .description(
      'Run build script and copy files to dist to prepare the publish directory',
    )
    .alias('b')
    .action(() => {
      build(context)
    })

  program.name(name).description(description)
  program.version(version)
  program.parse(process.argv)
}
