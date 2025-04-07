import React, { useState, useCallback, useEffect } from "react";


const PASSPHRASE_LENGTH = 8;
const RSA_ALGORITHM = "RSA-OAEP";
const RSA_HASH = "SHA-256";
const AES_ALGORITHM = "AES-GCM";



const loadFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    console.log(`[Helper] Iniciando lectura del archivo como texto: ${file.name}`);
    const reader = new FileReader();
    reader.onload = () => {
        console.log(`[Helper] Archivo ${file.name} leído como texto con éxito.`);
        resolve(reader.result as string)
    };
    reader.onerror = () => {
        console.error(`[Helper] Error al leer el archivo ${file.name}:`, reader.error);
        reject(reader.error ?? new Error("Failed to read file"));
    }
    reader.readAsText(file);
  });
};


const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    // console.log("[Helper] Convirtiendo Base64 a ArrayBuffer (longitud Base64):", base64.length);
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    // console.log("[Helper] Conversión a ArrayBuffer completada (longitud bytes):", bytes.byteLength);
    return bytes.buffer;
}


const hashString = async (input: string): Promise<string> => {
  if (!window.crypto?.subtle) {
     console.error("[Helper] Web Crypto API no disponible para hashString.");
     throw new Error("Web Crypto API no está disponible en este navegador.");
  }
  console.log("[Helper] Generando hash SHA-256 para entrada de longitud:", input.length);
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  console.log("[Helper] Hash SHA-256 generado:", hashHex);
  return hashHex;
};


const triggerDownload = (data: string, filename: string, type: string = "text/plain;charset=utf-8") => {
    console.log(`[Helper] Iniciando descarga del archivo: ${filename}, Tipo: ${type}, Tamaño: ${data.length} bytes`);
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log(`[Helper] Descarga del archivo ${filename} iniciada.`);
};




const Decryptor: React.FC = () => {
  const [decryptedText, setDecryptedText] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [privateKeyFile, setPrivateKeyFile] = useState<File | null>(null);
  const [privateKeyPEM, setPrivateKeyPEM] = useState<string | null>(null);
  const [inputPassphrase, setInputPassphrase] = useState<string>("");


  useEffect(() => {
     if (!window.crypto?.subtle) {
         console.error("❌ Error Crítico: La API Web Crypto no es compatible con este navegador.");
         setStatus("❌ Error: La API Web Crypto no es compatible con este navegador. No se puede desencriptar.");
     } else {
         console.log("✅ API Web Crypto disponible.");
     }
  }, []);


  const importPrivateKey = useCallback(async (pemBase64: string): Promise<CryptoKey> => {
    if (!window.crypto?.subtle) {
        console.error("[ImportKey] Web Crypto API no disponible.");
        throw new Error("Web Crypto API no está disponible.");
    }

    console.log("[ImportKey] Preparando para importar llave privada desde Base64 (formato esperado: PKCS8 DER). Longitud Base64:", pemBase64.length);
    const binaryDer = base64ToArrayBuffer(pemBase64);
    console.log("[ImportKey] Base64 convertido a ArrayBuffer (PKCS8 DER). Longitud:", binaryDer.byteLength);

    try {
        const importedKey = await window.crypto.subtle.importKey(
          "pkcs8",         
          binaryDer,     
          {
            name: RSA_ALGORITHM, 
            hash: RSA_HASH,      
          },
          true,            
          ["decrypt"]     
        );
        console.log("[ImportKey] Llave privada importada con éxito:", importedKey);
        return importedKey;
    } catch (error) {
        console.error("[ImportKey] Error al importar la llave privada:", error);
        throw new Error(`Error al importar la llave privada PKCS8: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, []);

  const performDecryption = useCallback(async (
      encryptedFile: File,
      privateKeyPemContent: string,
      passphrase: string
  ) => {
    setIsProcessing(true);
    setDecryptedText(null);
    setStatus("⏳ Iniciando proceso de desencriptación...");
    console.log("--- INICIO PROCESO DE DESENCRIPTACIÓN ---");
    console.log("Archivo JSON:", encryptedFile.name);
    console.log("Llave privada PEM (Base64) longitud:", privateKeyPemContent.length);
    console.log("Frase de contraseña longitud:", passphrase.length);


    if (!window.crypto?.subtle) {
        console.error("❌ Error: Web Crypto API no disponible al iniciar performDecryption.");
        setStatus("❌ Error: Web Crypto API no disponible.");
        setIsProcessing(false);
        return;
    }

    try {

        setStatus("⏳ 1. Leyendo archivo encriptado (.json)...");
        console.log("Paso 1: Leyendo archivo JSON...");
        let parsedData;
        try {
            const jsonText = await loadFileAsText(encryptedFile);
            console.log("Paso 1: Archivo JSON leído, parseando...");
            parsedData = JSON.parse(jsonText);
            console.log("Paso 1: Archivo JSON parseado con éxito. Datos:", { keys: Object.keys(parsedData) }); 
        } catch (parseError) {
             console.error("❌ Error en Paso 1 (Lectura/Parseo JSON):", parseError);
             throw new Error(`Error al leer o parsear el archivo JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
        }

        const { encryptedContent, encryptedAESKey, iv, passphraseHash } = parsedData;

    
        if (!encryptedContent || !encryptedAESKey || !iv || !passphraseHash) {
            console.error("❌ Error en Paso 1: Faltan campos en el JSON.", parsedData);
            throw new Error("El archivo JSON no contiene todos los campos necesarios (encryptedContent, encryptedAESKey, iv, passphraseHash).");
        }
        console.log("Paso 1: Campos necesarios encontrados en JSON.");
        console.log("  - encryptedContent (Base64 longitud):", encryptedContent.length);
        console.log("  - encryptedAESKey (Base64 longitud):", encryptedAESKey.length);
        console.log("  - iv (Base64 longitud):", iv.length);
        console.log("  - passphraseHash (SHA-256):", passphraseHash);


        
        setStatus("⏳ 2. Verificando frase de contraseña...");
        console.log("Paso 2: Verificando frase de contraseña...");
        const inputHash = await hashString(passphrase);
        console.log("  - Hash de entrada:", inputHash);
        console.log("  - Hash esperado (del archivo):", passphraseHash);

        if (inputHash !== passphraseHash) {
            console.error("❌ Error en Paso 2: Hashes de frase de contraseña no coinciden.");
            throw new Error("La frase de contraseña proporcionada es incorrecta.");
        }
        setStatus("✅ 2. Frase de contraseña correcta.");
        console.log("✅ Paso 2: Frase de contraseña correcta.");


       
        setStatus("⏳ 3. Importando llave privada...");
        console.log("Paso 3: Importando llave privada...");
        const privateKey = await importPrivateKey(privateKeyPemContent);
        setStatus("✅ 3. Llave privada importada.");
        console.log("✅ Paso 3: Llave privada importada.");


       
        setStatus("⏳ 4. Desencriptando clave simétrica AES...");
        console.log("Paso 4: Desencriptando clave AES usando RSA-OAEP...");
        let aesRawKeyBuffer: ArrayBuffer;
        try {
            const encryptedAESKeyBuffer = base64ToArrayBuffer(encryptedAESKey);
            console.log("  - Desencriptando ArrayBuffer (longitud):", encryptedAESKeyBuffer.byteLength);
            aesRawKeyBuffer = await window.crypto.subtle.decrypt(
                { name: RSA_ALGORITHM },
                privateKey,            
                encryptedAESKeyBuffer    
            );
            console.log("✅ Paso 4: Clave AES desencriptada (raw). Longitud:", aesRawKeyBuffer.byteLength);
        } catch (keyDecryptError) {
            console.error("❌ Error en Paso 4 (Desencriptar Clave AES):", keyDecryptError);
            throw new Error(`Error al desencriptar la clave AES. ¿Es la llave privada correcta? Detalles: ${keyDecryptError instanceof Error ? keyDecryptError.message : String(keyDecryptError)}`);
        }
        setStatus("✅ 4. Clave AES desencriptada.");


      
        setStatus("⏳ 5. Importando clave AES desencriptada...");
        console.log("Paso 5: Importando clave AES (raw) para usarla con AES-GCM...");
        const aesKey = await window.crypto.subtle.importKey(
            "raw",             
            aesRawKeyBuffer,   
            { name: AES_ALGORITHM }, 
            true,             
            ["decrypt"]        
        );
        setStatus("✅ 5. Clave AES importada.");
        console.log("✅ Paso 5: Clave AES importada con éxito:", aesKey);


    
        setStatus("⏳ 6. Desencriptando contenido del archivo...");
        console.log("Paso 6: Desencriptando contenido principal usando AES-GCM...");
        let decryptedBuffer: ArrayBuffer;
        try {
            const ivBuffer = base64ToArrayBuffer(iv);
            const encryptedContentBuffer = base64ToArrayBuffer(encryptedContent);
            console.log("  - IV (ArrayBuffer longitud):", ivBuffer.byteLength);
            console.log("  - Contenido encriptado (ArrayBuffer longitud):", encryptedContentBuffer.byteLength);
            decryptedBuffer = await window.crypto.subtle.decrypt(
                {
                    name: AES_ALGORITHM,
                    iv: ivBuffer 
                },
                aesKey,                  
                encryptedContentBuffer      
            );
            console.log("✅ Paso 6: Contenido desencriptado. Longitud del buffer:", decryptedBuffer.byteLength);
        } catch (contentDecryptError) {
            console.error("❌ Error en Paso 6 (Desencriptar Contenido):", contentDecryptError);
      
            if (contentDecryptError instanceof DOMException && contentDecryptError.name === 'OperationError') {
                 throw new Error(`Error al desencriptar el contenido. Posiblemente los datos fueron modificados o la clave/IV son incorrectos (fallo de autenticación AES-GCM). Detalles: ${contentDecryptError.message}`);
            }
            throw new Error(`Error al desencriptar el contenido. ¿Son correctos los datos del archivo JSON (IV, contenido)? Detalles: ${contentDecryptError instanceof Error ? contentDecryptError.message : String(contentDecryptError)}`);
        }
        setStatus("✅ 6. Contenido desencriptado.");


      
        setStatus("⏳ 7. Decodificando texto...");
        console.log("Paso 7: Decodificando el buffer desencriptado a texto (UTF-8)...");
        const decodedText = new TextDecoder().decode(decryptedBuffer);
        setDecryptedText(decodedText);
        console.log("✅ Paso 7: Texto decodificado. Longitud:", decodedText.length);
        // console.log("Texto desencriptado final:", decodedText);

        setStatus("🎉 ¡Archivo desencriptado con éxito!");
        console.log("--- FIN PROCESO DE DESENCRIPTACIÓN (ÉXITO) ---");

    } catch (err) {
        console.error("❌ Error General durante la desencriptación:", err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        setStatus(`❌ Error: ${errorMessage}`);
        setDecryptedText(null);
        console.log("--- FIN PROCESO DE DESENCRIPTACIÓN (FALLO) ---");
    } finally {
        setIsProcessing(false);
        console.log("Proceso finalizado, isProcessing establecido en false.");
    }
  }, [importPrivateKey]);



  const handleDecryptClick = useCallback(() => {
     console.log("Botón 'Desencriptar Archivo' clickeado.");
     setDecryptedText(null);
     setStatus(null);

     let errors: string[] = [];
     if (!jsonFile) {
         errors.push("No se ha cargado el archivo JSON encriptado.");
         console.warn("Validación fallida: Falta archivo JSON.");
     }
     if (!privateKeyPEM) {
         errors.push("No se ha cargado o leído la llave privada.");
          console.warn("Validación fallida: Falta llave privada procesada (PEM Base64).");
     }
     if (inputPassphrase.length !== PASSPHRASE_LENGTH) {
         errors.push(`La frase de contraseña debe tener exactamente ${PASSPHRASE_LENGTH} caracteres.`);
         console.warn(`Validación fallida: Longitud incorrecta de frase de contraseña (requerido: ${PASSPHRASE_LENGTH}, actual: ${inputPassphrase.length}).`);
     }

     if (errors.length > 0) {
         const errorMsg = `❌ Error de validación: ${errors.join(' ')}`;
         setStatus(errorMsg);
         console.error("Errores de validación encontrados:", errors);
         return;
     }

     console.log("Validación pasada. Llamando a performDecryption...");

     performDecryption(jsonFile!, privateKeyPEM!, inputPassphrase);

  }, [jsonFile, privateKeyPEM, inputPassphrase, performDecryption]);


  const handlePrivateKeyUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log("[Upload PEM] Evento de cambio de archivo detectado.");
    if (!file) {
        console.log("[Upload PEM] No se seleccionó ningún archivo.");
        setPrivateKeyFile(null);
        setPrivateKeyPEM(null);
        setStatus("Selecciona un archivo .pem");
        return;
    }

    console.log("[Upload PEM] Archivo seleccionado:", file.name, "Tipo:", file.type, "Tamaño:", file.size);
    setPrivateKeyFile(file);
    setPrivateKeyPEM(null); 
    setStatus("⏳ Leyendo llave privada...");
    setDecryptedText(null); 

    try {
        console.log("[Upload PEM] Leyendo contenido del archivo PEM como texto...");
        const pemContent = await loadFileAsText(file);
        console.log("[Upload PEM] Contenido PEM leído (primeros/últimos 100 caracteres):", pemContent.substring(0, 100) + "..." + pemContent.substring(pemContent.length - 100));

        console.log("[Upload PEM] Extrayendo contenido Base64 del PEM...");

        const base64Content = pemContent
            .replace(/-----BEGIN (ENCRYPTED )?PRIVATE KEY-----/g, '')
            .replace(/-----END (ENCRYPTED )?PRIVATE KEY-----/g, '')
            .replace(/\s+/g, ''); 

        if (!base64Content) {
             console.error("[Upload PEM] No se pudo extraer contenido Base64 válido del archivo.");
             throw new Error("No se pudo extraer contenido Base64 del archivo PEM. ¿Es un formato válido?");
        }

        console.log("[Upload PEM] Contenido Base64 extraído. Longitud:", base64Content.length);
       

        setPrivateKeyPEM(base64Content);
        setStatus("✅ Llave privada cargada y procesada.");
        console.log("[Upload PEM] Llave privada procesada y almacenada como Base64 en el estado.");
    } catch (error) {
        console.error("❌ Error leyendo o procesando llave privada:", error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        setStatus(`❌ Error al leer la llave privada: ${errorMessage}`);
        setPrivateKeyFile(null); 
        setPrivateKeyPEM(null);
    }
  }, []); 

   const handleDownloadDecrypted = useCallback(() => {
     if (!decryptedText) {
         console.warn("[Download] Intento de descarga sin texto desencriptado disponible.");
         return;
     }

     const baseFilename = jsonFile?.name.replace(/\.encrypted\.json$/i, '') ?? 'archivo';
     const downloadFilename = `${baseFilename}.decrypted.txt`;
     console.log(`[Download] Preparando descarga como: ${downloadFilename}`);

     if (window.confirm(`¿Deseas descargar el archivo desencriptado como "${downloadFilename}"?`)) {
         triggerDownload(decryptedText, downloadFilename);
         setStatus("✅ Texto desencriptado descargado.");
         console.log("[Download] Descarga confirmada por el usuario.");
     } else {
         console.log("[Download] Descarga cancelada por el usuario.");
     }
   }, [decryptedText, jsonFile]); 



  return (
   
     <div className="p-4 md:p-6 lg:p-8 rounded-xl bg-white shadow-lg flex flex-col gap-5 max-w-3xl mx-auto my-8 border border-gray-200">
       <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-4">
          Desencriptador Híbrido
       </h2>

      
       <div className="space-y-5">
         <div className="flex flex-col gap-2 border border-gray-200 p-4 rounded-lg bg-gray-50/50 shadow-sm">
           <label htmlFor="json-upload" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              Carga el archivo encriptado (.json):
           </label>
           <input
             id="json-upload"
             type="file"
             accept="application/json,.json"
             onChange={(e) => {
               const file = e.target.files?.[0] ?? null;
               console.log("[UI] Archivo JSON seleccionado:", file?.name ?? "Ninguno");
               setJsonFile(file);
               setStatus(file ? "Archivo JSON seleccionado." : "Selecciona un archivo JSON.");
               setDecryptedText(null);
             }}
             disabled={isProcessing}
             className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-wait cursor-pointer"
           />
           {jsonFile && <span className="text-xs text-gray-500 mt-1">Archivo: {jsonFile.name}</span>}
         </div>

       
         <div className="flex flex-col gap-2 border border-gray-200 p-4 rounded-lg bg-gray-50/50 shadow-sm">
           <label htmlFor="pem-upload" className="text-sm font-medium text-gray-700 flex items-center gap-2">
             Carga tu llave privada (.pem):
           </label>
           <input
             id="pem-upload"
             type="file"
             accept=".pem"
             onChange={handlePrivateKeyUpload}
             disabled={isProcessing}
             className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-wait cursor-pointer"
           />
           {privateKeyFile && <span className="text-xs text-gray-500 mt-1">Archivo: {privateKeyFile.name} {privateKeyPEM ? '(Leída)' : '(Error al leer o no procesada)'}</span>}
         </div>

  
         <div className="flex flex-col gap-2 border border-gray-200 p-4 rounded-lg bg-gray-50/50 shadow-sm">
           <label htmlFor="passphrase-input" className="text-sm font-medium text-gray-700 flex items-center gap-2">
             Introduce la frase de contraseña ({PASSPHRASE_LENGTH} caracteres):
           </label>
           <input
             id="passphrase-input"
             type="password"
             value={inputPassphrase}
             onChange={(e) => setInputPassphrase(e.target.value)}
             maxLength={PASSPHRASE_LENGTH}
             disabled={isProcessing}
             placeholder={`Introduce los ${PASSPHRASE_LENGTH} caracteres exactos`}
             className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono disabled:opacity-50 disabled:bg-gray-100"
             autoComplete="off"
           />
           <p className="text-xs text-gray-500">Distinción entre mayúsculas/minúsculas y números.</p>
         </div>
       </div>

     
       <button
         onClick={handleDecryptClick}
         disabled={!jsonFile || !privateKeyPEM || inputPassphrase.length !== PASSPHRASE_LENGTH || isProcessing}
         className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-3 text-base md:text-lg shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
       >
         {isProcessing
           ? <> <span className="animate-spin inline-block h-5 w-5 border-t-2 border-r-2 border-white rounded-full"></span> Desencriptando... </>
           : <> <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /> </svg> Desencriptar Archivo </>
         }
       </button>


       {status && (
          <p className={`text-sm p-3 rounded text-center font-medium mt-2 ${
              status.startsWith('❌ Error') ? 'bg-red-100 text-red-800 border border-red-200' :
              status.startsWith('🎉') || status.startsWith('✅') ? 'bg-green-100 text-green-800 border border-green-200' :
              status.startsWith('⏳') ? 'bg-blue-100 text-blue-800 border border-blue-200 animate-pulse' :
              'bg-gray-100 text-gray-800 border border-gray-200'
            }`}>
             {status}
          </p>
       )}

   
       {decryptedText && (
         <div className="bg-green-50 p-4 rounded-lg border border-green-200 mt-4 shadow-sm">
           <strong className="text-base text-green-900 block mb-2">Contenido desencriptado:</strong>
           <pre className="text-sm bg-white p-3 rounded border border-green-100 whitespace-pre-wrap max-h-80 overflow-y-auto shadow-inner font-mono">
             {decryptedText}
           </pre>
           <button
             onClick={handleDownloadDecrypted}
             className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition duration-150 ease-in-out text-sm font-medium flex items-center justify-center gap-2 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
             title="Descargar el texto desencriptado como un archivo .txt"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
             Descargar Texto Desencriptado (.txt)
           </button>
         </div>
       )}
     </div>
  );
};

export default Decryptor;