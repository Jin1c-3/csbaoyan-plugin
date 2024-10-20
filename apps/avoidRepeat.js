import Config from '../model/Config.js'
import common from "../lib/common/common.js";
import imghash from 'imghash';
import leven from 'leven';
import axios from 'axios';
import sharp from 'sharp'
import fs from 'fs/promises';
import tmp from 'tmp-promise'

let group_track_message = new Map();

export class AvoidRepeat extends plugin {
    constructor() {
        super({
            name: "[csbaoyan]阻止复读", // 插件名称
            dsc: "阻止群成员发送重复消息", // 插件描述
            event: "message.group", // 监听群消息事件
            priority: 500, // 插件优先度，数字越小优先度越高
            rule: [
                {
                    reg: "^#(设置|查看|查询)复读阻止次数", // 正则表达式,有关正则表达式请自行百度
                    fnc: "traceNumConfig", // 执行方法
                    log: false,
                },
                {
                    reg: "^#(设置|查看|查询)复读图片敏感度", // 正则表达式,有关正则表达式请自行百度
                    fnc: "sensitiveConfig", // 执行方法
                    log: false,
                },
                {
                    reg: "", // 匹配所有消息
                    fnc: "checkRepeat", // 执行方法
                    log: false,
                },
            ],
        });
    }

    async checkRepeat(e) {
        let groups = Config.getConfig("default", "scope");
        if (!groups.includes(e.group_id)) {
            return false;
        }
        if (common.getPermission(e, "admin") === true) return false;
        let member_title = (await e.group.pickMember(e.user_id).getInfo()).title;
        if (member_title) {
            logger.mark(`遇到title爷了：${member_title}`);
            return false;
        }
        if (!group_track_message.has(e.group_id)) {
            group_track_message.set(e.group_id, []);
        }
        let traceNum = Config.getConfig("avoidRepeat", "traceNum");
        let messages = group_track_message.get(e.group_id);
        if (messages.length == 0) {
            messages.push(e);
            return false;
        }
        if (e.img) {
            if (!messages[messages.length - 1].img) {
                group_track_message.set(e.group_id, [e]);
            } else {
                const [buffer1, buffer2] = await Promise.all([
                    this.getImageBufferFromUrl(e.img),
                    this.getImageBufferFromUrl(messages[messages.length - 1].img)
                ]);
                const [image1, image2] = await Promise.all([
                    sharp(buffer1).jpeg().toBuffer(),
                    sharp(buffer2).jpeg().toBuffer()
                ]);
                const { path: tempFilePath1, cleanup: cleanup1 } = await tmp.file({ postfix: '.jpeg' });
                const { path: tempFilePath2, cleanup: cleanup2 } = await tmp.file({ postfix: '.jpeg' });
                try {
                    await Promise.all([
                        fs.writeFile(tempFilePath1, image1),
                        fs.writeFile(tempFilePath2, image2)
                    ]);
                    const [hash1, hash2] = await Promise.all([
                        imghash.hash(tempFilePath1),
                        imghash.hash(tempFilePath2)
                    ]);
                    const distance = leven(hash1, hash2);
                    logger.mark(`Distance between images is: ${distance}`);
            
                    if (distance <= Config.getConfig("avoidRepeat", "sensitive")) {
                        messages.push(e);
                    } else {
                        group_track_message.set(e.group_id, [e]);
                    }
                } finally {
                    await Promise.all([cleanup1(), cleanup2()]);
                }
            }
        } else {
            if (messages[messages.length - 1].msg == e.msg) {
                messages.push(e);
            }
            else {
                group_track_message.set(e.group_id, [e]);
            }
        }
        if (messages.length >= traceNum) {
            const res = await e.reply(`复读达咩哟ヽ(*。>Д<)o゜`)
            for (let m of messages) {
                await e.group.recallMsg(m.message_id);
            }
            await e.group.recallMsg(res.message_id);
            group_track_message.set(e.group_id, []);
            return false;
        }
    }

    async traceNumConfig(e) {
        if (!common.checkPermission(e, "admin")) return false;
        if (/#(查看|查询)/.test(e.raw_message)) {
            let traceNum = Config.getConfig("avoidRepeat", "traceNum");
            return e.reply(`当前复读阻止次数为：${traceNum}`);
        }
        let traceNum = e.raw_message
            .replace(/#?设置复读阻止次数/, "")
            .replace(/&#91;/g, "[")
            .replace(/&#93;/g, "]")
            .trim();
        if (0 > traceNum) {
            return e.reply(`设置失败，概率不合理：${traceNum}`);
        }
        Config.setConfig("avoidRepeat", "traceNum", Number(traceNum));
        return e.reply(`设置成功，当前复读阻止次数为：${traceNum}`);
    }

    async sensitiveConfig(e) {
        if (!common.checkPermission(e, "admin")) return false;
        if (/#(查看|查询)/.test(e.raw_message)) {
            let sensitive = Config.getConfig("avoidRepeat", "sensitive");
            return e.reply(`当前复读图片敏感度为：${sensitive}`);
        }
        let sensitive = e.raw_message
            .replace(/#?设置复读图片敏感度/, "")
            .replace(/&#91;/g, "[")
            .replace(/&#93;/g, "]")
            .trim();
        if (0 > sensitive) {
            return e.reply(`设置失败，敏感度不合理：${sensitive}`);
        }
        Config.setConfig("avoidRepeat", "sensitive", Number(sensitive));
        return e.reply(`设置成功，当前复读图片敏感度为：${sensitive}`);
    }

    async getImageBufferFromUrl(url) {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'arraybuffer'
        });
        return Buffer.from(response.data, 'binary');
    }
}