interface knexConfig {
  client: 'mysql2'
  connection: {
    host: string
    port: number
    user: string
    password: string
    database: string
  }
  debug: boolean
}
