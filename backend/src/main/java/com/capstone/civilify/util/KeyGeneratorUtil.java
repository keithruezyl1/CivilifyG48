package com.capstone.civilify.util;

import org.apache.commons.codec.binary.Base64;

import java.security.KeyPair;
import java.security.KeyPairGenerator;

public class KeyGeneratorUtil {

    public static void generateAndPrintKeys() throws Exception {
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
        kpg.initialize(2048);
        KeyPair kp = kpg.generateKeyPair();

        String publicKey = Base64.encodeBase64String(kp.getPublic().getEncoded());
        String privateKey = Base64.encodeBase64String(kp.getPrivate().getEncoded());

        System.out.println("Public Key: " + publicKey);
        System.out.println("Private Key: " + privateKey);
    }
}