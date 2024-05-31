import { User } from '@/plugins/builtInPlugins/database/Models/User.ts'
import { type Repository } from 'typeorm'

declare global {
  var isDev: boolean
  var baseDir: string
  var User: Repository<User>
}
