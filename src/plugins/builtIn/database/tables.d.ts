declare module 'knex/types/tables.ts' {
  interface User {
    id: number
    user_id: string
    pigeon_num: number
    created_at: string
    updated_at: string
  }

  interface Tables {
    users: User
  }
}
