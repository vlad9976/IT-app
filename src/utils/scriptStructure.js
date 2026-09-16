/**
 * Helpers for script categories - supports both flat arrays and sectioned objects.
 * Sectioned: { "User Scripts": [...], "Group Scripts": [...] }
 */
export function isSectionedCategory(catData) {
  if (!catData || Array.isArray(catData)) return false;
  if (typeof catData !== 'object') return false;
  const keys = Object.keys(catData);
  return keys.length > 0 && keys.every(k => Array.isArray(catData[k]));
}

export function getScriptsFromCategory(scriptsData, category) {
  const data = scriptsData[category];
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (isSectionedCategory(data)) {
    return Object.values(data).flat();
  }
  return [];
}

export function getCategoryStructure(scriptsData, category) {
  const data = scriptsData[category];
  if (!data) return { isSectioned: false, sections: [], totalCount: 0 };
  if (Array.isArray(data)) {
    return { isSectioned: false, sections: [{ name: null, scripts: data }], totalCount: data.length };
  }
  if (isSectionedCategory(data)) {
    const sections = Object.entries(data).map(([name, scripts]) => ({ name, scripts }));
    const totalCount = sections.reduce((sum, s) => sum + s.scripts.length, 0);
    return { isSectioned: true, sections, totalCount };
  }
  return { isSectioned: false, sections: [], totalCount: 0 };
}

export function findScriptInCategory(scriptsData, category, scriptId) {
  const scripts = getScriptsFromCategory(scriptsData, category);
  return scripts.find(s => s.id === scriptId) || null;
}

/**
 * Find where a script lives: { category, section?, script }
 */
/**
 * Add any bundled/default scripts that are missing from user-saved data.
 * Preserves user customizations and existing scripts.
 */
export function mergeScriptsData(userData, defaultData) {
  if (!defaultData || typeof defaultData !== 'object') return userData || {};
  if (!userData || typeof userData !== 'object' || Object.keys(userData).length === 0) {
    return defaultData;
  }

  const result = { ...userData };

  for (const [category, defaultCat] of Object.entries(defaultData)) {
    if (!result[category]) {
      result[category] = defaultCat;
      continue;
    }

    const userCat = result[category];

    if (Array.isArray(defaultCat) && Array.isArray(userCat)) {
      const ids = new Set(userCat.map(s => s.id));
      result[category] = [...userCat, ...defaultCat.filter(s => s?.id && !ids.has(s.id))];
      continue;
    }

    if (isSectionedCategory(defaultCat) && isSectionedCategory(userCat)) {
      const merged = { ...userCat };
      for (const [section, scripts] of Object.entries(defaultCat)) {
        if (!merged[section]) {
          merged[section] = scripts;
        } else {
          const ids = new Set((merged[section] || []).map(s => s.id));
          merged[section] = [
            ...merged[section],
            ...(scripts || []).filter(s => s?.id && !ids.has(s.id))
          ];
        }
      }
      result[category] = merged;
      continue;
    }

    if (isSectionedCategory(defaultCat) && Array.isArray(userCat)) {
      const ids = new Set(userCat.map(s => s.id));
      const missing = Object.values(defaultCat).flat().filter(s => s?.id && !ids.has(s.id));
      if (missing.length) {
        result[category] = { Existing: userCat, Software: missing };
      }
    }
  }

  return result;
}

export function findScriptLocation(scriptsData, scriptId) {
  if (!scriptsData || !scriptId) return null;
  for (const category of Object.keys(scriptsData)) {
    const data = scriptsData[category];
    if (Array.isArray(data)) {
      const script = data.find(s => s.id === scriptId);
      if (script) return { category, section: null, script };
    }
    if (isSectionedCategory(data)) {
      for (const [section, scripts] of Object.entries(data)) {
        const script = (scripts || []).find(s => s.id === scriptId);
        if (script) return { category, section, script };
      }
    }
  }
  return null;
}
