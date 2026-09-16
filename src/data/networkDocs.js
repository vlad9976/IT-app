export const networkDocumentation = {
  title: 'Network Concepts',
  subtitle: 'Simple explanations and office examples for everyday IT work',
  sections: [
    {
      id: 'addressing',
      title: 'Addresses',
      color: 'text-blue-400',
      concepts: [
        {
          name: 'IP address',
          explanation: 'A number that identifies a device on a network, like a house number. IPv4 looks like 192.168.1.25. Without an IP, the PC cannot send or receive data on that network.',
          example: 'A user’s laptop gets 10.10.20.45. When they open a file share, the server answers that IP. If two PCs accidentally use the same IP, one of them randomly drops off the network.'
        },
        {
          name: 'Public vs private IP',
          explanation: 'Private IPs stay inside the office (10.x, 172.16–31.x, 192.168.x). The public IP is what the internet sees, usually on the firewall. Many PCs share one public IP.',
          example: 'Every PC shows 192.168.1.x in ipconfig, but whatismyip.com shows 85.64.12.9 — that is the office firewall’s public address.'
        },
        {
          name: 'IPv4 vs IPv6',
          explanation: 'IPv4 is the classic 4-number address. IPv6 is longer (2001:db8::1) and exists because IPv4 addresses ran out. Most offices still live on IPv4.',
          example: 'ipconfig shows both IPv4 192.168.1.25 and IPv6 fe80::…. If a site fails only on IPv6, try ping -4 hostname to force IPv4.'
        },
        {
          name: 'MAC address',
          explanation: 'The hardware ID of the network card, like a serial number burned into the NIC. Switches use MAC to deliver frames on the local LAN. It does not route across the internet.',
          example: 'DHCP reservation: “give this printer 192.168.1.50 forever” is bound to MAC AA-BB-CC-11-22-33. If you replace the printer, update the reservation to the new MAC.'
        }
      ]
    },
    {
      id: 'path',
      title: 'How traffic finds its way',
      color: 'text-emerald-400',
      concepts: [
        {
          name: 'Subnet / subnet mask',
          explanation: 'The mask decides who is “on my street” vs who needs the gateway. Same subnet = talk directly. Different subnet = send to the default gateway.',
          example: 'PC 192.168.1.25 mask 255.255.255.0 can reach printer 192.168.1.50 directly. File server 192.168.2.10 is another subnet, so the PC sends that traffic to the gateway.'
        },
        {
          name: 'CIDR',
          explanation: 'A short way to write a subnet. /24 means 255.255.255.0 (256 addresses). /16 is a bigger network. /32 is a single host.',
          example: 'VPN policy “allow 10.20.0.0/16” means the whole 10.20.x.x office range. A firewall rule to one server is written 10.20.5.12/32.'
        },
        {
          name: 'Default gateway',
          explanation: 'The door out of the local subnet — usually the firewall or router. If the gateway is wrong or down, local printers may work but internet and other VLANs fail.',
          example: 'User can print to 192.168.1.50 but Chrome says “no internet”. ipconfig shows gateway 192.168.1.1, but that router is offline. Fix the gateway or the router.'
        },
        {
          name: 'Routing',
          explanation: 'Routers choose the next hop for a packet. A PC has a tiny route table: local subnet + default route 0.0.0.0. Routers have more routes between sites.',
          example: 'Branch PC → local firewall → site-to-site VPN → HQ firewall → file server. If the VPN tunnel is down, the HQ route disappears and the share times out.'
        },
        {
          name: 'ARP',
          explanation: 'On the LAN, IP must become a MAC. ARP asks “who has 192.168.1.1?” The gateway answers with its MAC. A wrong ARP cache can send traffic to the wrong device.',
          example: 'After replacing a firewall, PCs still talk to the old MAC. arp -d * or a reboot clears it. Duplicate IPs also show up as ARP conflicts in the event log.'
        }
      ]
    },
    {
      id: 'names',
      title: 'Names and DNS',
      color: 'text-purple-400',
      concepts: [
        {
          name: 'DNS',
          explanation: 'The phone book of the network. It turns names (mail.company.com) into IPs. If DNS is wrong, the PC is “online” but cannot find servers, websites, or the domain.',
          example: 'ping fileserver fails with “could not find host”, but ping 10.10.1.20 works. DNS is broken, not the network cable. Check DNS servers in ipconfig /all.'
        },
        {
          name: 'DNS suffix / search domain',
          explanation: 'A shortcut so “fileserver” becomes fileserver.company.local. Domain-joined PCs get this from DHCP or GPO.',
          example: 'nslookup fileserver only works if the suffix is company.local. Without it, the user must type fileserver.company.local.'
        },
        {
          name: 'Hosts file',
          explanation: 'A local override list in C:\\Windows\\System32\\drivers\\etc\\hosts. It wins over DNS. Useful for a quick test, dangerous if forgotten.',
          example: 'Someone mapped intranet to an old IP in hosts. After the server moved, only that PC still opens the dead site. Remove the hosts line.'
        },
        {
          name: 'Flush DNS',
          explanation: 'Windows caches DNS answers. After a server IP change, the cache can keep the old IP until you run ipconfig /flushdns.',
          example: 'You moved a website to a new server. One user still hits the old site. Flush DNS (and browser cache). Others who never cached it already work.'
        }
      ]
    },
    {
      id: 'getting-connected',
      title: 'Getting an address',
      color: 'text-amber-400',
      concepts: [
        {
          name: 'DHCP',
          explanation: 'Automatic IP assignment. The PC asks “any DHCP server?” and gets IP, mask, gateway, and DNS for a lease time. No DHCP = APIPA 169.254.x.x and no real network.',
          example: 'User has 169.254.33.10. That means DHCP did not answer. Check cable, VLAN, DHCP scope full, or a helper/relay missing on that VLAN.'
        },
        {
          name: 'Static IP',
          explanation: 'You type the IP by hand. Common on servers, printers, and firewalls. Must not collide with the DHCP pool.',
          example: 'A printer is set to 192.168.1.50. If DHCP also gives that IP to a laptop, printing randomly fails. Reserve 192.168.1.50 or exclude it from the pool.'
        },
        {
          name: 'DHCP reservation',
          explanation: 'DHCP still assigns the IP, but always the same one to a specific MAC. Best of both worlds for printers and scanners.',
          example: 'Scanner reservation: MAC of the scanner → 10.10.30.20. Users keep a fixed scan-to-folder target, and you can still manage it from the DHCP console.'
        },
        {
          name: 'APIPA (169.254.x.x)',
          explanation: 'Windows gives itself this address when DHCP fails. It can talk only to other 169.254 devices on the same cable/switch, not to the internet or domain.',
          example: 'New PC cannot join the domain and has 169.254.x.x. Plug into a known-good port. If it then gets 10.x, the first port/VLAN was wrong.'
        }
      ]
    },
    {
      id: 'transport',
      title: 'TCP, UDP, and ports',
      color: 'text-cyan-400',
      concepts: [
        {
          name: 'TCP vs UDP',
          explanation: 'TCP is reliable: it checks that packets arrived (web, RDP, file copy). UDP is fast and does not wait for confirmation (DNS queries, VoIP, video).',
          example: 'A Teams call can sound choppy (UDP loss) while Outlook still works (TCP retries). File copy uses TCP, so it is slower but complete.'
        },
        {
          name: 'Port',
          explanation: 'An IP is the building. A port is the apartment number for a service. HTTPS is 443, RDP is 3389, SMB is 445. Firewall rules usually allow IP + port.',
          example: 'Website works (443) but RDP to the same server fails. Port 3389 is blocked on the firewall, not a “network down” problem.'
        },
        {
          name: 'Listening vs connecting',
          explanation: 'A server listens on a port. A client connects to that port. netstat / Get-NetTCPConnection shows who is listening.',
          example: 'IIS is down, nothing listens on 443, so browsers get connection refused. Start the site/service; the port appears as LISTENING.'
        }
      ]
    },
    {
      id: 'edge',
      title: 'NAT, firewall, proxy',
      color: 'text-red-400',
      concepts: [
        {
          name: 'NAT',
          explanation: 'Network Address Translation hides many private IPs behind one public IP. The firewall rewrites the source address going out and maps replies back in.',
          example: '50 office PCs share public IP 85.64.12.9. A vendor whitelist that IP. If you add a second internet line with a new public IP, the vendor must whitelist that too.'
        },
        {
          name: 'Port forwarding',
          explanation: 'A special NAT rule: “internet traffic to public IP:443 goes to internal server 10.10.1.20:443”. Opens a hole from the internet. Use carefully.',
          example: 'A camera is forwarded on port 8080. Scanners on the internet will find it. Prefer VPN instead of forwarding RDP 3389 to a PC.'
        },
        {
          name: 'Firewall',
          explanation: 'Allows or blocks traffic by source, destination, and port. Windows Firewall is on the PC. The perimeter firewall sits at the internet edge.',
          example: 'SMB share works in the office VLAN but not from Wi-Fi guest. Guest VLAN is isolated by firewall. Move the user to the corp SSID.'
        },
        {
          name: 'Proxy',
          explanation: 'A middle box that fetches websites for the PC. The browser talks to the proxy, the proxy talks to the internet. Can break apps that ignore proxy settings.',
          example: 'Chrome works (uses system proxy) but a PowerShell Invoke-WebRequest fails. Set proxy for that session or bypass the app on the proxy.'
        }
      ]
    },
    {
      id: 'types',
      title: 'Network types',
      color: 'text-pink-400',
      concepts: [
        {
          name: 'LAN',
          explanation: 'Local Area Network — the office switch fabric. Fast, private, usually 1 Gbps. Same building or floor.',
          example: 'Copying a 2 GB ISO from a local file server takes seconds on LAN and minutes over VPN from home.'
        },
        {
          name: 'WAN',
          explanation: 'Wide Area Network — links between sites or to the internet. Slower and more latency than LAN.',
          example: 'Branch users say “the share is slow”. The share sits in HQ over a 20 Mbps WAN. Map a local cache or move the data closer.'
        },
        {
          name: 'VLAN',
          explanation: 'A virtual LAN: one physical switch, several logical networks (Corp, Voice, Guest, Servers). A PC in the wrong VLAN gets the wrong DHCP and “no domain / no internet”.',
          example: 'A wall port is still on Voice VLAN. A PC gets 10.30.x.x (phones) instead of 10.10.x.x. Change the switch port to the Corp VLAN.'
        },
        {
          name: 'WLAN / Wi-Fi',
          explanation: 'Wireless LAN. Same IP ideas, but signal, channel, and authentication (WPA2-Enterprise, captive portal) add extra failure points.',
          example: 'User is on Guest Wi-Fi (no AD, no printers). Switch them to Corp Wi-Fi with their domain account. Same building, different network.'
        },
        {
          name: 'Switch vs router',
          explanation: 'A switch connects devices in the same network (MAC). A router connects different networks (IP). A firewall is a router with security policy.',
          example: 'Two PCs on the same VLAN talk through the switch only. To reach another VLAN or the internet they must hit the router/firewall.'
        }
      ]
    },
    {
      id: 'remote',
      title: 'Remote access',
      color: 'text-orange-400',
      concepts: [
        {
          name: 'VPN',
          explanation: 'An encrypted tunnel from a remote PC into the office network. After connect, the PC can use internal IPs as if it were on the LAN (with more latency).',
          example: 'From home, \\\\fileserver\\share fails until GlobalProtect/AnyConnect is connected. After VPN, the same path works.'
        },
        {
          name: 'RDP',
          explanation: 'Remote Desktop (port 3389) shows another Windows desktop. It does not put your laptop on that network; it only controls that PC.',
          example: 'Helpdesk RDPs to a user’s office PC to install software. The tech’s laptop stays on the helpdesk VLAN; only the session is remote.'
        },
        {
          name: 'Split tunnel vs full tunnel',
          explanation: 'Split tunnel: only office IPs go through the VPN. Full tunnel: all traffic, including YouTube, goes through the office. Full tunnel is safer, split is faster.',
          example: 'With full tunnel, home Wi-Fi internet feels slow because it exits via HQ. Split tunnel keeps Teams media local and only file-share traffic in the tunnel.'
        }
      ]
    },
    {
      id: 'quality',
      title: 'Speed and quality',
      color: 'text-lime-400',
      concepts: [
        {
          name: 'Bandwidth',
          explanation: 'How much data per second (Mbps). Like the width of a pipe. Many users sharing a small WAN pipe makes everything slow at 9:00.',
          example: 'One user uploads a 10 GB backup over a 20 Mbps line and everyone else’s Outlook crawls until it finishes.'
        },
        {
          name: 'Latency',
          explanation: 'Delay for a packet to go and come back (ms). Ping measures this. VoIP and RDP feel this more than file size does.',
          example: 'Ping to HQ is 80 ms — RDP is usable. Ping 400 ms over bad Wi-Fi — typing in RDP lags. Speedtest can still show “good Mbps”.'
        },
        {
          name: 'Packet loss',
          explanation: 'Some packets never arrive. TCP retries (slow copies). UDP just drops (bad calls). Even 1–2% loss hurts voice and RDP.',
          example: 'ping server -n 50 shows “Lost = 8 (16% loss)”. Fix cabling, Wi-Fi, or a failing switch port before blaming the application.'
        },
        {
          name: 'DNS vs ping vs the app',
          explanation: 'Always split the problem: name resolution, then reachability (ping), then the service port. Each layer fails differently.',
          example: 'ping fileserver fails (DNS). ping 10.10.1.20 works (network OK). \\10.10.1.20\\share fails (SMB/firewall/permissions). Now you know where to look.'
        }
      ]
    },
    {
      id: 'stories',
      title: 'Everyday IT examples',
      color: 'text-sky-400',
      concepts: [
        {
          name: '“I have internet but cannot reach the server”',
          explanation: 'Internet uses public DNS + default gateway. Internal servers need internal DNS and maybe VPN. These are different paths.',
          example: 'Home user browses Google fine (no VPN). \\\\hq-fs01 fails because that name and IP exist only on the office network. Connect VPN first.'
        },
        {
          name: '“The website works on my phone, not on the PC”',
          explanation: 'Phone uses mobile data (different public IP, no proxy). PC uses office DNS, proxy, or a hosts file.',
          example: 'Office proxy blocks the site; the phone on LTE does not use the proxy. Test the PC with another browser or check proxy exceptions.'
        },
        {
          name: 'Domain join needs DNS more than “internet”',
          explanation: 'Joining AD requires reaching a domain controller and resolving the domain name. Wrong DNS (8.8.8.8 only) breaks join even with perfect internet.',
          example: 'New PC uses 8.8.8.8. nslookup company.local fails. Set DNS to the DC (10.10.1.11) or DHCP option 006, then join works.'
        },
        {
          name: 'Printer “offline” is often VLAN or gateway',
          explanation: 'The queue looks offline when the PC cannot route to the printer IP, not only when the printer is powered off.',
          example: 'Printer 10.10.40.20 is on the Print VLAN. User on Guest Wi-Fi cannot reach 10.10.40.x. Same printer works from a corp docked PC.'
        }
      ]
    }
  ]
};
