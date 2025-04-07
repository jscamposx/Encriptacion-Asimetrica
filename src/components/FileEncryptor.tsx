import React, { useState } from "react";


const generatePassphrase = (length: number): string => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};


const hashString = async (input: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);

  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};


const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

const Encryptor = () => {
  const [originalText, setOriginalText] = useState<string | null>(null);
  const [publicKeyPEM, setPublicKeyPEM] = useState<string | null>(null);
  const [privateKeyPEM, setPrivateKeyPEM] = useState<string | null>(null);
  const [generatedPassphrase, setGeneratedPassphrase] = useState<string | null>(null); 
  const [status, setStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const generateRSAKeyPair = async (): Promise<{ publicKey: CryptoKey, privateKey: CryptoKey }> => {
    setStatus("Generando par de claves RSA...");
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"]
    );

  
    const publicKeyBuffer = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
    const privateKeyBuffer = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

    const pubPEMContent = arrayBufferToBase64(publicKeyBuffer);
    const privPEMContent = arrayBufferToBase64(privateKeyBuffer);

    setPublicKeyPEM(pubPEMContent);
    setPrivateKeyPEM(privPEMContent);
    setStatus("Par de claves RSA generado.");
    return keyPair;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

  
    setOriginalText(null);
    setPublicKeyPEM(null);
    setPrivateKeyPEM(null);
    setGeneratedPassphrase(null);
    setStatus("Leyendo archivo...");
    setIsProcessing(true);

    try {
      const text = await file.text();
      setOriginalText(text);
      setStatus("Archivo leído. Iniciando encriptación...");

      const rsaKeyPair = await generateRSAKeyPair(); 

      setStatus("Generando clave simétrica AES...");
      const aesKey = await window.crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );

      const iv = window.crypto.getRandomValues(new Uint8Array(12)); 
      const encodedText = new TextEncoder().encode(text);

      setStatus("Encriptando contenido con AES...");
      const encryptedContentBuffer = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        aesKey,
        encodedText
      );

 
      const exportedAESKeyBuffer = await window.crypto.subtle.exportKey("raw", aesKey);

      setStatus("Encriptando clave AES con RSA...");
      const encryptedAESKeyBuffer = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" }, 
        rsaKeyPair.publicKey,
        exportedAESKeyBuffer
      );

    
      setStatus("Generando frase de contraseña...");
      const newPassphrase = generatePassphrase(8);
      const passphraseHash = await hashString(newPassphrase);
      setGeneratedPassphrase(newPassphrase); 

      setStatus("Preparando archivo JSON...");
      const jsonOutput = JSON.stringify({
        encryptedContent: arrayBufferToBase64(encryptedContentBuffer),
        encryptedAESKey: arrayBufferToBase64(encryptedAESKeyBuffer),
        iv: arrayBufferToBase64(iv.buffer),
        passphraseHash: passphraseHash, 
      }, null, 2); 

      download(jsonOutput, `${file.name}.encrypted.json`, "application/json");
      setStatus("¡Archivo encriptado y descargado! Guarda la frase de contraseña.");

    } catch (error) {
        console.error("Error durante la encriptación:", error);
        setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
        setGeneratedPassphrase(null); 
    } finally {
        setIsProcessing(false); 
    }
  };

  const download = (data: string, filename: string, type: string) => {
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


  const downloadKey = (keyData: string | null, filename: string) => {
      if (!keyData) return;
     
      download(keyData, filename, "application/x-pem-file");
  }

  return (
    <div className="p-6 rounded-xl bg-white shadow-lg flex flex-col gap-5 max-w-2xl mx-auto mt-10 border border-gray-200">
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-4">🔐 Encriptador Asimétrico Avanzado</h2>

      <div className="flex flex-col gap-2">
          <label htmlFor="file-upload" className="text-sm font-medium text-gray-600">
            1. Selecciona un archivo de texto (.txt) para encriptar:
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".txt"
            onChange={handleFileUpload}
            disabled={isProcessing}
            className="block w-full text-sm text-gray-500
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-full file:border-0
                       file:text-sm file:font-semibold
                       file:bg-blue-50 file:text-blue-700
                       hover:file:bg-blue-100 disabled:opacity-50"
          />
      </div>

        {status && (
            <p className={`text-sm p-2 rounded text-center ${status.startsWith('Error') ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                {isProcessing && <span className="animate-spin inline-block mr-2">⏳</span>}
                {status}
            </p>
        )}

      {originalText && (
        <div className="bg-gray-50 p-3 rounded border border-gray-200">
          <strong className="text-sm text-gray-700">Contenido del archivo original:</strong>
          <pre className="mt-1 text-xs bg-white p-2 rounded whitespace-pre-wrap max-h-32 overflow-y-auto">{originalText}</pre>
        </div>
      )}

       {generatedPassphrase && !isProcessing && (
        <div className="bg-yellow-100 p-4 rounded border border-yellow-300 text-center">
          <p className="font-bold text-yellow-800">¡IMPORTANTE! Guarda esta frase de contraseña:</p>
          <p className="text-lg font-mono bg-white inline-block px-3 py-1 rounded my-2">{generatedPassphrase}</p>
          <p className="text-sm text-yellow-700">La necesitarás para desencriptar el archivo. No se guarda en el archivo encriptado.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <button
            onClick={() => downloadKey(publicKeyPEM, "llave_publica.pem")}
            disabled={!publicKeyPEM || isProcessing}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
            </svg>
            Descargar Llave Pública (.pem)
          </button>

          <button
            onClick={() => downloadKey(privateKeyPEM, "llave_privada.pem")}
            disabled={!privateKeyPEM || isProcessing}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm5 4a1 1 0 10-2 0v1a1 1 0 102 0v-1z" clipRule="evenodd" /> {/* Icono simplificado de llave/candado */}
             </svg>
            Descargar Llave Privada (.pem)
          </button>
      </div>
    </div>
  );
};

export default Encryptor;