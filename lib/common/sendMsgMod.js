import _ from "lodash"

export default class {

  /**
   * 发送转发消息
   * @async
   * @param {object} e - 发送消息的目标对象
   * @param {Array<any[]>} message - 发送的消息数组，数组每一项为转发消息的一条消息
   * @param {object} [options] - 发送消息的配置项
   * @param {number} [options.recallMsg] - 撤回时间，单位秒，默认为0表示不撤回
   * @param {{nickname: string, user_id: number}} [options.info] - 转发发送人信息 nickname-转发人昵称 user_id-转发人QQ
   * @param {string | Array} [options.fkmsg] - 风控消息，不传则默认消息
   * @param {boolean} [options.isxml] - 处理卡片
   * @param {boolean} [options.xmlTitle] - XML 标题
   * @param {boolean} [options.oneMsg] - 用于只有一条消息，不用再转成二维数组
   * @param {boolean} [options.shouldSendMsg] - 是否直接发送消息，true为直接发送，否则返回需要发送的消息
   * @returns {Promise<import("icqq").MessageRet|import("icqq").XmlElem|import("icqq").JsonElem>} 消息发送结果的Promise对象
   */
  async getforwardMsg(e, message, {
    recallMsg = 0,
    info,
    fkmsg,
    isxml,
    xmlTitle,
    oneMsg,
    shouldSendMsg = true
  } = {}) {
    let forwardMsg = []
    if (_.isEmpty(message)) throw new ReplyError("[Yenai-Plugin][sendforwardMsg][Error]发送的转发消息不能为空")
    let add = (msg) => forwardMsg.push(
      {
        message: msg,
        nickname: info?.nickname ?? (e.bot ?? Bot).nickname,
        user_id: info?.user_id ?? (e.bot ?? Bot).uin
      }
    )
    oneMsg ? add(message) : message.forEach(item => add(item))
    // 发送
    if (e.isGroup) {
      forwardMsg = await e.group.makeForwardMsg(forwardMsg)
    } else {
      forwardMsg = await e.friend.makeForwardMsg(forwardMsg)
    }

    if (isxml && typeof (forwardMsg.data) !== "object") {
      // 处理转发卡片
      forwardMsg.data = forwardMsg.data.replace("<?xml version=\"1.0\" encoding=\"utf-8\"?>\", \"<?xml version=\"1.0\" encoding=\"utf-8\" ?>")
    }

    if (xmlTitle) {
      if (typeof (forwardMsg.data) === "object") {
        let detail = forwardMsg.data?.meta?.detail
        if (detail) {
          detail.news = [ { text: xmlTitle } ]
        }
      } else {
        forwardMsg.data = forwardMsg.data
          .replace(/\n/g, "")
          .replace(/<title color="#777777" size="26">(.+?)<\/title>/g, "___")
          .replace(/___+/, `<title color="#777777" size="26">${xmlTitle}</title>`)
      }
    }
    if (shouldSendMsg) {
      let msgRes = await this.reply(e, forwardMsg, false, {
        fkmsg,
        recallMsg
      })
      return msgRes
    } else {
      return forwardMsg
    }
  }

  /**
   * 发送消息
   * @async
   * @param {*} e oicq 事件对象
   * @param {Array | string} msg 消息内容
   * @param {boolean} quote 是否引用回复
   * @param {object} data 其他参数
   * @param {number} data.recallMsg 撤回时间
   * @param {boolean} data.fkmsg 风控消息
   * @param {boolean | number} data.at 是否艾特该成员
   * @returns {Promise<import("icqq").MessageRet>} 返回发送消息后的结果对象
   */
  async reply(e, msg, quote, {
    recallMsg = 0,
    fkmsg = "",
    at = false
  } = {}) {
    if (at && e.isGroup) {
      let text = ""
      if (e?.sender?.card) {
        text = _.truncate(e.sender.card, { length: 10 })
      }
      if (at === true) {
        at = Number(e.user_id)
      } else if (!isNaN(at)) {
        let info = e.group.pickMember(at).info
        text = info?.card ?? info?.nickname
        text = _.truncate(text, { length: 10 })
      }

      if (Array.isArray(msg)) {
        msg = [ segment.at(at, text), ...msg ]
      } else {
        msg = [ segment.at(at, text), msg ]
      }
    }

    let msgRes = null
    // 发送消息
    if (e.isGroup) {
      msgRes = await e.group.sendMsg(msg, quote ? e : undefined)
    } else {
      msgRes = await e.reply(msg, quote)
      if (!msgRes) await e.reply(fkmsg || "消息发送失败，可能被风控")
    }
    if (recallMsg > 0 && msgRes?.message_id) {
      if (e.isGroup) {
        setTimeout(() => e.group.recallMsg(msgRes.message_id), recallMsg * 1000)
      } else if (e.friend) {
        setTimeout(() => e.friend.recallMsg(msgRes.message_id), recallMsg * 1000)
      }
    }
    return msgRes
  }

}
