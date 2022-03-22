import express from "express";
const bodyParser = require("body-parser");
// @ts-ignore
import handle from "./function/handler";
require('dotenv').config({ path: "./function/.env" });

const fs = require('fs').promises;
const app = express();

const defaultMaxSize = "100kb";
app.disable("x-powered-by");

const rawLimit = process.env.MAX_RAW_SIZE || defaultMaxSize;
const jsonLimit = process.env.MAX_JSON_SIZE || defaultMaxSize;

app.use(function addDefaultContentType(req, res, next) {
  if (!req.headers["content-type"]) {
    req.headers["content-type"] = "text/plain";
  }
  next();
});

if (process.env.NODE_ENV != "test")
  app.use(addBasicAuth);

async function addBasicAuth(req, res, next) {

  let apiKey = await fs.readFile("/var/openfaas/secrets/api-key", "utf8");
  let auth = req.headers["api-key"]
  if (auth && auth == apiKey)
    next();

  res.statusCode = 401;
  res.setHeader('WWW-Authenticate', 'OpenFass realm="api-key"');
  res.end({ "message": "No API key found in request" });
}

if (process.env.RAW_BODY === "true") {
  app.use(bodyParser.raw({ type: "*/*", limit: rawLimit }));
} else {
  app.use(bodyParser.text({ type: "text/*" }));
  app.use(bodyParser.json({ limit: jsonLimit }));
  app.use(bodyParser.urlencoded({ extended: true }));
}


async function init() {
  await handle({ "app": app });

  const port = process.env.http_port || 3000;
  app.disable('x-powered-by');

  app.listen(port, () => { console.log(`node14-typescript-microservice, listening on port: ${port}`) });
}

init();
