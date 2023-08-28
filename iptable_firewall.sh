#!/bin/sh
#
IPTABLES="/sbin/iptables"
#
# Remover módulos desnecessários
/sbin/modprobe ip_tables
/sbin/modprobe ip_conntrack
/sbin/modprobe iptable_filter
/sbin/modprobe iptable_mangle
/sbin/modprobe iptable_nat
/sbin/modprobe ipt_LOG
/sbin/modprobe ipt_limit
/sbin/modprobe ipt_state
#
# Enable Forwarding
echo "1" > /proc/sys/net/ipv4/ip_forward
#
# Set default policies to DROP
$IPTABLES -P INPUT DROP
$IPTABLES -P FORWARD DROP
$IPTABLES -P OUTPUT DROP
#
# Flush All Iptables Chains/Firewall rules
$IPTABLES -F
$IPTABLES -X
$IPTABLES -Z
#
# PROTECT RULES
#
# Allow connection RELATED,ESTABLISHED on eth0
$IPTABLES -A INPUT -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
#
# Log all packets
$IPTABLES -A INPUT -m conntrack --ctstate NEW -j LOG --log-prefix='[iptables_input] '
$IPTABLES -A OUTPUT -m conntrack --ctstate NEW -j LOG --log-prefix='[iptables_output] '
#
# Allow unlimited traffic on loopback and docker
$IPTABLES -A INPUT -i lo -j ACCEPT
$IPTABLES -A INPUT -i docker0 -j ACCEPT
#
# Allow specific services
$IPTABLES -A INPUT -p tcp -m state --state NEW -m multiport --dports ssh,smtp,http,https -m conntrack --ctstate NEW,ESTABLISHED,RELATED -j ACCEPT
$IPTABLES -A INPUT -p tcp -m multiport --dports 80,443 -m conntrack --ctstate NEW,ESTABLISHED,RELATED -j ACCEPT
$IPTABLES -A INPUT -p tcp -m multiport --dports 22,2280 -m conntrack --ctstate NEW,ESTABLISHED,RELATED -j ACCEPT
$IPTABLES -A INPUT -p tcp -m multiport --dports 25,587,465,2525 -m conntrack --ctstate NEW,ESTABLISHED,RELATED -j ACCEPT
#
# Allow Ping from Inside to Outside
$IPTABLES -A INPUT -p icmp -m state --state NEW -m icmp --icmp-type 8 -j ACCEPT
$IPTABLES -A INPUT -p icmp --icmp-type echo-reply -j ACCEPT
#
# Allow DNS
$IPTABLES -A INPUT -p udp -m udp --sport 53 -j ACCEPT
$IPTABLES -A INPUT -p tcp -m tcp --sport 53 -j ACCEPT
#
# SSH brute-force protection
$IPTABLES -A INPUT -p tcp --dport ssh -m conntrack --ctstate NEW -m recent --set
$IPTABLES -A INPUT -p tcp --dport ssh -m conntrack --ctstate NEW -m recent --update --seconds 60 --hitcount 10 -j DROP
#
# Allow custom rule# Obtenha o endereço IP do contêiner
#CONTAINER_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' CONTAINER_ID)
# Permita todo o tráfego do contêiner para o host
#$IPTABLES -A INPUT -s $CONTAINER_IP -j ACCEPT
#$IPTABLES -A OUTPUT -d $CONTAINER_IP -j ACCEPT
#

#
#
# Syn-flood protection
$IPTABLES -A INPUT -p tcp --syn -m limit --limit 1/s --limit-burst 3 -j RETURN
$IPTABLES -A INPUT -p tcp --syn -j DROP
#
# Protection against port scanning
$IPTABLES -N port-scanning
$IPTABLES -A port-scanning -p tcp --tcp-flags SYN,ACK,FIN,RST RST -m limit --limit 1/s --limit-burst 2 -j RETURN
$IPTABLES -A port-scanning -j DROP
#
# Block New Packets That Are Not SYN
$IPTABLES -t mangle -A PREROUTING -p tcp ! --syn -m conntrack --ctstate NEW -j DROP
#
# Drop all NULL packets
$IPTABLES -A INPUT -p tcp --tcp-flags ALL NONE -j DROP
#
# Block Uncommon MSS Values
$IPTABLES -t mangle -A PREROUTING -p tcp -m conntrack --ctstate NEW -m tcpmss ! --mss 536:65535 -j DROP
#
# Block packets with bogus TCP flags
$IPTABLES -t mangle -A PREROUTING -p tcp --tcp-flags FIN,SYN,RST,PSH,ACK,URG NONE -j DROP
$IPTABLES -t mangle -A PREROUTING -p tcp --tcp-flags FIN,SYN FIN,SYN -j DROP
$IPTABLES -t mangle -A PREROUTING -p tcp --tcp-flags SYN,RST SYN,RST -j DROP
$IPTABLES -t mangle -A PREROUTING -p tcp --tcp-flags FIN,RST FIN,RST -j DROP
$IPTABLES -t mangle -A PREROUTING -p tcp --tcp-flags FIN,ACK FIN -j DROP
$IPTABLES -t mangle -A PREROUTING -p tcp --tcp-flags ACK,URG URG -j DROP
$IPTABLES -t mangle -A PREROUTING -p tcp --tcp-flags ACK,FIN FIN -j DROP
$IPTABLES -t mangle -A PREROUTING -p tcp --tcp-flags ACK,PSH PSH -j DROP
$IPTABLES -t mangle -A PREROUTING -p tcp --tcp-flags ALL ALL -j DROP
$IPTABLES -t mangle -A PREROUTING -p tcp --tcp-flags ALL NONE -j DROP
$IPTABLES -t mangle -A PREROUTING -p tcp --tcp-flags ALL FIN,PSH,URG -j DROP
$IPTABLES -t mangle -A PREROUTING -p tcp --tcp-flags ALL SYN,FIN,PSH,URG -j DROP
$IPTABLES -t mangle -A PREROUTING -p tcp --tcp-flags ALL SYN,RST,ACK,FIN,URG -j DROP
#
# Block Packets From Private Subnets (Spoofing)
$IPTABLES -t mangle -A PREROUTING -s 224.0.0.0/3 -j DROP
$IPTABLES -t mangle -A PREROUTING -s 169.254.0.0/16 -j DROP
$IPTABLES -t mangle -A PREROUTING -s 192.0.2.0/24 -j DROP
$IPTABLES -t mangle -A PREROUTING -s 10.0.0.0/8 -j DROP
$IPTABLES -t mangle -A PREROUTING -s 0.0.0.0/8 -j DROP
$IPTABLES -t mangle -A PREROUTING -s 240.0.0.0/5 -j DROP
$IPTABLES -t mangle -A PREROUTING -s 127.0.0.0/8 ! -i lo -j DROP
#
# Allow outgoing traffic
$IPTABLES -A OUTPUT -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
$IPTABLES -A OUTPUT -j ACCEPT
#
#
iptables-save
iptables-save > /usr/local/rules.save
#
echo "Iptables rules have been set!"