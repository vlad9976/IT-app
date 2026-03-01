export const portDocumentation = {
  web: {
    title: "Web & HTTP Services",
    color: "text-blue-400",
    ports: [
      {
        port: "80",
        name: "HTTP",
        description: "Hypertext Transfer Protocol - Standard web traffic",
        protocol: "TCP",
        usage: "Web servers, websites, web applications",
        security: "Unencrypted - use HTTPS (443) for sensitive data",
        common: true
      },
      {
        port: "443",
        name: "HTTPS",
        description: "HTTP Secure - Encrypted web traffic",
        protocol: "TCP",
        usage: "Secure websites, SSL/TLS encrypted web services",
        security: "Encrypted with SSL/TLS - recommended for all web traffic",
        common: true
      },
      {
        port: "8080",
        name: "HTTP Alternate",
        description: "Alternative HTTP port, often used for proxies",
        protocol: "TCP",
        usage: "Development servers, proxy servers, alternate web services",
        security: "Unencrypted - same security concerns as port 80",
        common: true
      },
      {
        port: "8443",
        name: "HTTPS Alternate",
        description: "Alternative HTTPS port",
        protocol: "TCP",
        usage: "Alternate secure web services, development HTTPS servers",
        security: "Encrypted - alternate to port 443",
        common: false
      }
    ]
  },
  email: {
    title: "Email Services",
    color: "text-green-400",
    ports: [
      {
        port: "25",
        name: "SMTP",
        description: "Simple Mail Transfer Protocol - Email sending",
        protocol: "TCP",
        usage: "Mail servers for sending email between servers",
        security: "Unencrypted - often blocked by ISPs to prevent spam",
        common: true
      },
      {
        port: "587",
        name: "SMTP (Submission)",
        description: "Email submission with authentication",
        protocol: "TCP",
        usage: "Email clients sending mail with STARTTLS encryption",
        security: "Supports STARTTLS - recommended for email submission",
        common: true
      },
      {
        port: "465",
        name: "SMTPS",
        description: "SMTP over SSL/TLS",
        protocol: "TCP",
        usage: "Secure email sending (legacy, but still used)",
        security: "Encrypted with SSL/TLS from connection start",
        common: true
      },
      {
        port: "110",
        name: "POP3",
        description: "Post Office Protocol v3 - Email retrieval",
        protocol: "TCP",
        usage: "Email clients downloading mail (downloads and deletes from server)",
        security: "Unencrypted - use port 995 for secure POP3",
        common: true
      },
      {
        port: "995",
        name: "POP3S",
        description: "POP3 over SSL/TLS",
        protocol: "TCP",
        usage: "Secure email retrieval",
        security: "Encrypted with SSL/TLS",
        common: true
      },
      {
        port: "143",
        name: "IMAP",
        description: "Internet Message Access Protocol - Email access",
        protocol: "TCP",
        usage: "Email clients accessing mail (keeps mail on server)",
        security: "Unencrypted - use port 993 for secure IMAP",
        common: true
      },
      {
        port: "993",
        name: "IMAPS",
        description: "IMAP over SSL/TLS",
        protocol: "TCP",
        usage: "Secure email access and synchronization",
        security: "Encrypted with SSL/TLS - recommended",
        common: true
      }
    ]
  },
  fileTransfer: {
    title: "File Transfer Services",
    color: "text-purple-400",
    ports: [
      {
        port: "21",
        name: "FTP",
        description: "File Transfer Protocol - File transfers",
        protocol: "TCP",
        usage: "File uploads/downloads, website management",
        security: "Unencrypted including passwords - use SFTP or FTPS",
        common: true
      },
      {
        port: "22",
        name: "SSH/SFTP",
        description: "Secure Shell and SSH File Transfer Protocol",
        protocol: "TCP",
        usage: "Secure remote access, secure file transfers, tunneling",
        security: "Encrypted - recommended for remote access and file transfer",
        common: true
      },
      {
        port: "990",
        name: "FTPS",
        description: "FTP over SSL/TLS",
        protocol: "TCP",
        usage: "Secure file transfers",
        security: "Encrypted with SSL/TLS",
        common: false
      },
      {
        port: "445",
        name: "SMB",
        description: "Server Message Block - Windows file sharing",
        protocol: "TCP",
        usage: "Windows network file shares, printer sharing",
        security: "Should be blocked from internet - vulnerable to attacks",
        common: true
      },
      {
        port: "139",
        name: "NetBIOS",
        description: "NetBIOS Session Service",
        protocol: "TCP",
        usage: "Legacy Windows file sharing and network browsing",
        security: "Legacy protocol - should be disabled if not needed",
        common: false
      }
    ]
  },
  database: {
    title: "Database Services",
    color: "text-yellow-400",
    ports: [
      {
        port: "3306",
        name: "MySQL/MariaDB",
        description: "MySQL and MariaDB database server",
        protocol: "TCP",
        usage: "MySQL/MariaDB database connections",
        security: "Should not be exposed to internet - use SSH tunnel or VPN",
        common: true
      },
      {
        port: "5432",
        name: "PostgreSQL",
        description: "PostgreSQL database server",
        protocol: "TCP",
        usage: "PostgreSQL database connections",
        security: "Should not be exposed to internet - use SSH tunnel or VPN",
        common: true
      },
      {
        port: "1433",
        name: "MS SQL Server",
        description: "Microsoft SQL Server",
        protocol: "TCP",
        usage: "SQL Server database connections",
        security: "Should not be exposed to internet - use VPN",
        common: true
      },
      {
        port: "27017",
        name: "MongoDB",
        description: "MongoDB database server",
        protocol: "TCP",
        usage: "MongoDB NoSQL database connections",
        security: "Should not be exposed to internet - enable authentication",
        common: true
      },
      {
        port: "6379",
        name: "Redis",
        description: "Redis in-memory data store",
        protocol: "TCP",
        usage: "Redis cache and data structure server",
        security: "Should not be exposed to internet - no default authentication",
        common: true
      }
    ]
  },
  remote: {
    title: "Remote Access Services",
    color: "text-red-400",
    ports: [
      {
        port: "3389",
        name: "RDP",
        description: "Remote Desktop Protocol",
        protocol: "TCP",
        usage: "Windows remote desktop connections",
        security: "High-value target for attacks - use VPN or change default port",
        common: true
      },
      {
        port: "5900",
        name: "VNC",
        description: "Virtual Network Computing",
        protocol: "TCP",
        usage: "Cross-platform remote desktop access",
        security: "Weak encryption by default - use SSH tunnel",
        common: true
      },
      {
        port: "23",
        name: "Telnet",
        description: "Telnet protocol - Remote terminal access",
        protocol: "TCP",
        usage: "Legacy remote terminal access",
        security: "INSECURE - transmits passwords in plain text - use SSH instead",
        common: false
      }
    ]
  },
  dns: {
    title: "DNS & Network Services",
    color: "text-cyan-400",
    ports: [
      {
        port: "53",
        name: "DNS",
        description: "Domain Name System",
        protocol: "TCP/UDP",
        usage: "Domain name resolution, DNS queries",
        security: "Essential service - can be exploited for DDoS amplification",
        common: true
      },
      {
        port: "67",
        name: "DHCP Server",
        description: "Dynamic Host Configuration Protocol Server",
        protocol: "UDP",
        usage: "DHCP server assigning IP addresses",
        security: "Local network only - should not be exposed to internet",
        common: false
      },
      {
        port: "68",
        name: "DHCP Client",
        description: "DHCP Client",
        protocol: "UDP",
        usage: "DHCP client receiving IP configuration",
        security: "Local network only",
        common: false
      }
    ]
  },
  messaging: {
    title: "Messaging & Communication",
    color: "text-pink-400",
    ports: [
      {
        port: "5060",
        name: "SIP",
        description: "Session Initiation Protocol",
        protocol: "TCP/UDP",
        usage: "VoIP call signaling, video conferencing",
        security: "Can be exploited for toll fraud - secure with TLS",
        common: false
      },
      {
        port: "5061",
        name: "SIP-TLS",
        description: "SIP over TLS",
        protocol: "TCP",
        usage: "Secure VoIP signaling",
        security: "Encrypted SIP traffic",
        common: false
      },
      {
        port: "1935",
        name: "RTMP",
        description: "Real-Time Messaging Protocol",
        protocol: "TCP",
        usage: "Live streaming, video/audio streaming",
        security: "Unencrypted - use RTMPS for secure streaming",
        common: false
      }
    ]
  },
  monitoring: {
    title: "Monitoring & Management",
    color: "text-orange-400",
    ports: [
      {
        port: "161",
        name: "SNMP",
        description: "Simple Network Management Protocol",
        protocol: "UDP",
        usage: "Network device monitoring and management",
        security: "SNMPv1/v2 unencrypted - use SNMPv3 with authentication",
        common: false
      },
      {
        port: "162",
        name: "SNMP Trap",
        description: "SNMP Trap receiver",
        protocol: "UDP",
        usage: "Receiving SNMP notifications from devices",
        security: "Use SNMPv3 for secure traps",
        common: false
      },
      {
        port: "514",
        name: "Syslog",
        description: "System logging protocol",
        protocol: "UDP",
        usage: "Centralized log collection",
        security: "Unencrypted - use TLS syslog for sensitive logs",
        common: false
      }
    ]
  },
  gaming: {
    title: "Gaming & Entertainment",
    color: "text-indigo-400",
    ports: [
      {
        port: "25565",
        name: "Minecraft",
        description: "Minecraft game server",
        protocol: "TCP",
        usage: "Minecraft multiplayer server",
        security: "Whitelist players, use authentication",
        common: false
      },
      {
        port: "27015",
        name: "Steam/Source Games",
        description: "Steam and Source engine games",
        protocol: "TCP/UDP",
        usage: "Counter-Strike, Team Fortress, etc.",
        security: "Use server passwords for private servers",
        common: false
      },
      {
        port: "3074",
        name: "Xbox Live",
        description: "Xbox Live gaming",
        protocol: "TCP/UDP",
        usage: "Xbox Live multiplayer gaming",
        security: "Required for Xbox Live connectivity",
        common: false
      }
    ]
  },
  scanningTips: {
    title: "Port Scanning Tips & Best Practices",
    tips: [
      {
        title: "Legal Considerations",
        description: "Only scan networks and systems you own or have explicit permission to test. Unauthorized port scanning may be illegal."
      },
      {
        title: "Common Open Ports",
        description: "Ports 80, 443, 22, 21, 25, 3389 are frequently open. Check these first for web servers, SSH, FTP, email, and RDP."
      },
      {
        title: "Security Implications",
        description: "Open ports are potential entry points. Close unnecessary ports and use firewalls to restrict access."
      },
      {
        title: "Firewall Detection",
        description: "If a port doesn't respond, it may be filtered by a firewall rather than closed. Use -WarningAction to see connection details."
      },
      {
        title: "Service Identification",
        description: "Knowing what service runs on a port helps troubleshooting. Use 'netstat -ano' locally to see what's listening."
      },
      {
        title: "Port Ranges",
        description: "Well-known ports: 0-1023, Registered ports: 1024-49151, Dynamic/Private: 49152-65535"
      }
    ]
  }
};
