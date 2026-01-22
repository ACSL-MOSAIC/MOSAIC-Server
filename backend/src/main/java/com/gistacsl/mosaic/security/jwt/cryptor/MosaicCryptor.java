package com.gistacsl.mosaic.security.jwt.cryptor;

import javax.crypto.Cipher;
import java.security.GeneralSecurityException;
import java.security.Key;

public class MosaicCryptor {

    public static byte[] encrypt(String transformation, Key key, byte[] data) throws GeneralSecurityException {
        Cipher cipher = Cipher.getInstance(transformation);
        cipher.init(Cipher.ENCRYPT_MODE, key);

        return cipher.doFinal(data);
    }

    public static String decrypt(String transformation, Key key, byte[] data) throws GeneralSecurityException {
        Cipher cipher = Cipher.getInstance(transformation);
        cipher.init(Cipher.DECRYPT_MODE, key);

        return new String(cipher.doFinal(data));
    }

}
