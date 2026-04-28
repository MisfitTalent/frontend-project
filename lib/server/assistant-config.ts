import "server-only";

export type AssistantProvider = "groq" | "openai";

const OPENAI_BASE_URL = "https://api.openai.com/v1";
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_OPENAI_MODEL = process.env.OPENAI_ASSISTANT_MODEL ?? "gpt-5.4-mini";
const DEFAULT_GROQ_MODEL = process.env.GROQ_ASSISTANT_MODEL ?? "openai/gpt-oss-20b";

const normalizeProvider = (value: string | undefined): AssistantProvider | null => {
  const normalized = value?.trim().toLowerCase();

  if (normalized === "groq" || normalized === "openai") {
    return normalized;
  }

  return null;
};

export const getAssistantServerConfig = () => {
  const configuredProvider = normalizeProvider(process.env.ASSISTANT_PROVIDER);
  const openaiApiKey = process.env.OPENAI_API_KEY?.trim() ?? "";
  const groqApiKey = process.env.GROQ_API_KEY?.trim() ?? "";
  const provider =
    configuredProvider ??
    (groqApiKey && !openaiApiKey ? "groq" : "openai");
  const apiKey = provider === "groq" ? groqApiKey : openaiApiKey;
  const model = provider === "groq" ? DEFAULT_GROQ_MODEL : DEFAULT_OPENAI_MODEL;
  const reason =
    apiKey.length > 0
      ? null
      : provider === "groq"
        ? "Missing GROQ_API_KEY in the server environment."
        : "Missing OPENAI_API_KEY in the server environment.";

  return {
    apiKey,
    baseUrl: provider === "groq" ? GROQ_BASE_URL : OPENAI_BASE_URL,
    isConfigured: apiKey.length > 0,
    model,
    provider,
    reason,
    supportsPreviousResponseId: provider === "openai",
  };
};
