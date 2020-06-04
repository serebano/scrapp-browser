const puppeteer = require('puppeteer');
const httpProxy = require("http-proxy");

const host = "0.0.0.0";
const port = 3131;
let browser;
let proxy;

const options = {
    headless: true,
    devtools: false,
    ignoreHTTPSErrors: true,
    args: [
        `--no-sandbox`,
        `--disable-setuid-sandbox`,
        `--ignore-certificate-errors`
    ]
};

async function launchBrowser() {
  console.log(`Browser started!`)

  browser = await puppeteer.launch(options);
  browser.on('disconnected', launchBrowser);

  if (proxy) {
    proxy.options.target = browser.wsEndpoint();
    console.log(`Set new proxy.target`, proxy.options.target)
  }

  return browser
}

async function createServer(WSEndPoint, host, port) {

  proxy = await httpProxy
    .createServer({
      target: WSEndPoint, // where we are connecting
      ws: true,
      localAddress: host // where to bind the proxy
    })

  proxy.listen(port); // which port the proxy should listen to

  proxy.on('error', function (err, req, res) {
    console.log(`Error`, err)
  });

  // proxy.on('proxyReqWs', function (proxyReq, req, socket, options, head) {
  //   console.log('proxy WS Request');
  // });

  // proxy.on('proxyRes', function (proxyRes, req, res) {
  //   console.log('RAW Response from the target', JSON.stringify(proxyRes.headers, true, 2));
  // });

  proxy.on('open', async function (proxySocket) {
    //proxySocket.on('data', hybiParseAndLogMessage);
    console.log('Client connected');
  });

  proxy.on('close', function (res, socket, head) {
    console.log('Client disconnected');
  });

  return `ws://${host}:${port}`; // ie: ws://123.123.123.123:3131
}

(async () => {
    try {

      await launchBrowser()

      const browserWSEndpoint = browser.wsEndpoint();
      const customWSEndpoint = await createServer(browserWSEndpoint, host, port); // create the server here

      console.log([ browserWSEndpoint, customWSEndpoint ])

    } catch(e) {
      console.log(e)
    }
})()
