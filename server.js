const http = require('http');
const koa = require('koa');
const koaRequest = require('koa-http-request');
const cors = require('koa-cors');
const app = new koa();
let proxyHost = 'https://apiloopstest.shabikplus.mozat.com/';
//proxyHost = "http://172.28.2.144:2080";
const axios = require('axios');
app.use(cors());
app.use(koaRequest({
  json: true, //automatically parsing of JSON response
  timeout: 3000,    //3s timeout
  host: 'https://api.github.com',
}));

function parsePostData(ctx) {
  return new Promise((resolve, reject) => {
    try {
      let postdata = '';
      ctx.req.addListener('data', (data) => {
        postdata += data
      })
      ctx.req.addListener('end', function() {
        let parseData = parseQueryStr(postdata);
        resolve(parseData)
      })
    } catch (err) {
      reject(err)
    }
  })
}

// 将POST请求参数字符串解析成JSON
function parseQueryStr(queryStr) {
  return JSON.parse(queryStr)
}

app.use(async (ctx, next) => {
  console.log(ctx.url);
  console.log(ctx.method);
  //let data = {"game_id":5,"host_id":200321,"session_id":"game-session-368-200321","round_id":"2595","setting":{"fee":0,"host_raise_fee":0,"join_method":0,"max_player":20}};

  if (ctx.method.toLowerCase() === 'get') {
    const repo = await ctx.get(proxyHost + ctx.url, null, {
      'User-Agent': 'koa-http-request',
    });
    ctx.body = repo;
  } else {
    let ajax = axios.create();
    let postData = await parsePostData(ctx);
    console.log(typeof postData);
    console.log(postData);
    //let repo = await ctx.post(proxyHost + ctx.url, postData, {
    //  'User-Agent': 'koa-http-request',
    //  'Accept': 'application/json, text/plain, */*',
    //  'Content-Type': 'application/json'
    //});
    let repo = await ajax.post(proxyHost + ctx.url, postData, { headers: { 'Content-Type': 'application/json' } });
    console.log('response>>>>>>>>>>>>>>>>>>>>>>>>>>>');
    console.log(typeof repo.data);
    console.log(repo.data);
    ctx.body = JSON.stringify(repo.data);
  }

});

app.listen(8000);