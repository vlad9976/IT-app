export const serviceDocumentation = {
  system: {
    title: "System Services",
    color: "text-blue-400",
    services: [
      {
        name: "wuauserv",
        displayName: "Windows Update",
        description: "Manages Windows Update downloads and installations",
        importance: "critical",
        notes: "Stop to prevent automatic updates during maintenance. Required for manual updates."
      },
      {
        name: "BITS",
        displayName: "Background Intelligent Transfer Service",
        description: "Transfers files in the background using idle network bandwidth",
        importance: "high",
        notes: "Used by Windows Update and many applications. Safe to restart if stuck."
      },
      {
        name: "Spooler",
        displayName: "Print Spooler",
        description: "Manages all print jobs and print queue",
        importance: "high",
        notes: "Restart to clear stuck print jobs. Stop to prevent printing."
      },
      {
        name: "EventLog",
        displayName: "Windows Event Log",
        description: "Manages event logging for system diagnostics",
        importance: "critical",
        notes: "Critical for troubleshooting. Do not stop unless absolutely necessary."
      },
      {
        name: "Themes",
        displayName: "Themes",
        description: "Provides theme management for Windows",
        importance: "low",
        notes: "Safe to disable on servers. Reduces resource usage slightly."
      },
      {
        name: "WSearch",
        displayName: "Windows Search",
        description: "Indexes files for fast searching",
        importance: "medium",
        notes: "Can use significant CPU/disk. Safe to disable if not using search."
      }
    ]
  },
  network: {
    title: "Network Services",
    color: "text-green-400",
    services: [
      {
        name: "LanmanServer",
        displayName: "Server",
        description: "Supports file, print, and named-pipe sharing over the network",
        importance: "high",
        notes: "Required for file sharing. Stop to disable all network shares."
      },
      {
        name: "LanmanWorkstation",
        displayName: "Workstation",
        description: "Creates and maintains client network connections",
        importance: "critical",
        notes: "Required to access network resources. Do not stop."
      },
      {
        name: "Dnscache",
        displayName: "DNS Client",
        description: "Caches Domain Name System (DNS) names",
        importance: "critical",
        notes: "Required for internet connectivity. Restart to flush DNS cache."
      },
      {
        name: "Dhcp",
        displayName: "DHCP Client",
        description: "Registers and updates IP addresses and DNS records",
        importance: "critical",
        notes: "Required for automatic IP configuration. Do not stop."
      },
      {
        name: "Netlogon",
        displayName: "Netlogon",
        description: "Maintains secure channel between computer and domain controller",
        importance: "critical",
        notes: "Required for domain authentication. Do not stop on domain-joined machines."
      },
      {
        name: "RemoteRegistry",
        displayName: "Remote Registry",
        description: "Enables remote users to modify registry settings",
        importance: "low",
        notes: "Security risk. Disable unless specifically needed for remote management."
      }
    ]
  },
  security: {
    title: "Security Services",
    color: "text-red-400",
    services: [
      {
        name: "WinDefend",
        displayName: "Windows Defender Antivirus Service",
        description: "Protects against malware and threats",
        importance: "critical",
        notes: "Core security service. Do not disable unless using third-party antivirus."
      },
      {
        name: "wscsvc",
        displayName: "Security Center",
        description: "Monitors and reports security health settings",
        importance: "high",
        notes: "Alerts about security issues. Safe to disable but not recommended."
      },
      {
        name: "WdNisSvc",
        displayName: "Windows Defender Network Inspection Service",
        description: "Protects against network-based exploits",
        importance: "high",
        notes: "Part of Windows Defender. Disable only with third-party security."
      },
      {
        name: "MpsSvc",
        displayName: "Windows Defender Firewall",
        description: "Protects computer from unauthorized network access",
        importance: "critical",
        notes: "Critical security service. Do not disable without alternative firewall."
      },
      {
        name: "SamSs",
        displayName: "Security Accounts Manager",
        description: "Stores security information for local user accounts",
        importance: "critical",
        notes: "Core authentication service. Do not stop."
      }
    ]
  },
  remote: {
    title: "Remote Access Services",
    color: "text-purple-400",
    services: [
      {
        name: "TermService",
        displayName: "Remote Desktop Services",
        description: "Allows users to connect interactively to remote computers",
        importance: "high",
        notes: "Required for RDP. Stop to disable remote desktop access."
      },
      {
        name: "SessionEnv",
        displayName: "Remote Desktop Configuration",
        description: "Manages Remote Desktop Services configuration",
        importance: "high",
        notes: "Required for RDP. Works with TermService."
      },
      {
        name: "UmRdpService",
        displayName: "Remote Desktop Services UserMode Port Redirector",
        description: "Allows redirection of printers/drives/ports for RDP connections",
        importance: "medium",
        notes: "Enables resource sharing in RDP sessions."
      },
      {
        name: "WinRM",
        displayName: "Windows Remote Management (WS-Management)",
        description: "Implements WS-Management protocol for remote management",
        importance: "high",
        notes: "Required for PowerShell remoting. Enable for remote administration."
      }
    ]
  },
  storage: {
    title: "Storage & Disk Services",
    color: "text-yellow-400",
    services: [
      {
        name: "vss",
        displayName: "Volume Shadow Copy",
        description: "Manages volume shadow copies for backup and restore",
        importance: "critical",
        notes: "Required for system restore and many backup solutions."
      },
      {
        name: "defragsvc",
        displayName: "Optimize Drives",
        description: "Optimizes files on storage drives for improved performance",
        importance: "medium",
        notes: "Runs scheduled optimization. Safe to stop temporarily."
      },
      {
        name: "stisvc",
        displayName: "Windows Image Acquisition (WIA)",
        description: "Provides image acquisition services for scanners and cameras",
        importance: "low",
        notes: "Required for scanners. Restart if scanner not working."
      },
      {
        name: "StorSvc",
        displayName: "Storage Service",
        description: "Provides enabling services for storage settings and external storage",
        importance: "high",
        notes: "Required for storage management. Do not stop."
      }
    ]
  },
  application: {
    title: "Application Services",
    color: "text-cyan-400",
    services: [
      {
        name: "MSSQLSERVER",
        displayName: "SQL Server (MSSQLSERVER)",
        description: "Microsoft SQL Server database engine",
        importance: "high",
        notes: "Database service. Stop to perform maintenance or troubleshooting."
      },
      {
        name: "W3SVC",
        displayName: "World Wide Web Publishing Service",
        description: "Provides web connectivity and administration through IIS",
        importance: "high",
        notes: "IIS web server. Restart to apply configuration changes."
      },
      {
        name: "IISADMIN",
        displayName: "IIS Admin Service",
        description: "Enables administration of web and FTP services",
        importance: "high",
        notes: "Required for IIS management. Do not stop if running web services."
      },
      {
        name: "OneSyncSvc",
        displayName: "Sync Host",
        description: "Synchronizes mail, contacts, calendar and various other user data",
        importance: "medium",
        notes: "Used by Mail app and other sync features. Safe to disable."
      }
    ]
  },
  troubleshooting: {
    title: "Common Troubleshooting Scenarios",
    scenarios: [
      {
        issue: "Windows Update Stuck",
        services: "wuauserv, BITS, cryptsvc",
        solution: "Stop all three services, clear C:\\Windows\\SoftwareDistribution, restart services"
      },
      {
        issue: "Print Jobs Stuck",
        services: "Spooler",
        solution: "Stop Spooler, clear C:\\Windows\\System32\\spool\\PRINTERS, restart Spooler"
      },
      {
        issue: "Network Connectivity Issues",
        services: "Dnscache, Dhcp, Netman",
        solution: "Restart DNS Client and DHCP Client, run ipconfig /release and /renew"
      },
      {
        issue: "Remote Desktop Not Working",
        services: "TermService, SessionEnv, UmRdpService",
        solution: "Ensure all RDP services are running and set to Automatic"
      },
      {
        issue: "Scanner Not Detected",
        services: "stisvc",
        solution: "Restart Windows Image Acquisition service, check USB connection"
      },
      {
        issue: "System Restore Failed",
        services: "vss, swprv",
        solution: "Restart Volume Shadow Copy services, check disk space"
      },
      {
        issue: "High CPU Usage",
        services: "WSearch, SysMain, DiagTrack",
        solution: "Stop Windows Search temporarily, disable SuperFetch/Prefetch if not needed"
      },
      {
        issue: "Cannot Access Network Shares",
        services: "LanmanWorkstation, LanmanServer",
        solution: "Restart Workstation and Server services, check firewall rules"
      }
    ]
  }
};
