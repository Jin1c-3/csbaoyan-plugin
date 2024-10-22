class cache {
    constructor() {
        // 缓存成员信息，减少API调用
        this.memberCache = new Map();
    }

    async getMemberInfo(userId, group) {
        let memberInfo = this.getMemberCache(userId);
        if (memberInfo) {
            return memberInfo;
        }
        try {
            const info = await group.pickMember(userId).getInfo();
            this.setMemberCache(userId, info);
            return info;
        } catch (err) {
            logger.error(`获取群成员信息出错：${err}`);
            return null;
        }
    }

    setMemberCache(userId, info) {
        this.memberCache.set(userId, { info, usageCount: 0 });
    }

    getMemberCache(userId) {
        if (this.memberCache.has(userId)) {
            const cacheItem = this.memberCache.get(userId);
            cacheItem.usageCount += 1;
            if (cacheItem.usageCount >= 5) {
                this.memberCache.delete(userId);
            }
            return cacheItem.info;
        }
        return null;
    }
}

export default new cache()
