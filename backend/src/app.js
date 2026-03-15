import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

dotenv.config();
connectDB();

const app = express();

const PORT = process.env.PORT || 3000;

// Cấu hình CORS
app.use(cors());

// Tạo lại __dirname do ES Module ("type": "module") ko có dir__name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/storage', express.static(path.join(__dirname, 'storage')));

app.use(express.json());

app.listen((PORT) => {
  console.log(`[SERVER] Server running on http://localhost:${PORT}`);
});
