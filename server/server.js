import express from "express";
import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";
const app = express();
import cors from "cors";
import multer from "multer";
import * as uploadthingServer from "uploadthing/server";
const { UTApi } = uploadthingServer;
import nodeFetch from "node-fetch";
const fetch = nodeFetch;
import { Webhook } from "svix";
import fs from "fs";

const port = process.env.PORT || 5001;

dotenv.config();

app.use(cors());

const utapi = new UTApi({
  token: process.env.UPLOADTHING_TOKEN,
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, PGSSLROOTCERT } = process.env;

const pool = new Pool({
  host: PGHOST,
  database: PGDATABASE,
  user: PGUSER,
  password: PGPASSWORD,
  port: 5432,
  ssl: PGSSLROOTCERT ? { ca: fs.readFileSync(PGSSLROOTCERT, "utf8") } : true,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client: ", err);
});

app.get("/", (req, res) => {
  res.send("Hello PlayAI!");
});

app.post("/users", express.json(), async (req, res) => {
  console.log("\n\n------------ users ------------\n\n");
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== process.env.API_KEY) {
    res.status(401).json({
      error: "Unauthorized",
    });
    return;
  } else {
    console.log("Authorized");
  }

  const userId = req.query.id;
  const email = req.query.email;

  const client = await pool.connect();
  try {
    const insertUserQuery = `INSERT INTO users (id, email) VALUES ($1, $2);`;
    const values = [userId, email];

    await client.query(insertUserQuery, values);
    console.log(`Succesfully added ${email} to db.`);
    res.status(200).json({
      content: `Succesfully added ${email} to db.`,
    });
  } catch (error) {
    console.error("Error caught: ", error);
    res.status(500).json({
      error: `Failed to add user ${email} to db.`,
    });
  } finally {
    client.release();
  }
});

app.post("/user-exists", express.json(), async (req, res) => {
  console.log("\n\n------------ user-exists ------------\n\n");
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== process.env.API_KEY) {
    res.status(401).json({
      error: "Unauthorized",
    });
    return;
  } else {
    console.log("Authorized");
  }

  const userId = req.query.id;
  const client = await pool.connect();
  try {
    const userExistsQuery = `
    SELECT *
    FROM users
    WHERE id = $1;
    `;
    const values = [userId];

    const userExistsResult = await client.query(userExistsQuery, values);

    console.log(userExistsResult.rows);
    console.log(
      "'userExistsResult.rows' length: ",
      userExistsResult.rows.length
    );

    const userInDb = userExistsResult.rows.length > 0 ? true : false;

    res.status(200).json({
      content: userInDb,
    });
  } catch (error) {
    console.error("Error looking up user:", error);
    res.status(500).json({
      error: `Failed to look up user in db.`,
    });
  } finally {
    client.release();
  }
});

app.post("/upload-pdf", upload.single("pdf"), async (req, res) => {
  console.log("\n\n------------ upload-pdf ------------\n\n");

  const apiKey = req.headers["x-api-key"];
  if (apiKey !== process.env.API_KEY) {
    res.status(401).json({
      error: "Unauthorized",
    });
    return;
  } else {
    console.log("Authorized");
  }

  if (!req.file) {
    return res.status(400).json({
      error: "No pdf file provided.",
    });
  }

  try {
    const fileData = new File([req.file.buffer], req.file.originalname, {
      type: req.file.mimetype,
    });

    const [result] = await utapi.uploadFiles([fileData]);

    if (!result?.data) {
      const reason = result?.error?.message || "Unknown UploadThing error";
      console.error("UploadThing upload failed: ", result?.error);
      return res.status(502).json({
        error: `Failed to upload pdf to uploadthing: ${reason}`,
      });
    }

    const response_body = {
      url: result.data.ufsUrl,
      key: result.data.key,
    };

    console.log("response_body: ", response_body);

    res.status(200).json({
      content: response_body,
    });
  } catch (error) {
    console.log("Error: ", error);
    res.status(500).json({
      error: `Failed to upload pdf to uploadthing.`,
    });
  }
});

app.post("/upload-pdf-metadata", express.json(), async (req, res) => {
  console.log("\n\n------------ upload-pdf-metadata ------------\n\n");

  const apiKey = req.headers["x-api-key"];
  if (apiKey !== process.env.API_KEY) {
    res.status(401).json({
      error: "Unauthorized",
    });
    return;
  } else {
    console.log("Authorized");
  }
  const client = await pool.connect();
  try {
    const { userId, pdf_key, pdf_name, pdf_url, pdf_text } = req.body;
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

app.post("/text-to-speech", express.json(), async (req, res) => {
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== process.env.API_KEY) {
    res.status(401).json({
      error: "Unauthorized",
    });
    return;
  } else {
    console.log("Authorized");
  }

  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({
        error: "No text provided",
      });
    }

    console.log(`Converting text to speech (${text.length} characters)...`);

    const { ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID } = process.env;
    if (!ELEVENLABS_API_KEY || !ELEVENLABS_VOICE_ID) {
      throw new Error("ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID must be set");
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
    stream.on("error", (err) => {
      console.error("Stream error:", err);
      // If we haven't sent headers yet, send an error response
      if (!res.headersSent) {
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
      res.status(500).json({
        error: `Failed to convert text to speech: ${error.message}`,
      });
    } else {
      res.end();
    }
  }
});

app.post("/list-pdfs", express.json(), async (req, res) => {
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== process.env.API_KEY) {
    res.status(401).json({
      error: "Unauthorized",
    });
    return;
  } else {
    console.log("Authorized");
  }
  const client = await pool.connect();

  try {
    const { userId } = req.body;
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

app.post("/delete-pdf", express.json(), async (req, res) => {
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== process.env.API_KEY) {
    res.status(401).json({
      error: "Unauthorized",
    });
    return;
  } else {
    console.log("Authorized");
  }

  const client = await pool.connect();

  try {
    const { id } = req.body;
    console.log("id: ", id);

    const deletePdfQuery = `
    DELETE FROM pdfs
    WHERE id = $1;
    `;
    const values = [id];

    const dbResponse = await client.query(deletePdfQuery, values);
    console.log("dbResponse: ", dbResponse);

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
