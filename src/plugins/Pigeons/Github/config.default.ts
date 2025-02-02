export interface GithubConfig {
  groups: number[]
  secret: string
}

export const config: GithubConfig = {
  groups: [],
  secret: 'key',
}
