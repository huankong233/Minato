/**
 * 判断是否是机器人的好友
 * @param user_id 用户id
 */
export const isFriend = async (context: { user_id: number }) => bot.get_friend_list().then((res) => res.find((value) => value.user_id === context.user_id))

/**
 * 获取用户名
 * @param user_id 用户id
 */
export const getUserName = async (context: { user_id: number } | { user_id: number; group_id: number }) => {
  if ('group_id' in context) {
    return bot
      .get_group_member_info({
        group_id: context.group_id,
        user_id: context.user_id,
      })
      .then((res) => res.nickname)
  } else {
    return bot.get_stranger_info({ user_id: context.user_id }).then((res) => (res.remark !== '' ? res.remark : res.nickname !== '' ? res.nickname : '获取失败'))
  }
}
