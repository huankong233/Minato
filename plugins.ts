import { loadPlugin, loadPluginDir } from '@/libs/loadPlugin.ts'

// 加载插件(存在依赖关系在里面)
export default async function () {
  // 初始化机器人
  if ((await loadPlugin('bot', 'builtInPlugins')) !== 'success') {
    throw new Error('机器人加载失败,请检查上方提示!')
  }

  await loadPluginDir('builtInPlugins')
  await loadPluginDir('plugins')
  // await loadPlugins(['pigeon', 'query'])
  // await loadPlugins(['searchImage', 'help'])
}
