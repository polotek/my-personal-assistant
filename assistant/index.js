import getClient from "./openai.js";

const openai = getClient();

const DEFAULT_PARAMS = {
  model: "gpt-3.5-turbo",
};
const system_role = "You are an assistant.";

const CHAT_FUNCTIONS = [
  {
    func: function (params) {
      return getLocalTime(params);
    },
    name: "get_current_time",
    description: "Get the current local time",
    parameters: {
      type: "object",
      properties: {},
    },
  },
];
const funcProperties = CHAT_FUNCTIONS.map(function (chatFunc) {
  chatFunc = { ...chatFunc };
  delete chatFunc.func;
  return chatFunc;
});

/**
 * Get the current local time in ISO8601 format.
 */
function getLocalTime(params) {
  const date = new Date();
  const offset = date.getTimezoneOffset() / 60;
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const time = new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      hours,
      minutes,
      seconds
    )
  );
  const iso = time.toISOString();
  const isoTime = iso.slice(0, -1) + (offset >= 0 ? "+" : "-");
  const isoOffset = String(offset * 100).padStart(4, "0");
  return isoTime + isoOffset;
}

function getChatFunction(choice) {
  return CHAT_FUNCTIONS.find(
    (func) => func.name === choice.message.function_call.name
  );
}

function execChatFunction(chatFunc, choice) {
  const args = JSON.parse(choice.message.function_call.arguments);
  return chatFunc.func(args);
}

function isFunctionCall(choice) {
  return choice.message.role === "assistant" && choice.message.function_call;
}

function shouldCallFunctions(choices) {
  return choices.some((choice) => isFunctionCall(choice));
}

/**
 * Execute all functions contained in the completion choices.
 * @param {*} prompt
 * @param {*} config
 * @returns
 */
function collectFunctionMessages(choices) {
  return choices
    .filter(isFunctionCall)
    .map(function (choice) {
      const chatFunc = getChatFunction(choice);
      if (!chatFunc) {
        throw new Error(
          `Invalid Chat function: ${choice.message.function_call}`
        );
      }

      return [
        choice.message,
        {
          role: "function",
          name: choice.message.function_call.name,
          content: execChatFunction(chatFunc, choice),
        },
      ];
    })
    .flat();
}

async function askAssistant(prompt, config) {
  config = config ? { ...DEFAULT_PARAMS, ...config } : DEFAULT_PARAMS;

  const messages = [
    {
      role: "system",
      content: system_role,
    },
    { role: "user", content: prompt },
  ];
  const payload = {
    ...config,
    messages,
    functions: funcProperties,
  };
  console.debug("Initial prompt:");
  console.debug(payload);
  let res = await openai.chat.completions.create(payload);

  console.debug("Initial response:");
  console.debug(res.choices);

  if (shouldCallFunctions(res.choices)) {
    const funcMessages = collectFunctionMessages(res.choices, config);
    console.debug("Completing chat with functions...");
    console.debug(funcMessages);
    messages.push(...funcMessages);
    res = await openai.chat.completions.create({
      ...config,
      messages: messages,
    });
  }

  return [res, messages];
}

export default askAssistant;
