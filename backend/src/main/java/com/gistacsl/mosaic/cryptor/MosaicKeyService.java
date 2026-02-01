package com.gistacsl.mosaic.cryptor;

import com.gistacsl.mosaic.repository.KeyPairRepository;
import com.gistacsl.mosaic.repository.entity.KeyPairEntity;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.jooq.DSLContext;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class MosaicKeyService {
    // Purpose declaration
    public static final String PURPOSE_JWT = "JWT";
    public static final String PURPOSE_ROBOT_SIMPLE_TOKEN_AUTH = "ROBOT_SIMPLE_TOKEN_AUTH";
    private static final List<String> KEY_PURPOSES = Arrays.asList(
            PURPOSE_JWT,
            PURPOSE_ROBOT_SIMPLE_TOKEN_AUTH
    );

    public static String RSA_KEY_ALG = "RSA";

    private final KeyPairRepository keyPairRepository;
    private final KeyEncryptionService keyEncryptionService;
    private final DSLContext dslContext;

    // Cache for key pairs by purpose
    private final Map<String, KeyPair> keyPairMap = new ConcurrentHashMap<>();

    public static String keyToString(Key key) {
        return Base64.getEncoder().encodeToString(key.getEncoded());
    }

    // RSA
    public static PrivateKey stringToPrivateKey(String key, String algorithm) throws UnsupportedEncodingException, GeneralSecurityException {
        byte[] bytePrivateKey = Base64.getDecoder().decode(key.getBytes(StandardCharsets.UTF_8));

        KeyFactory keyFactory = KeyFactory.getInstance(algorithm, "BC");
        PKCS8EncodedKeySpec privateKeySpec = new PKCS8EncodedKeySpec(bytePrivateKey);

        return keyFactory.generatePrivate(privateKeySpec);
    }

    // RSA
    public static PublicKey stringToPublicKey(String key, String algorithm) throws UnsupportedEncodingException, GeneralSecurityException {
        byte[] bytePublicKey = Base64.getDecoder().decode(key.getBytes(StandardCharsets.UTF_8));

        KeyFactory keyFactory = KeyFactory.getInstance(algorithm, "BC");
        X509EncodedKeySpec publicKeySpec = new X509EncodedKeySpec(bytePublicKey);

        return keyFactory.generatePublic(publicKeySpec);
    }

    private KeyPair generateKeyPair(int keySize, String algorithm) throws NoSuchAlgorithmException, NoSuchProviderException {
        KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance(algorithm, BouncyCastleProvider.PROVIDER_NAME);
        keyPairGenerator.initialize(keySize, new SecureRandom());

        return keyPairGenerator.generateKeyPair();
    }

    @PostConstruct
    public void init() throws Exception {
        Security.addProvider(new BouncyCastleProvider());

        // Load or generate key pairs for each purpose
        for (String purpose : KEY_PURPOSES) {
            KeyPair keyPair = loadOrGenerateKeyPair(purpose).block();
            keyPairMap.put(purpose, keyPair);
            log.info("Loaded key pair for purpose: {}", purpose);
        }
    }

    private Mono<KeyPair> loadOrGenerateKeyPair(String purpose) {
        return keyPairRepository.findByPurpose(purpose, dslContext)
                .flatMap(entity -> {
                    try {
                        return Mono.just(loadKeyPairFromEntity(entity));
                    } catch (Exception e) {
                        log.error("Failed to load key pair for purpose: {}", purpose, e);
                        return Mono.error(e);
                    }
                })
                .switchIfEmpty(Mono.defer(() -> {
                    log.info("Key pair not found for purpose: {}. Generating new one...", purpose);
                    try {
                        return generateAndSaveKeyPair(purpose);
                    } catch (Exception e) {
                        return Mono.error(e);
                    }
                }));
    }

    private KeyPair loadKeyPairFromEntity(KeyPairEntity entity) throws Exception {
        // 1. Restore public key
        PublicKey publicKey = stringToPublicKey(entity.getPublicKey(), entity.getAlgorithm());

        // 2. Decrypt and restore private key
        String decryptedPrivateKey = keyEncryptionService.decryptPrivateKey(
                entity.getEncryptedPrivateKey()
        );
        PrivateKey privateKey = stringToPrivateKey(decryptedPrivateKey, entity.getAlgorithm());

        return new KeyPair(publicKey, privateKey);
    }

    private Mono<KeyPair> generateAndSaveKeyPair(String purpose) throws Exception {
        // 1. Generate key pair
        KeyPair keyPair = generateKeyPair(2048, RSA_KEY_ALG);

        // 2. Convert to Base64
        String publicKeyStr = keyToString(keyPair.getPublic());
        String privateKeyStr = keyToString(keyPair.getPrivate());

        // 3. Encrypt private key
        String encryptedPrivateKey = keyEncryptionService.encryptPrivateKey(privateKeyStr);

        // 4. Create entity
        KeyPairEntity entity = KeyPairEntity.builder()
                .purpose(purpose)
                .publicKey(publicKeyStr)
                .encryptedPrivateKey(encryptedPrivateKey)
                .algorithm(RSA_KEY_ALG)
                .keySize(2048)
                .build();

        // 5. Save to DB
        return keyPairRepository.insert(entity, dslContext)
                .thenReturn(keyPair)
                .doOnSuccess(kp -> log.info("Generated and saved new key pair for purpose: {}", purpose));
    }

    // Key retrieval API by purpose
    public PrivateKey getPrivateKey(String purpose) {
        KeyPair keyPair = keyPairMap.get(purpose);
        if (keyPair == null) {
            throw new IllegalArgumentException("Unknown key purpose: " + purpose);
        }
        return keyPair.getPrivate();
    }

    public PublicKey getPublicKey(String purpose) {
        KeyPair keyPair = keyPairMap.get(purpose);
        if (keyPair == null) {
            throw new IllegalArgumentException("Unknown key purpose: " + purpose);
        }
        return keyPair.getPublic();
    }

}
