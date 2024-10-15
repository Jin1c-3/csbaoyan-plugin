import Config from "../model/config.js";

export class UpdateScope extends plugin {
    constructor() {
        super({
            name: "[csbaoyan]lru", // 插件名称
            dsc: "lru命令", // 插件描述
            event: "message.group", // 更多监听事件请参考下方的 Events
            priority: 60, // 插件优先度，数字越小优先度越高
            rule: [
                {
                    reg: "^#lru ", // 合并后的正则表达式
                    fnc: "updateScope", // 合并后的执行方法
                    log: false
                },
            ],
        });
    }

    async updateScope(e) {
        if (!common.checkPermission(e, "admin")) return false
        let action = e.raw_message.match(/^#(增加|减少)绿群/)[1];
        let group = e.raw_message.replace(/^#(增加|减少)绿群/, "").trim();
        let operation = action === "增加" ? 'add' : 'remove';
        const result = Config.updateConfig("default", "scope", Number(group), operation);
        if (result === true) {
            e.reply(`群 ${group} 已成功${action === "增加" ? "添加到" : "从"}应用范围${action === "增加" ? "添加" : "移除"}`);
        } else {
            e.reply(`操作失败：${result}`);
        }
    }
}