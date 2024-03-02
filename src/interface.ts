export interface IContext {
  cwd: string
  version: string
}

export interface IPkgSimple {
  name: string
  description: string
  version: string
  scripts: Record<string, string>
}
