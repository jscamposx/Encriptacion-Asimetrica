# 🔐 Encriptador/Desencriptador Asimétrico Web 🔓

![Project Screenshot](image_31ac5e.png) ## Descripción General ✨

Esta es una aplicación web construida con **Astro** y **React** que permite a los usuarios encriptar y desencriptar archivos de texto directamente en su navegador. Utiliza un enfoque de **encriptación híbrida**, combinando la seguridad de la criptografía asimétrica (RSA-OAEP) para el intercambio de claves con la eficiencia de la criptografía simétrica (AES-GCM) para el contenido del archivo.

Además, implementa una capa extra de seguridad requiriendo una **frase de contraseña** de 8 caracteres (cuya verificación se realiza mediante un hash SHA-256) para el proceso de desencriptación. Todas las operaciones criptográficas se realizan del lado del cliente utilizando la **Web Crypto API** del navegador, lo que significa que los archivos y las claves privadas nunca abandonan la máquina del usuario.

## Características Principales 🚀

* **Encriptación de Archivos:** Encripta archivos `.txt` seleccionados por el usuario.
* **Desencriptación de Archivos:** Desencripta los archivos `.json` generados por la aplicación.
* **Generación de Claves RSA:** Genera un par de claves RSA (Pública y Privada) de 2048 bits.
* **Descarga de Claves:** Permite descargar las claves pública y privada en formato `.pem` (contenido Base64).
* **Encriptación Híbrida:**
    * Genera una clave simétrica AES-GCM de 256 bits para encriptar el contenido.
    * Encripta la clave AES con la clave pública RSA.
* **Frase de Contraseña:**
    * Genera una frase aleatoria de 8 caracteres durante la encriptación.
    * Almacena un hash SHA-256 de la frase en el archivo JSON encriptado.
    * Requiere que el usuario introduzca la frase correcta para desencriptar (verifica contra el hash).
* **Salida JSON:** Empaqueta el contenido encriptado (Base64), la clave AES encriptada (Base64), el IV (Base64) y el hash de la frase de contraseña en un archivo `.json` descargable.
* **Seguridad del Cliente:** Todas las operaciones criptográficas se realizan en el navegador del usuario.
* **Interfaz de Usuario:** Componentes React integrados en páginas Astro para una experiencia interactiva.

## Pila Tecnológica 🛠️

* **Framework:** [Astro](https://astro.build/)
* **UI:** [React](https://reactjs.org/) (integrado con Astro)
* **Lenguaje:** [TypeScript](https://www.typescriptlang.org/), JavaScript
* **Estilos:** [Tailwind CSS](https://tailwindcss.com/) (Basado en el código previo)
* **Criptografía:** [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) (Nativa del navegador)

## Estructura del Proyecto 📂
encriptacion/
├── .vscode/           # Configuraciones de VS Code
├── node_modules/      # Dependencias del proyecto
├── public/            # Archivos estáticos (imágenes, fuentes, etc.)
│   └── assets/
├── src/               # Código fuente principal de la aplicación
│   ├── components/    # Componentes React reutilizables
│   │   ├── FileDecryptor.tsx  # Lógica y UI para desencriptar
│   │   └── FileEncryptor.tsx  # Lógica y UI para encriptar
│   ├── layouts/       # Plantillas de página de Astro
│   │   └── Layout.astro     # Layout principal
│   ├── pages/         # Rutas/Páginas de la aplicación (archivos .astro)
│   │   ├── Desincriptar.astro # Página para usar el componente Decryptor
│   │   ├── Encriptacion.astro # Página para usar el componente Encryptor
│   │   └── index.astro        # Página de inicio
│   └── styles/        # Estilos globales
│       └── global.css
├── .gitignore         # Archivos y carpetas ignorados por Git
├── astro.config.mjs   # Archivo de configuración de Astro
├── package-lock.json  # Lockfile de dependencias NPM
├── package.json       # Metadatos y dependencias del proyecto
├── README.md          # Este archivo
└── tsconfig.json      # Archivo de configuración de TypeScript

## Lógica de Funcionamiento ⚙️

### Proceso de Encriptación

1.  **Selección de Archivo:** El usuario selecciona un archivo `.txt`.
2.  **Generación de Claves RSA:** Se genera un nuevo par de claves pública/privada RSA-OAEP (2048 bits).
3.  **Generación de Clave AES:** Se genera una clave simétrica AES-GCM (256 bits).
4.  **Generación de Frase:** Se crea una frase de contraseña aleatoria de 8 caracteres.
5.  **Hashing de Frase:** Se calcula el hash SHA-256 de la frase generada.
6.  **Encriptación de Contenido:** El contenido del archivo `.txt` se encripta usando la clave AES-GCM y un vector de inicialización (IV) aleatorio.
7.  **Encriptación de Clave AES:** La clave AES generada se encripta utilizando la clave pública RSA.
8.  **Empaquetado JSON:** Se crea un archivo `.json` que contiene:
    * `encryptedContent`: El contenido encriptado (Base64).
    * `encryptedAESKey`: La clave AES encriptada con RSA (Base64).
    * `iv`: El vector de inicialización usado con AES (Base64).
    * `passphraseHash`: El hash SHA-256 de la frase de contraseña.
9.  **Descargas:** Se ofrece al usuario la descarga del archivo `.json`, la clave pública (`.pem`) y la clave privada (`.pem`).
10. **Mostrar Frase:** Se muestra al usuario la frase de contraseña de 8 caracteres generada, indicándole que debe guardarla.

### Proceso de Desencriptación

1.  **Carga de Archivos:** El usuario carga el archivo `.json` encriptado y su archivo de clave privada (`.pem`).
2.  **Entrada de Frase:** El usuario introduce la frase de contraseña de 8 caracteres correspondiente.
3.  **Lectura de JSON:** Se extraen los datos del archivo `.json`.
4.  **Verificación de Frase:**
    * Se calcula el hash SHA-256 de la frase introducida por el usuario.
    * Se compara el hash calculado con el `passphraseHash` del archivo JSON. Si no coinciden, el proceso se detiene con un error.
5.  **Importación de Clave Privada:** Se importa la clave privada RSA desde el archivo `.pem`.
6.  **Desencriptación de Clave AES:** Se utiliza la clave privada RSA para desencriptar la `encryptedAESKey` del JSON, obteniendo la clave AES original.
7.  **Importación de Clave AES:** Se importa la clave AES desencriptada para su uso.
8.  **Desencriptación de Contenido:** Se utiliza la clave AES y el `iv` del JSON para desencriptar el `encryptedContent`.
9.  **Mostrar/Descargar Resultado:** Se muestra el texto desencriptado al usuario y se ofrece la opción de descargarlo como un archivo `.txt`.

## Instalación y Uso 💻

1.  **Clonar el Repositorio:**
    ```bash
    git clone <URL-DEL-REPOSITORIO>
    cd encriptacion
    ```
2.  **Instalar Dependencias:**
    ```bash
    npm install
    # o
    yarn install
    ```
3.  **Ejecutar Servidor de Desarrollo:**
    ```bash
    npm run dev
    # o
    yarn dev
    ```
4.  **Abrir en Navegador:** Abre la URL local proporcionada por Astro (generalmente `http://localhost:4321`).
5.  **Navegar:** Accede a las páginas de "Encriptación" y "Desencriptación" para usar la herramienta.

