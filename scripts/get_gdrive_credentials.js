#! /usr/bin/env node

// based on https://developers.google.com/drive/api/v3/quickstart/nodejs

const fs = require('fs');
const path = require('path');
const {google} = require('googleapis');
const express = require('express');
const parseUrl = require('url').parse;
const Server = require('http').Server;

const PORT = 8000;
const REDIRECT_URL = "http://localhost:" + PORT;

// If modifying these scopes, delete token.json.
const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'];

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
let tokenDir;
const TOKEN_FILE = 'token.json';
const CREDENTIALS_FILE = 'credentials.json';


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, javascript_origins} = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, REDIRECT_URL/*javascript_origins[0]*/);

  // from: https://github.com/googleapis/google-api-nodejs-client#handling-refresh-tokens
  oAuth2Client.on('tokens', (tokens) => {
    oAuth2Client.setCredentials(tokens);
    writeAccessToken(oAuth2Client, tokens);
  });

  // Check if we have previously stored a token.
   fs.readFile(fullpath(tokenDir, TOKEN_FILE), (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token).token);
    callback(oAuth2Client);
  });
}

function getUserInfo(oAuth2Client) {
  // from: https://stackoverflow.com/a/45187328
  return new Promise((resolve, reject) => google.people('v1').people.get({
    resourceName: 'people/me',
    personFields: 'emailAddresses,names',
    auth: oAuth2Client},
    (err, response) => {
      if (err) {
        reject(err);
      } else {
        resolve({
          name: response.data.names[0].displayName,
          email: response.data.emailAddresses[0].value
        });
      }      
    }));
}

function fullpath(tokenDir, file) {
  return path.join(tokenDir, file);
}

function main() {
  tokenDir = process.argv[2];
  if (!tokenDir) {
    console.log(`Usage: ${process.argv[0]} ${process.argv[1]} path/to/token_dir`);
    process.exit(1);
  } 
  // Load client secrets from a local file.
  fs.readFile(fullpath(tokenDir, CREDENTIALS_FILE), (err, content) => {
    if (err) return console.log('Error loading client secret file from ' + fullpath(tokenDir, CREDENTIALS_FILE), err);
    // Authorize a client with credentials, then call the Google Drive API.
    authorize(JSON.parse(content), listFiles);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    // following required to get a refresh token, see:
    // https://github.com/googleapis/google-api-python-client/issues/213
    prompt: 'consent'
  });
  startWebServer(oAuth2Client, authUrl, callback);
}

function writeAccessToken(oAuth2Client, token) {
  // Store the token to disk for later program executions
  const filename = fullpath(tokenDir, TOKEN_FILE);
  getUserInfo(oAuth2Client).then(
    (user) => {
      fs.writeFile(filename, JSON.stringify({user, token}), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', filename);
      });
    },
    console.error);  
}

function saveAuthCode(code, oAuth2Client, callback) {
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);       
      oAuth2Client.setCredentials(token);     
      callback(oAuth2Client);
    });
  }

function startWebServer(oAuth2Client, authUrl, callback) {
  const app = express();
  let server;

  app.get('/', function(req, res) {
    const code = parseUrl(req.url, true).query.code
      res.status(200);
      res.send();
      saveAuthCode(code, oAuth2Client, callback)
      server.close(() => process.exit(0));      
  });

  server = app.listen(PORT, function() {
    console.log('Authorize this app by visiting this url:', authUrl);
    //console.log(`Navigate to ${authUrl} and log in to Dropbox.`);
  });

}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listFiles(auth) {
  getUserInfo(auth).then(
    (data) => console.log(`Successfully logged in to ${data.name}'s Google Drive.`),
    console.error);
  const drive = google.drive({version: 'v3', auth});
  drive.files.list({
    pageSize: 10,
    fields: 'nextPageToken, files(id, name)',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const files = res.data.files;
    if (files.length) {
      console.log('Files:');
      files.map((file) => {
        console.log(`${file.name} (${file.id})`);
      });
    } else {
      console.log('No files found which browserfs has access to.');
    }
  });
}

module.exports = {
  SCOPES,
  listFiles,
};

main();
