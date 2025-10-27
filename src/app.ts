import dotenv from "dotenv";

// Load biến môi trường
dotenv.config();
import express, { Application } from "express";
import Database from "../src/dbs/db.connect";
import apiRoutes from "../src/routes/teacher.business.route";
// Lấy instance của database
const db = Database.getInstance();

// Khai báo app
const app: Application = express();
app.use(express.json());
app.use("/api", apiRoutes);

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log("Database connected!");

    await db.sequelize.sync();
    console.log("Database Syncronized");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error: any) {
    console.error("Fail to connect to database", error.message);
    process.exit(1);
  }
})();

export default app;
