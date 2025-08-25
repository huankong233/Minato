import type { MessageHandler, NoticeHandler, RequestHandler } from 'node-napcat-ts'

// prettier-ignore
export type Param =
  | { type: 'string'; default?: string }
  | { type: 'enum'; enum: string[]; default?: string }
  | { type: 'int'; default?: string }
  | { type: 'float'; default?: string }

// prettier-ignore
type ParamToType<T extends Param> =
  T extends { type: 'string' } ? string :
  T extends { type: 'int' } ? number :
  T extends { type: 'float' } ? number :
  T extends { type: 'enum'; enum: infer E } ? E : never;

// prettier-ignore
type ParamsToTuple<T extends Param[]> = {
  [K in keyof T]: T[K] extends Param ? ParamToType<T[K]> : never;
};

export type CallbackReturnType = Promise<void | 'quit'> | void | 'quit'

export interface CommandEvent<T extends keyof MessageHandler = 'message', K extends Param[] = []> {
  type: 'command'
  end_point?: T
  callback: (context: MessageHandler[T], params: ParamsToTuple<K>) => CallbackReturnType
  plugin_name: string
  command_name: string | RegExp
  description: string
  params?: K
  priority?: number
  hide?: boolean
  needReply?: boolean
}

export interface MessageEvent<T extends keyof MessageHandler = 'message'> {
  type: 'message'
  end_point?: T
  callback: (context: MessageHandler[T]) => CallbackReturnType
  plugin_name: string
  priority?: number
  needReply?: boolean
}

export interface NoticeEvent<T extends keyof NoticeHandler = 'notice'> {
  type: 'notice'
  end_point?: T
  callback: (context: NoticeHandler[T]) => CallbackReturnType
  plugin_name: string
  priority?: number
}

export interface RequestEvent<T extends keyof RequestHandler = 'request'> {
  type: 'request'
  end_point?: T
  callback: (context: RequestHandler[T]) => CallbackReturnType
  plugin_name: string
  priority?: number
}

export type RemoveField<T, KToRemove extends keyof T> = {
  [K in keyof T as K extends KToRemove ? never : K]: T[K]
}

export type RegEventOptions = CommandEvent | MessageEvent | NoticeEvent | RequestEvent
export type RegEventOptionsWithoutPluginName = RemoveField<RegEventOptions, 'plugin_name'>

export const define_message_event = <T extends keyof MessageHandler>(options: RemoveField<MessageEvent<T>, 'plugin_name' | 'type'>) =>
  ({ ...options, type: 'message' }) as unknown as RegEventOptionsWithoutPluginName

export const define_request_event = <T extends keyof RequestHandler>(options: RemoveField<RequestEvent<T>, 'plugin_name' | 'type'>) =>
  ({ ...options, type: 'request' }) as unknown as RegEventOptionsWithoutPluginName

export const define_notice_event = <T extends keyof NoticeHandler>(options: RemoveField<NoticeEvent<T>, 'plugin_name' | 'type'>) =>
  ({ ...options, type: 'notice' }) as unknown as RegEventOptionsWithoutPluginName

export const define_command_event = <T extends keyof MessageHandler, const K extends Param[]>(options: RemoveField<CommandEvent<T, K>, 'plugin_name' | 'type'>) =>
  ({ ...options, type: 'command' }) as unknown as RegEventOptionsWithoutPluginName
