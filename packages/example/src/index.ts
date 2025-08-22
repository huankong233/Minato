import { Minato } from '@huan_kong/minato'

const minato = new Minato(import.meta.dirname)
minato.load_config('default')
minato.load_plugin('example')
