import Config from '../model/Config.js'
import common from "../lib/common/common.js";

// TextMsg可自行更改，其他照旧即可。
export class RemindCard extends plugin {
  constructor() {
    super({
      name: "[csbaoyan]检测群名片", // 插件名称
      dsc: "如果群名片不符合正则将被提醒", // 插件描述
      event: "message.group", // 更多监听事件请参考下方的 Events
      priority: 600, // 插件优先度，数字越小优先度越高
      rule: [
        {
          reg: "^#(设置|查看|查询)群名片正则", // 正则表达式,有关正则表达式请自行百度
          fnc: "cardRegexConfig", // 执行方法
          log: false,
        },
        {
          reg: "", // 正则表达式,有关正则表达式请自行百度
          fnc: "reminder", // 执行方法
          log: false,
        },
      ],
    });
  }

  async reminder(e) {
    let cardRegex = new RegExp(
      `${Config.getConfig("remindCard", "cardRegex")}`
    );
    let groups = Config.getConfig("default", "scope");
    if (!groups.includes(e.group_id)) {
      return false;
    }
    // 生成一个0到1之间的随机数，只有小于0.2时才进行提醒
    if (Math.random() >= 0.35) {
      return false;
    }
    if (common.getPermission(e, "admin") === true) return false;
    let member_title = (await e.group.pickMember(e.user_id).getInfo()).title;
    if (member_title) {
      logger.mark(`遇到title爷了：${member_title}`);
      return false;
    }
    let member_name = e.sender.card;
    if (!cardRegex.test(member_name)) {
      // 引用并at回复
      const res = await e.reply(
        `您当前昵称为【${member_name}】，不符合规范，请更改为：\n【本科入学年份-本科学校-保研学校（可以不填）-昵称】\n以通过正则检测：\n${cardRegex}`,
        true,
        { at: true }
      );
      await Bot.sleep(30000);
      e.group.recallMsg(res.message_id);
    }
    return false;
  }

  async cardRegexConfig(e) {
    if (!common.checkPermission(e, "admin")) return false;
    if (/#(查看|查询)/.test(e.raw_message)) {
      let cardRegex = Config.getConfig("remindCard", "cardRegex");
      return e.reply(`当前正则表达式为：${cardRegex}`);
    }
    let cardRegexStr = e.raw_message
      .replace(/#?设置群名片正则/, "")
      .replace(/&#91;/g, "[")
      .replace(/&#93;/g, "]")
      .trim();
    if (!cardRegexStr) {
      return e.reply("请正确输入正则表达式");
    }
    // 尝试将字符串转换为正则表达式对象
    let cardRegex;
    try {
      cardRegex = new RegExp(cardRegexStr);
    } catch (error) {
      return e.reply("无效的正则表达式，请重新输入");
    }

    // 将正则表达式对象转换为字符串
    let cardRegexString = cardRegex.toString().slice(1, -1); // 去掉前后的斜杠

    Config.setConfig("remindCard", "cardRegex", cardRegexString);
    return e.reply(`设置成功，当前正则表达式为：${cardRegexString}`);
  }
}
