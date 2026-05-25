import express from "express";
import router from "./routes/product.route.js";
import "dotenv/config";

const app = express();

app.use(express.json());

app.use("/api", router);

app.get("/", (req, res) => {
  res.json({ message: "Welcome to E-Commerce API Gateway!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API Gateway berjalan di http://localhost:${PORT}`);
});
