export const backupDocumentation = {
  title: "Backup Guide – What Gets Backed Up",
  subtitle: "Each option below shows what is included and what is not. Folders already in OneDrive are skipped (already in cloud). Use 04. FULL RESTORE to restore after domain migration.",
  items: [
    {
      id: "Desktop",
      path: "%USERPROFILE%\\Desktop\\*",
      backsUp: "All files and folders on the Desktop.",
      doesNotBackUp: "Skipped if path is in OneDrive (already in cloud).",
      restoreNote: "Restores directly to Desktop."
    },
    {
      id: "Documents",
      path: "%USERPROFILE%\\Documents\\*",
      backsUp: "All files and folders in Documents (including My Documents). Uses actual path if redirected.",
      doesNotBackUp: "Skipped if path is in OneDrive (already in cloud).",
      restoreNote: "Restores to Documents folder."
    },
    {
      id: "Pictures",
      path: "%USERPROFILE%\\Pictures\\*",
      backsUp: "All files and folders in Pictures. Uses actual path if redirected.",
      doesNotBackUp: "Skipped if path is in OneDrive (already in cloud).",
      restoreNote: "Restores to Pictures folder."
    },
    {
      id: "Downloads",
      path: "%USERPROFILE%\\Downloads\\*",
      backsUp: "All downloaded files and subfolders.",
      doesNotBackUp: "Skipped if path is in OneDrive (already in cloud).",
      restoreNote: "Restores to Downloads folder."
    },
    {
      id: "Favorites",
      path: "%USERPROFILE%\\Favorites\\*",
      backsUp: "IE/Edge Favorites (bookmarks) – .url files and subfolders.",
      doesNotBackUp: "Chrome/Firefox bookmarks are in their own folders.",
      restoreNote: "Restores to Favorites. Works for Edge."
    },
    {
      id: "Links",
      path: "%USERPROFILE%\\Links\\*",
      backsUp: "Quick Access links – shortcuts in the user profile Links folder.",
      doesNotBackUp: "Nothing excluded.",
      restoreNote: "Restores to Links folder."
    },
    {
      id: "Contacts",
      path: "%USERPROFILE%\\Contacts\\*",
      backsUp: "Windows Contacts (.contact files).",
      doesNotBackUp: "Outlook contacts are stored in Outlook data – use Outlook backup.",
      restoreNote: "Restores to Contacts folder."
    },
    {
      id: "Searches",
      path: "%USERPROFILE%\\Searches\\*",
      backsUp: "Saved Windows Search queries.",
      doesNotBackUp: "Nothing excluded.",
      restoreNote: "Restores to Searches folder."
    },
    {
      id: "Outlook",
      path: "%USERPROFILE%\\AppData\\Roaming\\Microsoft\\Outlook",
      backsUp: ".pst files (archives, personal folders), .ost files (Exchange/365 cache), autocomplete/nickname cache, signatures.",
      doesNotBackUp: "Profile configuration (account setup) is in the registry – not backed up. User must re-add accounts on new PC.",
      restoreNote: ".pst: copy back and open via File > Open > Outlook Data File. .ost: for Exchange/365, add account fresh – data syncs from cloud. Profile setup is not restored."
    },
    {
      id: "Chrome",
      path: "%USERPROFILE%\\AppData\\Local\\Google\\Chrome\\User Data",
      backsUp: "Bookmarks, history, cookies, extensions, passwords (encrypted), preferences.",
      doesNotBackUp: "Chrome must be closed during backup for consistency.",
      restoreNote: "Restores profile. User may need to sign in to Chrome again."
    },
    {
      id: "Edge",
      path: "%USERPROFILE%\\AppData\\Local\\Microsoft\\Edge\\User Data",
      backsUp: "Bookmarks, history, cookies, extensions, preferences.",
      doesNotBackUp: "Edge should be closed during backup for consistency.",
      restoreNote: "Restores profile. User may need to sign in to Edge again."
    },
    {
      id: "Firefox",
      path: "%USERPROFILE%\\AppData\\Roaming\\Mozilla",
      backsUp: "Firefox profiles – bookmarks, history, extensions, passwords (if stored locally).",
      doesNotBackUp: "Firefox should be closed during backup for consistency.",
      restoreNote: "Restores profiles. User may need to sign in to Firefox Sync again."
    },
    {
      id: "Printers",
      path: "System (PrintManagement)",
      backsUp: "Full backup: PrintBrm creates Printers.printerExport with all printers, drivers, and ports. Printers.json lists printer name, driver, port, and IP address for each printer.",
      doesNotBackUp: "Nothing excluded. If PrintBrm is not available, falls back to Printers.json + third-party driver export (manual restore may be needed).",
      restoreNote: "04. FULL RESTORE uses PrintBrm to restore printers automatically. If PrintBrm backup exists, printers are restored with drivers and ports."
    }
  ]
};
