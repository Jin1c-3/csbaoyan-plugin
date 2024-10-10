import fs from 'node:fs'
import chalk from 'chalk'

const files = fs.readdirSync('./plugins/csbaoyan-plugin/apps').filter(file => file.endsWith('.js'))

let ret = []

files.forEach((file) => {
    ret.push(import(`./apps/${file}`))
})

ret = await Promise.allSettled(ret)

logger.info(chalk.blue.bold(`-----===开始加载绿群插件===-----`))

let apps = {}
for (let i in files) {
    let name = files[i].replace('.js', '')

    if (ret[i].status != 'fulfilled') {
        logger.error(`载入插件错误：${logger.red(name)}`)
        logger.error(ret[i].reason)
        continue
    } else {
        logger.mark(chalk.greenBright(`载入插件成功：${name}`))
    }
    apps[name] = ret[i].value[Object.keys(ret[i].value)[0]]
}
logger.info(chalk.blue.bold(`-----===绿群插件加载完毕===-----`))

export { apps }
