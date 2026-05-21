# Solución para Error de Login en OpenRed

## Problema Actual: Token JWT Inválido
Si aparece el error:
```json
{
    "detail": "Given token not valid for any token type",
    "code": "token_not_valid",
    "messages": [
        {
            "token_class": "AccessToken",
            "token_type": "access",
            "message": "Token is invalid or expired"
        }
    ]
}
```

### Solución Inmediata: Limpiar localStorage

**En la consola del navegador (F12 → Console):**
```javascript
// Limpiar todos los tokens
localStorage.removeItem('access_token');
localStorage.removeItem('refresh_token');
localStorage.clear();

// Recargar la página
window.location.reload();
```

**Después intenta hacer login nuevamente.**

## Problema Original
Al intentar hacer login, aparece el error:
```json
{
    "non_field_errors": [
        "No puede iniciar sesión con las credenciales proporcionadas."
    ]
}
```

## Causas Principales

### 1. Backend Django no está ejecutándose
**Solución:**
```bash
# Navegar al directorio del backend Django
cd /Users/franciscosanz/Work/development/openred/openred

# Activar el entorno virtual (si existe)
source venv/bin/activate  # o source env/bin/activate

# Instalar dependencias (si es necesario)
pip install -r requirements.txt

# Aplicar migraciones
python manage.py migrate

# Ejecutar el servidor
python manage.py runserver
```

### 2. Usuario no verificado
El backend tiene configurado `ACCOUNT_EMAIL_VERIFICATION = 'mandatory'`, lo que significa que debes verificar tu email antes de poder hacer login.

**Solución - Crear usuario verificado manualmente:**
```bash
# En el terminal del backend Django
python manage.py shell
```

```python
# En el shell de Django
from django.contrib.auth.models import User
from allauth.account.models import EmailAddress

# Crear usuario
user = User.objects.create_user(
    username='test@example.com',
    email='test@example.com',
    password='testpass123'
)

# Verificar el email del usuario
email_address = EmailAddress.objects.create(
    user=user,
    email='test@example.com',
    primary=True,
    verified=True
)

print('Usuario creado y verificado:')
print(f'Email: {user.email}')
print(f'Verificado: {email_address.verified}')
```

### 3. Credenciales incorrectas
Asegúrate de usar:
- **Email:** test@example.com
- **Password:** testpass123

## Verificación

### 1. Verificar que el backend esté ejecutándose:
```bash
curl http://localhost:8000/admin/
```
Debería devolver la página de admin de Django.

### 2. Verificar endpoint de login:
```bash
curl -X POST http://localhost:8000/dj-rest-auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "testpass123"}'
```

### 3. Verificar usuarios en la base de datos:
```bash
python manage.py shell
```
```python
from django.contrib.auth.models import User
from allauth.account.models import EmailAddress

users = User.objects.all()
for user in users:
    email_verified = EmailAddress.objects.filter(user=user, verified=True).exists()
    print(f'User: {user.email}, Verified: {email_verified}')
```

## Configuración Alternativa (Opcional)

Si quieres desactivar temporalmente la verificación de email para desarrollo:

En `settings.py`:
```python
# Cambiar de:
ACCOUNT_EMAIL_VERIFICATION = 'mandatory'

# A:
ACCOUNT_EMAIL_VERIFICATION = 'none'
```

Luego reinicia el servidor Django.

## Estado Actual del Frontend

El frontend React ya está configurado correctamente para:
- Enviar requests al formato correcto (`email` + `password`)
- Manejar errores de red y autenticación
- Mostrar mensajes informativos al usuario
- Funcionar con datos mock cuando no hay backend disponible
