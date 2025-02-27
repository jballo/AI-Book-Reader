const express = require("express");
const { Pool } = require("pg");
require("dotenv").config();
const app = express();
const cors = require("cors");
const multer = require("multer");
const { UTApi } = require("uploadthing/server");
const port = 5001;

app.use(cors());

const utapi = new UTApi({
  token: process.env.UPLOADTHING_TOKEN,
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD } = process.env;

const pool = new Pool({
  host: PGHOST,
  database: PGDATABASE,
  username: PGUSER,
  password: PGPASSWORD,
  port: 5432,
  ssl: {
    require: true,
  },
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
    const createTableResult = await client.query(createTableQuery);

    const insertUserQuery = `INSERT INTO users (id, email) VALUES ($1, $2);`;
    const values = [userId, email];

    const insertUserResult = await client.query(insertUserQuery, values);
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

    response_body = {
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

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
