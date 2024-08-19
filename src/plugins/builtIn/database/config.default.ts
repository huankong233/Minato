import { type Knex } from 'knex'

export type DatabaseConfig = Knex.Config

export const config: DatabaseConfig = {
  client: 'mysql2',
  connection: {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'kkbot',
    timezone: '+08:00'
  },
  debug: false
}
