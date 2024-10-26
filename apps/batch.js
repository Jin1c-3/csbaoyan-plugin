import Config from '../model/Config.js'
import common from "../lib/common/common.js";
import lodash from 'lodash';

const batchReg = new RegExp(`^#批量撤(回|禁)(\\d+)`)

export class Batch extends plugin {
    constructor() {
        super({
            name: "[csbaoyan]batch", // 插件名称
            dsc: "批处理群消息", // 插件描述
            event: "message.group", // 更多监听事件请参考下方的 Events
            priority: 6, // 插件优先度，数字越小优先度越高
            rule: [
                {
                    reg: "^#(设置|查看|查询)批处理数", // 正则表达式,有关正则表达式请自行百度
                    fnc: "batchSizeConfig", // 执行方法
                },
                {
                    reg: "^#(设置|查看|查询)批处理禁言时间", // 正则表达式,有关正则表达式请自行百度
                    fnc: "muteTimeConfig", // 执行方法
                },
                {
                    reg: batchReg,
                    fnc: "batchHandler", // 合并后的执行方法
                },
                {
                    reg: /^#广播(精华?)?/,
                    fnc: "broadcast", // 合并后的执行方法
                },
            ],
        });
    }

    async batchHandler(e) {
        let groups = Config.getConfig("default", "scope");
        if (!groups.includes(e.group_id)) {
            return false;
        }
        if (!common.checkPermission(e, "admin", "admin")) { return true }
        const regParam = batchReg.exec(e.msg)
        const num = Number(regParam[2])
        if (num > Config.getConfig("batch", "batchSize") || num === undefined) {
            return e.reply("撤的太多辣，我害怕 இ௰இ")
        }
        let history_msg = await e.group.getChatHistory(0, num + 1);
        history_msg.pop();
        const muteFlag = regParam[1] === "禁" ? true : false
        const res = await e.reply(`正在处理中，共${num}条消息，${muteFlag ? "禁言并" : "只"}撤回`)
        lodash.reverse(history_msg)
        let muteSet = new Set()
        for (let msg of history_msg) {
            await e.group.recallMsg(msg.message_id)
            if (muteFlag) {
                if (muteSet.has(msg.user_id)) {
                    continue
                }
                muteSet.add(msg.user_id)
                await e.group.muteMember(msg.user_id, Config.getConfig("batch", "muteTime"))
            }
        }
        await e.group.recallMsg(res.message_id)
        return e.reply(`都处理好辣( •̀ ω •́ )y`)
    }

    async muteTimeConfig(e) {
        if (!common.checkPermission(e, "admin")) return false;
        if (/#(查看|查询)/.test(e.raw_message)) {
            let muteTime = Config.getConfig("batch", "muteTime");
            return e.reply(`当前批处理禁言时间为：${muteTime}`);
        }
        let muteTime = e.raw_message
            .replace(/#设置批处理禁言时间/, "")
            .replace(/&#91;/g, "[")
            .replace(/&#93;/g, "]")
            .trim();
        if (60 > muteTime) {
            return e.reply(`设置失败，批处理禁言时间不合理：${muteTime}`);
        }
        Config.setConfig("batch", "muteTime", Number(muteTime));
        return e.reply(`设置成功，批处理禁言时间为：${muteTime}`);
    }

    async batchSizeConfig(e) {
        if (!common.checkPermission(e, "admin")) return false;
        if (/#(查看|查询)/.test(e.raw_message)) {
            let batchSize = Config.getConfig("batch", "batchSize");
            return e.reply(`当前批处理最大值为：${batchSize}`);
        }
        let batchSize = e.raw_message
            .replace(/#设置批处理数/, "")
            .replace(/&#91;/g, "[")
            .replace(/&#93;/g, "]")
            .trim();
        if (10 > batchSize) {
            return e.reply(`设置失败，批处理最大值不合理：${batchSize}`);
        }
        Config.setConfig("batch", "batchSize", Number(batchSize));
        return e.reply(`设置成功，当前批处理最大值为：${batchSize}`);
    }

    async broadcast(e) {
        let groups = Config.getConfig("default", "scope");
        if (!groups.includes(e.group_id)) {
            return false;
        }
        if (!common.checkPermission(e, "admin")) return false;
        e.message[0].text = e.message[0].text.replace("^#广播(精华?)?", "").trim()
        if (!e.message[0].text) e.message.shift()
        if (lodash.isEmpty(e.message)) return e.reply("❎ 消息不能为空")
        e.message.unshift(segment.at("all"))
        let res_msg = [];
        for (let gpid of groups) {
            await Bot.pickGroup(gpid).sendMsg(e.message)
                .then(() => res_msg.push(`✅ ${gpid} 群聊消息已送达`))
                .catch((err) => res_msg.push(`❎ ${gpid} 群聊消息发送失败\n错误信息为:${err}`))
        }
        return e.reply(res_msg.join("\n"))
    }

}