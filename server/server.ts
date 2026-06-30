import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import ragRoutes from './routes/ragRoutes';
import { initializeDB } from './models/index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/api', ragRoutes);

app.use(express.static(path.join(__dirname, '../public/dist')));

app.get('*', (_, res) => {
  res.sendFile(path.join(__dirname, '../public/dist/index.html'));
});

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  try {
    await initializeDB();
  } catch (error) {
    console.error(
      'Failed to connect to database. Server will continue but database operations may fail.'
    );
  }
});
