import React, { useState } from "react";


const PASSPHRASE_LENGTH = 8;
const RSA_ALGORITHM = "RSA-OAEP";
const RSA_HASH = "SHA-256";
const AES_ALGORITHM = "AES-GCM";



const generatePassphrase = (length: number): string => {
  console.log(`[Helper] Generando frase de contraseña aleatoria de longitud ${length}...`);
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  console.log(`[Helper] Frase de contraseña generada: ${result}`);
  return result;
};

const hashString = async (input: string): Promise<string> => {
  if (!window.crypto?.subtle) {
     console.error("[Helper] Web Crypto API no disponible para hashString.");
     throw new Error("Web Crypto API no está disponible en este navegador.");
  }
  console.log("[Helper] Generando hash SHA-256 para entrada (frase de contraseña) de longitud:", input.length);
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  console.log("[Helper] Hash SHA-256 generado:", hashHex);
  return hashHex;
};

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    // console.log("[Helper] Convirtiendo ArrayBuffer a Base64 (longitud buffer):", buffer.byteLength); // Puede ser muy verboso
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const base64String = window.btoa(binary);
    // console.log("[Helper] Conversión a Base64 completada (longitud string):", base64String.length);
    return base64String;
}

const formatPEM = (base64String: string, type: 'PUBLIC' | 'PRIVATE'): string => {
    const header = `-----BEGIN ${type} KEY-----`;
    const footer = `-----END ${type} KEY-----`;
    const chunks = base64String.match(/.{1,64}/g) ?? [];
    return `${header}\n${chunks.join('\n')}\n${footer}`;
}



const Encryptor = () => {
  const [originalText, setOriginalText] = useState<string | null>(null);
  const [publicKeyPEM_B64, setPublicKeyPEM_B64] = useState<string | null>(null); 
  const [privateKeyPEM_B64, setPrivateKeyPEM_B64] = useState<string | null>(null); 
  const [generatedPassphrase, setGeneratedPassphrase] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);


  const generateRSAKeyPair = async (): Promise<{ publicKey: CryptoKey, privateKey: CryptoKey }> => {
    setStatus("⏳ Generando par de claves RSA (2048 bits)...");
    console.log("--- INICIO Generación Par de Claves RSA ---");
    console.log("Algoritmo: RSA-OAEP, Modulus: 2048, Hash: SHA-256");

    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: RSA_ALGORITHM,
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: RSA_HASH,
      },
      true,
      ["encrypt", "decrypt"]
    );
    console.log("Par de claves CryptoKey generado:", keyPair);

   
    console.log("Exportando llave pública a formato SPKI...");
    const publicKeyBuffer = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
    console.log(`Llave pública exportada (SPKI). Tamaño: ${publicKeyBuffer.byteLength} bytes.`);

    console.log("Exportando llave privada a formato PKCS8...");
    const privateKeyBuffer = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
    console.log(`Llave privada exportada (PKCS8). Tamaño: ${privateKeyBuffer.byteLength} bytes.`);

   
    const pubB64 = arrayBufferToBase64(publicKeyBuffer);
    const privB64 = arrayBufferToBase64(privateKeyBuffer);
    console.log("Llaves convertidas a Base64.");
    console.log("  - Pública Base64 (primeros 60):", pubB64.substring(0, 60) + "...");
    console.log("  - Privada Base64 (primeros 60):", privB64.substring(0, 60) + "...");


    setPublicKeyPEM_B64(pubB64);
    setPrivateKeyPEM_B64(privB64);

    setStatus("✅ Par de claves RSA generado.");
    console.log("--- FIN Generación Par de Claves RSA ---");
    return keyPair; 
  };

 
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log("[Upload TXT] Evento de cambio de archivo detectado.");
    if (!file) {
        console.log("[Upload TXT] No se seleccionó ningún archivo.");
        return;
    }

    console.log("[Upload TXT] Archivo seleccionado:", file.name, "Tipo:", file.type, "Tamaño:", file.size);

  
    setOriginalText(null);
    setPublicKeyPEM_B64(null);
    setPrivateKeyPEM_B64(null);
    setGeneratedPassphrase(null);
    setStatus("⏳ Leyendo archivo...");
    setIsProcessing(true);
    console.log("--- INICIO PROCESO DE ENCRIPTACIÓN ---");
    console.log("Archivo de entrada:", file.name);

    try {
       
        console.log("Paso 1: Leyendo contenido del archivo de texto...");
        const text = await file.text();
        setOriginalText(text);
        console.log(`Paso 1: Archivo leído. Longitud del texto: ${text.length} caracteres.`);
        setStatus("⏳ Archivo leído. Generando claves RSA...");

       
        console.log("Paso 2: Generando par de claves RSA...");
        const rsaKeyPair = await generateRSAKeyPair();
        console.log("Paso 2: Par de claves RSA generado y almacenado.");
        setStatus("⏳ Claves RSA generadas. Generando clave AES...");


      
        console.log("Paso 3: Generando clave simétrica AES (AES-GCM 256 bits)...");
        const aesKey = await window.crypto.subtle.generateKey(
          { name: AES_ALGORITHM, length: 256 },
          true, 
          ["encrypt", "decrypt"]
        );
        console.log("Paso 3: Clave AES generada:", aesKey);
        setStatus("⏳ Clave AES generada. Encriptando contenido...");

       
        console.log("Paso 4a: Generando IV (12 bytes) para AES-GCM...");
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const ivBase64 = arrayBufferToBase64(iv.buffer);
        console.log("Paso 4a: IV generado (Base64):", ivBase64);

        console.log("Paso 4b: Codificando texto original a ArrayBuffer (UTF-8)...");
        const encodedText = new TextEncoder().encode(text);
        console.log(`Paso 4b: Texto codificado. Tamaño: ${encodedText.byteLength} bytes.`);


        
        console.log("Paso 5: Encriptando contenido con AES-GCM...");
        const encryptedContentBuffer = await window.crypto.subtle.encrypt(
          { name: AES_ALGORITHM, iv }, 
          aesKey,
          encodedText
        );
        const encryptedContentBase64 = arrayBufferToBase64(encryptedContentBuffer);
        console.log(`Paso 5: Contenido encriptado con AES. Tamaño del buffer cifrado: ${encryptedContentBuffer.byteLength} bytes.`);
        console.log("  - Contenido cifrado Base64 (primeros 60):", encryptedContentBase64.substring(0, 60) + "...");
        setStatus("⏳ Contenido encriptado. Encriptando clave AES...");


       
        console.log("Paso 6a: Exportando clave AES en formato 'raw'...");
        const exportedAESKeyBuffer = await window.crypto.subtle.exportKey("raw", aesKey);
        console.log(`Paso 6a: Clave AES exportada (raw). Tamaño: ${exportedAESKeyBuffer.byteLength} bytes.`);

        console.log("Paso 6b: Encriptando clave AES exportada con la llave pública RSA (RSA-OAEP)...");
        const encryptedAESKeyBuffer = await window.crypto.subtle.encrypt(
          { name: RSA_ALGORITHM }, 
          rsaKeyPair.publicKey,   
          exportedAESKeyBuffer  
        );
        const encryptedAESKeyBase64 = arrayBufferToBase64(encryptedAESKeyBuffer);
        console.log(`Paso 6b: Clave AES encriptada con RSA. Tamaño del buffer cifrado: ${encryptedAESKeyBuffer.byteLength} bytes.`);
        console.log("  - Clave AES cifrada Base64 (primeros 60):", encryptedAESKeyBase64.substring(0, 60) + "...");
        setStatus("⏳ Clave AES encriptada. Generando frase de contraseña...");


       
        console.log("Paso 7: Generando frase de contraseña y su hash...");
        const newPassphrase = generatePassphrase(PASSPHRASE_LENGTH); 
        const passphraseHash = await hashString(newPassphrase); 
        setGeneratedPassphrase(newPassphrase); 
        console.log("Paso 7: Frase de contraseña generada y hash calculado.");
        setStatus("⏳ Frase de contraseña generada. Preparando archivo JSON...");


        // 8. Preparar archivo JSON de salida
        console.log("Paso 8: Preparando objeto JSON de salida...");
        const outputData = {
          encryptedContent: encryptedContentBase64,
          encryptedAESKey: encryptedAESKeyBase64,
          iv: ivBase64,
          passphraseHash: passphraseHash, 
        };
        const jsonOutput = JSON.stringify(outputData, null, 2); 
        console.log("Paso 8: Objeto JSON preparado:", outputData);
        console.log(`Paso 8: String JSON generado. Longitud: ${jsonOutput.length} caracteres.`);



        console.log("Paso 9: Iniciando descarga del archivo JSON encriptado...");
        const jsonFilename = `${file.name}.encrypted.json`;
        download(jsonOutput, jsonFilename, "application/json");
        console.log(`Paso 9: Descarga del archivo ${jsonFilename} iniciada.`);
        setStatus("🎉 ¡Archivo encriptado y descargado! Guarda la frase y las llaves.");
        console.log("--- FIN PROCESO DE ENCRIPTACIÓN (ÉXITO) ---");

    } catch (error) {
        console.error("❌ Error durante la encriptación:", error);
        setStatus(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
     
        setPublicKeyPEM_B64(null);
        setPrivateKeyPEM_B64(null);
        setGeneratedPassphrase(null);
        console.log("--- FIN PROCESO DE ENCRIPTACIÓN (FALLO) ---");
    } finally {
        setIsProcessing(false);
        console.log("Proceso finalizado, isProcessing establecido en false.");
    }
  };

  // Función de descarga genérica
  const download = (data: string, filename: string, type: string) => {
    console.log(`[Download] Iniciando descarga: ${filename}, Tipo: ${type}, Longitud Data: ${data.length}`);
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log(`[Download] Descarga de ${filename} completada.`);
  };

 
  const downloadKey = (keyDataBase64: string | null, filename: string, type: 'PUBLIC' | 'PRIVATE') => {
     if (!keyDataBase64) {
         console.warn(`[Download Key] Intento de descargar ${filename} pero los datos Base64 no están disponibles.`);
         return;
     }
     console.log(`[Download Key] Preparando descarga para ${filename} (Tipo: ${type}).`);
     const pemFormattedKey = formatPEM(keyDataBase64, type);
     download(pemFormattedKey, filename, "application/x-pem-file");
  }


  return (
    <div className="p-4 md:p-6 lg:p-8 rounded-xl bg-white shadow-lg flex flex-col gap-5 max-w-3xl mx-auto my-8 border border-gray-200">
      <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-4">
         🔐 Encriptador Híbrido
      </h2>

   
      <div className="flex flex-col gap-2 border border-gray-200 p-4 rounded-lg bg-gray-50/50 shadow-sm">
          <label htmlFor="file-upload" className="text-sm font-medium text-gray-700 flex items-center gap-2">
            1. Selecciona un archivo (.txt) para encriptar:
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".txt,text/plain" 
            onChange={handleFileUpload}
            disabled={isProcessing}
            className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-wait cursor-pointer"
          />
      </div>

    
       {status && (
          <p className={`text-sm p-3 rounded text-center font-medium ${
              status.startsWith('❌ Error') ? 'bg-red-100 text-red-800 border border-red-200' :
              status.startsWith('🎉') || status.startsWith('✅') ? 'bg-green-100 text-green-800 border border-green-200' :
              status.startsWith('⏳') ? 'bg-blue-100 text-blue-800 border border-blue-200 animate-pulse' :
              'bg-gray-100 text-gray-800 border border-gray-200'
            }`}>
             {status}
          </p>
       )}

   
      {originalText && !isProcessing && (
        <div className="bg-gray-50 p-3 rounded border border-gray-200 mt-2 shadow-sm">
          <strong className="text-xs text-gray-600 block mb-1">Contenido original (previsualización):</strong>
          <pre className="text-xs bg-white p-2 rounded border border-gray-100 whitespace-pre-wrap max-h-24 overflow-y-auto shadow-inner font-mono">
            {originalText.substring(0, 500)}{originalText.length > 500 ? '...' : ''}
          </pre>
        </div>
      )}


       {generatedPassphrase && !isProcessing && (
         <div className="bg-yellow-100 p-4 rounded-lg border-2 border-dashed border-yellow-400 text-center shadow-md my-4">
           <p className="font-bold text-yellow-900 text-base">
             <span role="img" aria-label="warning">⚠️</span> ¡IMPORTANTE! Guarda esta frase de contraseña:
           </p>
           <p className="text-xl md:text-2xl font-mono bg-white inline-block px-4 py-2 rounded my-2 shadow select-all">
             {generatedPassphrase}
           </p>
           <p className="text-sm text-yellow-800 mt-1">
             La necesitarás junto con la llave privada para desencriptar el archivo. <strong className="underline">No se puede recuperar si la pierdes.</strong>
           </p>
         </div>
       )}


      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <button
            onClick={() => downloadKey(publicKeyPEM_B64, "llave_publica.pem", 'PUBLIC')}
            disabled={!publicKeyPEM_B64 || isProcessing}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 text-sm shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            title="Descargar la llave pública en formato PEM"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /> </svg> {/* Icono de candado abierto */}
            Descargar Llave Pública (.pem)
          </button>

          <button
            onClick={() => downloadKey(privateKeyPEM_B64, "llave_privada.pem", 'PRIVATE')}
            disabled={!privateKeyPEM_B64 || isProcessing}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 text-sm shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            title="Descargar la llave privada en formato PEM. ¡GUÁRDALA DE FORMA SEGURA!"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /> </svg> {/* Icono de candado cerrado */}
            Descargar Llave Privada (.pem)
          </button>
      </div>
        <p className="text-xs text-center text-gray-500 mt-2">
            Recuerda descargar y guardar de forma segura tanto el archivo <code className="bg-gray-200 px-1 rounded">.encrypted.json</code>, la <strong className="text-red-600">llave privada</strong> y la <strong className="text-yellow-700">frase de contraseña</strong>.
        </p>
    </div>
  );
};

export default Encryptor;