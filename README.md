# 🔐 Encriptador/Desencriptador Asimétrico Web 🔓

## Descripción General ✨

Esta es una aplicación web construida con **Astro** y **React** que permite a los usuarios encriptar y desencriptar archivos de texto directamente en su navegador. Utiliza un enfoque de **encriptación híbrida**, combinando la seguridad de la criptografía asimétrica (**RSA-OAEP**) para el intercambio de claves con la eficiencia de la criptografía simétrica (**AES-GCM**) para el contenido del archivo.

Además, implementa una capa extra de seguridad requiriendo una **frase de contraseña** de 8 caracteres (cuya verificación se realiza mediante un hash **SHA-256**) para el proceso de desencriptación. Todas las operaciones criptográficas se realizan del lado del cliente utilizando la **Web Crypto API** del navegador, lo que significa que los archivos y las claves privadas nunca abandonan la máquina del usuario, garantizando la privacidad.


https://voluble-belekoy-7ea83f.netlify.app/

## Características Principales 🚀

* **Encriptación Segura:** Encripta archivos `.txt` seleccionados por el usuario.
* **Desencriptación Fiable:** Desencripta los archivos `.json` generados por esta misma aplicación.
* **Generación de Claves RSA:** Crea un par de claves RSA (Pública y Privada) robusto de 2048 bits (estándar RSA-OAEP).
* **Descarga de Claves:** Permite descargar fácilmente las claves pública y privada en formato `.pem` (codificadas en Base64).
* **Encriptación Híbrida Eficiente:**
    * Genera una clave simétrica **AES-GCM** de 256 bits para cifrar el contenido del archivo rápidamente.
    * Encripta la clave AES de forma segura utilizando la **clave pública RSA** del destinatario (o la generada).
* **Protección por Frase de Contraseña:**
    * Genera automáticamente una frase aleatoria de 8 caracteres durante la encriptación como capa adicional.
    * Almacena un hash **SHA-256** de la frase en el archivo JSON encriptado (no la frase en sí).
    * Requiere que el usuario introduzca la frase correcta durante la desencriptación para verificarla contra el hash almacenado.
* **Formato de Salida Organizado:** Empaqueta todos los componentes necesarios en un único archivo `.json` descargable:
    * `encryptedContent`: Contenido del archivo original encriptado (Base64).
    * `encryptedAESKey`: Clave AES encriptada con RSA (Base64).
    * `iv`: Vector de inicialización para AES-GCM (Base64).
    * `passphraseHash`: Hash SHA-256 de la frase de contraseña.
* **Seguridad Centrada en el Cliente:** Todas las operaciones criptográficas se ejecutan exclusivamente en el navegador del usuario. ¡Tus archivos y claves privadas nunca se envían a ningún servidor!
* **Interfaz Intuitiva:** Componentes **React** integrados en páginas **Astro** para una experiencia de usuario fluida e interactiva.

## Tecnologías 🛠️

* **🚀 Framework:** [Astro](https://astro.build/) (Para la estructura y optimización del sitio)
* **⚛️ UI:** [React](https://reactjs.org/) (Integrado con Astro para componentes interactivos)
* **🟦 Lenguaje:** [TypeScript](https://www.typescriptlang.org/), JavaScript (Para tipado seguro y lógica)
* **💨 Estilos:** [Tailwind CSS](https://tailwindcss.com/) (Para un diseño rápido y moderno)
* **🔑 Criptografía:** [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) (API nativa del navegador para operaciones criptográficas seguras)

## Estructura del Proyecto 📂

encriptacion/
├── 📁 .vscode/              # Configuraciones de VS Code
├── 📁 node_modules/         # Dependencias del proyecto (instaladas por npm/yarn)
├── 📁 public/               # Archivos estáticos
│   └── 📁 assets/           # Imágenes, fuentes, etc.
├── 📁 src/                  # Código fuente principal
│   ├── 📁 components/       # Componentes React reutilizables
│   │   ├── ⚛️ FileDecryptor.tsx  # Lógica y UI para desencriptar
│   │   └── ⚛️ FileEncryptor.tsx  # Lógica y UI para encriptar
│   ├── 📁 layouts/          # Plantillas de página de Astro
│   │   └── 🚀 Layout.astro      # Layout principal de las páginas
│   ├── 📁 pages/            # Rutas/Páginas de la aplicación
│   │   ├── 🚀 Desincriptar.astro # Página para usar el componente Decryptor
│   │   ├── 🚀 Encriptacion.astro # Página para usar el componente Encryptor
│   │   └── 🚀 index.astro        # Página de inicio
│   └── 📁 styles/           # Estilos globales
│       └── 🎨 global.css
├── 📄 .gitignore            # Archivos y carpetas ignorados por Git
├── ⚙️ astro.config.mjs     # Archivo de configuración de Astro
├── 📄 package-lock.json     # Lockfile de dependencias NPM
├── 📄 package.json          # Metadatos y dependencias del proyecto
├── 📄 README.md             # Este archivo
└── 🔧 tsconfig.json        # Archivo de configuración de TypeScript


## Lógica de Funcionamiento ⚙️

### Proceso de Encriptación

1.  **📤 Selección de Archivo:** El usuario selecciona un archivo de texto (`.txt`).
2.  **🔑 Generación de Claves RSA:** Se genera un nuevo par de claves pública/privada RSA-OAEP (2048 bits).
3.  **🗝️ Generación de Clave AES:** Se genera una clave simétrica AES-GCM (256 bits).
4.  **💬 Generación de Frase:** Se crea una frase de contraseña aleatoria de 8 caracteres.
5.  **#️⃣ Hashing de Frase:** Se calcula el hash SHA-256 de la frase generada.
6.  **🔒 Encriptación de Contenido:** El contenido del archivo `.txt` se encripta usando la clave AES-GCM y un vector de inicialización (IV) único y aleatorio.
7.  **🔐 Encriptación de Clave AES:** La clave AES generada se encripta utilizando la clave pública RSA recién creada.
8.  **📦 Empaquetado JSON:** Se crea un archivo `.json` que contiene:
    * `encryptedContent`: El contenido encriptado (codificado en Base64).
    * `encryptedAESKey`: La clave AES encriptada con RSA (codificada en Base64).
    * `iv`: El vector de inicialización usado con AES (codificado en Base64).
    * `passphraseHash`: El hash SHA-256 de la frase de contraseña.
9.  **💾 Descargas:** Se ofrecen al usuario tres descargas separadas:
    * El archivo `.json` con los datos encriptados.
    * La clave pública (`public_key.pem`).
    * La clave privada (`private_key.pem`).
10. **👀 Mostrar Frase:** Se muestra al usuario la frase de contraseña de 8 caracteres generada, **indicándole claramente que debe guardarla de forma segura junto con la clave privada**, ya que será necesaria para desencriptar.

### Proceso de Desencriptación

1.  **📥 Carga de Archivos:** El usuario carga el archivo `.json` previamente encriptado y su archivo de clave privada (`.pem`) correspondiente.
2.  **⌨️ Entrada de Frase:** El usuario introduce la frase de contraseña de 8 caracteres que guardó durante la encriptación.
3.  **📄 Lectura de JSON:** Se leen y extraen los datos (`encryptedContent`, `encryptedAESKey`, `iv`, `passphraseHash`) del archivo `.json`.
4.  **✅ Verificación de Frase:**
    * Se calcula el hash SHA-256 de la frase introducida por el usuario.
    * Se compara este hash calculado con el `passphraseHash` extraído del archivo JSON. **Si no coinciden, el proceso se detiene mostrando un error.**
5.  **🔑 Importación de Clave Privada:** Se importa la clave privada RSA desde el archivo `.pem` proporcionado.
6.  **🔓 Desencriptación de Clave AES:** Se utiliza la clave privada RSA importada para desencriptar la `encryptedAESKey` del JSON, recuperando así la clave AES original.
7.  **🗝️ Importación de Clave AES:** Se importa la clave AES desencriptada para prepararla para su uso.
8.  **📜 Desencriptación de Contenido:** Se utiliza la clave AES recuperada y el `iv` (vector de inicialización) del JSON para desencriptar el `encryptedContent`.
9.  **💡 Mostrar/Descargar Resultado:** El contenido original del archivo se muestra en formato de texto plano al usuario, y se ofrece la opción de descargarlo como un nuevo archivo `.txt`.

## Instalación y Uso 💻

1.  **Clonar el Repositorio:**
    ```bash
    git clone <URL-DEL-REPOSITORIO> # Reemplaza con la URL real del repo
    cd encriptacion
    ```
2.  **Instalar Dependencias:** Asegúrate de tener [Node.js](https://nodejs.org/) instalado (que incluye npm).
    ```bash
    npm install
    # o si prefieres usar yarn:
    # yarn install
    ```
3.  **Ejecutar Servidor de Desarrollo:**
    ```bash
    npm run dev
    # o
    # yarn dev
    ```
4.  **Abrir en Navegador:** Abre tu navegador web y ve a la dirección local que indica Astro en la terminal (usualmente `http://localhost:4321`).
5.  **Navegar y Usar:** Accede a las páginas "Encriptación" y "Desencriptación" desde el menú o los enlaces para comenzar a usar la herramienta. ¡Sigue las instrucciones en pantalla!
