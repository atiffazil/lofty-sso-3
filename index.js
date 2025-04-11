const express = require("express");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 🛠 Load your RSA private key
const PRIVATE_KEY = fs.readFileSync("./private_key.pem", "utf8");

const BASE_URL = "https://crm.blok.co";
const LOFTY_ENDPOINT =
  "https://crm.lofty.com/api/user-account/lofty/sso/login?biz=blok";

// 🔑 SSO token endpoint
app.post("/generate-lofty-token", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const payload = {
      userAccount: email,
    };

    const token = jwt.sign(payload, PRIVATE_KEY, {
      algorithm: "RS256",
      expiresIn: "5d", // 5 days
    });

    const ssoUrl = `${LOFTY_ENDPOINT}&token=${token}`;

    // 💥 Hit Lofty SSO and follow redirects manually
    const response = await axios.get(ssoUrl, {
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400,
    });

    const redirectUrl = response.headers.location || BASE_URL;

    return res.json({ redirectUrl });
  } catch (error) {
    console.error("SSO Error:", error.message);
    return res.json({ redirectUrl: BASE_URL });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔐 Lofty SSO backend running on port ${PORT}`);
});
