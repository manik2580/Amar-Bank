/**
 * Client-Side Settings Controller for MyBank
 * Manages communication with /api/settings endpoints for User Identity and Application Settings
 */
export const SettingsController = {
  async getSettings() {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('Failed to fetch settings from server');
    return res.json();
  },

  async updateIdentity(identityData) {
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(identityData)
    });
    if (!res.ok) throw new Error('Failed to update identity on server');
    return res.json();
  },

  async updateSettings(settingsData) {
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsData)
    });
    if (!res.ok) throw new Error('Failed to update settings on server');
    return res.json();
  },

  async reset() {
    const res = await fetch('/api/settings/reset', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset database on server');
    return res.json();
  }
};

if (typeof window !== 'undefined') {
  window.SettingsController = SettingsController;
}

export default SettingsController;
