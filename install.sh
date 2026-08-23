#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE INSTALACIÓN NATIVO - TIENDA SINGLE BINARY (Go + Embedded SPA)
# Optimizado para Oracle Cloud Infrastructure (OCI) Always Free E2.1.Micro
# ==============================================================================

set -e

GREEN='\033[032m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}  🚀 INSTALADOR TIENDA E-COMMERCE (SINGLE BINARY GO + REACT NATIVO)   ${NC}"
echo -e "${BLUE}  Máximo rendimiento: ~15 MB RAM, Cero Caddy, Cero Node en Producción ${NC}"
echo -e "${BLUE}======================================================================${NC}"

# 1. Verificar permisos de root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Por favor ejecuta este script con permisos sudo: sudo bash install.sh${NC}"
    exit 1
fi

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "Directorio del proyecto: $PROJECT_DIR"

# 2. Configurar Memoria Swap (2 GB) para asegurar builds fluidos en 1 GB RAM
echo -e "\n${YELLOW}🧠 [1/6] Verificando memoria Swap...${NC}"
if [ $(swapon --show | wc -l) -le 1 ]; then
    echo "Creando archivo swap de 2GB..."
    fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    if ! grep -q '/swapfile' /etc/fstab; then
        echo '/swapfile none swap sw 0 0' >> /etc/fstab
    fi
    echo -e "${GREEN}✅ Memoria Swap de 2GB creada y activada.${NC}"
else
    echo -e "${GREEN}✅ Memoria swap ya presente en el sistema.${NC}"
fi

# 3. Actualizar sistema e instalar paquetes esenciales
echo -e "\n${YELLOW}📦 [2/6] Instalando dependencias base del sistema...${NC}"
export DEBIAN_FRONTEND=noninteractive

# Corregir posibles llaves PPA rotas de terceros
if [ -f /etc/apt/sources.list.d/vscode.list ] || grep -rq "packages.microsoft.com" /etc/apt/sources.list.d/ 2>/dev/null; then
    mkdir -p /etc/apt/trusted.gpg.d /usr/share/keyrings /etc/apt/keyrings
    curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /etc/apt/trusted.gpg.d/microsoft.gpg 2>/dev/null || true
fi

apt-get update -qq || true
apt-get install -y --fix-missing curl wget git build-essential ufw ca-certificates gnupg debian-keyring debian-archive-keyring apt-transport-https

# 4. Instalar Go 1.22+
echo -e "\n${YELLOW}🐹 [3/6] Verificando / Instalando Go (Golang)...${NC}"
GO_VERSION="1.22.6"
if ! command -v go &> /dev/null || [[ "$(go version)" != *"go1.22"* && "$(go version)" != *"go1.23"* && "$(go version)" != *"go1.24"* ]]; then
    echo "Instalando Go $GO_VERSION oficial para Linux..."
    wget -q "https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz" -O /tmp/go.tar.gz
    rm -rf /usr/local/go
    tar -C /usr/local -xzf /tmp/go.tar.gz
    rm -f /tmp/go.tar.gz
    ln -sf /usr/local/go/bin/go /usr/bin/go
    ln -sf /usr/local/go/bin/gofmt /usr/bin/gofmt
    echo -e "${GREEN}✅ Go $(go version) instalado.${NC}"
else
    echo -e "${GREEN}✅ Go ya está instalado: $(go version)${NC}"
fi

# 5. Instalar Node.js y npm (únicamente necesario durante la compilación inicial del frontend)
echo -e "\n${YELLOW}🟢 [4/6] Verificando Node.js y npm (para compilación inicial)...${NC}"
if ! command -v node &> /dev/null; then
    apt-get install -y --fix-missing nodejs || true
fi
if ! command -v npm &> /dev/null; then
    apt-get install -y --fix-missing npm || true
fi
echo -e "${GREEN}✅ Node.js $(node -v 2>/dev/null || echo '') y npm $(npm -v 2>/dev/null || echo '') listos.${NC}"

# 6. Desbloquear Firewall OCI (iptables y ufw)
echo -e "\n${YELLOW}🛡️  [5/6] Configurando Firewall y abriendo puertos (22, 80, 443)...${NC}"
# Desbloquear puertos y reglas de rechazo por defecto en Oracle Cloud
iptables -P INPUT ACCEPT || true
iptables -P FORWARD ACCEPT || true
iptables -P OUTPUT ACCEPT || true
iptables -I INPUT 1 -p tcp --dport 22 -j ACCEPT 2>/dev/null || true
iptables -I INPUT 1 -p tcp --dport 80 -j ACCEPT 2>/dev/null || true
iptables -I INPUT 1 -p tcp --dport 443 -j ACCEPT 2>/dev/null || true

if command -v ufw &> /dev/null; then
    ufw allow 22/tcp 2>/dev/null || true
    ufw allow 80/tcp 2>/dev/null || true
    ufw allow 443/tcp 2>/dev/null || true
fi
echo -e "${GREEN}✅ Reglas de firewall configuradas.${NC}"

# 7. Compilar Frontend y Backend Go Single Binary
echo -e "\n${YELLOW}⚙️  [6/6] Compilando Frontend y Binario Único de Go...${NC}"

# Crear directorios y .env
mkdir -p "$PROJECT_DIR/backend/uploads"
mkdir -p "$PROJECT_DIR/backend/dist"

if [ ! -f "$PROJECT_DIR/backend/.env" ]; then
    if [ -f "$PROJECT_DIR/backend/.env.example" ]; then
        cp "$PROJECT_DIR/backend/.env.example" "$PROJECT_DIR/backend/.env"
    else
        cat <<EOF > "$PROJECT_DIR/backend/.env"
PORT=80
GIN_MODE=release
DATABASE_URL=$PROJECT_DIR/backend/ecommerce.db
ADMIN_PASSWORD=Malulo23
MP_ACCESS_TOKEN=TEST-6447849483321584-051015-8d598585474747474747474747474747-000000000
UPLOAD_DIR=$PROJECT_DIR/backend/uploads
DOMAIN=bere.vnd.mom
EOF
    fi
fi

# Compilar Frontend con Vite -> Salida directa en backend/dist
cd "$PROJECT_DIR/frontend"
echo "Instalando dependencias de frontend y compilando assets estáticos..."
npm install --no-audit --no-fund
npm run build

# Compilar Binario Go con Frontend Embebido
cd "$PROJECT_DIR/backend"
echo "Compilando ejecutable Go Single Binary (con frontend embebido)..."
go mod tidy
CGO_ENABLED=0 go build -ldflags="-s -w" -o "$PROJECT_DIR/backend/server" .
chmod +x "$PROJECT_DIR/backend/server"
echo -e "${GREEN}✅ Binario Go compilado exitosamente.${NC}"

# 8. Detener servicios anteriores si existían
systemctl stop caddy tienda-backend tienda-frontend 2>/dev/null || true
systemctl disable caddy tienda-backend tienda-frontend 2>/dev/null || true

# 9. Crear Servicio Systemd Único
echo "Configurando servicio systemd 'tienda.service'..."
cat <<EOF > /etc/systemd/system/tienda.service
[Unit]
Description=Tienda E-Commerce Single Binary (Go + Embedded SPA)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$PROJECT_DIR/backend
EnvironmentFile=-$PROJECT_DIR/backend/.env
ExecStart=$PROJECT_DIR/backend/server
Restart=always
RestartSec=3
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF

# Iniciar y habilitar servicio
systemctl daemon-reload
systemctl enable tienda.service
systemctl restart tienda.service

# Esperar 2 segundos
sleep 2

PUBLIC_IP=$(curl -s --connect-timeout 2 ifconfig.me 2>/dev/null || echo "TU_IP_PUBLICA")

echo -e "\n${GREEN}======================================================================${NC}"
echo -e "${GREEN}  🎉 ¡INSTALACIÓN COMPLETADA CON ÉXITO!                             ${NC}"
echo -e "${GREEN}======================================================================${NC}"
echo -e "  🌐 Dominio Seguro (HTTPS): https://bere.vnd.mom/"
echo -e "  🔐 Admin con Dominio:     https://bere.vnd.mom/admin"
echo -e "  🌐 Acceso por IP:         http://${PUBLIC_IP}/"
echo -e "  🔑 Contraseña Master:     Malulo23"
echo -e "  📊 Consumo de RAM:       ~15 MB (1 solo servicio activo)"
echo -e "\n  Para ver logs en tiempo real:"
echo -e "  ${YELLOW}sudo journalctl -u tienda -f${NC}\n"
