import express from "express";
import askAssistant from "./assistant/index.js";

const app = express();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/time", async (req, res, next) => {
  const prompt = "What time is it? Don't forget to specify AM or PM.";
  askAssistant(prompt)
    .then((response) => response.choices)
    .then((choices) => {
      console.log(choices);
      res.send(choices[0].message.content);
    })
    .catch(next);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});
