#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE CONFIGURACIÓN SSL CON CERTBOT (LET'S ENCRYPT)
# Dominio: bere.vnd.mom (o cualquier dominio personalizado)
# ==============================================================================

set -e

GREEN='\033[032m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Por favor ejecuta este script con permisos sudo: sudo bash ssl-certbot.sh${NC}"
    exit 1
fi

DOMAIN="${1:-bere.vnd.mom}"
EMAIL="${2:-admin@bere.vnd.mom}"

echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}  🔒 CONFIGURADOR CERTBOT SSL (LET'S ENCRYPT) PARA: ${DOMAIN}        ${NC}"
echo -e "${BLUE}======================================================================${NC}"

# 1. Instalar Certbot
echo -e "\n${YELLOW}📦 [1/4] Instalando Certbot desde repositorios oficiales...${NC}"
apt-get update -qq || true
apt-get install -y certbot

# 2. Detener temporalmente el servicio para liberar el puerto 80 durante la emisión
echo -e "\n${YELLOW}⏸️  [2/4] Liberando temporalmente el puerto 80...${NC}"
systemctl stop tienda.service 2>/dev/null || true

# 3. Solicitar Certificado a Let's Encrypt
echo -e "\n${YELLOW}📜 [3/4] Solicitando Certificado SSL para ${DOMAIN}...${NC}"
certbot certonly --standalone \
  -d "$DOMAIN" \
  --non-interactive \
  --agree-tos \
  -m "$EMAIL" \
  --keep-until-expiring || certbot certonly --standalone -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --keep-until-expiring

# 4. Configurar renovación automática con hook de reinicio del servicio
echo -e "\n${YELLOW}🔄 [4/4] Configurando renovación automática y reiniciando tienda...${NC}"
mkdir -p /etc/letsencrypt/renewal-hooks/deploy
cat <<EOF > /etc/letsencrypt/renewal-hooks/deploy/restart-tienda.sh
#!/usr/bin/env bash
systemctl restart tienda.service
EOF
chmod +x /etc/letsencrypt/renewal-hooks/deploy/restart-tienda.sh

# Actualizar .env con el dominio
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$PROJECT_DIR/backend/.env" ]; then
    if grep -q "DOMAIN=" "$PROJECT_DIR/backend/.env"; then
        sed -i "s|DOMAIN=.*|DOMAIN=$DOMAIN|g" "$PROJECT_DIR/backend/.env"
    else
        echo "DOMAIN=$DOMAIN" >> "$PROJECT_DIR/backend/.env"
    fi
fi

# Reiniciar servicio
systemctl restart tienda.service

echo -e "\n${GREEN}======================================================================${NC}"
echo -e "${GREEN}  🎉 ¡CERTIFICADO SSL INSTALADO EXITOSAMENTE!                        ${NC}"
echo -e "${GREEN}======================================================================${NC}"
echo -e "  🌐 Tienda Segura HTTPS: https://${DOMAIN}/"
echo -e "  🔐 Admin Seguro HTTPS:  https://${DOMAIN}/admin"
echo -e "  🔄 Renovación:          Automática (Certbot timer activo)"
echo -e "\n"
