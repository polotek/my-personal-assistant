import askAssistant from "./assistant/index.js";

const [response, messages] = await askAssistant(
  "What time is it? Don't forget to specify AM or PM."
);

console.log(messages);
console.log(response.choices);
