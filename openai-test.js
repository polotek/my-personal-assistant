import askAssistant from "./assistant/index.js";

const response = await askAssistant(
  "What time is it? Don't forget to specify AM or PM."
);

console.log(response.choices);
