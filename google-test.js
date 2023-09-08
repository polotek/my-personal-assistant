import { authorize, getTodaysEvents } from "./integrations/google.js";

authorize().then(getTodaysEvents).then(console.log);
