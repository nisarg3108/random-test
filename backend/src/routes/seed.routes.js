import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const router = express.Router();
const execAsync = promisify(exec);

router.post('/seed', async (req, res) => {
  const authHeader = req.headers.authorization;
  const seedKey = process.env.SEED_KEY || 'change-this-secret-key';
  
  if (authHeader !== `Bearer ${seedKey}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { stdout, stderr } = await execAsync('npm run seed');
    res.json({ success: true, output: stdout, errors: stderr });
  } catch (error) {
    res.status(500).json({ error: error.message, output: error.stdout, errors: error.stderr });
  }
});

export default router;
