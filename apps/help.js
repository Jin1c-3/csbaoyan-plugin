export class CSBaoyanHelp extends plugin {
  constructor() {
    super({
      name: "[csbaoyan]帮助插件",
      dsc: "返回所有插件的用法信息",
      event: "message.group",
      priority: 10,
      rule: [
        {
          reg: "^#绿[裙群](插件)?帮助$",
          fnc: "showHelp",
          log: false,
        },
      ],
    });
  }

  async showHelp(e) {
    const helpMessage = `-==csbaoyan-plugin帮助==-

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
    ⑴首先在绿群中使用命令清人：
      - #lru100天
      - 时间可以改为3周等
    ⑵按照要求确认并等待清理，平均1-6秒清理1个群友
    ⑶使用指令：
      - #自动审批
      - bot将自动放行入群申请
      
6. 复读检测：
    描述：使用感知哈希检测图片，重复超过一定次数会被撤回
    使用方法：自动进行

7. 批处理：
    描述：批量撤回消息，并禁言
    使用方法：#批量撤回10 #批量撤禁15

8. 广播：
    描述：广播消息给所有绿群，加全体会艾特全体成员
    使用方法：#广播这条消息 #全体广播第二条消息`;

    return e.reply(helpMessage);
  }
}
