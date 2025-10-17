import { Router, Request, Response } from 'express';
import pool from './database';

const router = Router();

// GET /api/regulations - Get all regulations (with optional filters)
router.get('/regulations', async (req: Request, res: Response) => {
  try {
    const { standard, section, keyword } = req.query;

    let query = 'SELECT * FROM regulations WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    // Filter by standard
    if (standard) {
      query += ` AND standard = $${paramCount}`;
      params.push(standard);
      paramCount++;
    }

    // Filter by section number
    if (section) {
      query += ` AND section_number = $${paramCount}`;
      params.push(section);
      paramCount++;
    }

    // Search by keyword (case-insensitive)
    if (keyword) {
      query += ` AND (title ILIKE $${paramCount} OR content ILIKE $${paramCount})`;
      params.push(`%${keyword}%`);
      paramCount++;
    }

    query += ' ORDER BY section_number';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('❌ Error fetching regulations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch regulations',
    });
  }
});

// GET /api/regulations/:id - Get single regulation by ID
router.get('/regulations/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM regulations WHERE id = $1', [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Regulation not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('❌ Error fetching regulation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch regulation',
    });
  }
});

// GET /api/standards - Get list of available standards
router.get('/standards', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT standard, COUNT(*) as section_count FROM regulations GROUP BY standard ORDER BY standard'
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('❌ Error fetching standards:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch standards',
    });
  }
});

// GET /api/health - Health check endpoint
router.get('/health', async (req: Request, res: Response) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      success: true,
      message: 'API is healthy',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Database connection failed',
    });
  }
});

export default router;
