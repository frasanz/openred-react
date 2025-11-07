#!/bin/bash
# Script para verificar el backend y crear usuario de prueba

echo "🔍 Verificando backend Django..."
echo "📍 URL: http://localhost:8000"

# Verificar si el backend está ejecutándose
if curl -f -s http://localhost:8000/api/ > /dev/null; then
    echo "✅ Backend Django está ejecutándose"
else
    echo "❌ Backend Django no está disponible en http://localhost:8000"
    echo "💡 Asegúrate de que el servidor Django esté ejecutándose:"
    echo "   cd /path/to/django/backend"
    echo "   python manage.py runserver"
    exit 1
fi

echo ""
echo "🔐 Para crear un usuario de prueba, ejecuta estos comandos en el backend Django:"
echo ""
echo "# 1. Acceder al shell de Django"
echo "python manage.py shell"
echo ""
echo "# 2. Crear y verificar usuario (en el shell de Django)"
echo "from django.contrib.auth.models import User"
echo "from allauth.account.models import EmailAddress"
echo ""
echo "# Crear usuario"
echo "user = User.objects.create_user("
echo "    username='test@example.com',"
echo "    email='test@example.com',"
echo "    password='testpass123'"
echo ")"
echo ""
echo "# Verificar el email del usuario"
echo "email_address = EmailAddress.objects.create("
echo "    user=user,"
echo "    email='test@example.com',"
echo "    primary=True,"
echo "    verified=True"
echo ")"
echo ""
echo "print('Usuario creado y verificado:')"
echo "print(f'Email: {user.email}')"
echo "print(f'Verificado: {email_address.verified}')"
echo ""
echo "🎯 Después podrás hacer login con:"
echo "   Email: test@example.com"
echo "   Password: testpass123"
