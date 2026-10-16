import "dotenv/config";

function warnMissing(name) {
  console.warn(
    `[config] ${name} is not set. Related features will fall back or be unavailable.`
  );
}

function readEnv(name, fallback) {
  const value = process.env[name];
  return value === undefined || value === "" ? fallback : value;
}

export const config = {
  nodeEnv: readEnv("NODE_ENV", "development"),
  port: Number(readEnv("PORT", 4000)),
  exaApiKey: readEnv("EXA_API_KEY"),
  moltsetsApiKey: readEnv("MOLTSETS_API_KEY"),
  enrichmentMode: readEnv("ENRICHMENT_MODE", "mock"),
};

if (!config.exaApiKey) {
  warnMissing("EXA_API_KEY");
}

export default config;
