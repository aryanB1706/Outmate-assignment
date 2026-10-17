import { Router } from "express";
import { runResearch } from "../services/researchService.js";
import { AppError, ERROR_CODES } from "../utils/errors.js";

const router = Router();

export function normalizeDomain(raw) {
  if (raw == null) return null;
  let domain = String(raw).trim();
  if (!domain) return null;

  domain = domain.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
  domain = domain.replace(/^www\./i, "");
  domain = domain.split(/[/?#]/)[0];
  domain = domain.replace(/\.+$/, "").toLowerCase();

  return domain || null;
}

function readString(value, fieldName) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, `${fieldName} must be a string`);
  }
  const trimmed = value.trim();
  return trimmed || undefined;
}

router.post("/", async (req, res, next) => {
  try {
    const body = req.body ?? {};

    const name = readString(body.name, "name");
    const domainRaw = readString(body.domain, "domain");
    const objective = readString(body.objective, "objective");

    if (!name && !domainRaw) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "At least one of 'name' or 'domain' is required"
      );
    }

    if (objective && objective.length > 500) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "'objective' must be 500 characters or fewer"
      );
    }

    const domain = normalizeDomain(domainRaw);
    if (domainRaw && !domain) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "'domain' is not a valid domain");
    }

    const report = await runResearch({ name, domain, objective });
    res.json(report);
  } catch (err) {
    next(err);
  }
});

export default router;
