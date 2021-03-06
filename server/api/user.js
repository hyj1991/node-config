const Router = require('koa-router');
const config = require('config');
const UserModel = require('../model/user');
const UserCache = require('../cache/user');
const UserService = require('../service/user');

const router = new Router();

const cfg_login = config.get('login');

router.post('/login', async function (ctx, next) {
    const username = ctx.request.body.username;
    const pwd = ctx.request.body.pwd;
    const type = ctx.request.body.type;
    if (!username || !pwd) {
        return (ctx.body = {
            code: 0,
            msg: '登录账户或者密码为空',
        });
    }
    //自定义注册，取配置的用户名密码
    if (cfg_login.username === username && pwd === cfg_login.pwd) {
        //登录成功
        let obj = {
            nickname: '管理员',
            tell: '',
            username,
            headimg: '',
        };
        const token = UserService.add(obj);
        obj.token = token;
        ctx.body = {
            code: 1,
            data: obj,
        };
    } else {
        //失败
        ctx.body = {
            code: 0,
            msg: '账号密码不正确',
        };
    }
});

router.post('/auth', async function (ctx, next) {
    const { username, token } = ctx.headers;
    try {
        const res = await UserService.check(token, username);
        if (res) {
            ctx.body = {
                code: 1,
            };
        } else {
            ctx.body = {
                code: 0,
                msg: '登录失效',
            };
        }
    } catch (error) {
        ctx.body = {
            code: 0,
            msg: error.message,
        };
    }
});

router.get('/all', async function (ctx, next) {
    const { limit } = ctx.query;
    const data = await UserModel.getCount(limit);

    ctx.body = {
        code: 1,
        data,
    };
});
router.post('/change/:id', async function (ctx, next) {
    try {
        const username = ctx.headers.username;
        await UserCache.check(username, UserCache.qlist.USER);
    } catch (error) {
        return (ctx.body = {
            code: 0,
            msg: error.message,
        });
    }

    const id = ctx.params.id;
    const { status } = ctx.request.body;
    const data = await UserModel.change(status, id);
    UserCache.update(id);
    ctx.body = {
        code: 1,
        data,
    };
});
router.post('/add', async function (ctx, next) {
    try {
        const user_name = ctx.headers.username;
        await UserCache.check(user_name, UserCache.qlist.USER);
    } catch (error) {
        return (ctx.body = {
            code: 0,
            msg: error.message,
        });
    }
    const { id = '', username, qlist } = ctx.request.body;
    if (!username) {
        return (ctx.body = {
            code: 0,
            msg: '用户名不能为空',
        });
    }

    const nickname = decodeURIComponent(ctx.headers.nickname);
    const model = {
        username,
        qlist,
        nickname,
    };
    if (!id || id === '0') {
        await UserModel.insert(model);
    } else {
        await UserModel.update(model, id);
        UserCache.update(id);
    }
    ctx.body = {
        code: 1,
        data: {},
    };
});
module.exports = router;
