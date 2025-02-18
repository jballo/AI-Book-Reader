const express = require("express");
const app = express();
const port = 5001;

app.get("/", (req, res) => {
  res.send("Hello PlayAI!");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
