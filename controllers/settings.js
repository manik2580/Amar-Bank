/**
 * Settings Controller for MyBank
 * Handles GET, PATCH, and POST requests for User Identity & App Settings with SQLite persistence.
 */
import { Router } from 'express';
import {
  getUser,
  updateUser,
  getSettings as getDbSettings,
  updateSettings as updateDbSettings,
  resetDatabase
} from '../src/db/sqlite.js';

export const router = Router();

/**
 * GET /api/settings or GET /api/user
 * Fetches user identity and application settings from the SQLite database.
 */
export async function getSettings(req, res) {
  try {
    const user = getUser();
    const settings = getDbSettings();

    return res.status(200).json({
      success: true,
      message: 'Settings and user identity retrieved successfully',
      user,
      settings,
      data: {
        user,
        settings
      }
    });
  } catch (err) {
    console.error('Error fetching settings from SQLite:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve settings from database',
      details: err.message
    });
  }
}

/**
 * PATCH /api/settings or PATCH /api/settings/identity
 * Updates user identity and/or application settings in the SQLite database.
 */
export async function updateIdentity(req, res) {
  try {
    const body = req.body || {};

    // Extract user identity fields from top-level or nested user/identity keys
    const identityPayload = body.user || body.identity || body;
    const userUpdates = {};

    if (identityPayload.name !== undefined) {
      const name = String(identityPayload.name).trim();
      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Name cannot be empty'
        });
      }
      userUpdates.name = name;
    }

    if (identityPayload.email !== undefined) {
      userUpdates.email = String(identityPayload.email).trim();
    }

    if (identityPayload.phone !== undefined) {
      userUpdates.phone = String(identityPayload.phone).trim();
    }

    if (identityPayload.role !== undefined) {
      userUpdates.role = String(identityPayload.role).trim();
    }

    if (identityPayload.initials !== undefined) {
      userUpdates.initials = String(identityPayload.initials).trim().toUpperCase();
    }

    // Apply user updates if any
    let updatedUser = getUser();
    if (Object.keys(userUpdates).length > 0) {
      updatedUser = updateUser(userUpdates);
    }

    // Check for settings updates (currency, toggles, etc.)
    const settingsPayload = body.settings || body;
    const settingsUpdates = {};

    if (settingsPayload.currency !== undefined) {
      settingsUpdates.currency = String(settingsPayload.currency).trim().toUpperCase();
    }
    if (settingsPayload.hideBalance !== undefined) {
      settingsUpdates.hideBalance = Boolean(settingsPayload.hideBalance);
    }
    if (settingsPayload.requirePin !== undefined) {
      settingsUpdates.requirePin = Boolean(settingsPayload.requirePin);
    }
    if (settingsPayload.emailAlerts !== undefined) {
      settingsUpdates.emailAlerts = Boolean(settingsPayload.emailAlerts);
    }

    let updatedSettings = getDbSettings();
    if (Object.keys(settingsUpdates).length > 0) {
      updatedSettings = updateDbSettings(settingsUpdates);
    }

    return res.status(200).json({
      success: true,
      message: 'User identity and settings updated successfully in SQLite database',
      user: updatedUser,
      settings: updatedSettings,
      data: {
        user: updatedUser,
        settings: updatedSettings
      }
    });
  } catch (err) {
    console.error('Error handling PATCH request in settings controller:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to update user identity or settings in SQLite database',
      details: err.message
    });
  }
}

/**
 * Alias for updateIdentity to handle general PATCH /api/settings
 */
export const patchSettings = updateIdentity;

/**
 * PUT /api/settings
 */
export const updateSettings = updateIdentity;

/**
 * POST /api/settings/reset
 * Resets user identity and settings back to default demo state in SQLite.
 */
export async function resetSettings(req, res) {
  try {
    const result = resetDatabase();
    return res.status(200).json({
      success: true,
      message: 'SQLite database reset to initial demo state',
      user: result.user,
      settings: result.settings,
      data: result
    });
  } catch (err) {
    console.error('Error resetting database in settings controller:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to reset SQLite database',
      details: err.message
    });
  }
}

// Route Mappings
router.get('/', getSettings);
router.get('/identity', getSettings);
router.get('/user', getSettings);

router.patch('/', updateIdentity);
router.patch('/identity', updateIdentity);
router.patch('/user', updateIdentity);

router.put('/', updateIdentity);
router.post('/', updateIdentity);
router.post('/reset', resetSettings);

export const settingsController = {
  getSettings,
  updateIdentity,
  patchSettings,
  updateSettings,
  resetSettings
};

export default router;
