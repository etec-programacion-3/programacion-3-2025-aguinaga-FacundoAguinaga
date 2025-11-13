# 🚀 Slard Chat App

**Slard** es una aplicación de chat en tiempo real con todas las funciones, construida con React, Node.js, Socket.IO, Prisma y WebRTC. Permite a los usuarios comunicarse a través de canales de texto, reaccionar a mensajes y realizar videollamadas grupales de alta performance.

---

## ✨ Características

* **Canales de Chat:** Creación y unión a múltiples canales de texto.
* **Mensajería en Tiempo Real:** Comunicación instantánea impulsada por WebSockets.
* **Videollamadas Grupales:** Integración de WebRTC para videollamadas de baja latencia con múltiples participantes.
* **Controles de Llamada:** Silenciar micrófono y apagar cámara.
* **Foco de Cámara:** Posibilidad de hacer clic en un video para ponerlo en foco.
* **Reacciones y Emojis:** Reacciona a mensajes y usa emojis en tus chats.
* **Identidad de Usuario:** Colores únicos por nombre de usuario.
* **Historial de Chat:** Scroll infinito para cargar mensajes antiguos bajo demanda.
* **Indicador de "Escribiendo...":** Ve quién está escribiendo en tiempo real.
* **Autenticación Segura:** Login con Email o Usuario y contraseña (JWT).
* **Sesión Única:** Cierra sesiones antiguas automáticamente si se inicia sesión en un nuevo dispositivo.

---

## 📋 Prerrequisitos

Antes de comenzar, asegúrate de tener instalado lo siguiente:
* [Node.js](https://nodejs.org/) (v18 o superior)
* `npm` (incluido con Node.js)
* [Git](https://git-scm.com/)

---

## 🔧 Instalación Manual (Recomendada)

Este método te da control total sobre la configuración y es el más fiable.

### 1. Clonar el Repositorio

```bash
git clone [https://github.com/tu-usuario/tu-repositorio.git](https://github.com/tu-usuario/tu-repositorio.git)
cd tu-repositorio
````

### 2\. Configurar el Backend

```bash
# 1. Navega a la carpeta del backend
cd backend

# 2. Instala las dependencias
npm install

# 3. Crea tu archivo de variables de entorno
cp .env.example .env
```

Abre el archivo `.env` y llénalo con tus datos. Como mínimo, necesitas:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="TU_CLAVE_SECRETA_ALEATORIA"
```

```bash
# 4. Ejecuta las migraciones de la base de datos
npx prisma migrate dev
```

### 3\. Configurar el Frontend

```bash
# 1. Desde la raíz, navega a la carpeta del frontend
cd ../frontend

# 2. Instala las dependencias
npm install
```

### 4\. Configurar para Pruebas (Elige una opción)

#### Opción A: Pruebas Locales (Un solo dispositivo)

¡No necesitas hacer nada más\! El código ya está configurado para `localhost`.

#### Opción B: Pruebas en Red (Múltiples dispositivos)

Para que otros dispositivos (como tu teléfono) en tu misma red Wi-Fi puedan conectarse, debes usar tu IP privada.

1.  **Busca tu IP Privada:**

      * **Windows:** Abre `cmd` y escribe `ipconfig`. Busca la dirección "IPv4 Address".
      * **macOS/Linux:** Abre la terminal y escribe `hostname -I` o `ifconfig | grep "inet "`.
      * (Ejemplo: `192.168.1.100`)

2.  **Configura el Frontend:**
    Edita los siguientes archivos en `frontend/src/services/`:

      * `authService.js`: Cambia `http://localhost:3000` por `http://TU_IP_PRIVADA:3000`.
      * `socketService.js`: Cambia `http://localhost:3000` por `http://TU_IP_PRIVADA:3000`.

3.  **Configura el Backend:**
    Edita `backend/src/index.js` y actualiza la configuración de CORS para permitir la conexión desde tu IP (o desde cualquier origen para pruebas).

    *Busca:*

    ```javascript
    cors: {
      origin: "http://localhost:5173",
      // ...
    },
    ```

    *Reemplaza con:*

    ```javascript
    cors: {
      origin: "*", // Permite cualquier origen (más fácil para pruebas)
      // ...
    },
    ```

### 5\. Iniciar la Aplicación

1.  **Construir el Frontend (Build):**

    ```bash
    # Desde la carpeta 'frontend'
    npm run build
    ```

2.  **Mover el Build al Backend:**

    ```bash
    # (Desde la carpeta 'frontend')
    # Mueve la carpeta 'dist' generada al backend
    mv dist ../backend/
    ```

3.  **Iniciar el Servidor:**

    ```bash
    # Desde la carpeta 'frontend', ve al backend
    cd ../backend

    # Inicia el servidor
    node src/index.js
    ```

4.  **Acceder a Slard:**

      * **Local:** Abre `http://localhost:3000` en tu navegador.
      * **Red:** Abre `http://TU_IP_PRIVADA:3000` en cualquier dispositivo de tu red.

-----

## ⚡ Instalación Automática (Inicio Rápido)

Estos scripts intentan automatizar los pasos anteriores. Solo para **Linux/macOS**.

### Instalador para Pruebas Locales

Crea un archivo llamado `install_local.sh`, pega el siguiente código y ejecútalo con `bash install_local.sh`.

```bash
#!/bin/bash
echo "🚀 Iniciando instalación local de Slard..."

# Clonar el repositorio (cambia la URL)
git clone [https://github.com/tu-usuario/tu-repositorio.git](https://github.com/tu-usuario/tu-repositorio.git) slard
cd slard

# --- Backend ---
echo "🔧 Configurando Backend..."
cd backend
npm install
cp .env.example .env
echo "JWT_SECRET=slard_es_genial_$(date +%s)" >> .env
npx prisma migrate dev

# --- Frontend ---
echo "🎨 Configurando Frontend..."
cd ../frontend
npm install

echo "🏗️ Construyendo aplicación..."
npm run build

echo "🚚 Moviendo archivos al servidor..."
mv dist ../backend/

# --- Iniciar ---
echo "✅ Instalación completa. Iniciando servidor..."
cd ../backend
node src/index.js
```

### Instalador para Pruebas en Red (LAN)

Este script es **experimental**. Intenta encontrar tu IP y reemplazarla automáticamente.

Crea un archivo llamado `install_lan.sh`, pega el código y ejecútalo.

```bash
#!/bin/bash
echo "🚀 Iniciando instalación en Red (LAN) de Slard..."

# 1. Encontrar la IP privada
IP_PRIVADA=$(hostname -I | awk '{print $1}')
if [ -z "$IP_PRIVADA" ]; then
  echo "❌ No se pudo encontrar la IP privada. Por favor, usa la instalación manual."
  exit 1
fi
echo "DETECTADA IP: $IP_PRIVADA"

# Clonar el repositorio
git clone [https://github.com/tu-usuario/tu-repositorio.git](https://github.com/tu-usuario/tu-repositorio.git) slard-lan
cd slard-lan

# --- Backend ---
echo "🔧 Configurando Backend..."
cd backend
npm install
cp .env.example .env
echo "JWT_SECRET=slard_es_genial_$(date +%s)" >> .env
npx prisma migrate dev

# Configurar CORS en el servidor
sed -i 's/origin: "http:\/\/localhost:5173"/origin: "*"/' src/index.js

# --- Frontend ---
echo "🎨 Configurando Frontend..."
cd ../frontend
npm install

# Reemplazar localhost con la IP privada
sed -i "s/http:\/\/localhost:3000/http:\/\/$IP_PRIVADA:3000/g" src/services/authService.js
sed -i "s/http:\/\/localhost:3000/http:\/\/$IP_PRIVADA:3000/g" src/services/socketService.js

echo "🏗️ Construyendo aplicación..."
npm run build

echo "🚚 Moviendo archivos al servidor..."
mv dist ../backend/

# --- Iniciar ---
echo "✅ Instalación completa. Iniciando servidor..."
cd ../backend
node src/index.js
```

-----

## ⚠️ Configuración del Navegador para Videollamadas

**¡IMPORTANTE\!** Para que la cámara y el micrófono funcionen en una IP de red (que no son sitios seguros `https`), debes habilitar una bandera especial en tu navegador.

  * **Navegadores Soportados:** Solo funciona en navegadores basados en **Chromium** (Google Chrome, Microsoft Edge, Brave).
  * **Firefox:** Firefox **no** permite esta configuración y no funcionará para las videollamadas.

### Pasos (en Chrome/Edge):

1.  Abre una nueva pestaña y ve a: `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
    (Si usas Edge, ve a: `edge://flags/#unsafely-treat-insecure-origin-as-secure`)
2.  Busca la bandera llamada **"Insecure origins treated as secure"**.
3.  Haz clic en **"Enable"** (Habilitar).
4.  En el cuadro de texto que aparece, pega las direcciones que usarás para probar. Sepáralas con una coma.
    ```
    http://localhost:3000,http://TU_IP_PRIVADA:3000
    ```
5.  Haz clic en **"Relaunch"** (Reiniciar) en la parte inferior.

¡Ahora tu navegador confiará en tu aplicación y te dará permiso para usar la cámara y el micrófono\!

```
```
