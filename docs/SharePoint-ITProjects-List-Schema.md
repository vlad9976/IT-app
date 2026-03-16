# SharePoint List Schema: ITProjects

Create a SharePoint list named **ITProjects** in your SharePoint site (e.g. root site or your IT team site). The app uses Microsoft Graph to read/write this list.

## Azure app permissions (required)

For the app to read/write SharePoint, the **Azure AD app registration** must have these **Delegated** permissions and **admin consent**:

- **Sites.ReadWrite.All** – read and write list items.
- **Sites.Manage.All** – required only if you want the app to auto-create the ITProjects list; otherwise you can create the list manually.

Steps: Azure Portal → App registrations → your app → API permissions → Add permission → Microsoft Graph → **Delegated** → select the above → **Grant admin consent for [tenant]**.

After changing permissions, disconnect and reconnect in the app (Microsoft 365 section) so a new token is obtained.

## List name
- **Display name:** `ITProjects`
- **Internal name:** `ITProjects` (or as created)

## Columns

| Display Name   | Internal Name  | Type             | Required | Notes |
|----------------|----------------|------------------|----------|--------|
| Title          | Title          | Single line text | Yes      | Default; app also sets ProjectName. |
| ProjectName    | ProjectName    | Single line text | No       | Project title. |
| Owner          | Owner          | Person           | No       | Single user. |
| AssignedTo     | AssignedTo     | Person (multi)   | No       | Multiple users. |
| Status         | Status         | Choice           | No       | See choices below. |
| Priority       | Priority       | Choice           | No       | See choices below. |
| StartDate      | StartDate      | Date             | No       | |
| DueDate        | DueDate        | Date             | No       | |
| Progress       | Progress       | Number (0-100)   | No       | Integer. |
| Description    | Description    | Multiple lines   | No       | |
| Tasks          | Tasks          | Multiple lines   | No       | JSON string: `{"tasks":[{"title":"...","completed":true/false}]}`. |
| Notes          | Notes          | Multiple lines   | No       | JSON array: `[{"author":"...","timestamp":"...","text":"..."}]`. |
| ActivityLog    | ActivityLog    | Multiple lines   | No       | JSON array of `{action, by, at}`. |
| CreatedBy      | CreatedBy      | Person           | No       | Auto/system. |
| CreatedDate    | CreatedDate    | Date/Time         | No       | |
| LastUpdated    | LastUpdated    | Date/Time         | No       | |

## Choice values

**Status:**
- Planned
- In Progress
- Blocked
- Completed

**Priority:**
- Low
- Medium
- High
- Critical

## Creating the list (PowerShell / PnP)

You can create the list in SharePoint Online with PnP PowerShell or manually in the SharePoint UI.

1. Create a new list named **ITProjects**.
2. Add columns as above. If **Person** columns cause Graph API issues, you can use **Single line text** or **Multiple lines** for Owner/AssignedTo and the app will still store display names.
3. Ensure the app registration has **Sites.ReadWrite.All** (or at least **Sites.Read.All** for read-only) and that the signed-in user has access to the site.

## Graph API endpoints used

- `GET /sites/root` – resolve site (or use a specific site ID).
- `GET /sites/{site-id}/lists?$filter=displayName eq 'ITProjects'` – get list id.
- `GET /sites/{site-id}/lists/{list-id}/items?expand=fields&$top=200` – list projects.
- `POST /sites/{site-id}/lists/{list-id}/items` – create project.
- `PATCH /sites/{site-id}/lists/{list-id}/items/{item-id}/fields` – update project.
- `DELETE /sites/{site-id}/lists/{list-id}/items/{item-id}` – delete project.
