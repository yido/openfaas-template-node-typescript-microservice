import express from "express";
const bodyParser = require("body-parser");
// @ts-ignore
import handle from "./function/handler";
require('dotenv').config({ path: "./function/.env" });

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
