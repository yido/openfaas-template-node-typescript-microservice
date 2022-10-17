import express from "express";
const bodyParser = require("body-parser");
// @ts-ignore
import handle from "./function/handler";
require('dotenv').config({ path: "./function/.env" });
var cors = require('cors');

const fs = require('fs').promises;
const app = express();

const defaultMaxSize = "100kb";
app.disable("x-powered-by");

const rawLimit = process.env.MAX_RAW_SIZE || defaultMaxSize;
const jsonLimit = process.env.MAX_JSON_SIZE || defaultMaxSize;
const api_key_name = process.env.API_KEY_NAME;
const use_basic_auth = process.env.BASIC_AUTH && api_key_name && process.env.NODE_ENV && process.env.NODE_ENV != "test";

const ContentType = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers"
};

export const HEADERS = { ...ContentType };


app.use(function addDefaultContentType(req, res, next) {
  if (!req.headers["content-type"]) {
    req.headers["content-type"] = "text/plain";
  }
  next();
});

if (use_basic_auth)
    app.use(addBasicAuth);

console.log("process.env.BASIC_AUTH",process.env.BASIC_AUTH);
console.log("process.env.API_KEY_NAME",process.env.API_KEY_NAME);
console.log("use_basic_auth",use_basic_auth);

async function addBasicAuth(req, res, next) {
  if ('OPTIONS' == req.method) {
     next();
  }
  else
  {
    let auth = api_key_name ? req.headers[api_key_name] : undefined;
    let auth2 = api_key_name ? req.headers[api_key_name.replace("-","")] : undefined;
    
    let msg = { "message": "No API key found in request" };
    let apiKey = "";
    try { apiKey = await fs.readFile("/var/openfaas/secrets/" + api_key_name, "utf8"); }
    catch (error: any) {
      auth = false;
      msg = { "message": `Unable to read ${api_key_name} from secrets, error: ${error.message}` };

      console.log("we are here error:  --> ", JSON.stringify(msg));
      res.setHeader('WWW-Authenticate', 'OpenFass realm="' + api_key_name + '"');
      res.statusCode = 401;
      res.send(msg);
      res.end();
    }

    console.log("apiKey --> ", apiKey);
    console.log("auth --> ", auth);
    console.log("auth2 --> ", auth2);

    if (auth && auth == apiKey || (auth2 && auth2 == apiKey)) {
      next();
    }
    else {
      if (auth)
        msg = { "message": "Invalid API Key!" };
        
      res.setHeader('WWW-Authenticate', 'OpenFass realm="' + api_key_name + '"'); 
      res.statusCode = 401;
      res.send(msg);
      res.end();
    } 
  } 
}

if (process.env.RAW_BODY === "true") {
  app.use(bodyParser.raw({ type: "*/*", limit: rawLimit }));
} else {
  app.use(bodyParser.text({ type: "text/*" }));
  app.use(bodyParser.json({ limit: jsonLimit }));
  app.use(bodyParser.urlencoded({ extended: true }));
}

if (process.env.ENABLE_CORS) {
  app.use(cors());
  app.options('*', cors());
}


async function init() {
  await handle({ "app": app });

  const port = process.env.http_port || 3000;
  app.disable('x-powered-by');

  app.listen(port, () => { console.log(`node14-typescript-microservice, listening on port: ${port}`) });
}

init();
