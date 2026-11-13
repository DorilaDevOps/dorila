"use strict";

function json(statusCode, body, extraHeaders){
  return {
    statusCode: statusCode,
    headers: Object.assign({
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }, extraHeaders || {}),
    body: JSON.stringify(body)
  };
}

function parseJsonBody(event){
  if (!event || !event.body) return { ok: false, error: "Falta el cuerpo del envío." };
  try {
    var raw = event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body;
    if (Buffer.byteLength(raw, "utf8") > 25000) return { ok: false, error: "El envío es demasiado grande." };
    var parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false, error: "El envío no tiene el formato esperado." };
    }
    return { ok: true, data: parsed };
  } catch (error){
    return { ok: false, error: "No pudimos leer el envío." };
  }
}

module.exports = { json: json, parseJsonBody: parseJsonBody };
