package com.legalbot.legalchatbot;

import java.util.*;

public class PromptBuilder {

    private static final Map<String, String> EXAMPLES_MAP = Map.of(
        "criminal", """
            Example:
            Question: What is the penalty for theft?
            Answer: Under Article 308 of the Revised Penal Code, theft is committed by any person who takes the personal property of another without consent. Penalties depend on the value of the stolen property.
        """,
        "family", """
            Example:
            Question: What are the grounds for annulment of marriage in the Philippines?
            Answer: The Family Code (Articles 45-47) lists psychological incapacity, fraud, lack of parental consent (if under 21), and impotence as grounds for annulment.
        """,
        "labor", """
            Example:
            Question: Can my employer terminate me without just cause?
            Answer: Under the Labor Code, termination without valid reason is considered illegal dismissal. Employers must provide just cause and follow due process.
        """,
        "cyber", """
            Example:
            Question: What is considered cyber libel in the Philippines?
            Answer: Under the Cybercrime Prevention Act (RA 10175), cyber libel refers to defamatory statements made through online platforms, punishable by imprisonment or fine.
        """
    );

    public static String buildPrompt(String question) {
        String category = detectCategory(question.toLowerCase());
        String examples = EXAMPLES_MAP.getOrDefault(category, getDefaultExample());

        return """
                You are a helpful, knowledgeable, and friendly AI legal assistant trained in Philippine laws, including the Revised Penal Code, Family Code, Labor Code, Data Privacy Act, and Supreme Court rulings. Your role is to educate users and provide complete, step-by-step guidance on legal matters in the Philippines, including legal processes, filing requirements, and expected outcomes (VERY IMPORTANT! DO NOT MISS THIS!).

                IMPORTANT INSTRUCTIONS:

                DO NOT simply tell the user to "consult a lawyer" unless absolutely necessary (e.g., mandatory court representation).

                ALWAYS provide the following whenever applicable (DO NOT MISS ANY OF THESE POINTS):

                Explain the full process clearly (where to file, how much it may cost, how long it may take).

                List all required documents.

                Mention the government agencies involved (e.g., DSWD, PSA, LCR, RTC, PNP-IAS, NAPOLCOM).

                Warn about common mistakes, delays, or risks that the user should avoid.

                Provide realistic timelines (processing time, validity period, etc.).

                Include helpful tips (e.g., "Prepare affidavits of witnesses," "Secure a psychological evaluation if claiming psychological incapacity").

                If available, include links to official government resources, forms, or contact information (e.g., https://www.officialgazette.gov.ph, https://psa.gov.ph, https://pnp.gov.ph).

                Maintain the SAME structure, process, and details in your answer, regardless of whether the user asks in English or Tagalog/Filipino. Only the language should change, not the information quality.

                ALWAYS maintain a warm, professional, and easy-to-understand tone for non-lawyers.

                If the law does not directly cover the issue, suggest practical next steps (e.g., barangay mediation, filing complaints with specific agencies).

                If the issue is beyond the scope of AI guidance (e.g., representation in court), clearly explain WHY a lawyer is necessary and what the user should prepare before consulting one.

                End every answer with: DISCLAIMER: This is not formal legal advice. Please consult a licensed attorney for official legal proceedings.

                Now, answer the following question thoroughly and clearly"

            %s

            Now, answer the following:
            Question: %s
        """.formatted(examples, question);
    }

    private static String detectCategory(String question) {
        // Criminal Law detection (English + Tagalog)
        if (containsAny(question, List.of("theft", "robbery", "estafa", "homicide", "pagnanakaw", "panloloob", "panlilinlang", "pagpatay"))) {
            return "criminal";
        }
        // Family Law detection
        else if (containsAny(question, List.of("marriage", "annulment", "custody", "adoption", "kasal", "annul", "pag-aasawa", "pagkukustodiya", "ampon"))) {
            return "family";
        }
        // Labor Law detection
        else if (containsAny(question, List.of("termination", "wages", "contract", "benefits", "tanggal", "sweldo", "kontrata", "benepisyo", "empleyado", "trabaho"))) {
            return "labor";
        }
        // Cybercrime / Data Privacy detection
        else if (containsAny(question, List.of("libel", "hacking", "privacy", "data", "paninirang-puri", "pag-hack", "pribado", "impormasyon"))) {
            return "cyber";
        } else {
            return "general";
        }
    }

    private static boolean containsAny(String text, List<String> keywords) {
        return keywords.stream().anyMatch(text::contains);
    }

    private static String getDefaultExample() {
        return """
            Example:
            Question: What are the basic rights of Filipino citizens?
            Answer: Under the Philippine Constitution, every citizen has the right to due process, equal protection of the law, freedom of speech, and freedom of religion.
        """;
    }
}
