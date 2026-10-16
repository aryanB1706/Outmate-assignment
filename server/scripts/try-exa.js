import { researchCompany } from "../src/providers/exa/exaAdapter.js";

const [name, domain, ...objectiveParts] = process.argv.slice(2);
const targetName = name || "Stripe";
const targetDomain = domain || "stripe.com";
const objective = objectiveParts.join(" ") || undefined;

try {
  const output = await researchCompany({
    name: targetName,
    domain: targetDomain,
    objective,
  });
  console.log(JSON.stringify(output, null, 2));
} catch (err) {
  console.error(`Exa research failed [${err?.code ?? "UNKNOWN"}]: ${err?.message ?? err}`);
  process.exit(1);
}
