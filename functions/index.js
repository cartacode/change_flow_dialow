/**
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

// [START import]
const functions = require('firebase-functions');
const firebase = require('firebase-admin');

var config = {
  apiKey: "AIzaSyAHxE3p-StvpR-8Rj88C42R9EEJSmlVLEs",
  authDomain: "changeflow-9f86f.firebaseapp.com",
  databaseURL: "https://changeflow-9f86f.firebaseio.com",
  projectId: "changeflow-9f86f",
  storageBucket: "changeflow-9f86f.appspot.com",
  messagingSenderId: "210271489664"
};

firebase.initializeApp(config);

var starCountRef = firebase.database().ref('data');
var intents = {}

starCountRef.on('value', function(snapshot) {
  snapshot.forEach(function(childSnapshot) {
    intents[childSnapshot.key] = childSnapshot.val();
  });
});

const express = require('express');
const app = express();
// [END import]

// [START middleware]
const cors = require('cors')({origin: true});
app.use(cors);
// [END middleware]

// [START index]
// This endpoint provides displays the index page.
app.get('/', (req, res) => {
  const date = new Date();
  const hours = (date.getHours() % 12) + 1; // London is UTC + 1hr;
  // [START_EXCLUDE silent]
  res.set('Cache-Control', `public, max-age=${secondsLeftBeforeEndOfHour(date)}`);
  // [END_EXCLUDE silent]
  res.send(`
  <!doctype html>
    <head>
      <title>Time</title>
      <link rel="stylesheet" href="/style.css">
      <script src="/script.js"></script>
    </head>
    <body>
      <p>In London, the clock strikes: <span id="bongs">${'BONG '.repeat(hours)}</span></p>
      <button onClick="refresh(this)">Refresh</button>
    </body>
  </html>`);
});
// [END index]

// [START api]
// This endpoint is the BONG API.
app.get('/api', (req, res) => {
  const date = new Date();
  const hours = (date.getHours() % 12) + 1; // London is UTC + 1hr;
  // [START_EXCLUDE silent]
  // [START cache]
  res.set('Cache-Control', `public, max-age=${secondsLeftBeforeEndOfHour(date)}`);
  // [END cache]
  // [END_EXCLUDE silent]
  res.send('BONG '.repeat(hours));
});
// [END api]

// [START process]
// This endpoint is the BONG API.
app.post('/process', (req, res) => {
  const currentIntentName = req.body.queryResult.intent.displayName;
  if (req.body && req.body.queryResult) {
    
    if (intents.hasOwnProperty(currentIntentName)) {
      const nextIntentName = intents[currentIntentName].next;
      console.log('make request: ', intents[nextIntentName])
      let responseJson = {};

      responseJson.fulfillmentText = intents[nextIntentName].queryResult.fulfillmentText;
      responseJson.fulfillmentMessages = intents[nextIntentName].queryResult.fulfillmentMessages;
      responseJson.outputContexts = [
        JSON.parse(
          JSON.stringify(
            intents[nextIntentName].queryResult.outputContexts[0]
          ).replace(/\*/g, '.')
        )
      ];

      console.log('outeu: ', responseJson)
      return res.json(responseJson);
    } else {
      return res.json({
          'speech': 'no found action',
          "displayText": 'no found action'
      });
    }

  } else {
    return res.json({
        'speech': 'no action',
        "displayText": 'no action'
    });
  }
});
// [END process]

// [START seconds_left]
// Returns the number of seconds left before the next hour starts.
function secondsLeftBeforeEndOfHour(date) {
  const m = date.getMinutes();
  const s = date.getSeconds();
  return 3600 - (m*60) - s;
}
// [END seconds_left]

// [START export]
// Export the express app as an HTTP Cloud Functions
exports.app = functions.https.onRequest(app);
// [END export]
