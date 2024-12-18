import Config from '../model/Config.js'
import common from "../lib/common/common.js";
import { cache } from '../model/index.js'

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
          reg: "^#(设置|查看|查询)群名片概率", // 正则表达式,有关正则表达式请自行百度
          fnc: "chanceConfig", // 执行方法
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
    let chance = Config.getConfig("remindCard", "chance");
    if (!groups.includes(e.group_id)) {
      return false;
    }
    if (Math.random() >= chance) {
      return false;
    }
    if (common.getPermission(e, "admin") === true) return false;
    const memberInfo = await cache.getMemberInfo(e.user_id, e.group);
    if (memberInfo.title) {
        logger.mark(`遇到title爷了：${memberInfo.title}`);
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

  async chanceConfig(e) {
    if (!common.checkPermission(e, "admin")) return false;
    if (/#(查看|查询)/.test(e.raw_message)) {
      let chance = Config.getConfig("remindCard", "chance");
      return e.reply(`当前群名片提示概率为：${chance}`);
    }
    let chance = e.raw_message
      .replace(/#?设置群名片概率/, "")
      .replace(/&#91;/g, "[")
      .replace(/&#93;/g, "]")
      .trim();
    if (0 > chance || chance > 1) {
      return e.reply(`设置失败，概率不合理：${chance}`);
    }
    Config.setConfig("remindCard", "chance", Number(chance));
    return e.reply(`设置成功，当前群名片提示概率为：${chance}`);
  }
}
