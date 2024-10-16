<center>

# csbaoyan-plugin

<hr/>

基于 [trss-yunzai](trss.me) 机器人的插件，写法上借鉴了 [yenai-plugin](yenai.ren) ，功能上专为 [绿群](https://github.com/cs-baoyan) 客制化了需求，感谢他们做出的贡献。

</center>

## 工作方式

使用 `QQNT` 作为客户端，为其安装 [LiteLoader](https://liteloaderqqnt.github.io/guide/install.html) 赋予其插件能力。然后安装 [NapCat](https://napneko.github.io/zh-CN/guide/getting-started) ，该插件的功能为接受 QQ 消息，并以 [OneBot协议](https://12.onebot.dev/) 规定的格式将消息按 `WebSocket` 协议发送到 `yunzai` 端。

## 使用方式

1. 自行安装 `yunzai` 机器人。建议手动安装 [trss-yunzai](https://github.com/TimeRainStarSky/Yunzai) ，然后使用 `qqnt` + [NapCat](https://napneko.github.io/zh-CN/guide/getting-started) 作为 `QQ` 端的实现。

2. 推荐使用git进行安装，以方便后续升级。在Yunzai目录打开终端，运行

   ```
   git clone --depth 1 https://github.com/Jin1c-3/csbaoyan-plugin ./plugins/csbaoyan-plugin
   ```

3. 安装依赖

   ```
   npm i pnpm -g
   cd ./plugins/csbaoyan-plugin
   pnpm i
   ```

## 功能介绍

1. 自动入群审批
    描述: 根据正则允许入群者是否能入群，采用随机算法
    使用方法: 
    - 示例1: #设置入群审批正则 [正则表达式]
      示例: #设置入群审批正则 ^[a-zA-Z0-9]+$
    - 示例2: #查看入群审批正则
    - 示例3: #自动入群审批

2. 检测群名片
    描述: 如果群名片不符合正则将被提醒
    使用方法: 
    - 示例1: #设置群名片正则 [正则表达式]
      示例: #设置群名片正则 ^[0-2]\\d([-–－ ].+)+$
    - 示例2: #查看群名片正则
    - 示例3: 自动检测群名片（无需命令，自动触发）

3. 修改群范围
    描述: 可以增添和减少插件的应用范围
    使用方法: 
    - 示例1: #增加绿群 [群号]
      示例: #增加绿群 123456
    - 示例2: #减少绿群 [群号]
      示例: #减少绿群 123456

4. 帮助插件
    描述: 返回所有插件的用法信息
    使用方法: 
    - 示例: #绿群帮助 #绿群插件帮助

5. LRU自动化提示：
    1. 首先在绿群中使用命令清人：
      - #lru100天
      - 时间可以改为3周等
    2. 按照要求确认并等待清理，平均1-6秒清理1个群友
    3. 使用指令：
      - #自动审批
      - bot将自动放行入群申请`
