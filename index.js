import express from "express";
import askAssistant from "./assistant/index.js";

function validateInput(input) {
  if (!input) {
    return null;
  }

  input = input.trim();
  if (input && /^[a-zA-Z0-9_-\s]+$/.test(input)) {
    return input;
  }

  return null;
}

const app = express();
app.set("view engine", "squirrelly");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", function (req, res) {
  res.send("Hello World!");
});

app.get("/time", function (req, res, next) {
  const loc = validateInput(req.query.loc);
  const addendum = loc ? ` in ${loc}` : "";
  const prompt = `What time is it${addendum}? Don't forget to specify AM or PM.`;
  askAssistant(prompt)
    .then(([response, messages]) => [response.choices, messages])
    .then(([choices, messages]) => {
      res.render("time", {
        prompt: messages[1].content,
        response: choices[0].message.content,
      });
    })
    .catch(next);
});

app.get("/schedule", function (req, res, next) {
  res.render("time", {
    prompt: "Give me a summary of my schedule for today.",
    response: "",
  });
});

app.post("/schedule", function (req, res, next) {
  const prompt = req.body.prompt;

  return askAssistant(prompt)
    .then(([response, messages]) => [response.choices, messages])
    .then(([choices, messages]) => {
      res.render("time", {
        prompt: messages[1].content,
        response: choices[0].message.content,
      });
    })
    .catch(next);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log(`Server listening on port ${PORT}...`);
});
