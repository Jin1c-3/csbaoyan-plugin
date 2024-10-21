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
            priority: -8, // 插件优先度，数字越小优先度越高
            rule: [
                {
                    reg: "^#(设置|查看|查询)复读阻止次数", // 正则表达式,有关正则表达式请自行百度
                    fnc: "traceNumConfig", // 执行方法
                },
                {
                    reg: "^#(设置|查看|查询)复读图片敏感度", // 正则表达式,有关正则表达式请自行百度
                    fnc: "sensitiveConfig", // 执行方法
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
            messages.push({ ...e.message[0], message_id: e.message_id, user_id: e.user_id });
            return false;
        }
        const isSimilar = await this.isSimilarMessage(e.message[0], messages[messages.length - 1]);
        if (isSimilar) {
            messages.push({ ...e.message[0], message_id: e.message_id, user_id: e.user_id });
        } else {
            group_track_message.set(e.group_id, [{ ...e.message[0], message_id: e.message_id, user_id: e.user_id }]);
        }
        if (messages.length >= traceNum) {
            const res = await e.reply(`复读达咩哟ヽ(*。>Д<)o゜`)
            let user_id_pool = new Set();
            for (let i = 0; i < messages.length; i++) {
                await e.group.recallMsg(messages[i].message_id);
                if (i != 0 || user_id_pool.has(messages[i].user_id)) {
                    continue;
                }
                await e.group.muteMember(messages[i].user_id, 60)
                user_id_pool.add(messages[i].user_id)
            }
            await e.group.recallMsg(res.message_id);
            group_track_message.set(e.group_id, []);
            return true;
        }
    }

    async isSimilarMessage(now_msg, last_msg) {
        if (now_msg.type == "image") {
            if (last_msg.type != "image") {
                return false;
            }
            if (now_msg.file_unique == last_msg.file_unique) {
                return true;
            }
            const [buffer1, buffer2] = await Promise.all([
                this.getImageBufferFromUrl(now_msg.url),
                this.getImageBufferFromUrl(last_msg.url)
            ]).catch(_ => { return false; });
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
                return distance <= Config.getConfig("avoidRepeat", "sensitive");
            } finally {
                await Promise.all([cleanup1(), cleanup2()]);
            }
        } else {
            if (last_msg.type == 'image') {
                return false;
            }
            return last_msg.text === now_msg.text;
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