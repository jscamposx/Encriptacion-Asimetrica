# 🔐 Encriptador Híbrido Web (RSA + AES)

![Astro](https://img.shields.io/badge/Astro-FF5D01?style=for-the-badge\&logo=astro\&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge\&logo=react\&logoColor=61DAFB)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-0F172A?style=for-the-badge\&logo=tailwindcss\&logoColor=38BDF8)
![WebCrypto](https://img.shields.io/badge/WebCrypto-Encryption-blue?style=for-the-badge)

> **Privacidad Total.** Una herramienta avanzada de criptografía que corre 100% en tu navegador. Nada se sube a servidores. Nada se almacena. Todo permanece bajo tu control.

---

## 📖 Descripción

Este proyecto implementa un sistema moderno de **Cifrado Híbrido**, combinando la velocidad del cifrado simétrico (**AES**) con la robustez del cifrado asimétrico (**RSA**). Ideal para compartir archivos de texto sensibles sin depender de servicios externos.

El motor criptográfico está construido sobre la **Web Crypto API**, estándar abierto, auditable y con rendimiento nativo del navegador.

---

## 🎯 Objetivo del Proyecto

Permitir que cualquier usuario pueda:

* Cifrar archivos `.txt` de forma segura.
* Proteger la clave simétrica con RSA.
* Recuperar el archivo **solo** si posee la llave privada correcta y una frase de contraseña válida.
* Disfrutar de una arquitectura **Zero‑Knowledge**, donde ningún dato sale del navegador.

---

## ✨ Características Estelares

### 🛡️ Cifrado de Grado Militar

* **AES‑GCM 256 bits** → rápido, seguro y con verificación de integridad.
* **RSA‑OAEP 2048 bits** → protege la clave AES.

### ⚡ Arquitectura Zero‑Knowledge

* Todo ocurre 100% en el navegador.
* Nunca se suben archivos o llaves a la nube.

### 🔑 Gestión Completa de Llaves

* Generación automática de pares RSA.
* Exportación en formatos estándar:

  * **SPKI** → Llave pública
  * **PKCS#8** → Llave privada

### 🧩 Capa Extra de Seguridad

* Validación mediante **Passphrase** (mínimo 8 caracteres).
* Protegida con hash **SHA‑256**.

### 🎨 UI Moderna y Responsiva

* Construida con **Tailwind CSS**.
* Modo claro/oscuro automático.
* Flujo intuitivo para usuarios sin experiencia técnica.

---

## 🧠 ¿Cómo Funciona el Sistema Híbrido?

### 🔒 Proceso de Encriptación

1. Se genera una clave **AES** efímera.
2. Se cifra el archivo `.txt` con AES.
3. La clave AES se cifra con la **llave pública RSA**.
4. Se genera un paquete `.json` con:

   * Contenido cifrado
   * Clave AES cifrada
   * IV de AES
   * Hash de la passphrase

### 🔓 Proceso de Desencriptación

1. El usuario carga:

   * El archivo `.json` cifrado
   * Su **llave privada RSA**
   * La **passphrase**
2. Se valida la passphrase mediante hash.
3. Se descifra la clave AES con RSA.
4. Se recupera el contenido original del archivo.

---

## 🛠️ Tecnologías Utilizadas

| Tecnología                            | Uso                                              |
| ------------------------------------- | ------------------------------------------------ |
| **Astro**                             | Framework estático de alto rendimiento           |
| **React**                             | Componentes interactivos para cifrado/descifrado |
| **Tailwind CSS**                      | UI moderna y responsiva                          |
| **Web Crypto API**                    | Criptografía nativa del navegador                |
| **file-saver**                        | Descarga de archivos                             |
| **jsencrypt / jsrsasign / crypto-js** | Utilidades auxiliares                            |

---

## 📂 Estructura del Proyecto

```bash
src/
├── components/
│   ├── FileEncryptor.tsx   # Lógica de claves, AES y RSA
│   ├── FileDecryptor.tsx   # Importación y descifrado
│   └── NavBar.tsx          # Navegación UI
├── layouts/
│   └── Layout.astro        # Estructura base
├── pages/
│   ├── index.astro         # Landing
│   ├── Encryptor.astro     # Página de cifrado
│   └── Decryptor.astro     # Página de descifrado
└── styles/
    └── global.css          # Estilos globales
```

---

## 🚀 Instalación y Uso

### 1️⃣ Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/encriptacion-asimetrica.git
cd encriptacion-asimetrica
```

### 2️⃣ Instalar dependencias

```bash
npm install
```

### 3️⃣ Iniciar servidor de desarrollo

```bash
npm run dev
```

Visita: **[http://localhost:4321](http://localhost:4321)**

### 4️⃣ Construir para producción

```bash
npm run build
```

---

## ⚠️ Aviso de Seguridad

Aunque la herramienta usa criptografía robusta, la seguridad final depende del usuario:

* **Guarda tu llave privada**. Si la pierdes, no hay forma de recuperar los archivos.
* **Nunca compartas tu llave privada**.
* Usa solo dispositivos confiables y libres de malware.

---

## ❤️ Créditos

Desarrollado con dedicación, seguridad y amor por la criptografía moderna.

---

🔐 **Encriptador Híbrido Web — Seguridad real. Sin intermediarios.**
