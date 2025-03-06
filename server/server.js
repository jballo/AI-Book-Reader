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

const port = process.env.PORT || 5001;

dotenv.config();

app.use(cors());
app.use(express.json());

const utapi = new UTApi({
  token: process.env.UPLOADTHING_TOKEN,
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD } = process.env;

const pool = new Pool({
  host: PGHOST,
  database: PGDATABASE,
  user: PGUSER,
  password: PGPASSWORD,
  port: 5432,
  ssl: true,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client: ", err);
});

app.get("/", (req, res) => {
  res.send("Hello PlayAI!");
});

app.post("/users", async (req, res) => {
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
    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT NOT NULL);
    `;
    await client.query(createTableQuery);

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

app.post("/user-exists", async (req, res) => {
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

  try {
    const fileData = new File([req.file.buffer], req.file.originalname, {
      type: req.file.mimetype,
    });

    const response = await utapi.uploadFiles([fileData]);

    const response_body = {
      url: response[0].data.ufsUrl,
      key: response[0].data.key,
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

app.post("/upload-pdf-metadata", async (req, res) => {
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
    const { userId, pdf_key, pdf_url, pdf_text } = req.body;
    console.log("userId: ", userId);
    console.log("req body: ", req.body);

    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS pdfs (id TEXT PRIMARY KEY, url TEXT NOT NULL, uploader TEXT NOT NULL, text TEXT[] NOT NULL);
    `;

    await client.query(createTableQuery);

    const insertUserQuery = `INSERT INTO pdfs (id, url, uploader, text) VALUES ($1, $2, $3, $4);`;
    const values = [pdf_key, pdf_url, userId, pdf_text];

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

app.post("/text-to-speech", async (req, res) => {
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

    // Ensure proper headers
    const options = {
      method: "POST",
      headers: {
        AUTHORIZATION: process.env.PLAYAI_AUTH_KEY,
        "X-USER-ID": process.env.PLAYAI_USER_ID,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "PlayDialog",
        text: text,
        voice:
          "s3://voice-cloning-zero-shot/65977f5e-a22a-4b36-861b-ecede19bdd65/original/manifest.json",
        outputFormat: "mp3",
      }),
    };

    // Make the API call with direct streaming
    const playAIResponse = await fetch(
      "https://api.play.ai/api/v1/tts/stream",
      options
    );

    if (!playAIResponse.ok) {
      throw new Error(
        `PlayAI API error: ${playAIResponse.status} ${playAIResponse.statusText}`
      );
    }

    // Set proper headers for audio streaming
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Improve streaming by piping with error handling
    const stream = playAIResponse.body;

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

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
