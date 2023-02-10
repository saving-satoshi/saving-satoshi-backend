import { Request } from 'express'

export interface Account {
  id: number
  code: string
  avatar: string
}

export interface RequestWithToken extends Request {
  token: string
  account?: Account
}
