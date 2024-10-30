import { evaluate } from 'mathjs';

const regex = /^#?calc[\(（](.+)[\)）]$/i

export class Calc extends plugin {
    constructor() {
        super({
            name: "[csbaoyan]计算器", // 插件名称
            dsc: "计算数学表达式", // 插件描述
            event: "message.group", // 更多监听事件请参考下方的 Events
            priority: 5000, // 插件优先度，数字越小优先度越高
            rule: [
                {
                    reg: regex, // 正则表达式,有关正则表达式请自行百度
                    fnc: "calc", // 执行方法
                }
            ],
        });
    }

    async calc(e) {
        try {
            const result = evaluate(e.msg.replace(regex, '$1').trim());
            return e.reply(String(result));
        } catch (err) {
            return e.reply(`瓦塔西算不出来喵ヽ(*。>Д<)o゜\n${err.message}`);
        }
    }

}