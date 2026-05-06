import "server-only";

export type AssistantProvider = "gemini" | "groq" | "openai";
export type AssistantServerConfig = {
  apiKey: string;
  baseUrl: string;
  isConfigured: boolean;
  model: string;
  provider: AssistantProvider;
  reason: string | null;
  supportsPreviousResponseId: boolean;
};

const OPENAI_BASE_URL = "https://api.openai.com/v1";
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai";
const DEFAULT_OPENAI_MODEL = process.env.OPENAI_ASSISTANT_MODEL ?? "gpt-5.4-mini";
const DEFAULT_GROQ_MODEL = process.env.GROQ_ASSISTANT_MODEL ?? "openai/gpt-oss-20b";
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_ASSISTANT_MODEL ?? "gemini-2.5-flash";

const normalizeProvider = (value: string | undefined): AssistantProvider | null => {
  const normalized = value?.trim().toLowerCase();

  if (normalized === "gemini" || normalized === "groq" || normalized === "openai") {
    return normalized;
  }

  return null;
};

const buildProviderConfig = (
  provider: AssistantProvider,
  apiKey: string,
): AssistantServerConfig => {
  const model =
    provider === "groq"
      ? DEFAULT_GROQ_MODEL
      : provider === "gemini"
        ? DEFAULT_GEMINI_MODEL
        : DEFAULT_OPENAI_MODEL;
  const reason =
    apiKey.length > 0
      ? null
      : provider === "groq"
        ? "Missing GROQ_API_KEY in the server environment."
        : provider === "gemini"
          ? "Missing GEMINI_API_KEY in the server environment."
          : "Missing OPENAI_API_KEY in the server environment.";

  return {
    apiKey,
    baseUrl:
      provider === "groq"
        ? GROQ_BASE_URL
        : provider === "gemini"
          ? GEMINI_BASE_URL
          : OPENAI_BASE_URL,
    isConfigured: apiKey.length > 0,
    model,
    provider,
    reason,
    supportsPreviousResponseId: provider === "openai",
  };
};

export const getAssistantServerConfigs = (): AssistantServerConfig[] => {
  const configuredProvider = normalizeProvider(process.env.ASSISTANT_PROVIDER) ?? "groq";
  const openaiApiKey = process.env.OPENAI_API_KEY?.trim() ?? "";
  const groqApiKey = process.env.GROQ_API_KEY?.trim() ?? "";
  const geminiApiKey = process.env.GEMINI_API_KEY?.trim() ?? "";
  const preferredOrder: AssistantProvider[] =
    configuredProvider === "openai"
      ? ["openai", "groq", "gemini"]
      : configuredProvider === "gemini"
        ? ["gemini", "groq", "openai"]
        : ["groq", "openai", "gemini"];

  return preferredOrder.map((provider) =>
    buildProviderConfig(
      provider,
      provider === "groq"
        ? groqApiKey
        : provider === "gemini"
          ? geminiApiKey
          : openaiApiKey,
    ),
  );
};

export const getAssistantServerConfig = () => getAssistantServerConfigs()[0];
