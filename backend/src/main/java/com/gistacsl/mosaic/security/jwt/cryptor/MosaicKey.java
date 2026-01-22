package com.gistacsl.mosaic.security.jwt.cryptor;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.util.io.pem.PemObject;
import org.bouncycastle.util.io.pem.PemWriter;
import org.springframework.stereotype.Component;

import java.io.*;
import java.security.*;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

@Component
public class MosaicKey {
    public static String RSA_KEY_ALG = "RSA";
    public static String RSA_KEY_TRANS = "RSA/NONE/NoPadding";

    @Getter
    private PrivateKey privateKey;
    @Getter
    private PublicKey publicKey;

    // RSA PRIVATE KEY
    public static void exportPrivateKey(String path, String type, byte[] priKey) {
        PemObject pemObject = new PemObject(type, priKey);
        StringWriter str = new StringWriter();
        PemWriter pemWriter = new PemWriter(str);

        try {
            pemWriter.writeObject(pemObject);
            pemWriter.close();
            str.close();

            PrintWriter pw = new PrintWriter(new FileOutputStream(path));
            String privateKey = str.toString();
            pw.print(privateKey);
            pw.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    // RSA PUBLIC KEY
    public static void exportPublicKey(String path, String type, byte[] pubKey) {
        PemObject pemObject = new PemObject(type, pubKey);
        StringWriter str = new StringWriter();
        PemWriter pemWriter = new PemWriter(str);

        try {
            pemWriter.writeObject(pemObject);
            pemWriter.close();
            str.close();

            PrintWriter pw = new PrintWriter(new FileOutputStream(path));
            String publicKey = str.toString();
            pw.print(publicKey);
            pw.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static String keyToString(Key key) {
        return Base64.getEncoder().encodeToString(key.getEncoded());
    }

    // RSA
    public static PrivateKey stringToPrivateKey(String key, String algorithm) throws UnsupportedEncodingException, GeneralSecurityException {
        byte[] bytePrivateKey = Base64.getDecoder().decode(key.getBytes("UTF-8"));

        KeyFactory keyFactory = KeyFactory.getInstance(algorithm, "BC");
        PKCS8EncodedKeySpec privateKeySpec = new PKCS8EncodedKeySpec(bytePrivateKey);

        return keyFactory.generatePrivate(privateKeySpec);
    }

    // RSA
    public static PublicKey stringToPublicKey(String key, String algorithm) throws UnsupportedEncodingException, GeneralSecurityException {
        byte[] bytePublicKey = Base64.getDecoder().decode(key.getBytes("UTF-8"));

        KeyFactory keyFactory = KeyFactory.getInstance(algorithm, "BC");
        X509EncodedKeySpec publicKeySpec = new X509EncodedKeySpec(bytePublicKey);

        return keyFactory.generatePublic(publicKeySpec);
    }

    private KeyPair generateKeyPair(int keySize, String algorithm) throws NoSuchAlgorithmException, NoSuchProviderException {
        KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance(algorithm, "BC");
        keyPairGenerator.initialize(keySize, new SecureRandom());

        return keyPairGenerator.generateKeyPair();
    }

    @PostConstruct
    public void init() throws Exception {
        Security.addProvider(new BouncyCastleProvider());

        if (this.privateKey == null || this.publicKey == null) {
            KeyPair keyPair = this.generateKeyPair(2048, MosaicKey.RSA_KEY_ALG);
            this.publicKey = keyPair.getPublic();
            this.privateKey = keyPair.getPrivate();

            // TODO: 서버 시작 시 DB 에서 가져오게

//            this.privateKey = MosaicKey.stringToPrivateKey(this.privateKeyString, MosaicKey.RSA_KEY_ALG);
//            this.publicKey = MosaicKey.stringToPublicKey(this.publicKeyString, MosaicKey.RSA_KEY_ALG);
        }
    }

}
