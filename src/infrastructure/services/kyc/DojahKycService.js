const { AppError } = require("../../../shared/errors/AppError");

class DojahKycService {
  constructor({ baseUrl, appId, secretKey }) {
    this.baseUrl = stripTrailingSlash(baseUrl || "https://api.dojah.io");
    this.appId = appId;
    this.secretKey = secretKey;
  }

  async lookupNin(nin) {
    this.assertConfigured();

    const url = new URL(`${this.baseUrl}/api/v1/kyc/nin`);
    url.searchParams.set("nin", nin);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        AppId: this.appId,
        Authorization: this.secretKey
      }
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new AppError("NIN verification failed", response.status >= 500 ? 502 : 400, {
        details: {
          provider: "dojah",
          statusCode: response.status,
          response: payload
        }
      });
    }

    if (!payload?.entity?.first_name || !payload?.entity?.last_name) {
      throw new AppError("NIN could not be verified", 422, {
        details: {
          provider: "dojah",
          response: payload
        }
      });
    }

    return payload.entity;
  }

  async checkLiveness(image) {
    this.assertConfigured();

    const response = await fetch(`${this.baseUrl}/api/v1/ml/liveness/`, {
      method: "POST",
      headers: {
        AppId: this.appId,
        Authorization: this.secretKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ image })
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new AppError("Liveness verification failed", response.status >= 500 ? 502 : 400, {
        details: {
          provider: "dojah",
          statusCode: response.status,
          response: payload
        }
      });
    }

    if (!payload?.entity?.liveness) {
      throw new AppError("Liveness verification returned an invalid response", 502, {
        details: {
          provider: "dojah",
          response: payload
        }
      });
    }

    return payload.entity;
  }

  assertConfigured() {
    if (!this.appId || !this.secretKey) {
      throw new AppError("Dojah KYC is not configured", 503);
    }
  }
}

async function readJson(response) {
  try {
    return await response.json();
  } catch (_error) {
    return {};
  }
}

function stripTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

module.exports = { DojahKycService };
