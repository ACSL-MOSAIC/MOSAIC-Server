package com.gistacsl.mosaic.cryptor;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.security.GeneralSecurityException;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

@Service
public class KeyEncryptionService {

    private static final String AES_ALGORITHM = "AES";
    private static final String AES_TRANSFORMATION = "AES/ECB/PKCS5Padding";

    @Value("${mosaic.security.encryption-key}")
    private String masterKeyBase64;

    private SecretKey aesKey;

    /**
     * Generate a new AES-256 key for initial setup
     * Run this method and set the generated key in application.yml or environment variable
     */
    public static String generateAESKey() throws NoSuchAlgorithmException {
        KeyGenerator keyGen = KeyGenerator.getInstance(AES_ALGORITHM);
        keyGen.init(256);
        SecretKey secretKey = keyGen.generateKey();
        return Base64.getEncoder().encodeToString(secretKey.getEncoded());
    }

    @PostConstruct
    public void init() {
        // Convert Base64 encoded master key to SecretKey
        byte[] decodedKey = Base64.getDecoder().decode(masterKeyBase64);
        this.aesKey = new SecretKeySpec(decodedKey, 0, decodedKey.length, AES_ALGORITHM);
    }

    /**
     * Encrypt private key using AES
     */
    public String encryptPrivateKey(String privateKeyBase64) throws GeneralSecurityException {
        byte[] encrypted = MosaicCryptor.encrypt(
                AES_TRANSFORMATION,
                aesKey,
                privateKeyBase64.getBytes()
        );
        return Base64.getEncoder().encodeToString(encrypted);
    }

    /**
     * Decrypt encrypted private key
     */
    public String decryptPrivateKey(String encryptedPrivateKey) throws GeneralSecurityException {
        byte[] decoded = Base64.getDecoder().decode(encryptedPrivateKey);
        return MosaicCryptor.decrypt(AES_TRANSFORMATION, aesKey, decoded);
    }
}