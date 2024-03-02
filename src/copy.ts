import chalk from 'soyo/compiled/chalk'
import sortPackageJson from 'soyo/compiled/sort-package-json'
import { basename, join } from 'path'
import { existsSync } from 'fs'
import fsExtra from 'fs-extra'
import { IContext } from './interface'

/**
 * only for local development reference
 * @unused
 */
interface IPkgJson {
  // base info
  name?: string
  version?: string
  description?: string

  // scripts
  scripts?: Record<string, string>

  // entry point
  main?: string
  browser?: string
  exports?: string
  module?: string

  // types
  types?: string
  typings?: string

  // files
  files?: string[]

  // more info
  keywords?: string[]
  author?: string
  contributors?: string[]
  repository?: Record<string, string>
  homepage?: string
  bugs?: Record<string, string>

  // license
  license?: string

  // private
  private?: boolean

  // publishConfig
  publishConfig?: Record<string, string>

  // deps
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
  // bundledDependencies?: string[]

  // engines
  engines?: Record<string, string>

  // package manager
  packageManager?: string

  // bin
  bin?: Record<string, string>

  // other maybe exist fields
  napi?: Record<string, any>
  os?: string[]
  cpu?: string[]

  // import alias
  imports?: string
}

enum EField {
  name = 'name',
  version = 'version',
  description = 'description',

  // bin
  bin = 'bin',

  // more info
  homepage = 'homepage',
  author = 'author',
  repository = 'repository',
  keywords = 'keywords',
  contributors = 'contributors',
  bugs = 'bugs',

  // license
  license = 'license',

  // entry point
  main = 'main',
  browser = 'browser',
  exports = 'exports',
  module = 'module',

  // types
  types = 'types',
  typings = 'typings',

  // package manager
  packageManager = 'packageManager',

  // engines
  engines = 'engines',

  // publishConfig
  publishConfig = 'publishConfig',

  // deps
  dependencies = 'dependencies',
  devDependencies = 'devDependencies',
  peerDependencies = 'peerDependencies',
  optionalDependencies = 'optionalDependencies',

  // soyo config
  soyo = 'soyo',
  __soyo = '__soyo',

  // other maybe exist fields
  napi = 'napi',
  imports = 'imports',
  os = 'os',
  cpu = 'cpu',
}

interface ISoyoConfig {
  fields?: string[]
}

export const copy = async (opts: IContext) => {
  const { cwd, version: soyoVersion } = opts

  // check package.json
  const pkgPath = join(cwd, 'package.json')
  if (!existsSync(pkgPath)) {
    console.log(chalk.red('package.json not found'))
    throw new Error('package.json not found')
  }
  const pkg = require(pkgPath) as Record<string, any>

  const finalPkg: Record<string, any> = {}
  const setField = (
    field: string | string[],
    throwErrorWhenNotFound: boolean = false,
  ) => {
    if (Array.isArray(field)) {
      field.forEach((f) => {
        setField(f, throwErrorWhenNotFound)
      })
    } else {
      const originValue = pkg?.[field]
      if (originValue !== undefined) {
        debug(`set ${field} to ${JSON.stringify(originValue)}`)
        finalPkg[field] = originValue
      } else {
        if (throwErrorWhenNotFound) {
          console.log(
            `The package.json is missing required field: ${chalk.red(field)}`,
          )
          throw new Error(`Missing field: ${field}`)
        }
      }
    }
  }

  const REQUIRED_FIELDS: EField[] = [
    EField.name,
    EField.version,
    EField.description,
  ]
  const missingFields = REQUIRED_FIELDS.filter((field) => !pkg?.[field])
  if (missingFields?.length) {
    console.log(
      `The package.json is missing required fields: ${chalk.red(
        missingFields.join(', '),
      )}`,
    )
    throw new Error(`Missing fields`)
  }
  setField(REQUIRED_FIELDS)

  // recommmeded fields
  // 1. package more info
  const RECOMMEND_FIELDS_FOR_MORE_INFO: EField[] = [
    EField.homepage,
    EField.author,
    EField.repository,
    EField.keywords,
  ]
  const missingMoreInfoFields = RECOMMEND_FIELDS_FOR_MORE_INFO.filter(
    (field) => !pkg?.[field],
  )
  if (missingMoreInfoFields?.length) {
    console.log(
      `The package.json is missing recommended fields for more info: ${chalk.yellow(
        missingMoreInfoFields.join(', '),
      )}`,
    )
  }
  setField(RECOMMEND_FIELDS_FOR_MORE_INFO)
  const OPTIONAL_FIELDS_FOR_MORE_INFO: EField[] = [
    EField.contributors,
    EField.bugs,
  ]
  setField(OPTIONAL_FIELDS_FOR_MORE_INFO)

  // 2. license
  if (!pkg?.license) {
    console.log(
      `The package.json is missing recommended fields for license: ${chalk.yellow(
        EField.license,
      )}`,
    )
  }
  // check LICENSE file
  const licensePath = join(cwd, 'LICENSE')
  if (!existsSync(licensePath)) {
    console.log(chalk.yellow('LICENSE file not found'))
  }
  setField(EField.license)

  // 3. package manager
  const packageManager = pkg?.packageManager
  if (!packageManager) {
    console.log(
      `The package.json is missing recommended fields for packageManager: ${chalk.yellow(
        'packageManager',
      )}`,
    )
  }
  // not need keep packageManager

  // 4. should not contain fields other than `engines.node`
  if (pkg?.engines) {
    const otherEngines = Object.keys(pkg.engines).filter(
      (key) => key !== 'node',
    )
    if (otherEngines?.length) {
      console.log(
        `The package.json should not contain fields other than 'engines.node': ${chalk.yellow(
          otherEngines.join(', '),
        )}`,
      )
    }
  }
  setField(EField.engines)

  // 5. scope package should have `publishConfig.access`
  const isScopePackage = (pkg.name as string)?.startsWith('@')
  if (isScopePackage) {
    const isPublicAccess = pkg?.publishConfig?.access === 'public'
    if (!isPublicAccess) {
      console.log(
        `The scope package should have 'publishConfig.access': ${chalk.yellow(
          'public',
        )}`,
      )
      throw new Error('Scope package should have public access')
    }
  }
  setField(EField.publishConfig)

  // 6. check package entry
  const ENTRY_FIELDS: string[] = [
    EField.main,
    EField.browser,
    EField.exports,
    EField.module,
  ]
  const hasEntry = ENTRY_FIELDS.some((field) => pkg?.[field])
  if (!hasEntry) {
    console.log(
      `The package.json is missing entry fields: ${chalk.red(
        ENTRY_FIELDS.join(' or '),
      )}`,
    )
  }
  setField(ENTRY_FIELDS)

  // 7. check types
  const TYPES_FIELDS: string[] = [EField.types, EField.typings]
  const hasTypes = TYPES_FIELDS.some((field) => pkg?.[field])
  if (!hasTypes) {
    console.log(
      `The package.json is missing types fields: ${chalk.red(
        TYPES_FIELDS.join(' or '),
      )}`,
    )
  }
  setField(TYPES_FIELDS)

  // 8. copy dependencies
  const DEPS_FIELDS: string[] = [
    EField.dependencies,
    EField.devDependencies,
    EField.peerDependencies,
    EField.optionalDependencies,
  ]
  setField(DEPS_FIELDS)

  // 9. other copy fields
  const OTHER_COPY_FIELDS: string[] = [
    // bin
    EField.bin,
    // napi
    EField.napi,
    // import alias
    EField.imports,
    // for binary package
    EField.os,
    EField.cpu,
  ]
  setField(OTHER_COPY_FIELDS)

  // soyo config
  const soyoConfig = (pkg?.[EField.soyo] || {}) as ISoyoConfig
  // extra fields
  const extraFields = soyoConfig?.fields || []
  setField(extraFields, true)

  // set soyo infomation
  finalPkg[EField.__soyo] = soyoVersion

  // check dist folder
  const distPath = join(cwd, 'dist')
  if (!existsSync(distPath)) {
    console.log(`dist folder not found, please ${chalk.red('build')} first`)
    throw new Error('dist folder not found')
  }

  // mkdir publish folder
  const publishBaseDir = distPath
  const outputDir = join(publishBaseDir, 'dist')
  if (existsSync(outputDir)) {
    fsExtra.removeSync(outputDir)
  }
  const OUTDATED_FILES: string[] = ['package.json', 'readme.md', 'README.md']
  // check outdated files
  OUTDATED_FILES.forEach((file) => {
    const target = join(publishBaseDir, file)
    if (existsSync(target)) {
      console.log(
        `The 'dist' folder should not contain outdated file: ${chalk.red(
          file,
        )}, please remove 'dist' folder and try rebuild and copy`,
      )
      throw new Error('Outdated file found')
    }
  })
  // copy files to `dist/dist`
  const willCopyFiles = fsExtra.readdirSync(distPath).filter((file) => {
    return file !== 'dist' && file !== '.DS_Store'
  })
  willCopyFiles.forEach((file) => {
    const fromPath = join(distPath, file)
    const targetPath = join(outputDir, file)
    debug(`copy ${file} to 'dist/dist'`)
    fsExtra.moveSync(fromPath, targetPath)
  })

  const forceCopy = (file: string, target: string) => {
    if (existsSync(target)) {
      fsExtra.removeSync(target)
    }
    const filename = basename(file)
    debug(`copy ${filename}`)
    fsExtra.copySync(file, target)
  }

  // copy files
  // 1. write clean package.json
  const cleanPkgPath = join(publishBaseDir, 'package.json')
  fsExtra.writeFileSync(
    cleanPkgPath,
    sortPackageJson(JSON.stringify(finalPkg, null, 2)),
    'utf-8',
  )

  // 2. copy maybe exist files
  const MAYBE_EXIST_FILES: string[] = [
    // readme
    'readme.md',
    'README.md',
    // changelog
    'CHANGELOG.md',
    // license
    'LICENSE',
  ]
  MAYBE_EXIST_FILES.forEach((file) => {
    const fromPath = join(cwd, file)
    if (!existsSync(fromPath)) {
      return
    }
    const target = join(publishBaseDir, file)
    forceCopy(fromPath, target)
  })

  // 3. copy `files`
  const files = pkg?.files as string[] | undefined
  if (files?.length) {
    files.forEach((file) => {
      // skip dist
      const isDist = file === 'dist' || file === 'dist/'
      if (isDist) {
        debug(`skip dist folder`)
        return
      }
      const willCopyFile = join(cwd, file)
      if (existsSync(willCopyFile)) {
        const target = join(publishBaseDir, file)
        forceCopy(willCopyFile, target)
      } else {
        console.log(
          `The file or dir in 'files' not found: ${chalk.red(
            file,
          )}, please check`,
        )
        throw new Error('File not found')
      }
    })
  }

  // 4. copy `bin`
  if (finalPkg?.bin) {
    const fromPath = join(cwd, EField.bin)
    const targetPath = join(publishBaseDir, EField.bin)
    forceCopy(fromPath, targetPath)
  }

  // over
  console.log(chalk.green('Publish directory prepared'))
}

function debug(...args: any[]) {
  if (process.env.SOYO_DEBUG) {
    console.log(chalk.yellow.bold('DEBUG'), ...args)
  }
}
