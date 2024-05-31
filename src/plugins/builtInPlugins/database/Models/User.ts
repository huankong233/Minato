// @ts-nocheck

import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class User {
  @PrimaryGeneratedColumn('increment')
  id: number

  @Column('text')
  user_id: string

  @Column('double')
  pigeon_num: number

  @Column('datetime')
  created_at: string

  @Column('datetime')
  updated_at: string
}
