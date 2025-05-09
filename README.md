

# 🔐 Encriptador/Desencriptador Asimétrico Web 🔓

**Proyecto:** [https://poetic-stardust-ca6d13.netlify.app/decryptor/]

Este proyecto implementa un sistema de **encriptación de archivos directamente en el navegador**, utilizando un enfoque de **cifrado híbrido**. El objetivo es combinar la eficiencia del cifrado simétrico con la seguridad en el intercambio de claves del cifrado asimétrico, todo ello usando tecnologías web estándar y seguras.

---

## 💡 Concepto Clave: Cifrado Híbrido

El cifrado híbrido es una estrategia que aprovecha lo mejor de dos mundos:

1.  **Cifrado Simétrico (AES):** Es muy rápido y eficiente para encriptar grandes cantidades de datos (como el contenido de un archivo). Sin embargo, requiere que tanto el emisor como el receptor compartan la *misma clave secreta*, lo cual presenta un desafío para distribuirla de forma segura.
2.  **Cifrado Asimétrico (RSA):** Utiliza un par de claves (pública y privada). La clave pública puede compartirse libremente y se usa para cifrar, mientras que solo la clave privada correspondiente puede descifrar. Es muy seguro para el intercambio de claves, pero es significativamente más lento y no es práctico para encriptar archivos grandes directamente.

**¿Cómo funciona en este proyecto?**
* Se genera una clave **AES** única para encriptar el contenido del archivo (rápido).
* Se utiliza la clave **pública RSA** del destinatario para encriptar *únicamente* la clave AES que se acaba de generar (seguro).
* El archivo cifrado (con AES) y la clave AES cifrada (con RSA) se envían juntos.
* El destinatario usa su **clave privada RSA** para descifrar la clave AES, y luego usa esa clave AES para descifrar el archivo completo.

---

## 🛠️ Tecnologías Utilizadas

Este proyecto se basa exclusivamente en **APIs nativas del navegador**, evitando dependencias externas para maximizar la seguridad y minimizar el tamaño del proyecto.

### 🌐 Web Crypto API (`window.crypto.subtle`)

Es la piedra angular de este proyecto. La [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) es una interfaz de bajo nivel integrada en los navegadores modernos que proporciona operaciones criptográficas fundamentales de forma segura.

* **Funcionalidades Usadas:** Generación de claves (AES y RSA), cifrado, descifrado y exportación/importación de claves.
* **Ventajas:** Segura, estándar, mantenida por los fabricantes de navegadores, no requiere librerías adicionales.

---

## 🧊 AES (Advanced Encryption Standard) - Cifrado Simétrico

### 🔸 ¿Qué es AES?
AES es el estándar de facto para el cifrado simétrico. Utiliza la **misma clave** tanto para cifrar como para descifrar datos. Es conocido por su velocidad y robustez.

### 🔸 Implementación en el Proyecto:
* **Generación de Clave AES:** Se genera una clave AES de 256 bits utilizando el modo **AES-GCM** (Galois/Counter Mode).
    ```typescript
    const aesKey = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 }, // Algoritmo y longitud de clave
      true,                             // Clave exportable (para cifrarla con RSA)
      ["encrypt", "decrypt"]            // Usos permitidos para la clave
    );
    ```
* **Modo AES-GCM:** Este modo es preferible porque no solo cifra los datos, sino que también incluye **autenticación (AEAD - Authenticated Encryption with Associated Data)**. Esto garantiza la confidencialidad y la integridad: si los datos cifrados son manipulados, el descifrado fallará, alertando al usuario.
* **Vector de Inicialización (IV):** Se genera un IV aleatorio de 12 bytes (tamaño recomendado para AES-GCM) para cada operación de cifrado. El IV asegura que cifrar el mismo archivo dos veces produzca resultados diferentes, añadiendo una capa extra de seguridad. El IV no necesita ser secreto y se envía junto con los datos cifrados.

---

## 🔐 RSA (Rivest–Shamir–Adleman) - Cifrado Asimétrico

### 🔸 ¿Qué es RSA?
RSA es el algoritmo más conocido de cifrado asimétrico. Funciona con un **par de claves** matemáticamente relacionadas:
* **Clave Pública:** Se usa para *cifrar* datos o verificar firmas. Puede compartirse sin riesgo.
* **Clave Privada:** Se usa para *descifrar* datos o crear firmas. Debe mantenerse en secreto absoluto.

### 🔸 Implementación en el Proyecto:
* **Rol de RSA:** Su función principal aquí **no es cifrar el archivo**, sino **cifrar la clave AES simétrica** utilizada para el archivo. Esto resuelve el problema de cómo compartir la clave AES de forma segura.
* **Generación del Par de Claves RSA:** Se genera un par de claves RSA (pública y privada) con los siguientes parámetros:
    ```typescript
    const keyPair = await crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",            // Algoritmo RSA con padding OAEP (más seguro)
        modulusLength: 2048,         // Longitud del módulo (tamaño de la clave), 2048 es un buen balance seguridad/rendimiento
        publicExponent: new Uint8Array([1, 0, 1]), // Exponente público estándar (65537)
        hash: "SHA-256",             // Algoritmo de hash a usar con OAEP
      },
      true,                         // Claves exportables (para guardarlas o compartirlas)
      ["encrypt", "decrypt"]        // Usos permitidos (cifrar con pública, descifrar con privada)
    );
    ```
* **RSA-OAEP:** Se utiliza RSA con el padding OAEP (Optimal Asymmetric Encryption Padding). OAEP añade aleatoriedad al proceso de cifrado, haciendo a RSA resistente a ciertos tipos de ataques criptográficos.

---

## 🔄 Manejo de Datos: ArrayBuffer y Base64

### 🔸 ¿Qué es `ArrayBuffer`?
La Web Crypto API opera con datos binarios. Muchas de sus funciones devuelven los resultados (claves, datos cifrados) en formato `ArrayBuffer`. Un `ArrayBuffer` es un objeto que representa un bloque genérico de datos binarios de longitud fija. No se puede manipular directamente, sino a través de "vistas" como `Uint8Array`.

### 🔸 ¿Por qué convertir a Base64?
Los `ArrayBuffer` son datos binarios puros. Para poder almacenarlos fácilmente (por ejemplo, en un archivo JSON), enviarlos a través de redes (que a menudo prefieren texto) o simplemente mostrarlos/copiarlos como texto, necesitamos una representación textual. **Base64** es un esquema de codificación que convierte datos binarios en una cadena de caracteres ASCII.

* **Conversión:** Se utiliza `btoa()` (binary-to-ASCII) para codificar los datos binarios (obtenidos del `ArrayBuffer`) a Base64. Para el proceso inverso (decodificar de Base64 a binario), se usaría `atob()`.
    ```typescript
    // Función para convertir ArrayBuffer a cadena Base64
    const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
      let binary = '';
      const bytes = new Uint8Array(buffer); // Crear una vista de bytes del buffer
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]); // Convertir cada byte a carácter
      }
      return window.btoa(binary); // Codificar la cadena binaria a Base64
    };

    // Para la decodificación (Base64 a ArrayBuffer):
    const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
      const binary_string = window.atob(base64); // Decodificar Base64 a cadena binaria
      const len = binary_string.length;
      const bytes = new Uint8Array(len); // Crear un buffer de bytes
      for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i); // Convertir cada carácter a byte
      }
      return bytes.buffer; // Devolver el ArrayBuffer subyacente
    };
    ```
* **Uso:** En este proyecto, la clave AES cifrada, el IV, y potencialmente las claves RSA exportadas, se convierten a Base64 para poder manejarlos como texto, por ejemplo, al guardarlos junto al archivo cifrado.

---
