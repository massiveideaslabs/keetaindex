import { Request, Response } from 'express';
import pool from '../db/connection.js';
import { Report } from '../types.js';

export const getReports = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        app_id as "appId",
        app_name as "appName",
        reasons,
        timestamp
      FROM reports
      ORDER BY timestamp DESC
    `);

    const reports: Report[] = result.rows.map(row => ({
      id: row.id,
      appId: row.appId,
      appName: row.appName,
      reasons: row.reasons || [],
      timestamp: parseInt(row.timestamp.toString())
    }));

    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

export const addReport = async (req: Request, res: Response) => {
  try {
    const { appId, appName, reasons } = req.body;

    if (!appId || !appName || !reasons || !Array.isArray(reasons)) {
      return res.status(400).json({ error: 'Missing required fields: appId, appName, reasons' });
    }

    const newReport = {
      appId,
      appName,
      reasons,
      timestamp: Date.now()
    };

    const result = await pool.query(`
      INSERT INTO reports (app_id, app_name, reasons, timestamp)
      VALUES ($1, $2, $3, $4)
      RETURNING 
        id,
        app_id as "appId",
        app_name as "appName",
        reasons,
        timestamp
    `, [
      newReport.appId,
      newReport.appName,
      JSON.stringify(newReport.reasons),
      newReport.timestamp
    ]);

    const report: Report = {
      id: result.rows[0].id,
      appId: result.rows[0].appId,
      appName: result.rows[0].appName,
      reasons: result.rows[0].reasons || [],
      timestamp: parseInt(result.rows[0].timestamp.toString())
    };

    res.status(201).json(report);
  } catch (error) {
    console.error('Error adding report:', error);
    res.status(500).json({ error: 'Failed to add report' });
  }
};

export const deleteReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM reports WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
};

export const deleteReportsForApp = async (req: Request, res: Response) => {
  try {
    const { appId } = req.params;

    await pool.query('DELETE FROM reports WHERE app_id = $1', [appId]);

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting reports for app:', error);
    res.status(500).json({ error: 'Failed to delete reports for app' });
  }
};

