const { Octokit } = require('octokit');
const express = require('express');
const http = require('http');
const { checkSchema, validationResult } = require('express-validator');
const { createTerminus } = require('@godaddy/terminus');
const bodyParser = require('body-parser');
const { copyRepoTo } = require('copy-repo-to');
const multer = require('multer');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3000;
const upload = multer();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

console.log('COPY_PASSWORD', process.env.COPY_PASSWORD);

app.get(
  '/datalist',
  async function (req, res) {
    const octokit = new Octokit({
      auth: process.env.COPY_GITHUB_TOKEN,
    })
    // @TODO add caching
    // @TODO add page support for case over 100 repositories
    const newRepoRequest = octokit.request('GET /orgs/prjctr-ytb/repos?per_page=100', {
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    const oldRepoRequest = octokit.request('GET /orgs/prjctr-ytb-code/repos?per_page=100', {
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    const [newRepo, oldRepo] = await Promise.all([newRepoRequest, oldRepoRequest]);
    const oldNames = oldRepo.data.map(({name})=>name);

    const names = newRepo.data
      .filter(({is_template})=>is_template)
      .filter(({name})=>!oldNames.includes(name))
      .map(({name})=>name);
    res.status(200).json(names).end();
});

app.post(
  '/copy',
  upload.none(),
  checkSchema({
    repository: {
      errorMessage: `Будь ласка введіть ім'я репозиторія`,
      notEmpty: true,
      optional: false,
      trim: true,
      in: ['body'],
    },
    password: {
      errorMessage: 'Будь ласка введіть пароль, щоб ми знали, що ви маєте право копіювати репозиторії туди-сюди',
      notEmpty: true,
      optional: false,
      trim: true,
      in: ['body'],
      custom: {
        options: (value) => {
          console.log('value', value);
          console.log('COPY_PASSWORD', process.env.COPY_PASSWORD);
          return value === process.env.COPY_PASSWORD
        },
        bail: true,
        errorMessage: 'Пароль невірний'
      },
    },
  }),
  async function (req, res) {
    const validation = validationResult(req);
    if (validation.errors.length !== 0) {
      res.status(400).json(validation.errors).end();
      return;
    }

    try {
      const result = await copyRepoTo({
        token: process.env.COPY_GITHUB_TOKEN,
        templateOwner: 'prjctr-ytb',
        templateRepo: req.body.repository,
        owner: 'prjctr-ytb-code',
        description: '',
      });
      console.log(result);
      console.log(result?.stdout?.toString());
      console.log(result?.stderr?.toString());
    } catch (error) {
      console.log(error);
      console.log(error?.stdout?.toString());

      console.log(error?.data);
      if (error?.stderr !== undefined) {
        console.log(error?.stderr?.toString());
        res.status(400).json([
          {
            "msg": error?.stderr?.toString(),
            "path": "password",
          }
        ]).end();
      }
      if (error?.response !== undefined) {
        console.log(error.response.data);
        res.status(400).json(error?.response.data.errors).end();
      }
    }
    res.status(204).end();
  });

function beforeShutdown() {
  return new Promise(resolve => {
    setTimeout(resolve, 3000)
  })
}

function healthCheck({ state }) {
  return Promise.resolve()
}

const server = http.createServer(app);
createTerminus(server, {
  healthChecks: {
    '/healthcheck': healthCheck,    // a function accepting a state and returning a promise indicating service health,
    verbatim: true,                 // [optional = false] use object returned from /healthcheck verbatim in response,
    __unsafeExposeStackTraces: true // [optional = false] return stack traces in error response if healthchecks throw errors
  },
  useExit0: true,
  beforeShutdown,
  caseInsensitive: true,                  // [optional] whether given health checks routes are case insensitive (defaults to false)
});

server.listen(PORT);
