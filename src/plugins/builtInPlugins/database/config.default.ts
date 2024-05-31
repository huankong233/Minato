import { type DataSourceOptions } from 'typeorm'

export type DatabaseConfig = DataSourceOptions

export const config: DatabaseConfig = {
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: '',
  database: 'kkbot',
  timezone: 'Asia/Shanghai',
  synchronize: true
}
