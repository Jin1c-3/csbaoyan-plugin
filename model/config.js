import fs from 'node:fs'
import YAML from 'yaml'
import chokidar from 'chokidar'

class Config {
    constructor() {
        this.configDir = './plugins/csbaoyan-plugin/config/';
        /** 监听文件 */
        this.watcher = {}
    }

    /**
     * 获取配置yaml
     * @param app 功能
     * @param name 名称
     */
    getConfig(app, name) {
        let file = this.getFilePath(app);
        let key = `${app}.${name}`;

        try {
            const fileContents = fs.readFileSync(file, 'utf8');
            const config = YAML.parse(fileContents);
            if (config.hasOwnProperty(name)) {
                this[key] = config[name];
            } else {
                logger.error(`[csbaoyan-plugin][${app}][${name}] 键不存在`);
                return false;
            }
        } catch (error) {
            logger.error(`[csbaoyan-plugin][${app}][${name}] 格式错误 ${error}`);
            return false;
        }

        this.watch(file, app, name);
        return this[key];
    }

    /**
     * 设置配置yaml
     * @param app 功能
     * @param name 名称
     * @param data 新数据
     */
    setConfig(app, name, data) {
        let file = this.getFilePath(app);
        let key = `${app}.${name}`;

        try {
            const fileContents = fs.readFileSync(file, 'utf8');
            const config = YAML.parse(fileContents);
            if (!config.hasOwnProperty(name)) {
                logger.error(`[csbaoyan-plugin][${app}][${name}] 键不存在，写入新值：${data}`);
            }
            config[name] = data;
            fs.writeFileSync(file, YAML.stringify(config));
            this[key] = data;
        } catch (error) {
            logger.error(`[csbaoyan-plugin][${app}][${name}] 设置配置错误 ${error}`);
            return false;
        }

        return true;
    }

    /**
     * 更新配置yaml
     * @param app 功能
     * @param name 名称
     * @param data 新数据
     * @param flag 增加或减少配置项的标志
     */
    updateConfig(app, name, data, flag) {
        let file = this.getFilePath(app);
        let key = `${app}.${name}`;

        try {
            const fileContents = fs.readFileSync(file, 'utf8');
            const config = YAML.parse(fileContents);

            if (!config.hasOwnProperty(name)) {
                let err = ` ${name} 键不存在`
                console.error(`[csbaoyan-plugin][${app}][${name}]${err}`);
                return err;
            }

            if (!Array.isArray(config[name])) {
                let err = ` ${name} 不是一个列表`;
                console.error(`[csbaoyan-plugin][${app}][${name}]${err}`);
                return err;
            }

            if (flag === 'add') {
                if (config[name].includes(data)) {
                    let err = ` ${data} 数据已存在`;
                    console.error(`[csbaoyan-plugin][${app}][${name}]${err}`);
                    return err;
                }
                config[name].push(data);
            } else if (flag === 'remove') {
                const index = config[name].indexOf(data);
                if (index === -1) {
                    let err = ` ${data} 数据不存在`;
                    console.error(`[csbaoyan-plugin][${app}][${name}]${err}`);
                    return err;
                }
                config[name].splice(index, 1);
            } else {
                let err = `无效的标志`;
                console.error(`[csbaoyan-plugin][${app}][${name}]${err}`);
                return err;
            }

            fs.writeFileSync(file, YAML.stringify(config));
            this[key] = config[name];
        } catch (error) {
            let err = `更新配置错误 ${error}`;
            console.error(`[csbaoyan-plugin][${app}][${name}]${err}`);
            return err;
        }

        return true;
    }

    getFilePath(app) {
        return `${this.configDir}${app}.yaml`
    }

    /** 监听配置文件 */
    watch(file, app, name) {
        let key = `${app}.${name}`

        if (this.watcher[key]) return

        const watcher = chokidar.watch(file)
        watcher.on('change', () => {
            delete this[key]
            logger.mark(`[csbaoyan-plugin][修改配置文件][${app}][${name}]`)
        })

        this.watcher[key] = watcher
    }
}

export default new Config()
