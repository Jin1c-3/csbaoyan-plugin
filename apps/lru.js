import { Time_unit } from "../constants/other.js"
import common from "../lib/common/common.js";
import { translateChinaNum } from "../tools/index.js"
import { GroupAdmin as Ga } from "../model/index.js"
import Config from '../model/Config.js'

const Numreg = "[零一壹二两三四五六七八九十百千万亿\\d]+"
const TimeUnitReg = Object.keys(Time_unit).join("|")
const lrureg = new RegExp(`^#(确认)?(lru|LRU|Lru)(${Numreg})(${TimeUnitReg})(第(${Numreg})页)?$`)

export class Lru extends plugin {
    constructor() {
        super({
            name: "[csbaoyan]lru", // 插件名称
            dsc: "lru命令", // 插件描述
            event: "message.group", // 更多监听事件请参考下方的 Events
            priority: 5, // 插件优先度，数字越小优先度越高
            rule: [
                {
                    reg: lrureg,
                    fnc: "lru_", // 合并后的执行方法
                },
            ],
        });
    }

    async lru_(e) {
        let groups = Config.getConfig("default", "scope");
        if (!groups.includes(e.group_id)) {
            return false;
        }
        if (!common.checkPermission(e, "admin", "admin")) { return true }
        let regRet = lrureg.exec(e.msg)
        regRet[3] = translateChinaNum(regRet[3] || 1)
        // 确认清理直接执行
        if (regRet[1] == "确认") {
            try {
                return common.getforwardMsg(e,
                    await new Ga(e).clearNoactive(
                        e.group_id,
                        regRet[3],
                        regRet[4]
                    )
                )
            } catch (error) {
                return common.handleException(e, error)
            }
        }
        // 查看和清理都会发送列表
        let page = translateChinaNum(regRet[6] || 1)
        let msg = null
        try {
            msg = await new Ga(e).getNoactiveInfo(
                e.group_id, regRet[3], regRet[4], page
            )
        } catch (err) {
            return common.handleException(e, err)
        }
        // 清理
        if (regRet[1] === undefined) {
            let list = await new Ga(e).noactiveList(e.group_id, regRet[3], regRet[4])
            e.reply([
                `⚠ 本次共需清理「${list.length}」人，防止误触发\n`,
                `请发送：#确认lru${regRet[3]}${regRet[4]}`
            ])
        }
        common.getforwardMsg(e, msg, {
            isxml: true,
            xmlTitle: e.msg.replace(/#|查看|清理/g, "")
        })
    }
}