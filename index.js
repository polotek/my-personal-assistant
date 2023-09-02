import express from "express";
import askAssistant from "./assistant/index.js";

const app = express();
app.set("view engine", "squirrelly");

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/time", async (req, res, next) => {
  const prompt = "What time is it? Don't forget to specify AM or PM.";
  askAssistant(prompt)
    .then(([response, messages]) => [response.choices, messages])
    .then(([choices, messages]) => {
      console.log(choices);
      res.send(choices[0].message.content);
    })
    .catch(next);
});

app.get("/time/:timezone", async (req, res, next) => {
  const prompt = `What time is it in ${req.params.timezone}?`;
  askAssistant(prompt)
    .then(([response, messages]) => [response.choices, messages])
    .then(([choices, messages]) => {
      const content = `${messages[1].content}
      
      ${choices[0].message.content}`;
      res.send(content);
    })
    .catch(next);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});
