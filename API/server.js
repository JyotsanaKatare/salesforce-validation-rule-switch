
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import jsforce from "jsforce";

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
  })
);

app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.post("/api/validation-rules", async (req, res) => {
  const { accessToken, instanceUrl } = req.body;

  if (!accessToken || !instanceUrl) {
    return res.status(400).json({ error: "Access token or instance URL missing" });
  }

  try {
    const connection = new jsforce.Connection({
      instanceUrl,
      accessToken,
    });

    const rules = await connection.metadata.list(
      { type: "ValidationRule" },
      "57.0"
    );

    const formattedRules = Array.isArray(rules)
      ? rules.map((rule) => ({
          ValidationName: rule.fullName,
          Active: rule.active || false,
          Description: rule.description || "",
        }))
      : [];

    res.json({ rules: formattedRules });
  } catch (error) {
    console.error("Salesforce Metadata API error:", error);

    if (error.message?.includes("INVALID_SESSION_ID")) {
      res.status(401).json({ error: "Session expired. Please login again." });
    } else {
      res.status(500).json({ error: error.message || "Unknown backend error" });
    }
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Backend running on port ${PORT}`)
);
