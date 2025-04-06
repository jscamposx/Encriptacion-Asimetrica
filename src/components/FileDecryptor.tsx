import React, { useState } from "react";

// Helper para leer archivo como texto
const loadFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};

// Helper para convertir Base64 a ArrayBuffer (necesario para importar/desencriptar)
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

// Helper para hashear un string (DEBE ser idéntico al del Encryptor)
const hashString = async (input: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};


const Decryptor = () => {
  const [decryptedText, setDecryptedText] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [privateKeyFile, setPrivateKeyFile] = useState<File | null>(null);
  const [privateKeyPEM, setPrivateKeyPEM] = useState<string | null>(null); // Contenido PEM (Base64)
  const [inputPassphrase, setInputPassphrase] = useState<string>(""); // Frase introducida por el usuario

  // Importar la llave privada desde el contenido PEM (Base64)
  const importPrivateKey = async (pemBase64: string): Promise<CryptoKey> => {
    const binaryDer = base64ToArrayBuffer(pemBase64);
    return await window.crypto.subtle.importKey(
      "pkcs8", // Formato esperado
      binaryDer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256", // Debe coincidir con la generación
      },
      true, // Exportable (aunque no se use aquí)
      ["decrypt"] // Uso permitido
    );
  };

  const decrypt = async (file: File, privateKeyPemContent: string, passphrase: string) => {
    setIsProcessing(true);
    setDecryptedText(null); // Limpiar resultado anterior
    setStatus("Iniciando proceso de desencriptación...");

    try {
      setStatus("1. Leyendo archivo encriptado (.json)...");
      const jsonText = await loadFileAsText(file);
      const { encryptedContent, encryptedAESKey, iv, passphraseHash } = JSON.parse(jsonText);

      // Verificar que los datos necesarios existen
      if (!encryptedContent || !encryptedAESKey || !iv || !passphraseHash) {
          throw new Error("El archivo JSON no tiene el formato esperado (faltan datos).");
      }

      setStatus("2. Verificando frase de contraseña...");
      const inputHash = await hashString(passphrase);

      if (inputHash !== passphraseHash) {
          throw new Error("La frase de contraseña proporcionada es incorrecta.");
      }
      setStatus("   Frase de contraseña correcta.");


      setStatus("3. Importando llave privada...");
      const privateKey = await importPrivateKey(privateKeyPemContent);

      setStatus("4. Desencriptando clave simétrica AES...");
      const aesRawKeyBuffer = await window.crypto.subtle.decrypt(
        { name: "RSA-OAEP" }, // Algoritmo usado para encriptar la clave AES
        privateKey,
        base64ToArrayBuffer(encryptedAESKey) // Clave AES encriptada
      );

      setStatus("5. Importando clave AES desencriptada...");
      const aesKey = await window.crypto.subtle.importKey(
        "raw", // Formato de la clave AES desencriptada
        aesRawKeyBuffer,
        { name: "AES-GCM" }, // Algoritmo para el que se usará la clave
        true,
        ["decrypt"] // Uso permitido
      );

      setStatus("6. Desencriptando contenido del archivo...");
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: base64ToArrayBuffer(iv) // IV usado en la encriptación AES
        },
        aesKey,
        base64ToArrayBuffer(encryptedContent) // Contenido encriptado
      );

      setStatus("7. Decodificando texto...");
      const decodedText = new TextDecoder().decode(decryptedBuffer);
      setDecryptedText(decodedText);
      setStatus("¡Archivo desencriptado con éxito!");

    } catch (err) {
      console.error("Error durante la desencriptación:", err);
      setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
      setDecryptedText(null); // Limpiar en caso de error
    } finally {
      setIsProcessing(false); // Finaliza el procesamiento
    }
  };

  const handleDecryptClick = () => {
    if (jsonFile && privateKeyPEM && inputPassphrase.length === 8) {
      decrypt(jsonFile, privateKeyPEM, inputPassphrase);
    } else if (inputPassphrase.length !== 8) {
        setStatus("Error: La frase de contraseña debe tener exactamente 8 caracteres.");
    } else {
        setStatus("Error: Asegúrate de cargar el archivo JSON, la llave privada y escribir la frase.");
    }
  };

  const handlePrivateKeyUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setPrivateKeyFile(file);
      setStatus("Leyendo llave privada...");
      try {
          const pemContent = await loadFileAsText(file);
          // Quitamos posibles cabeceras/pies de PEM si existen, nos quedamos solo con Base64
          const base64Content = pemContent
            .replace(/-----BEGIN PRIVATE KEY-----/g, '')
            .replace(/-----END PRIVATE KEY-----/g, '')
            .replace(/\s+/g, ''); // Remove whitespace and newlines
          setPrivateKeyPEM(base64Content);
          setStatus("Llave privada cargada.");
      } catch (error) {
          console.error("Error leyendo llave privada:", error);
          setStatus(`Error al leer la llave privada: ${error instanceof Error ? error.message : 'Error desconocido'}`);
          setPrivateKeyPEM(null);
      }
  };

  const download = (data: string, filename: string, type: string = "text/plain") => {
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

  return (
    <div className="p-6 rounded-xl bg-white shadow-lg flex flex-col gap-5 max-w-2xl mx-auto mt-10 border border-gray-200">
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-4">🔓 Desencriptador Avanzado</h2>

        <div className="flex flex-col gap-2 border p-4 rounded-lg bg-gray-50">
          <label htmlFor="json-upload" className="text-sm font-medium text-gray-600">
             1. Carga el archivo encriptado (.json):
          </label>
          <input
            id="json-upload"
            type="file"
            accept="application/json"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                setJsonFile(e.target.files[0]);
                setStatus("Archivo JSON seleccionado.");
                setDecryptedText(null); // Limpiar resultado si se cambia el archivo
              }
            }}
            disabled={isProcessing}
            className="block w-full text-sm text-gray-500
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-full file:border-0
                       file:text-sm file:font-semibold
                       file:bg-indigo-50 file:text-indigo-700
                       hover:file:bg-indigo-100 disabled:opacity-50"
          />
       </div>

       <div className="flex flex-col gap-2 border p-4 rounded-lg bg-gray-50">
          <label htmlFor="pem-upload" className="text-sm font-medium text-gray-600">
            2. Carga tu llave privada (.pem):
          </label>
          <input
            id="pem-upload"
            type="file"
            accept=".pem"
            onChange={handlePrivateKeyUpload}
            disabled={isProcessing}
             className="block w-full text-sm text-gray-500
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-full file:border-0
                       file:text-sm file:font-semibold
                       file:bg-pink-50 file:text-pink-700
                       hover:file:bg-pink-100 disabled:opacity-50"
          />
          {privateKeyFile && <span className="text-xs text-gray-500 mt-1">Archivo: {privateKeyFile.name}</span>}
      </div>

       <div className="flex flex-col gap-2 border p-4 rounded-lg bg-gray-50">
          <label htmlFor="passphrase-input" className="text-sm font-medium text-gray-600">
            3. Introduce la frase de contraseña (8 caracteres):
          </label>
          <input
            id="passphrase-input"
            type="password" // Oculta la entrada
            value={inputPassphrase}
            onChange={(e) => setInputPassphrase(e.target.value)}
            maxLength={8}
            disabled={isProcessing}
            placeholder="Introduce los 8 caracteres"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                       placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500
                       sm:text-sm disabled:opacity-50"
          />
      </div>


      <button
        onClick={handleDecryptClick}
        disabled={!jsonFile || !privateKeyPEM || inputPassphrase.length !== 8 || isProcessing}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2 text-lg"
      >
         {isProcessing ? <span className="animate-spin inline-block h-5 w-5 border-t-2 border-r-2 border-white rounded-full"></span> : '🔓'}
         {isProcessing ? 'Desencriptando...' : 'Desencriptar Archivo'}
      </button>

      {status && (
         <p className={`text-sm p-3 rounded text-center ${status.startsWith('Error') ? 'bg-red-100 text-red-700' : (decryptedText ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700')}`}>
            {status}
         </p>
      )}

      {decryptedText && (
        <div className="bg-green-50 p-4 rounded border border-green-200 mt-4">
          <strong className="text-base text-green-800">Contenido desencriptado:</strong>
          <pre className="mt-2 text-sm bg-white p-3 rounded whitespace-pre-wrap max-h-60 overflow-y-auto shadow-inner">{decryptedText}</pre>
          <button
            onClick={() => download(decryptedText, jsonFile ? `${jsonFile.name.replace('.encrypted.json', '')}.decrypted.txt` : "archivo_desencriptado.txt")}
            className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition duration-150 ease-in-out text-sm font-medium flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 14a1 1 0 01-.707-.293l-4-4a1 1 0 011.414-1.414L10 11.586l3.293-3.293a1 1 0 111.414 1.414l-4 4A1 1 0 0110 14z" />
                <path d="M4 18a1 1 0 01-1-1V7a1 1 0 011-1h2a1 1 0 010 2H5v9h10V8h-1a1 1 0 010-2h2a1 1 0 011 1v10a1 1 0 01-1 1H4z" />
            </svg>
            Descargar Texto Desencriptado (.txt)
          </button>
        </div>
      )}
    </div>
  );
};

export default Decryptor;