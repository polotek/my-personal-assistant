import { promises as fs } from "fs";
import path from "path";
import process from "process";
import { authenticate } from "@google-cloud/local-auth";
import { google } from "googleapis";
import { get } from "http";

// If modifying these scopes, delete token.json.
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar.events.readonly",
];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time. If the token expires, delete token.json and authorize() again.
const TOKEN_PATH = path.join(process.cwd(), "token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");
console.log(TOKEN_PATH, CREDENTIALS_PATH);
/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: "authorized_user",
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
export async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Return the list of threads given the ids
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 * @param {Array<string>} ids
 */
export async function getThreads(auth, ids) {
  const gmail = google.gmail({ version: "v1", auth });
  const res = await gmail.users.threads.get({
    userId: "me",
    id: ids[0],
    fields: "*",
  });
  return res.data;
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
export async function listThreads(auth) {
  const gmail = google.gmail({ version: "v1", auth });
  const res = await gmail.users.threads.list({
    userId: "me",
    maxResults: 3,
    labelIds: ["CATEGORY_UPDATES"],
    fields: "nextPageToken,resultSizeEstimate,threads(id,snippet,messages(id))",
  });
  let threads = res.data.threads;
  if (!threads || threads.length === 0) {
    console.log("No threads found.");
    return;
  }

  // const ids = threads.map((thread) => thread.id);
  // threads = await getThreads(auth, ids);
  // console.log(threads);

  console.log(res.data);
}

/**
 * Return min and max datetimes for the given day
 * @param {Date} inputDate
 */
function getTimeBoundsForDay(inputDate) {
  return [
    new Date(
      inputDate.getFullYear(),
      inputDate.getMonth(),
      inputDate.getDate()
    ),
    new Date(
      inputDate.getFullYear(),
      inputDate.getMonth(),
      inputDate.getDate() + 1
    ),
  ];
}

/**
 * Get today's events from my calendar
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
export async function getTodaysEvents(auth) {
  const [timeMin, timeMax] = getTimeBoundsForDay(new Date());
  const calendar = google.calendar({ version: "v3", auth });
  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: "startTime",
  });
  return res.data.items;
}
