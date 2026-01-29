package com.gistacsl.mosaic.cryptor;

import org.junit.jupiter.api.Test;

import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

/**
 * AES-256 encryption key generator test
 * <p>
 * How to use:
 * 1. Run this test in your IDE
 * 2. Copy the generated key from console output
 * 3. Set it in application.yml (mosaic.security.encryption-key)
 */
class AESKeyGeneratorTest {

    @Test
    void generateAESKey() throws NoSuchAlgorithmException {
        String aesKey = generateKey();

        System.out.println("\n" + "=".repeat(80));
        System.out.println("Generated AES-256 Encryption Key:");
        System.out.println("=".repeat(80));
        System.out.println(aesKey);
        System.out.println("=".repeat(80));
        System.out.println("\nCopy this key and set it in:");
        System.out.println("  - application.yml: mosaic.security.encryption-key");
        System.out.println("\nWARNING: Keep this key secure and never commit it to version control!");
        System.out.println("=".repeat(80) + "\n");
    }

    private String generateKey() throws NoSuchAlgorithmException {
        KeyGenerator keyGen = KeyGenerator.getInstance("AES");
        keyGen.init(256);
        SecretKey secretKey = keyGen.generateKey();
        return Base64.getEncoder().encodeToString(secretKey.getEncoded());
    }
}