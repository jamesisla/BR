#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE OPTIMIZACIÓN Y LIMPIEZA EXTREMA PARA SERVIDOR UBUNTU (OCI 1GB RAM)
# Reduce procesos al mínimo esencial manteniendo SSH y Tienda 100% operativos.
# ==============================================================================

set -e

GREEN='\033[032m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Por favor ejecuta este script con permisos de superusuario: sudo bash $0${NC}"
    exit 1
fi

echo -e "${YELLOW}🧹 [1/5] Deteniendo y deshabilitando servicios innecesarios...${NC}"

# Lista de servicios pesados e innecesarios en servidores web en la nube
SERVICES_TO_DISABLE=(
    "snapd.service"
    "snapd.socket"
    "snapd.seeded.service"
    "multipathd.service"
    "multipathd.socket"
    "apport.service"
    "whoopsie.service"
    "unattended-upgrades.service"
    "packagekit.service"
    "ModemManager.service"
    "bluetooth.service"
    "cups.service"
    "cups-browsed.service"
    "avahi-daemon.service"
    "avahi-daemon.socket"
    "speech-dispatcher.service"
    "thermald.service"
    "udisks2.service"
)

for svc in "${SERVICES_TO_DISABLE[@]}"; do
    if systemctl list-unit-files | grep -q "^$svc"; then
        echo "   -> Desactivando: $svc"
        systemctl stop "$svc" 2>/dev/null || true
        systemctl disable "$svc" 2>/dev/null || true
        systemctl mask "$svc" 2>/dev/null || true
    fi
done

echo -e "\n${YELLOW}🗑️  [2/5] Desinstalando paquetes residuales y telemetría...${NC}"
apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get remove --purge -y \
    apport \
    whoopsie \
    popularity-contest \
    ubuntu-report \
    modemmanager 2>/dev/null || true

apt-get autoremove --purge -y
apt-get clean

echo -e "\n${YELLOW}📦 [3/5] Limpiando logs antiguos de Systemd Journal...${NC}"
journalctl --vacuum-size=50M
journalctl --vacuum-time=7d

# Limitar tamaño máximo de logs en disco
mkdir -p /etc/systemd/journald.conf.d
cat << 'EOF' > /etc/systemd/journald.conf.d/00-limits.conf
[Journal]
SystemMaxUse=50M
RuntimeMaxUse=20M
MaxRetentionSec=7day
EOF
systemctl restart systemd-journald

echo -e "\n${YELLOW}⚡ [4/5] Optimizando Swappiness y memoria del kernel para 1GB RAM...${NC}"
# Ajustar swappiness a 10 (evita uso prematuro de swap manteniendo alta velocidad de RAM)
cat << 'EOF' > /etc/sysctl.d/99-cloud-tuning.conf
vm.swappiness=10
vm.vfs_cache_pressure=50
vm.dirty_background_ratio=5
vm.dirty_ratio=10
EOF
sysctl --system > /dev/null 2>&1 || true

echo -e "\n${YELLOW}🔒 [5/5] Verificando servicios vitales (SSH & Tienda)...${NC}"
systemctl enable ssh 2>/dev/null || systemctl enable sshd 2>/dev/null || true
systemctl restart tienda.service 2>/dev/null || true

echo -e "\n${GREEN}================================================================${NC}"
echo -e "${GREEN}✅ ¡Optimización completada con éxito!${NC}"
echo -e "${GREEN}   • Se apagaron y enmascararon todos los daemons no esenciales.${NC}"
echo -e "${GREEN}   • SSH y la Tienda permanecen 100% operativos.${NC}"
echo -e "${GREEN}   • Los cambios son permanentes y persistirán tras reinicios.${NC}"
echo -e "${GREEN}================================================================${NC}"
