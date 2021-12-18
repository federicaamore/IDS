const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const { auth } = require('google-auth-library');
const { NONAME } = require('dns');
const { response } = require('express');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar',
'https://www.googleapis.com/auth/calendar.events',
'https://www.googleapis.com/auth/admin.directory.resource.calendar'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';
const CALENDAR_ID = "ksoct8ono2cem4gkdvdnl4af0g@group.calendar.google.com"

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, event, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    console.log(event)
    callback(oAuth2Client, event);
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
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

function insertEvent(auth, data){
    const calendar = google.calendar({version: 'v3', auth});
    calendar.events.insert(
    {
      auth: auth,
      calendarId: CALENDAR_ID,
      resource: data[0]
    },
    function(err, event) {
      if (err) {
        console.log('There was an error contacting the Calendar service: ' + err);
        return;
      }
      
      console.log('Event created:', event.data.id);
      data[1].prepare("INSERT INTO eventi(id, materia) VALUES(?, ?)").run(event.data.id, data[2])
      data[3].send("Evento aggiunto " + event.data.id)
    }
  );
}

function deleteEvent(auth, data){
  const calendar = google.calendar({version: 'v3', auth});
  calendar.events.delete({
    auth: auth,
    calendarId: CALENDAR_ID,
    eventId: data[0]
  }, function(err,event) {
    if (err){
      console.log('There was an error contacting the Calendar service: ' + err)
      data[2].send(err.message)
      return
    }
    console.log(event)
    data[1].prepare("DELETE FROM eventi WHERE id = ?").run(data[0])
    data[2].send("Evento rimosso con id: " + data[0])
})
}
/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */

function listEvents(auth, event) {
  const calendar = google.calendar({version: 'v3', auth});
  calendar.events.list({
    calendarId: CALENDAR_ID,
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const events = res.data.items;
    if (events.length) {
      console.log('Upcoming 10 events:');
      events.map((event, i) => {
        const start = event.start.dateTime || event.start.date;
        console.log(event);
      });
    } else {
      console.log('No upcoming events found.');
    }
  });
}

module.exports = {authorize, insertEvent, deleteEvent}