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
