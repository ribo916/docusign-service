const express = require('express') // Support web apps with NODEJS
const axios = require('axios') // Promise based HTTP client
const app = express()
const port = 3000
const { JSDOM } = require("jsdom");
const { window } = new JSDOM();
const { exit } = require("process");
const docusign = require("docusign-esign");
const open = require("open");
const envelopeCreator = require("./makeenvelope");
const bodyParser = require('body-parser');
const impersonationUserGuid = process.env['userid'];
const integrationKey = process.env['integrationkey'];
const rsaKey = process.env['privatekey'];
const redirectUri = process.env['redirecturi'];
const returnUrl = "https://embedded-signing.ribo916.repl.co/response.html";
const pingUrl = "https://embedded-signing.ribo916.repl.co/";
const pingFrequency = 600; // seconds

// ***********************************************
// Prepare DocuSign
// ***********************************************
let accessToken, expiry, accountId;
let scopes = "signature";
let oAuthBasePath = "account-d.docusign.com"; // don't put the https:// 
let apiBasePath = "https://demo.docusign.net/restapi";
let consentUrl = `https://${oAuthBasePath}/oauth/auth?response_type=code&scope=impersonation+${scopes}&client_id=${integrationKey}&redirect_uri=${redirectUri}`;
let envelopeArgs = {
  signerEmail: "sbadoc.test@gmail.com",
  signerName: "Billy Kid",
  recipientId: "1",
  clientUserId: "123",
  status: "sent",
  scenario: 1
};

// ***********************************************
// Prepare Express
// ***********************************************

// Support CORS so browsers can interact with us cross domain
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Configure and Launch the Express Server
app.use(bodyParser.json({ limit: '15mb' }));
app.use(bodyParser.text({ type: 'text/plain' }))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public')); // load files from public directory
app.listen(process.env.PORT || 3000, function() {
  console.log('Express server listening on port %d in %s mode', this.address().port, app.settings.env);
});

// ***********************************************
// Endpoints
// ***********************************************

app.get('/', async (req, res) => {
  res.sendFile('public/index.html'); // no need to specify dir off root
});

app.get('/getlinkmixed', async (req, res) => {
  envelopeArgs.scenario = 3; // 1 = HTML, 2 = PDF, else MIXED
  let u = await CallDocuSign();
  res.send(u);
});

app.get('/getlinkhtml', async (req, res) => {
  envelopeArgs.scenario = 1; // 1 = HTML, 2 = PDF, else MIXED
  let u = await CallDocuSign();
  res.send(u);
});

app.get('/getlinkpdf', async (req, res) => {
  envelopeArgs.scenario = 2; // 1 = HTML, 2 = PDF, else MIXED
  let u = await CallDocuSign();
  res.send(u);
});

app.post('/redirect', async (req, res) => {
  envelopeArgs.scenario = 2; // 1 = HTML, 2 = PDF, else MIXED
  let u = await CallDocuSign();
  res.redirect(u);
});

app.post('/iframe', async (req, res) => {
  envelopeArgs.scenario = 3; // 1 = HTML, 2 = PDF, else MIXED
  let u = await CallDocuSign();
  res.send('<html><head></head><body align="center" style="background-color:black; color:white;"><h1>DocuSign Framed</h1><iframe src="' + u + '" height="800" width="450" style="border:10px solid white; border-radius: 25px;";></iframe></body></html>');
});

// ***********************************************
// DocuSign Functions
// 1 - Get JWT Token
// 2 - Get AccountID 
// 3 - Get/Create Envelope
// 4 - Create Recipient View (Embedded Signing)
// ***********************************************

let DS = {}; // Global object to store functions

DS.getJWT = async function _getJWT() {
  try {
    let apiClient = new docusign.ApiClient();
    apiClient.setOAuthBasePath(oAuthBasePath);
    let privateKey = rsaKey;
    let response = await apiClient.requestJWTUserToken(integrationKey, impersonationUserGuid, scopes, privateKey, 3600);
    expiry = response.body.expires_in;
    accessToken = response.body.access_token;
    // console.log(response.body);
    return { "expiry": expiry, "accessToken": accessToken };
  } catch (err) {
    // Verify we have a response body to parse
    if (err.response) {
      if (err.response.body.error == "consent_required") {
        console.log("consent required");
        console.log("Consent URL: " + consentUrl);
        await open(consentUrl, { wait: true }); // open the browser and get consent done         
        exit(0); // Exit since we cannot run further API calls
      }
    } else {
      // Legitimate errors
      console.error(err);
      exit(0);
    }
  }
};

DS.getUserInfo = async function _getUserInfo(accessToken) {
  try {
    let apiClient = new docusign.ApiClient();
    apiClient.setOAuthBasePath(oAuthBasePath);
    let response = await apiClient.getUserInfo(accessToken);
    accountId = response.accounts[0].accountId;
    // console.log(response);
    return { "accountId": accountId };
  } catch (err) {
    console.error(err);
  }
};

DS.getEnvelope = async function _getEnvelope(accessToken, envelopeId) {
  try {
    let dsApiClient = new docusign.ApiClient();
    dsApiClient.setBasePath(apiBasePath);
    dsApiClient.addDefaultHeader('Authorization', 'Bearer ' + accessToken);
    let envelopesApi = new docusign.EnvelopesApi(dsApiClient);
    let response = await envelopesApi.getEnvelope(accountId, envelopeId, null);
    return response;
  } catch (err) {
    console.error(err);
  }
};

DS.createEnvelope = async function _createEnvelope(accessToken) {
  try {
    let dsApiClient = new docusign.ApiClient();
    dsApiClient.setBasePath(apiBasePath);
    dsApiClient.addDefaultHeader('Authorization', 'Bearer ' + accessToken);
    let envelopesApi = new docusign.EnvelopesApi(dsApiClient),
      results = null;

    const args = {
      accessToken: accessToken,
      basePath: apiBasePath,
      accountId: accountId,
      envelopeArgs: envelopeArgs
    };
console.log("2 - envelope scenario = " + envelopeArgs.scenario);
    let envelope = envelopeCreator.makeEnvelope(args.envelopeArgs);

    // console.log("accountId = " + accountId); 
    results = await envelopesApi.createEnvelope(accountId, { envelopeDefinition: envelope });
    let envelopeId = results.envelopeId;

    console.log(`>>> Envelope was created with ID = ${envelopeId}`);
    return { envelopeId: envelopeId };
  } catch (err) {
    console.error(err);
  }
};

DS.createRecipientView = async function _createRecipientView(accessToken, envId) {
  try {
    let dsApiClient = new docusign.ApiClient();
    dsApiClient.setBasePath(apiBasePath);
    dsApiClient.addDefaultHeader('Authorization', 'Bearer ' + accessToken);

    var envelopesApi = new docusign.EnvelopesApi(dsApiClient);
    var viewRequest = new docusign.RecipientViewRequest();
    viewRequest.returnUrl = returnUrl + '?myPretendState=12345';
    viewRequest.authenticationMethod = 'email';

    // DocuSign recommends that you redirect to DocuSign for the
    // Signing Ceremony. There are multiple ways to save state.
    // To maintain your application's session, use the pingUrl
    // parameter. It causes the DocuSign Signing Ceremony web page
    // (not the DocuSign server) to send pings via AJAX to your
    // app,
    // https://www.youtube.com/watch?v=0wdWMIXE9l8   
    viewRequest.PingFrequency = pingFrequency; 
    viewRequest.PingUrl = pingUrl; // optional setting (must be an https site)

    
    viewRequest.email = envelopeArgs.signerEmail;
    viewRequest.userName = envelopeArgs.signerName;
    viewRequest.recipientId = envelopeArgs.recipientId;
    viewRequest.clientUserId = envelopeArgs.clientUserId;

    let results = await envelopesApi.createRecipientView(accountId, envId, { 'recipientViewRequest': viewRequest }, null);
    // console.log(results);
    return results.url;
  } catch (err) {
    console.error(err);
  }
};

async function CallDocuSign() {
  const timeStart = window.performance.now();

  console.log("\n" + "----- ABOUT TO GET ACCESSTOKEN AND ACCOUNTID -----" + "\n");
  await DS.getJWT();
  await DS.getUserInfo(accessToken);
  const timeTokenReceived = window.performance.now();
  console.log("\n" + `>>> Time taken to get token = ${(timeTokenReceived - timeStart) / 1000} seconds`);

  console.log("\n" + "----- ABOUT TO CREATE ENVELOPE -----" + "\n");
  let env = await DS.createEnvelope(accessToken);
  let envelopeId = env.envelopeId;
  const timeEnvelopeCreated = window.performance.now();
  console.log("\n" + `>>> Time taken to create envelope = ${(timeEnvelopeCreated - timeTokenReceived) / 1000} seconds`);

  console.log("\n" + "----- ABOUT TO CREATE SIGNING LINK -----" + "\n");
  let url = await DS.createRecipientView(accessToken, envelopeId);
  console.log(url);
  const timeLinkCreated = window.performance.now();
  console.log("\n" + `>>> Time taken to get link = ${(timeLinkCreated - timeEnvelopeCreated) / 1000} seconds`);
  
  return url;
}

// ***********************************************
// Test direct from Server/Console on REPLIT Run
// ***********************************************
// CallDocuSign();