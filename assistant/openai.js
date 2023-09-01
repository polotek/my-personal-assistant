import OpenAI from "openai";

const DEFAULT_CONFIG = {
  apiKey: process.env.OPENAI_API_KEY,
};

export default function (config_overrides = {}) {
  const config = {
    ...DEFAULT_CONFIG,
    ...config_overrides,
  };

  return new OpenAI(config);
}
