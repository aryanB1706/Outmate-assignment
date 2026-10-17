export async function runResearch({ name, domain, objective }) {
  const response = await fetch("/api/research", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, domain, objective }),
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.error?.message || `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.code = data?.error?.code;
    error.status = response.status;
    throw error;
  }

  return data;
}
