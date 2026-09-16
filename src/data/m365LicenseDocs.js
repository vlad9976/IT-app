export const m365LicenseDocumentation = {
  businessPlans: {
    title: "Microsoft 365 Business Plans",
    color: "text-blue-400",
    licenses: [
      {
        name: "Microsoft 365 Business Basic",
        sku: "O365_BUSINESS_ESSENTIALS",
        price: "$6/user/month",
        description: "Web and mobile versions of Office apps",
        features: [
          "Web and mobile versions of Word, Excel, PowerPoint, Outlook",
          "Exchange, OneDrive, SharePoint, Teams",
          "1 TB OneDrive cloud storage",
          "Business-class email (50 GB mailbox)",
          "No desktop Office apps"
        ],
        bestFor: "Small businesses needing basic cloud services",
        userLimit: "Up to 300 users"
      },
      {
        name: "Microsoft 365 Business Standard",
        sku: "O365_BUSINESS_PREMIUM",
        price: "$12.50/user/month",
        description: "Desktop Office apps plus cloud services",
        features: [
          "Desktop versions of Word, Excel, PowerPoint, Outlook, Publisher, Access",
          "Web and mobile Office apps",
          "Exchange, OneDrive, SharePoint, Teams",
          "1 TB OneDrive cloud storage",
          "50 GB mailbox + archiving",
          "Webinar hosting (up to 300 attendees)"
        ],
        bestFor: "Small to medium businesses needing full Office suite",
        userLimit: "Up to 300 users"
      },
      {
        name: "Microsoft 365 Business Premium",
        sku: "SPB",
        price: "$22/user/month",
        description: "Business Standard + advanced security",
        features: [
          "Everything in Business Standard",
          "Advanced threat protection",
          "Device management (Intune)",
          "Information protection",
          "Conditional access",
          "Azure AD Premium P1",
          "Windows 10/11 Enterprise upgrade rights"
        ],
        bestFor: "Businesses requiring advanced security and device management",
        userLimit: "Up to 300 users"
      },
      {
        name: "Microsoft 365 Apps for Business",
        sku: "OFFICESUBSCRIPTION",
        price: "$8.25/user/month",
        description: "Desktop Office apps only (no email/cloud services)",
        features: [
          "Desktop Office apps (Word, Excel, PowerPoint, Outlook, Publisher, Access)",
          "1 TB OneDrive storage",
          "No Exchange email",
          "No Teams, SharePoint"
        ],
        bestFor: "Organizations that only need Office desktop apps",
        userLimit: "Up to 300 users"
      }
    ]
  },
  enterprisePlans: {
    title: "Microsoft 365 Enterprise Plans",
    color: "text-green-400",
    licenses: [
      {
        name: "Microsoft 365 E3",
        sku: "SPE_E3",
        price: "$36/user/month",
        description: "Enterprise productivity and security",
        features: [
          "Desktop and mobile Office apps",
          "Exchange Online (100 GB mailbox)",
          "SharePoint, OneDrive (unlimited storage)",
          "Teams with advanced features",
          "Azure AD Premium P1",
          "Intune device management",
          "Windows 10/11 Enterprise E3",
          "Information protection and DLP",
          "eDiscovery and legal hold"
        ],
        bestFor: "Large organizations needing enterprise features",
        userLimit: "Unlimited"
      },
      {
        name: "Microsoft 365 E5",
        sku: "SPE_E5",
        price: "$57/user/month",
        description: "E3 + advanced security, compliance, and analytics",
        features: [
          "Everything in E3",
          "Microsoft Defender for Office 365 (Plan 2)",
          "Microsoft Defender for Endpoint",
          "Azure AD Premium P2",
          "Advanced eDiscovery and audit",
          "Advanced compliance (insider risk, communication compliance)",
          "Power BI Pro",
          "Phone System (Cloud PBX)",
          "Audio Conferencing",
          "Advanced analytics"
        ],
        bestFor: "Enterprises requiring maximum security and compliance",
        userLimit: "Unlimited"
      },
      {
        name: "Office 365 E1",
        sku: "STANDARDPACK",
        price: "$8/user/month",
        description: "Cloud services only (no desktop apps)",
        features: [
          "Web and mobile Office apps only",
          "Exchange Online (50 GB mailbox)",
          "SharePoint, OneDrive (1 TB)",
          "Teams",
          "No desktop Office apps",
          "No advanced security features"
        ],
        bestFor: "Budget-conscious enterprises, web-only users",
        userLimit: "Unlimited"
      },
      {
        name: "Office 365 E3",
        sku: "ENTERPRISEPACK",
        price: "$23/user/month",
        description: "Office apps + cloud services (no Windows, Intune)",
        features: [
          "Desktop and mobile Office apps",
          "Exchange Online (100 GB mailbox)",
          "SharePoint, OneDrive (unlimited)",
          "Teams",
          "No Windows Enterprise",
          "No Intune",
          "Basic security features"
        ],
        bestFor: "Organizations not needing Windows/device management",
        userLimit: "Unlimited"
      }
    ]
  },
  frontlineWorker: {
    title: "Frontline Worker Plans",
    color: "text-purple-400",
    licenses: [
      {
        name: "Microsoft 365 F1",
        sku: "DESKLESSPACK",
        price: "$8/user/month",
        description: "For frontline workers without desktop needs",
        features: [
          "Web and mobile Office apps",
          "Teams, SharePoint, Yammer",
          "Exchange (2 GB mailbox)",
          "OneDrive (2 GB storage)",
          "Shifts scheduling",
          "Task management",
          "No desktop Office apps"
        ],
        bestFor: "Retail, hospitality, manufacturing workers",
        userLimit: "Unlimited"
      },
      {
        name: "Microsoft 365 F3",
        sku: "SPE_F1",
        price: "$8/user/month",
        description: "F1 + security and device management",
        features: [
          "Everything in F1",
          "Intune device management",
          "Windows 10/11 Enterprise E3",
          "Azure AD Premium P1",
          "Advanced security features"
        ],
        bestFor: "Frontline workers needing managed devices",
        userLimit: "Unlimited"
      }
    ]
  },
  addOns: {
    title: "Common Add-On Licenses",
    color: "text-yellow-400",
    licenses: [
      {
        name: "Exchange Online Plan 1",
        sku: "EXCHANGESTANDARD",
        price: "$4/user/month",
        description: "Email only",
        features: [
          "50 GB mailbox",
          "Email, calendar, contacts",
          "Anti-spam and anti-malware",
          "No Office apps"
        ],
        bestFor: "Email-only users",
        userLimit: "Unlimited"
      },
      {
        name: "Exchange Online Plan 2",
        sku: "EXCHANGEENTERPRISE",
        price: "$8/user/month",
        description: "Email with archiving",
        features: [
          "100 GB mailbox",
          "Unlimited archiving",
          "DLP and eDiscovery",
          "Advanced compliance"
        ],
        bestFor: "Users needing large mailboxes and compliance",
        userLimit: "Unlimited"
      },
      {
        name: "Power BI Pro",
        sku: "POWER_BI_PRO",
        price: "$10/user/month",
        description: "Business analytics and reporting",
        features: [
          "Create and share dashboards",
          "Collaborate on reports",
          "10 GB storage per user",
          "Included in E5"
        ],
        bestFor: "Data analysts and report creators",
        userLimit: "Unlimited"
      },
      {
        name: "Microsoft Defender for Office 365 (Plan 1)",
        sku: "ATP_ENTERPRISE",
        price: "$2/user/month",
        description: "Advanced email security",
        features: [
          "Safe Attachments",
          "Safe Links",
          "Anti-phishing protection",
          "Real-time threat detection"
        ],
        bestFor: "Enhanced email security",
        userLimit: "Unlimited"
      },
      {
        name: "Azure AD Premium P1",
        sku: "AAD_PREMIUM",
        price: "$6/user/month",
        description: "Advanced identity management",
        features: [
          "Conditional access",
          "Self-service password reset",
          "Dynamic groups",
          "Included in M365 E3/E5"
        ],
        bestFor: "Advanced identity and access management",
        userLimit: "Unlimited"
      },
      {
        name: "Azure AD Premium P2",
        sku: "AAD_PREMIUM_P2",
        price: "$9/user/month",
        description: "P1 + identity protection",
        features: [
          "Everything in P1",
          "Identity Protection",
          "Privileged Identity Management (PIM)",
          "Access reviews",
          "Included in M365 E5"
        ],
        bestFor: "Advanced security and compliance",
        userLimit: "Unlimited"
      }
    ]
  },
  education: {
    title: "Education Plans",
    color: "text-cyan-400",
    licenses: [
      {
        name: "Microsoft 365 A1",
        sku: "STANDARDWOFFPACK_FACULTY / STANDARDWOFFPACK_STUDENT",
        price: "Free",
        description: "Free for eligible educational institutions",
        features: [
          "Web and mobile Office apps",
          "Teams for Education",
          "Exchange (100 GB)",
          "OneDrive (1 TB)",
          "No desktop Office apps"
        ],
        bestFor: "Students and educators",
        userLimit: "Unlimited (eligible institutions)"
      },
      {
        name: "Microsoft 365 A3",
        sku: "M365EDU_A3_FACULTY / M365EDU_A3_STUDENT",
        price: "$2.50-$3.25/user/month",
        description: "A1 + desktop apps and security",
        features: [
          "Everything in A1",
          "Desktop Office apps",
          "Windows 10/11 Education",
          "Intune for Education",
          "Advanced security"
        ],
        bestFor: "Schools needing full Office suite",
        userLimit: "Unlimited (eligible institutions)"
      },
      {
        name: "Microsoft 365 A5",
        sku: "M365EDU_A5_FACULTY / M365EDU_A5_STUDENT",
        price: "$6-$8/user/month",
        description: "A3 + advanced security and analytics",
        features: [
          "Everything in A3",
          "Advanced threat protection",
          "Advanced compliance",
          "Power BI Pro",
          "Phone System"
        ],
        bestFor: "Educational institutions requiring maximum security",
        userLimit: "Unlimited (eligible institutions)"
      }
    ]
  },
  comparison: {
    title: "License Comparison Tips",
    tips: [
      {
        title: "Business vs Enterprise",
        description: "Business plans (up to 300 users) are simpler and cheaper. Enterprise plans (unlimited users) offer more features, compliance tools, and customization."
      },
      {
        title: "Office 365 vs Microsoft 365",
        description: "Office 365 = Office apps + cloud services only. Microsoft 365 = Office 365 + Windows 10/11 + Enterprise Mobility + Security (EMS)."
      },
      {
        title: "E3 vs E5",
        description: "E5 adds: Advanced security (Defender), advanced compliance, Power BI Pro, Phone System. Choose E5 for regulated industries or high security needs."
      },
      {
        title: "Mixing Licenses",
        description: "You can assign different licenses to different users. Common: E3 for most users, E5 for executives/IT, F3 for frontline workers."
      },
      {
        title: "License Assignment",
        description: "Licenses are assigned per user. One user can have multiple licenses (e.g., E3 + Power BI Pro). Remove unused licenses to save costs."
      },
      {
        title: "Grace Period",
        description: "When a license is removed, users have a 30-day grace period before data is deleted. Mailbox becomes inactive after 30 days."
      },
      {
        title: "Shared Mailboxes",
        description: "Shared mailboxes (under 50 GB) don't require a license. Users accessing them need their own license."
      },
      {
        title: "Trial Licenses",
        description: "Most M365 plans offer 30-day free trials. Trial licenses show as 'TRIAL' in SKU name."
      }
    ]
  },
  commonSkus: {
    title: "Common SKU Reference (PowerShell)",
    description: "When using PowerShell, licenses are identified by SKU names:",
    skus: [
      { display: "Microsoft 365 Business Basic", sku: "O365_BUSINESS_ESSENTIALS" },
      { display: "Microsoft 365 Business Standard", sku: "O365_BUSINESS_PREMIUM" },
      { display: "Microsoft 365 Business Premium", sku: "SPB" },
      { display: "Microsoft 365 Apps for Business", sku: "OFFICESUBSCRIPTION" },
      { display: "Microsoft 365 E3", sku: "SPE_E3" },
      { display: "Microsoft 365 E5", sku: "SPE_E5" },
      { display: "Office 365 E1", sku: "STANDARDPACK" },
      { display: "Office 365 E3", sku: "ENTERPRISEPACK" },
      { display: "Office 365 E5", sku: "ENTERPRISEPREMIUM" },
      { display: "Exchange Online Plan 1", sku: "EXCHANGESTANDARD" },
      { display: "Exchange Online Plan 2", sku: "EXCHANGEENTERPRISE" },
      { display: "Microsoft 365 F1", sku: "DESKLESSPACK" },
      { display: "Microsoft 365 F3", sku: "SPE_F1" },
      { display: "Power BI Pro", sku: "POWER_BI_PRO" },
      { display: "Azure AD Premium P1", sku: "AAD_PREMIUM" },
      { display: "Azure AD Premium P2", sku: "AAD_PREMIUM_P2" }
    ]
  }
};
