package org.playlimana.auth;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;

import java.io.IOException;
import java.io.InputStream;

public class FirebaseTokenVerifier {
    private FirebaseTokenVerifier(){
        // to hide the public constructor satisfying sonarqube
    }

    // no more “initialized” flag needed
    public static synchronized void initialize() {
        // if there’s already an app, do nothing
        if (!FirebaseApp.getApps().isEmpty()) {
            return;
        }

        try ( InputStream serviceAccount = Thread.currentThread()
                .getContextClassLoader()
                .getResourceAsStream("firebase-service-account.json") ) {

            if (serviceAccount == null) {
                throw new FirebaseException("Could not find firebase-service-account.json on the classpath", null);
            }

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();

            FirebaseApp.initializeApp(options);

        } catch (IOException e) {
            throw new FirebaseException("Firebase initialization failed", e);
        }
    }

    public static FirebaseToken verify(String idToken) {
        // safe to call over and over
        initialize();
        try {
            return FirebaseAuth.getInstance().verifyIdToken(idToken);
        } catch (FirebaseAuthException e) {
            throw new FirebaseException("Invalid Firebase token", e);
        }
    }
}

// to have a dedicated exception instead of a generic one
class FirebaseException extends RuntimeException{
    FirebaseException(String message, Exception cause) {
        super(message, cause);
    }
}
