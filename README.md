[![CI](https://github.com/fa93hws/snowball-rss/workflows/CI/badge.svg)](https://github.com/fa93hws/snowball-rss/actions)
[![codecov](https://codecov.io/gh/fa93hws/snowball-rss/branch/master/graph/badge.svg?token=Zvc4rSXkVa)](https://codecov.io/gh/fa93hws/snowball-rss)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![TypescriptStrict](https://camo.githubusercontent.com/41c68e9f29c6caccc084e5a147e0abd5f392d9bc/68747470733a2f2f62616467656e2e6e65742f62616467652f547970655363726970742f7374726963742532302546302539462539322541412f626c7565)

- [What is this](#what-is-this)
- [How to run](#how-to-run)
  - [With docker](#with-docker)
    - [下载镜像](#下载镜像)
    - [运行](#运行)
    - [设置环境变量](#设置环境变量)
      - [MAILER_SERVICE](#mailer_service)
      - [MAILER_USER](#mailer_user)
      - [MAILER_PASS](#mailer_pass)
      - [ADMIN_EMAIL](#admin_email)
      - [SUBSCRIBERS](#subscribers)
      - [SNOWBALL_USER_ID](#snowball_user_id)
    - [程序参数](#程序参数)
      - [--send-test-email](#--send-test-email)
      - [--interval-second](#--interval-second)
  - [Without docker](#without-docker)
    - [设置 .env 文件](#设置-env-文件)
    - [运行程序](#运行程序)

# What is this

启动服务后，他会每隔一段时间获取雪球某用户动态（通过 [RSSHUB](https://docs.rsshub.app/finance.html#xin-lang-cai-jing) 支持)。如果有新动态，则进入网页截图，并通过邮件发送给所有订阅者。

# How to run

如果只是想使用它，推荐通过 [docker](#with-docker) 来运行。但是如果还需要一些调试或者魔改，那最好就[别用 docker](#without-docker) 了

## With docker

[安装 docker](https://docs.docker.com/get-docker)，并[启动 docker 服务](https://docs.docker.com/config/daemon/systemd/#start-the-docker-daemon)

### 下载镜像

镜像发布在[github](https://github.com/fa93hws/snowball-rss/pkgs/container/snowball-rss)上，可以通过

```
sudo docker pull ghcr.io/fa93hws/snowball-rss:latest
```

来下载最新的镜像

### 运行

[下载](#下载镜像)之后，之后可以通过

```
sudo docker run -d --env-file .env ghcr.io/fa93hws/snowball-rss by-email [args]
```

来运行，详细的 `docker run` 参数可以翻阅[官方文档](https://docs.docker.com/engine/reference/commandline/run/).

示例命令行中

- `--env-file .env` 表示读取 `.env` 的内容作为环境变量。使用方法可以参考[官方文档](https://docs.docker.com/engine/reference/commandline/run/#set-environment-variables--e---env---env-file)；具体需要设置的环境变量见[设置环境变量](#设置环境变量)
- `[args]` 为程序的[命令行参数](#程序参数)

### 设置环境变量

创建一个`.env`文件，将[`sample.env`](https://github.com/fa93hws/snowball-rss/blob/master/sample.env)的内容全部复制进去。然后设置成你自己的内容。

#### MAILER_SERVICE

发件邮箱的服务提供商，比如`hotmail` 等等。目前代码写的仅支持简单的账号密码登陆，所以`gmail`无法使用。推荐这里使用 hotmail

#### MAILER_USER

发件邮箱的账号

#### MAILER_PASS

发件邮箱的密码

#### ADMIN_EMAIL

管理员邮箱。填你自己的邮箱就好，用了接收一些测试邮件，以及崩溃通知

#### SUBSCRIBERS

订阅者邮箱，有新的消息会发邮件给所有订阅者。通过`, `分割（当中有个空格）。比如

```
foo@gmail.com, bar@hotmail.com, foobar@126.com
```

#### SNOWBALL_USER_ID

关注的用户的 ID，可以从雪球用户的个人页面的网址中取得。比如 https://xueqiu.com/u/1334706236 是 `1334706236`

### 程序参数

#### --send-test-email

可选，默认值为 `false`

是否在一开始登陆发件邮箱时发送测试邮件。这可以确保邮箱登陆失败的时候立即知晓错误。

#### --interval-second

可选，默认值为 `60` (一分钟)

完成一次爬虫行为后，等待多久进行下一次。

## Without docker

clone 之后，首先，惯例，安装依赖 `npm install`.

### 设置 .env 文件

程序使用 [`dotenv`](https://github.com/motdotla/dotenv) 来载入环境变量，因此需要创建一个 `.env` 文件，可以直接复制 `sample.env` 并将其中的内容修改成适用你的情况。环境变量的说明可以参考[设置环境变量](#设置环境变量)。

### 运行程序

`node index.js by-email` 即可。也可提供一些命令行参数, 见[程序参数](#程序参数)
