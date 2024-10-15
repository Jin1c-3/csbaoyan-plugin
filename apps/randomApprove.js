import Config from "../model/config.js";
import lodash from "lodash";
import common from "../lib/common/common.js";

// TextMsg可自行更改，其他照旧即可。
export class RandomApprove extends plugin {
  constructor() {
    super({
      name: "[csbaoyan]自动入群审批", // 插件名称
      dsc: "根据正则允许入群者是否能入群，采用随机算法", // 插件描述
      event: "message.group", // 更多监听事件请参考下方的 Events
      priority: 5, // 插件优先度，数字越小优先度越高
      rule: [
        {
          reg: "^#(设置|查看|查询)入群审[核批]正则", // 正则表达式,有关正则表达式请自行百度
          fnc: "commentRegexConfig", // 执行方法
          log: false,
        },
        {
          reg: "^#(自动|入群|自动入群)审[核批]$", // 正则表达式,有关正则表达式请自行百度
          fnc: "autoApprove", // 执行方法
          log: false,
        },
      ],
    });
  }

  async commentRegexConfig(e) {
    if (!common.checkPermission(e, "admin")) return false;
    if (/#(查看|查询)/.test(e.raw_message)) {
      let commentRegex = Config.getConfig("randomApprove", "commentRegex");
      return e.reply(`当前正则表达式为：${commentRegex}`);
    }
    let commentRegexStr = e.raw_message
      .replace(/#(设置|查看)入群审[核批]正则/, "")
      .replace(/&#91;/g, "[")
      .replace(/&#93;/g, "]")
      .trim();
    if (!commentRegexStr) {
      return e.reply("请正确输入正则表达式");
    }
    // 尝试将字符串转换为正则表达式对象
    let commentRegex;
    try {
      commentRegex = new RegExp(commentRegexStr);
    } catch (error) {
      return e.reply("无效的正则表达式，请重新输入");
    }

    // 将正则表达式对象转换为字符串
    let commentRegexString = commentRegex.toString().slice(1, -1); // 去掉前后的斜杠

    Config.setConfig("randomApprove", "commentRegex", commentRegexString);
    return e.reply(`设置成功，当前正则表达式为：${commentRegexString}`);
  }

  async autoApprove(e) {
    if (!common.checkPermission(e, "admin")) return false;
    let groups = Config.getConfig("default", "scope");
    if (!groups.includes(e.group_id)) {
      return false;
    }
    let seenUserIds = new Set();
    let SystemMsg = await (e.bot ?? Bot).getSystemMsg();
    let filteredSystemMsg = [];

    for (let i = 0; i < SystemMsg.length; i++) {
      let item = SystemMsg[i];
      if (
        item.request_type === "group" &&
        item.sub_type === "add" &&
        groups.includes(item.group_id)
      ) {
        if (seenUserIds.has(item.user_id)) {
          item.approve(false);
          await Bot.sleep(1000);
        } else {
          seenUserIds.add(item.user_id);
          filteredSystemMsg.push(item);
        }
      }
    }
    SystemMsg = filteredSystemMsg
    if (lodash.isEmpty(SystemMsg))
      return e.reply("暂无加群申请(。-ω-)zzz", true);
    // 随机打乱SystemMsg
    SystemMsg = lodash.shuffle(SystemMsg);
    if (false) {
      // TODO: 判断后再显示私密信息
      SystemMsgToShow = SystemMsg.map((item) => {
        return [
          segment.image(`https://q1.qlogo.cn/g?b=qq&s=100&nk=${item.user_id}`),
          `\nQQ：${item.user_id}\n`,
          `昵称：${item.nickname}\n`,
          item.tips ? `Tips：${item.tips}\n` : "",
          `${item.comment}`,
        ];
      });
      let msg = [
        `现有未处理的加群申请如下，总共${SystemMsgToShow.length}条`,
        ...SystemMsgToShow,
      ];
      common.getforwardMsg(e, msg);
    }
    e.reply("好哒，我开始处理辣٩(๑•ㅂ•)۶");
    let commentRegex = new RegExp(
      `${Config.getConfig("randomApprove", "commentRegex")}`
    );
    let success = [];
    let fail = [];
    let risk = [];
    for (let i of SystemMsg) {
      let i_comment = i.comment.replace(/答案：/, "");
      let yes = commentRegex.test(i_comment);
      logger.mark(`i_comment:${i_comment}；commentRegex：${commentRegex}；审核结果：${yes}`)
      if (yes && (await i.approve(yes))) {
        success.push(`${success.length + 1}、${i.user_id}`);
      } else {
        if (/风险/.test(i.tips)) {
          risk.push(`${risk.length + 1}、${i.user_id}`);
        } else {
          fail.push(`${fail.length + 1}、${i.user_id}`);
        }
      }
      await Bot.sleep(1000);
    }
    let msg = [
      `本次共处理${SystemMsg.length}条群申请\n成功：${success.length}\n失败：${fail.length}\n风险：${risk.length}`,
    ];
    if (false) {
      if (!lodash.isEmpty(success))
        msg.push(["以下为成功的名单：\n", success.join("\n")]);
      if (!lodash.isEmpty(fail))
        msg.push(["以下为失败的名单：\n", fail.join("\n")]);
      if (!lodash.isEmpty(risk))
        msg.push(["以下为风险账号名单：\n", risk.join("\n")]);
    }
    common.getforwardMsg(e, msg);
    return false;
  }
}
