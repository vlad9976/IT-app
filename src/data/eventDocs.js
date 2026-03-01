export const eventDocumentation = {
  authentication: {
    title: "Authentication Events",
    color: "text-green-400",
    events: [
      {
        id: "4624",
        name: "Successful Logon",
        description: "User successfully logged on to the system",
        details: "Check Logon Type: 2=Interactive (keyboard), 3=Network (file share), 10=RemoteDesktop, 5=Service",
        severity: "info"
      },
      {
        id: "4625",
        name: "Failed Logon Attempt",
        description: "Failed login attempt detected",
        details: "Monitor for brute-force attacks. Check Failure Reason, Source IP, and Account Name. Multiple 4625 events from same IP = potential attack",
        severity: "critical"
      },
      {
        id: "4634",
        name: "Logoff",
        description: "User logged off or session disconnected",
        details: "Normal logoff event. Useful for session tracking",
        severity: "info"
      },
      {
        id: "4648",
        name: "Logon with Explicit Credentials (RunAs)",
        description: "User logged on with different credentials",
        details: "RunAs or credential delegation used. Check target account and verify authorization",
        severity: "warning"
      }
    ]
  },
  privilege: {
    title: "Privilege & Admin Events",
    color: "text-yellow-400",
    events: [
      {
        id: "4672",
        name: "Special Privileges Assigned",
        description: "Admin privileges granted at logon",
        details: "Indicates admin/elevated session. Monitor for unauthorized admin access",
        severity: "warning"
      },
      {
        id: "4673",
        name: "Privileged Service Called",
        description: "Sensitive privilege used",
        details: "Monitor for privilege abuse. Check which privilege was used and by whom",
        severity: "warning"
      }
    ]
  },
  accountManagement: {
    title: "Account Management (CRITICAL)",
    color: "text-red-400",
    events: [
      {
        id: "4720",
        name: "User Account Created",
        description: "New user account created",
        details: "Audit who created it and verify authorization. Check account properties and group memberships",
        severity: "critical"
      },
      {
        id: "4722",
        name: "User Account Enabled",
        description: "Disabled account was enabled",
        details: "Verify authorization. Could indicate compromised admin or unauthorized access",
        severity: "warning"
      },
      {
        id: "4724",
        name: "Password Reset",
        description: "Admin reset user password",
        details: "Verify who performed reset. Could indicate account takeover attempt",
        severity: "critical"
      },
      {
        id: "4725",
        name: "User Account Disabled",
        description: "Account disabled",
        details: "Check who disabled and reason. Normal for offboarding",
        severity: "warning"
      },
      {
        id: "4726",
        name: "User Account Deleted",
        description: "Account permanently deleted",
        details: "CRITICAL audit event. Verify authorization and backup user data",
        severity: "critical"
      },
      {
        id: "4740",
        name: "Account Locked Out",
        description: "Too many failed login attempts",
        details: "Check source IP and unlock if legitimate user. Multiple lockouts = potential attack",
        severity: "critical"
      },
      {
        id: "4767",
        name: "Account Unlocked",
        description: "Locked account was unlocked",
        details: "Verify who unlocked it and ensure password was changed if compromised",
        severity: "warning"
      }
    ]
  },
  groupManagement: {
    title: "Group Management (Privilege Escalation)",
    color: "text-orange-400",
    events: [
      {
        id: "4732",
        name: "Member Added to Local Group",
        description: "User added to local group (e.g., Administrators)",
        details: "CRITICAL for privilege escalation. Verify who was added, by whom, and to which group",
        severity: "critical"
      },
      {
        id: "4733",
        name: "Member Removed from Local Group",
        description: "User removed from local group",
        details: "Verify authorization. Check if part of offboarding or security incident",
        severity: "warning"
      },
      {
        id: "4728",
        name: "Member Added to Global Group",
        description: "User added to domain global group",
        details: "Audit group membership changes. Monitor for unauthorized privilege grants",
        severity: "warning"
      },
      {
        id: "4756",
        name: "Member Added to Universal Group",
        description: "User added to universal group",
        details: "Monitor for unauthorized access to resources",
        severity: "warning"
      }
    ]
  },
  processes: {
    title: "Process & Execution",
    color: "text-purple-400",
    events: [
      {
        id: "4688",
        name: "Process Created",
        description: "New process started",
        details: "Monitor for suspicious executables (cmd.exe, powershell.exe from unusual paths). Check Creator Process Name and Command Line",
        severity: "warning"
      },
      {
        id: "4689",
        name: "Process Terminated",
        description: "Process ended",
        details: "Useful for tracking application lifecycle and investigating crashes",
        severity: "info"
      }
    ]
  },
  persistence: {
    title: "Persistence Mechanisms (Malware)",
    color: "text-red-400",
    events: [
      {
        id: "4697",
        name: "Service Installed",
        description: "New Windows service created",
        details: "Common malware persistence technique. Check Service File Name, Path, and Start Type. Verify legitimacy",
        severity: "critical"
      },
      {
        id: "4698",
        name: "Scheduled Task Created",
        description: "New scheduled task created",
        details: "Common persistence mechanism. Check Task Name, Actions, Triggers, and Run As account. Verify authorization",
        severity: "critical"
      },
      {
        id: "4699",
        name: "Scheduled Task Deleted",
        description: "Scheduled task removed",
        details: "Verify if authorized. Could be cleanup or attacker removing traces",
        severity: "warning"
      },
      {
        id: "4702",
        name: "Scheduled Task Updated",
        description: "Scheduled task modified",
        details: "Check what changed. Could indicate task hijacking",
        severity: "warning"
      }
    ]
  },
  systemIntegrity: {
    title: "System Integrity & Tampering",
    color: "text-red-400",
    events: [
      {
        id: "4616",
        name: "System Time Changed",
        description: "System clock modified",
        details: "Can indicate tampering to hide event timestamps. Verify if legitimate maintenance",
        severity: "critical"
      },
      {
        id: "4719",
        name: "Audit Policy Changed",
        description: "System audit settings modified",
        details: "CRITICAL - Attacker may disable logging to hide activities. Verify authorization immediately",
        severity: "critical"
      },
      {
        id: "4608",
        name: "Windows Starting Up",
        description: "Windows boot initiated",
        details: "System startup event. Useful for uptime tracking",
        severity: "info"
      },
      {
        id: "6008",
        name: "Unexpected Shutdown",
        description: "System crashed or lost power",
        details: "Check for hardware issues, forced shutdown, or system crash. Review System log for errors",
        severity: "critical"
      },
      {
        id: "1074",
        name: "System Shutdown Initiated",
        description: "System shutdown or restart",
        details: "Check who initiated and reason. Normal for updates/maintenance",
        severity: "info"
      }
    ]
  },
  network: {
    title: "Network & File Shares",
    color: "text-blue-400",
    events: [
      {
        id: "5140",
        name: "Network Share Accessed",
        description: "User accessed network share",
        details: "Monitor for data exfiltration or lateral movement. Check Share Name, Source IP, and Access Mask",
        severity: "warning"
      },
      {
        id: "5142",
        name: "Network Share Created",
        description: "New network share created",
        details: "Verify authorization and check share permissions. Could be used for data staging",
        severity: "warning"
      },
      {
        id: "5144",
        name: "Network Share Deleted",
        description: "Network share removed",
        details: "Audit who deleted it. Could be cleanup or covering tracks",
        severity: "warning"
      }
    ]
  },
  investigations: {
    title: "Common Investigation Scenarios",
    scenarios: [
      {
        name: "Brute Force Detection",
        eventIds: "4625",
        description: "Multiple failed login attempts from same IP or account"
      },
      {
        name: "Privilege Escalation",
        eventIds: "4732,4728,4756",
        description: "Unauthorized addition to admin groups"
      },
      {
        name: "Unauthorized Access",
        eventIds: "4624,4672",
        description: "Unexpected admin logons or access from unusual locations"
      },
      {
        name: "Account Compromise",
        eventIds: "4720,4724,4738",
        description: "Suspicious account creation, password resets, or modifications"
      },
      {
        name: "Malware Persistence",
        eventIds: "4697,4698",
        description: "Services or scheduled tasks created for persistence"
      },
      {
        name: "Data Exfiltration",
        eventIds: "5140",
        description: "Unusual network share access patterns or large file transfers"
      },
      {
        name: "Audit Tampering",
        eventIds: "4719",
        description: "Audit policy disabled to hide malicious activities"
      },
      {
        name: "System Crashes",
        eventIds: "6008,1074",
        description: "Unexpected shutdowns or system instability"
      }
    ]
  }
};
