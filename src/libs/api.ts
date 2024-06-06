/**
 * 判断是否是机器人的好友
 * @param user_id 用户id
 */
export const isFriend = async (user_id: number) =>
  bot.get_friend_list().then((res) => res.find((value) => value.user_id === user_id))

/**
 * 获取用户名
 * @param user_id 用户id
 */
export const getUserName = async (user_id: number) =>
  bot.get_stranger_info({ user_id }).then((res) => res.nickname)
