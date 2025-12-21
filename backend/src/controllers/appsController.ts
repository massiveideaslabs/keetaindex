import { Request, Response } from 'express';
import pool from '../db/connection.js';
import { AppItem, SubmissionData } from '../types.js';

export const getApps = async (_req: Request, res: Response) => {
  try {
    // Only return approved apps for public view
    const result = await pool.query(`
      SELECT 
        id,
        name,
        description,
        url,
        category,
        tags,
        added_at as "addedAt",
        clicks,
        featured,
        approved
      FROM apps
      WHERE approved = true
      ORDER BY added_at DESC
    `);

    const apps: AppItem[] = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      url: row.url,
      category: row.category,
      tags: row.tags || [],
      addedAt: parseInt(row.addedAt.toString()),
      clicks: row.clicks || 0,
      featured: row.featured || false,
      approved: row.approved || false
    }));

    res.json(apps);
  } catch (error) {
    console.error('Error fetching apps:', error);
    res.status(500).json({ error: 'Failed to fetch apps' });
  }
};

// Get all apps (including unapproved) for admin
export const getAllApps = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        description,
        url,
        category,
        tags,
        added_at as "addedAt",
        clicks,
        featured,
        approved
      FROM apps
      ORDER BY added_at DESC
    `);

    const apps: AppItem[] = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      url: row.url,
      category: row.category,
      tags: row.tags || [],
      addedAt: parseInt(row.addedAt.toString()),
      clicks: row.clicks || 0,
      featured: row.featured || false,
      approved: row.approved || false
    }));

    res.json(apps);
  } catch (error) {
    console.error('Error fetching all apps:', error);
    res.status(500).json({ error: 'Failed to fetch apps' });
  }
};

export const addApp = async (req: Request, res: Response) => {
  try {
    const data: SubmissionData = req.body;
    
    if (!data.name || !data.description || !data.url || !data.category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newApp = {
      ...data,
      tags: ['New', 'Community'],
      addedAt: Date.now(),
      clicks: 0,
      featured: false,
      approved: false // New submissions require approval
    };

    const result = await pool.query(`
      INSERT INTO apps (name, description, url, category, tags, added_at, clicks, featured, approved)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING 
        id,
        name,
        description,
        url,
        category,
        tags,
        added_at as "addedAt",
        clicks,
        featured,
        approved
    `, [
      newApp.name,
      newApp.description,
      newApp.url,
      newApp.category,
      JSON.stringify(newApp.tags),
      newApp.addedAt,
      newApp.clicks,
      newApp.featured,
      newApp.approved
    ]);

    const app: AppItem = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      description: result.rows[0].description,
      url: result.rows[0].url,
      category: result.rows[0].category,
      tags: result.rows[0].tags || [],
      addedAt: parseInt(result.rows[0].addedAt.toString()),
      clicks: result.rows[0].clicks || 0,
      featured: result.rows[0].featured || false,
      approved: result.rows[0].approved || false
    };

    res.status(201).json(app);
  } catch (error) {
    console.error('Error adding app:', error);
    res.status(500).json({ error: 'Failed to add app' });
  }
};

export const updateApp = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Build dynamic update query
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(updates.description);
    }
    if (updates.url !== undefined) {
      fields.push(`url = $${paramCount++}`);
      values.push(updates.url);
    }
    if (updates.category !== undefined) {
      fields.push(`category = $${paramCount++}`);
      values.push(updates.category);
    }
    if (updates.tags !== undefined) {
      fields.push(`tags = $${paramCount++}`);
      values.push(JSON.stringify(updates.tags));
    }
    if (updates.featured !== undefined) {
      fields.push(`featured = $${paramCount++}`);
      values.push(updates.featured);
    }
    if (updates.approved !== undefined) {
      fields.push(`approved = $${paramCount++}`);
      values.push(updates.approved);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);

    const result = await pool.query(`
      UPDATE apps
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING 
        id,
        name,
        description,
        url,
        category,
        tags,
        added_at as "addedAt",
        clicks,
        featured,
        approved
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'App not found' });
    }

    const app: AppItem = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      description: result.rows[0].description,
      url: result.rows[0].url,
      category: result.rows[0].category,
      tags: result.rows[0].tags || [],
      addedAt: parseInt(result.rows[0].addedAt.toString()),
      clicks: result.rows[0].clicks || 0,
      featured: result.rows[0].featured || false,
      approved: result.rows[0].approved || false
    };

    res.json(app);
  } catch (error) {
    console.error('Error updating app:', error);
    res.status(500).json({ error: 'Failed to update app' });
  }
};

export const deleteApp = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM apps WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'App not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting app:', error);
    res.status(500).json({ error: 'Failed to delete app' });
  }
};

export const incrementAppClicks = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      UPDATE apps
      SET clicks = clicks + 1
      WHERE id = $1
      RETURNING clicks
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'App not found' });
    }

    res.json({ clicks: result.rows[0].clicks });
  } catch (error) {
    console.error('Error incrementing clicks:', error);
    res.status(500).json({ error: 'Failed to increment clicks' });
  }
};

export const approveApp = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { approved } = req.body;

    if (typeof approved !== 'boolean') {
      return res.status(400).json({ error: 'approved must be a boolean' });
    }

    const result = await pool.query(`
      UPDATE apps
      SET approved = $1
      WHERE id = $2
      RETURNING 
        id,
        name,
        description,
        url,
        category,
        tags,
        added_at as "addedAt",
        clicks,
        featured,
        approved
    `, [approved, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'App not found' });
    }

    const app: AppItem = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      description: result.rows[0].description,
      url: result.rows[0].url,
      category: result.rows[0].category,
      tags: result.rows[0].tags || [],
      addedAt: parseInt(result.rows[0].addedAt.toString()),
      clicks: result.rows[0].clicks || 0,
      featured: result.rows[0].featured || false,
      approved: result.rows[0].approved || false
    };

    res.json(app);
  } catch (error) {
    console.error('Error approving app:', error);
    res.status(500).json({ error: 'Failed to approve app' });
  }
};

