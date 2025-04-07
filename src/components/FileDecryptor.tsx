import React, { useState, useCallback, useEffect } from "react";


const PASSPHRASE_LENGTH = 8;
const RSA_ALGORITHM = "RSA-OAEP";
const RSA_HASH = "SHA-256";
const AES_ALGORITHM = "AES-GCM";

const loadFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsText(file);
  });
};


const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}


const hashString = async (input: string): Promise<string> => {
  if (!window.crypto?.subtle) {
      throw new Error("Web Crypto API no está disponible en este navegador.");
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};


const triggerDownload = (data: string, filename: string, type: string = "text/plain;charset=utf-8") => {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a); 
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); 
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
          setStatus("❌ Error: La API Web Crypto no es compatible con este navegador. No se puede desencriptar.");
      }
  }, []);


  const importPrivateKey = useCallback(async (pemBase64: string): Promise<CryptoKey> => {
    if (!window.crypto?.subtle) {
        throw new Error("Web Crypto API no está disponible.");
    }
 
    const binaryDer = base64ToArrayBuffer(pemBase64);


    return await window.crypto.subtle.importKey(
      "pkcs8",       
      binaryDer,
      {
        name: RSA_ALGORITHM, 
        hash: RSA_HASH,    
      },
      true,             
      ["decrypt"]      
    );
  }, []); 

  const performDecryption = useCallback(async (
      encryptedFile: File,
      privateKeyPemContent: string,
      passphrase: string
  ) => {
    setIsProcessing(true);
    setDecryptedText(null); 
    setStatus("⏳ Iniciando proceso de desencriptación...");

    if (!window.crypto?.subtle) {
        setStatus("❌ Error: Web Crypto API no disponible.");
        setIsProcessing(false);
        return;
    }

    try {
      
        setStatus("⏳ 1. Leyendo archivo encriptado (.json)...");
        let parsedData;
        try {
            const jsonText = await loadFileAsText(encryptedFile);
            parsedData = JSON.parse(jsonText);
        } catch (parseError) {
             throw new Error(`Error al leer o parsear el archivo JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
        }

        const { encryptedContent, encryptedAESKey, iv, passphraseHash } = parsedData;

    
        if (!encryptedContent || !encryptedAESKey || !iv || !passphraseHash) {
            throw new Error("El archivo JSON no contiene todos los campos necesarios (encryptedContent, encryptedAESKey, iv, passphraseHash).");
        }

   
        setStatus("⏳ 2. Verificando frase de contraseña...");
        const inputHash = await hashString(passphrase);

        if (inputHash !== passphraseHash) {
            throw new Error("La frase de contraseña proporcionada es incorrecta.");
        }
        setStatus("✅ 2. Frase de contraseña correcta.");

 
        setStatus("⏳ 3. Importando llave privada...");
        const privateKey = await importPrivateKey(privateKeyPemContent);
        setStatus("✅ 3. Llave privada importada.");

    
        setStatus("⏳ 4. Desencriptando clave simétrica AES...");
        let aesRawKeyBuffer: ArrayBuffer;
        try {
             aesRawKeyBuffer = await window.crypto.subtle.decrypt(
                { name: RSA_ALGORITHM },
                privateKey,
                base64ToArrayBuffer(encryptedAESKey) 
            );
        } catch (keyDecryptError) {
            throw new Error(`Error al desencriptar la clave AES. ¿Es la llave privada correcta? Detalles: ${keyDecryptError instanceof Error ? keyDecryptError.message : String(keyDecryptError)}`);
        }
        setStatus("✅ 4. Clave AES desencriptada.");


        setStatus("⏳ 5. Importando clave AES desencriptada...");
        const aesKey = await window.crypto.subtle.importKey(
            "raw",           
            aesRawKeyBuffer,
            { name: AES_ALGORITHM },
            true,            
            ["decrypt"]      
        );
        setStatus("✅ 5. Clave AES importada.");


        setStatus("⏳ 6. Desencriptando contenido del archivo...");
        let decryptedBuffer: ArrayBuffer;
        try {
            decryptedBuffer = await window.crypto.subtle.decrypt(
                {
                    name: AES_ALGORITHM,
                    iv: base64ToArrayBuffer(iv) 
                },
                aesKey,
                base64ToArrayBuffer(encryptedContent) 
            );
        } catch (contentDecryptError) {
             throw new Error(`Error al desencriptar el contenido. ¿Son correctos los datos del archivo JSON (IV, contenido)? Detalles: ${contentDecryptError instanceof Error ? contentDecryptError.message : String(contentDecryptError)}`);
        }
        setStatus("✅ 6. Contenido desencriptado.");

 
        setStatus("⏳ 7. Decodificando texto...");
        const decodedText = new TextDecoder().decode(decryptedBuffer);
        setDecryptedText(decodedText);
        setStatus("🎉 ¡Archivo desencriptado con éxito!");

    } catch (err) {
        console.error("Error detallado durante la desencriptación:", err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        setStatus(`❌ Error: ${errorMessage}`);
        setDecryptedText(null); 
    } finally {
        setIsProcessing(false); 
    }
  }, [importPrivateKey]); 



  const handleDecryptClick = useCallback(() => {
   
      setDecryptedText(null);
      setStatus(null);

      let errors: string[] = [];
      if (!jsonFile) {
          errors.push("No se ha cargado el archivo JSON encriptado.");
      }
      if (!privateKeyPEM) {
          errors.push("No se ha cargado o leído la llave privada.");
      }
      if (inputPassphrase.length !== PASSPHRASE_LENGTH) {
          errors.push(`La frase de contraseña debe tener exactamente ${PASSPHRASE_LENGTH} caracteres.`);
      }

      if (errors.length > 0) {
          setStatus(`❌ Error de validación: ${errors.join(' ')}`);
          return;
      }


      performDecryption(jsonFile!, privateKeyPEM!, inputPassphrase);

  }, [jsonFile, privateKeyPEM, inputPassphrase, performDecryption]);


  const handlePrivateKeyUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
        setPrivateKeyFile(null);
        setPrivateKeyPEM(null);
        return;
    }

    setPrivateKeyFile(file);
    setPrivateKeyPEM(null); 
    setStatus("⏳ Leyendo llave privada...");
    setDecryptedText(null); 
    try {
        const pemContent = await loadFileAsText(file);
  
        const base64Content = pemContent
            .replace(/-----BEGIN PRIVATE KEY-----/g, '')
            .replace(/-----END PRIVATE KEY-----/g, '')
            .replace(/-----BEGIN ENCRYPTED PRIVATE KEY-----/g, '') 
            .replace(/-----END ENCRYPTED PRIVATE KEY-----/g, '')
            .replace(/\s+/g, ''); 

        if (!base64Content) {
             throw new Error("No se pudo extraer contenido Base64 del archivo PEM.");
        }

        setPrivateKeyPEM(base64Content);
        setStatus("✅ Llave privada cargada y procesada.");
    } catch (error) {
        console.error("Error leyendo o procesando llave privada:", error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        setStatus(`❌ Error al leer la llave privada: ${errorMessage}`);
        setPrivateKeyFile(null); 
        setPrivateKeyPEM(null);
    }
  }, []);


   const handleDownloadDecrypted = useCallback(() => {
     if (!decryptedText) return;

     const baseFilename = jsonFile?.name.replace(/\.encrypted\.json$/i, '') ?? 'archivo';
     const downloadFilename = `${baseFilename}.decrypted.txt`;

     if (window.confirm(`¿Deseas descargar el archivo desencriptado como "${downloadFilename}"?`)) {
         triggerDownload(decryptedText, downloadFilename);
         setStatus("✅ Texto desencriptado descargado.");
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
           {privateKeyFile && <span className="text-xs text-gray-500 mt-1">Archivo: {privateKeyFile.name} {privateKeyPEM ? '(Leída)' : '(Error al leer)'}</span>}
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