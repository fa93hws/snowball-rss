![CI](https://github.com/fa93hws/snowball-rss/workflows/CI/badge.svg)
[![codecov](https://codecov.io/gh/fa93hws/snowball-rss/branch/master/graph/badge.svg?token=Zvc4rSXkVa)](https://codecov.io/gh/fa93hws/snowball-rss)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![TypescriptStrict](https://camo.githubusercontent.com/41c68e9f29c6caccc084e5a147e0abd5f392d9bc/68747470733a2f2f62616467656e2e6e65742f62616467652f547970655363726970742f7374726963742532302546302539462539322541412f626c7565)

# What is this

启动服务后，他会每隔一段时间获取雪球某用户动态（通过[RSSHUB](https://docs.rsshub.app/finance.html#xin-lang-cai-jing)支持)。如果有新动态，则会将新动态通过邮件发送给所有订阅者。

# User guide

首先，惯例，安装依赖 `npm install`.

## 设置敏感环境变量

创建一个`.env`文件，将`sample.env`的内容全部复制进去。然后设置成你自己的内容。

### MAILER_SERVICE

发件邮箱的服务提供商，比如`hotmail` 等等。目前代码写的仅支持简单的账号密码登陆，所以`gmail`无法使用。推荐这里使用 hotmail

### MAILER_USER

发件邮箱的账号

### MAILER_PASS

发件邮箱的密码

### ADMIN_EMAIL

管理员邮箱。填你自己的邮箱就好，用了接收一些测试邮件，以及崩溃通知

### SUBSCRIBERS

订阅者邮箱，有新的消息会发邮件给所有订阅者。通过`, `分割（当中有个空格）。比如

```
foo@gmail.com, bar@hotmail.com, foobar@126.com
```

### SNOWBALL_USER_ID

关注的用户的 ID，可以从雪球用户的个人页面的网址中取得。比如 https://xueqiu.com/u/1334706236 是 `1334706236`

## 运行程序

`node index.js by-email` 即可。也可提供一些命令行参数

### --send-test-email (默认值: false)

是否在一开始登陆发件邮箱时发送测试邮件。这可以确保邮箱登陆失败的时候立即知晓错误。

### --interval-second (默认值: 60)

多久刷新一次，单位为秒
