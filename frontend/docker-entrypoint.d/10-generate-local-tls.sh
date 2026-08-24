#!/bin/sh
set -eu

cert_dir=/etc/nginx/certs
ca_key="$cert_dir/portal-ca.key"
ca_cert="$cert_dir/portal-ca.crt"
server_key="$cert_dir/portal.key"
server_cert="$cert_dir/portal.crt"

mkdir -p "$cert_dir"

if [ -s "$server_key" ] && [ -s "$server_cert" ] && [ -s "$ca_cert" ]; then
  exit 0
fi

hostname_value="${TLS_HOSTNAME:-isg.clinica.local}"
ip_value="${TLS_IP_ADDRESS:-}"

case "$hostname_value" in
  *[!A-Za-z0-9.-]*|'')
    echo "TLS_HOSTNAME contém caracteres inválidos" >&2
    exit 1
    ;;
esac

subject_alt_names="DNS:$hostname_value,DNS:localhost,IP:127.0.0.1"
if [ -n "$ip_value" ]; then
  case "$ip_value" in
    *[!0-9A-Fa-f:.]*)
      echo "TLS_IP_ADDRESS não é um endereço IP válido" >&2
      exit 1
      ;;
  esac
  subject_alt_names="$subject_alt_names,IP:$ip_value"
fi

openssl req -x509 -new -nodes -newkey rsa:3072 -sha256 -days 3650 \
  -keyout "$ca_key" \
  -out "$ca_cert" \
  -subj "/CN=Portal ISG - Autoridade Local/O=Portal ISG" \
  -addext "basicConstraints=critical,CA:TRUE,pathlen:0" \
  -addext "keyUsage=critical,keyCertSign,cRLSign"

config_file="$cert_dir/openssl-server.cnf"
cat > "$config_file" <<EOF
[req]
prompt = no
distinguished_name = distinguished_name
req_extensions = request_extensions

[distinguished_name]
CN = $hostname_value
O = Portal ISG

[request_extensions]
subjectAltName = $subject_alt_names

[server_extensions]
basicConstraints = critical,CA:FALSE
keyUsage = critical,digitalSignature,keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = $subject_alt_names
EOF

openssl req -new -nodes -newkey rsa:2048 -sha256 \
  -keyout "$server_key" \
  -out "$cert_dir/portal.csr" \
  -config "$config_file"

openssl x509 -req -sha256 -days 825 \
  -in "$cert_dir/portal.csr" \
  -CA "$ca_cert" \
  -CAkey "$ca_key" \
  -CAcreateserial \
  -out "$server_cert" \
  -extfile "$config_file" \
  -extensions server_extensions

rm -f "$cert_dir/portal.csr" "$config_file" "$cert_dir/portal-ca.srl"
chmod 600 "$ca_key" "$server_key"
chmod 644 "$ca_cert" "$server_cert"

echo "Certificado HTTPS local criado para $hostname_value${ip_value:+ e $ip_value}."
echo "Instale portal-ca.crt como autoridade raiz confiável nos computadores clientes."
