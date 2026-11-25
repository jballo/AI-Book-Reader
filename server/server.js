import express from "express";
import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";
const app = express();
import cors from "cors";
import * as uploadthingServer from "uploadthing/server";
const { UTApi, UploadThingError, createUploadthing, createRouteHandler } = uploadthingServer;
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import nodeFetch from "node-fetch";
const fetch = nodeFetch;
import { Webhook } from "svix";
import fs from "fs";
import { verifyToken } from "@clerk/backend";
import { decodeJwt } from "@clerk/backend/jwt";
import { createClient } from "redis";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";

const port = process.env.PORT || 5001;

dotenv.config();

let redisConnected = false;
const redis = createClient({
  url: process.env.REDIS_URL,
  disableOfflineQueue: true,
  socket: {
    reconnectStrategy: (retries, cause) => (redisConnected ? Math.min(retries * 100, 3000) : cause),
  },
});
redis.on("error", (error) => {
  console.error("Redis error: ", error?.message || error?.code);
});

try {
  await redis.connect();
  redisConnected = true;
} catch {
  console.error("Failed to connect to Redis. Check REDIS_URL.");
  process.exit(1);
}

const TTS_MAX_CHARS = Number(process.env.TTS_MAX_CHARS) || 5000;
const TTS_DAILY_CHAR_BUDGET = Number(process.env.TTS_DAILY_CHAR_BUDGET) || 20000;
const TTS_BUDGET_TTL_SECONDS = 2 * 24 * 60 * 60;
const SERVICE_UNAVAILABLE = "Service temporarily unavailable. Try again shortly.";
const REDIS_REPLY_TIMEOUT_MS = 1000;

const withRedisTimeout = (command) => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("Redis did not reply in time")), REDIS_REPLY_TIMEOUT_MS);
  });
  return Promise.race([command, timeout]).finally(() => clearTimeout(timer));
};

const pluralize = (count, unit) => `${count} ${unit}${count === 1 ? "" : "s"}`;

const formatWait = (seconds) => {
  if (seconds <= 90) return pluralize(Math.max(seconds, 1), "second");
  if (seconds <= 90 * 60) return pluralize(Math.ceil(seconds / 60), "minute");
  return pluralize(Math.ceil(seconds / 3600), "hour");
};

const secondsUntil = (date) => Math.max(Math.ceil((date.getTime() - Date.now()) / 1000), 0);

const createUserLimiter = ({ prefix, windowMs, limit, failOpen, skip }) => {
  const limiter = rateLimit({
    windowMs,
    limit,
    skip,
    keyGenerator: (req) => req.userId,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    passOnStoreError: failOpen,
    message: (req) => ({
      error: `Too many requests. Try again in ${formatWait(secondsUntil(req.rateLimit.resetTime))}.`,
    }),
    store: new RedisStore({
      prefix: `rl:${prefix}:`,
      sendCommand: (...args) => withRedisTimeout(redis.sendCommand(args)),
    }),
  });
  return (req, res, next) =>
    limiter(req, res, (error) => {
      if (!error) return next();
      console.error(`Rate limiter ${prefix} failed: `, error?.message);
      if (!res.headersSent) res.status(503).json({ error: SERVICE_UNAVAILABLE });
    });
};

const ttsLimiter = createUserLimiter({ prefix: "tts", windowMs: 60 * 1000, limit: 10, failOpen: false });
const uploadLimiter = createUserLimiter({
  prefix: "upload",
  windowMs: 10 * 60 * 1000,
  limit: 10,
  failOpen: false,
  skip: (req) => !req.userId,
});
const metadataLimiter = createUserLimiter({ prefix: "metadata", windowMs: 10 * 60 * 1000, limit: 10, failOpen: false });
const libraryLimiter = createUserLimiter({ prefix: "library", windowMs: 60 * 1000, limit: 60, failOpen: true });

const SESSION_TOKEN_CATEGORY = "cl_B7d4PD111AAA";
const parseOrigins = (value) =>
  (value || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
const authorizedParties = parseOrigins(process.env.CLERK_AUTHORIZED_PARTIES);
const corsOrigins = parseOrigins(process.env.CORS_ORIGINS);

const verifySessionToken = async (authorization) => {
  const token = authorization?.match(/^Bearer (\S+)$/)?.[1];
  if (!token || decodeJwt(token).header.cat !== SESSION_TOKEN_CATEGORY) {
    throw new Error("Not a session token");
  }
  const claims = await verifyToken(token, {
    jwtKey: process.env.CLERK_JWT_KEY,
    authorizedParties,
  });
  if (claims.sts === "pending" || !claims.sid || !claims.sub) {
    throw new Error("Session is not active");
  }
  return claims.sub;
};

const requireUser = async (req, res, next) => {
  try {
    req.userId = await verifySessionToken(req.headers.authorization);
  } catch (error) {
    console.error("Session token rejected: ", error?.reason || error?.message);
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

const identifyUploader = async (req, res, next) => {
  if (req.headers.authorization) {
    req.userId = await verifySessionToken(req.headers.authorization).catch(() => undefined);
  }
  next();
};

app.use(cors({ origin: corsOrigins }));

const utapi = new UTApi({
  token: process.env.UPLOADTHING_TOKEN,
});

const f = createUploadthing();

const uploadRouter = {
  pdfUploader: f({ pdf: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      try {
        return { userId: await verifySessionToken(req.headers.get("authorization")) };
      } catch (error) {
        console.error("Session token rejected: ", error?.reason || error?.message);
        throw new UploadThingError({ code: "FORBIDDEN", message: "Unauthorized" });
      }
    })
    .onUploadComplete(({ metadata, file }) => {
      console.log("Upload complete: ", { userId: metadata.userId, key: file.key });
    }),
};

const handleUploadthing = createRouteHandler({ router: uploadRouter });

app.all("/api/uploadthing", identifyUploader, uploadLimiter, express.text({ type: "*/*" }), async (req, res) => {
  try {
    const proto = req.headers["x-forwarded-proto"] ?? "http";
    const host = req.headers["x-forwarded-host"] ?? req.headers.host;
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      headers.set(key, Array.isArray(value) ? value.join(",") : value);
    }
    const request = new Request(new URL(req.originalUrl, `${proto}://${host}`), {
      method: req.method,
      headers,
      body: ["POST", "PUT", "PATCH"].includes(req.method) && typeof req.body === "string" ? req.body : undefined,
    });
    const response = await handleUploadthing(request);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    if (response.body) await pipeline(Readable.fromWeb(response.body), res);
    else res.end();
  } catch (error) {
    console.error("UploadThing request failed: ", error?.message);
    if (!res.headersSent) res.status(400).json({ error: "Bad request" });
  }
});

const { PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD, PGSSLROOTCERT, PGSSL_REJECT_UNAUTHORIZED } = process.env;

const pool = new Pool({
  host: PGHOST,
  database: PGDATABASE,
  user: PGUSER,
  password: PGPASSWORD,
  port: PGPORT,
  ssl:
    PGSSL_REJECT_UNAUTHORIZED === "false"
      ? { rejectUnauthorized: false }
      : PGSSLROOTCERT
        ? { ca: fs.readFileSync(PGSSLROOTCERT, "utf8") }
        : true,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client: ", err);
});

app.get("/", (req, res) => {
  res.send("Hello PlayAI!");
});

app.post("/upload-pdf-metadata", requireUser, metadataLimiter, express.json({ limit: "5mb" }), async (req, res) => {
  console.log("\n\n------------ upload-pdf-metadata ------------\n\n");

  const client = await pool.connect();
  try {
    const { pdf_key, pdf_name, pdf_url, pdf_text } = req.body;
    const userId = req.userId;
    console.log("userId: ", userId);
    console.log("req body: ", req.body);
    // Sanitize the pdf_text array to remove null bytes from each string
    const sanitizedText = pdf_text.map((text) => text.replace(/\0/g, ""));

    const insertUserQuery = `INSERT INTO pdfs (id, name, url, uploader, text) VALUES ($1, $2, $3, $4, $5);`;
    const values = [pdf_key, pdf_name, pdf_url, userId, sanitizedText];

    await client.query(insertUserQuery, values);
    console.log(`Succesfully uploaded pdf metadata to db.`);

    res.status(200).json({
      content: true,
    });
  } catch (error) {
    console.log("Error: ", error);
    res.status(500).json({
      error: `Failed to upload pdf metadata to db.`,
    });
  } finally {
    client.release();
  }
});

app.post("/text-to-speech", requireUser, ttsLimiter, express.json(), async (req, res) => {
  const budgetKey = `tts:chars:${req.userId}:${new Date().toISOString().slice(0, 10)}`;
  let chargedChars = 0;
  const refundBudget = async () => {
    if (!chargedChars) return;
    const amount = chargedChars;
    chargedChars = 0;
    await withRedisTimeout(redis.decrBy(budgetKey, amount)).catch((error) => {
      console.error("TTS budget refund failed: ", error?.message);
    });
  };

  try {
    const { text } = req.body;
    if (typeof text !== "string" || !text) {
      return res.status(400).json({
        error: "No text provided",
      });
    }
    if (text.length > TTS_MAX_CHARS) {
      return res.status(400).json({
        error: `Text is too long. The limit is ${TTS_MAX_CHARS} characters.`,
      });
    }

    console.log(`Converting text to speech (${text.length} characters)...`);

    const { ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID } = process.env;
    if (!ELEVENLABS_API_KEY || !ELEVENLABS_VOICE_ID) {
      throw new Error("ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID must be set");
    }

    let usedChars;
    try {
      await withRedisTimeout(
        redis.set(budgetKey, 0, {
          expiration: { type: "EX", value: TTS_BUDGET_TTL_SECONDS },
          condition: "NX",
        })
      );
      chargedChars = text.length;
      usedChars = await withRedisTimeout(redis.incrBy(budgetKey, text.length));
    } catch (error) {
      console.error("TTS budget check failed: ", error?.message);
      await refundBudget();
      return res.status(503).json({ error: SERVICE_UNAVAILABLE });
    }

    if (usedChars > TTS_DAILY_CHAR_BUDGET) {
      await refundBudget();
      const now = new Date();
      const nextUtcDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
      const waitSeconds = secondsUntil(nextUtcDay);
      res.setHeader("Retry-After", String(waitSeconds));
      return res.status(429).json({
        error: `Daily text-to-speech limit reached. Try again in ${formatWait(waitSeconds)}.`,
      });
    }

    const ttsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(
        ELEVENLABS_VOICE_ID
      )}/stream?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2",
        }),
      }
    );

    if (!ttsResponse.ok) {
      const detail = await ttsResponse.text().catch(() => "");
      throw new Error(
        `ElevenLabs API error: ${ttsResponse.status} ${ttsResponse.statusText} ${detail}`.trim()
      );
    }

    // Set proper headers for audio streaming
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Improve streaming by piping with error handling
    const stream = ttsResponse.body;

    // Handle stream errors
    stream.on("error", async (err) => {
      console.error("Stream error:", err);
      // If we haven't sent headers yet, send an error response
      if (!res.headersSent) {
        await refundBudget();
        res.status(500).json({
          error: `Streaming error: ${err.message}`,
        });
      } else {
        // Otherwise just end the response
        res.end();
      }
    });

    // Use pipe for efficient streaming
    stream.pipe(res).on("error", (err) => {
      console.error("Pipe error:", err);
    });

    console.log("Audio stream started");
  } catch (error) {
    console.error("Error during text-to-speech conversion:", error);
    if (!res.headersSent) {
      await refundBudget();
      res.status(500).json({
        error: `Failed to convert text to speech: ${error.message}`,
      });
    } else {
      res.end();
    }
  }
});

app.post("/list-pdfs", express.json(), requireUser, libraryLimiter, async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.userId;
    console.log("userId: ", userId);

    const pdfListQuery = `
    SELECT id AS key, name, url, text 
    FROM pdfs
    WHERE uploader = $1;
    `;
    const values = [userId];

    const { rows } = await client.query(pdfListQuery, values);
    console.log("rows: ", rows);

    res.status(200).json({
      content: rows,
    });
  } catch (error) {
    console.error("Error: ", error);
    res.status(500).json({
      error: `Failed to retrieve list of pdfs`,
    });
  } finally {
    client.release();
  }
});

app.post("/delete-pdf", express.json(), requireUser, libraryLimiter, async (req, res) => {
  const { id } = req.body ?? {};
  if (typeof id !== "string" || id.length === 0) {
    return res.status(400).json({
      error: "Invalid id.",
    });
  }

  const client = await pool.connect();

  try {
    const userId = req.userId;
    console.log("id: ", id);

    const deletePdfQuery = `
    DELETE FROM pdfs
    WHERE id = $1 AND uploader = $2;
    `;
    const values = [id, userId];

    const dbResponse = await client.query(deletePdfQuery, values);
    console.log("dbResponse: ", dbResponse);

    if (dbResponse.rowCount === 0) {
      return res.status(404).json({
        error: "PDF not found.",
      });
    }

    const uploadthingResponse = await utapi.deleteFiles(id);

    console.log("uploadthingResponse: ", uploadthingResponse);

    res.status(200).json({
      content: "Successfully deleted pdf.",
    });
  } catch (error) {
    console.error("Error: ", error);
    res.status(500).json({
      error: `Failed to delete pdf`,
    });
  } finally {
    client.release();
  }
});

app.post(
  "/webhooks/clerk",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    let client;
    try {
      const webhookSecret = process.env.CLERK_WEBHOOK_SECRET || "";

      if (!webhookSecret) {
        console.log("CLERK_WEBHOOK_SECRET is not set");
        return res
          .status(500)
          .json({ error: "CLERK_WEBHOOK_SECRET is not set" });
      }

      const svixId = req.headers["svix-id"];
      const svixTimestamp = req.headers["svix-timestamp"];
      const svixSignature = req.headers["svix-signature"];

      if (!svixId || !svixTimestamp || !svixSignature) {
        console.log("Missing Svix headers");
        return res.status(400).send("Missing Svix headers");
      }

      const body = req.body.toString();
      const wh = new Webhook(webhookSecret);
      const evt = wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      });

      const { data, type } = evt;

      switch (type) {
        case "user.created":
          console.log("User created event!");
          const email = data.email_addresses[0].email_address;
          const userId = data.id;
          console.log("email_address: ", email);
          console.log("id: ", userId);

          client = await pool.connect();

          const insertUserQuery = `INSERT INTO users (id, email) VALUES ($1, $2);`;
          const values = [userId, email];
          await client.query(insertUserQuery, values);
          console.log(`Succesfully added ${email} to db.`);
          res.status(200).json({
            content: `Succesfully added ${email} to db.`,
          });
          break;

        default:
          console.log("Unhanled event type: ", type);
          res.status(200).json({ success: true });
          break;
      }
    } catch (error) {
      console.error("Webhook error: ", error);
      res.status(200).json({ error: `Webhook Error: ${error.message}` });
    } finally {
      if (client) {
        client.release();
        console.log("Client released.");
      }
    }
  }
);

async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS pdfs (id TEXT PRIMARY KEY, name TEXT NOT NULL, url TEXT NOT NULL, uploader TEXT NOT NULL, text TEXT[] NOT NULL);
    CREATE INDEX IF NOT EXISTS pdfs_uploader_idx ON pdfs (uploader);
  `);
}

initDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database: ", err);
    process.exit(1);
  });
