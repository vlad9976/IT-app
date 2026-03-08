# 📧 Domain Filter Feature - Export Mailboxes

## New Feature Added!

The "Export All Active Mailboxes" script now supports **domain filtering**.

---

## 🎯 How to Use

### Example 1: Export All Domains

**Settings:**
- Export Path: `C:\Reports\All_Mailboxes.csv`
- Mailbox Type: `User Mailboxes Only`
- Domain Filter: *(leave empty)*

**Result:**
```
Exports all user mailboxes from all domains:
- john@contoso.com
- jane@contoso.com
- admin@fabrikam.com
- sales@fabrikam.com
```

---

### Example 2: Export Single Domain

**Settings:**
- Export Path: `C:\Reports\Contoso_Mailboxes.csv`
- Mailbox Type: `User Mailboxes Only`
- Domain Filter: `contoso.com`

**Result:**
```
Exports only contoso.com mailboxes:
- john@contoso.com
- jane@contoso.com

(Excludes fabrikam.com and other domains)
```

---

### Example 3: Export Shared Mailboxes by Domain

**Settings:**
- Export Path: `C:\Reports\Fabrikam_Shared.csv`
- Mailbox Type: `Shared Mailboxes Only`
- Domain Filter: `fabrikam.com`

**Result:**
```
Exports only shared mailboxes from fabrikam.com:
- support@fabrikam.com
- sales@fabrikam.com
```

---

## 📊 Output Includes Domain Breakdown

The export now shows domain statistics:

```
Summary Statistics:
  Total Mailbox Size: 245.67 GB
  Total Items: 1,234,567
  Active Users (logged in): 145
  Inactive Users: 23

Domain Breakdown:
  contoso.com: 98 mailboxes
  fabrikam.com: 45 mailboxes
  subsidiary.com: 25 mailboxes
```

---

## 🎯 Use Cases

### Multi-Domain Organizations

If your organization has multiple domains:
- `company.com`
- `subsidiary.com`
- `acquired-company.com`

You can now:
- ✅ Export each domain separately
- ✅ Compare mailbox usage by domain
- ✅ Audit specific domains
- ✅ Generate domain-specific reports

### Filtered Exports

**Scenarios:**
1. **Compliance audit:** Export only `regulated-division.com`
2. **Migration planning:** Export `old-domain.com` mailboxes
3. **Cost analysis:** Compare usage across domains
4. **Department reports:** Export by department domain

---

## 📋 CSV Output Fields

The exported CSV includes:

| Field | Description |
|-------|-------------|
| DisplayName | User's full name |
| UserPrincipalName | Login name |
| PrimarySmtpAddress | Primary email (includes domain) |
| MailboxType | User/Shared/Room/Equipment |
| AccountEnabled | Active/Disabled |
| Department | User's department |
| JobTitle | User's job title |
| Office | Physical office location |
| City | City |
| Country | Country |
| MailboxSizeMB | Size in megabytes |
| MailboxSizeGB | Size in gigabytes |
| ItemCount | Number of items |
| DeletedItemCount | Deleted items |
| LastLogonTime | Last login |
| LastUserActionTime | Last activity |
| Licenses | Assigned licenses |
| ArchiveStatus | Archive enabled/disabled |
| LitigationHoldEnabled | Legal hold status |
| WhenCreated | Creation date |
| EmailAddresses | All email aliases |

---

## 🔍 Domain Filter Examples

### Filter Syntax

```
Domain Filter: contoso.com
→ Matches: *@contoso.com

Domain Filter: subsidiary.co.uk
→ Matches: *@subsidiary.co.uk

Domain Filter: (empty)
→ Matches: All domains
```

### Wildcard Support

The filter uses PowerShell `-like` operator:

```powershell
# Exact domain
contoso.com → user@contoso.com ✅

# Subdomain NOT supported (use exact domain)
*.contoso.com → Won't work ❌
```

---

## 💡 Tips

### 1. Export Multiple Domains

Run the script multiple times with different filters:

```
Run 1: Domain = contoso.com → Contoso_Export.csv
Run 2: Domain = fabrikam.com → Fabrikam_Export.csv
Run 3: Domain = (empty) → All_Domains_Export.csv
```

### 2. Compare Domains

Export all domains, then open in Excel:

1. Use PivotTable
2. Group by domain (from PrimarySmtpAddress)
3. Sum MailboxSizeGB
4. Compare usage

### 3. Find Largest Mailboxes by Domain

1. Export with domain filter
2. Open CSV in Excel
3. Sort by MailboxSizeGB (descending)
4. Identify top consumers

---

## 🚀 Testing the New Feature

### In the App:

1. Launch IT Script Generator
2. Go to "Microsoft 365" category
3. Find "Export All Active Mailboxes"
4. You'll see the new "Domain Filter" field
5. Try it with and without a domain

### Sample Output:

**Without filter:**
```
Found 168 mailbox(es)
Processing mailbox details...
[Progress bar...]

EXPORT COMPLETE!
Total Mailboxes: 168

Domain Breakdown:
  contoso.com: 98 mailboxes
  fabrikam.com: 45 mailboxes
  subsidiary.com: 25 mailboxes
```

**With filter (contoso.com):**
```
Found 168 mailbox(es)
Applying domain filter: contoso.com
Mailboxes after domain filter: 98
Processing mailbox details...
[Progress bar...]

EXPORT COMPLETE!
Total Mailboxes: 98

Domain Breakdown:
  contoso.com: 98 mailboxes
```

---

## ✅ Feature Complete!

**What's new:**
- ✅ Domain filter input field
- ✅ Filters mailboxes by email domain
- ✅ Shows domain breakdown in summary
- ✅ Optional (leave empty for all domains)
- ✅ Works with all mailbox types

**Ready to use!** Launch the app and test it out.

---

**Want me to add any other filters?**
- Department filter?
- License filter?
- Size filter (mailboxes > X GB)?
- Date filter (created after X)?

Let me know!
