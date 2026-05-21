#!/bin/bash
# Script para reiniciar el servidor de desarrollo con variables de entorno

echo "Reiniciando servidor de desarrollo..."
echo "Directorio: $(pwd)"
echo "Verificando archivo .env..."

if [ -f .env ]; then
    echo "Archivo .env encontrado"
    echo "Variables REACT_APP_:"
    grep "REACT_APP_" .env
else
    echo "Archivo .env no encontrado"
    exit 1
fi

echo ""
echo "Terminando procesos existentes..."
pkill -f "react-scripts" 2>/dev/null || true

echo "Iniciando servidor de desarrollo..."
npm start
