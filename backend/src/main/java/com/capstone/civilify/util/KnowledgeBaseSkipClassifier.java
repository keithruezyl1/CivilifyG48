package com.capstone.civilify.util;

import org.springframework.stereotype.Component;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Classifier to determine if a user query can be answered without Knowledge Base lookup.
 * This improves response time by skipping unnecessary KB API calls for conversational
 * and general queries that don't require specific legal provisions or citations.
 */
@Component
public class KnowledgeBaseSkipClassifier {

    // Greeting patterns
    private static final List<String> GREETING_PATTERNS = Arrays.asList(
        "hello", "hi", "hey", "good morning", "good afternoon", "good evening",
        "kumusta", "kamusta", "what's up", "whats up", "sup", "yo"
    );

    // Farewell patterns
    private static final List<String> FAREWELL_PATTERNS = Arrays.asList(
        "goodbye", "bye", "see you", "paalam", "salamat", "thank you", "thanks",
        "i'm done", "that's all", "thats all", "exit", "quit"
    );

    // Identity/capability questions
    private static final List<String> IDENTITY_PATTERNS = Arrays.asList(
        "who are you", "what are you", "what is your name", "your name",
        "tell me about yourself", "introduce yourself", "what can you do",
        "what are your capabilities", "how can you help", "what services",
        "what is civilify", "what does civilify do", "are you a lawyer",
        "are you human", "are you a robot", "are you ai"
    );

    // Mode explanation questions - REMOVED
    // These questions should use KB to provide accurate, detailed explanations
    // about GLI and CPA modes based on the actual system capabilities

    // Usage instruction questions
    private static final List<String> USAGE_PATTERNS = Arrays.asList(
        "how do i use this", "how to use", "how do i ask", "how do i get a report",
        "how do i switch modes", "what should i ask", "give me examples",
        "how does this work", "how does this chat work", "instructions"
    );

    // Acknowledgment/affirmation patterns
    private static final List<String> ACKNOWLEDGMENT_PATTERNS = Arrays.asList(
        "okay", "ok", "got it", "i understand", "i see", "alright",
        "yes", "yeah", "yep", "no", "nope", "sure", "fine"
    );

    // Meta/platform questions
    private static final List<String> META_PATTERNS = Arrays.asList(
        "is this free", "how much does this cost", "do i need to pay",
        "is my information private", "is this confidential", "can i trust this",
        "can you represent me", "can you go to court", "are you always right",
        "can you guarantee", "what can't you do", "your limitations"
    );

    // Basic legal concept definitions - REMOVED
    // These should use KB to provide accurate Philippine law context
    // and proper legal definitions with citations when available

    // Legal system overview (general knowledge)
    private static final List<String> LEGAL_SYSTEM_OVERVIEW = Arrays.asList(
        "philippine legal system", "court system", "levels of courts",
        "how does the court work", "what are my rights", "constitutional rights",
        "lawyer vs attorney", "difference between lawyer and attorney"
    );

    // Non-legal questions (should redirect)
    private static final List<String> NON_LEGAL_INDICATORS = Arrays.asList(
        "photosynthesis", "capital of", "president of",
        "math", "science", "history", "geography", "medical", "health",
        "investment", "stocks", "business advice", "technology", "computer",
        "phone", "recipe", "weather", "sports", "entertainment"
    );

    // Patterns that indicate specific legal provision lookup is needed
    private static final List<String> KB_REQUIRED_INDICATORS = Arrays.asList(
        "article", "section", "rule", "republic act", "ra ", "r.a.",
        "presidential decree", "pd ", "p.d.", "executive order", "eo ",
        "revised penal code", "rpc", "rules of court", "roc",
        "civil code", "labor code", "family code", "corporation code",
        "supreme court", "jurisprudence", "case law", "doctrine",
        "specific steps to file", "exact procedure", "deadline for filing",
        "statute of limitations", "prescriptive period", "legal basis",
        "cite the law", "what law", "which law", "specific provision",
        "penalty for", "imprisonment for", "fine for", "punishment for"
    );

    /**
     * Determines if a query can skip Knowledge Base lookup.
     * 
     * @param query The user's input message
     * @param mode The chat mode ("A" for GLI, "B" for CPA)
     * @param isReport Whether the query is triggering a report generation (CPA only)
     * @return true if KB lookup can be skipped, false otherwise
     */
    public boolean canSkipKnowledgeBase(String query, String mode, boolean isReport) {
        if (query == null || query.trim().isEmpty()) {
            return true; // Skip KB for empty queries
        }

        String lowerQuery = query.toLowerCase().trim();

        // CPA report generation ALWAYS needs KB for citations
        if ("B".equals(mode) && isReport) {
            return false;
        }

        // Check if query explicitly requires KB lookup (specific legal provisions)
        if (requiresKnowledgeBase(lowerQuery)) {
            return false;
        }

        // Check if query can be answered without KB
        return isGreeting(lowerQuery)
            || isFarewell(lowerQuery)
            || isIdentityQuestion(lowerQuery)
            || isUsageQuestion(lowerQuery)
            || isAcknowledgment(lowerQuery)
            || isMetaQuestion(lowerQuery)
            || isLegalSystemOverview(lowerQuery)
            || isNonLegalQuestion(lowerQuery)
            || isShortConversationalResponse(lowerQuery);
    }

    /**
     * Checks if query explicitly requires KB lookup (specific legal provisions).
     */
    private boolean requiresKnowledgeBase(String lowerQuery) {
        return KB_REQUIRED_INDICATORS.stream()
            .anyMatch(lowerQuery::contains);
    }

    /**
     * Checks if query is a greeting.
     */
    private boolean isGreeting(String lowerQuery) {
        return GREETING_PATTERNS.stream()
            .anyMatch(pattern -> lowerQuery.startsWith(pattern) 
                || lowerQuery.equals(pattern)
                || lowerQuery.matches("^" + Pattern.quote(pattern) + "[!?.,\\s]*$"));
    }

    /**
     * Checks if query is a farewell or thank you.
     */
    private boolean isFarewell(String lowerQuery) {
        return FAREWELL_PATTERNS.stream()
            .anyMatch(lowerQuery::contains);
    }

    /**
     * Checks if query is about identity or capabilities.
     */
    private boolean isIdentityQuestion(String lowerQuery) {
        return IDENTITY_PATTERNS.stream()
            .anyMatch(lowerQuery::contains);
    }

    // isModeQuestion method removed - mode questions now use KB for accurate explanations

    /**
     * Checks if query is about usage instructions.
     */
    private boolean isUsageQuestion(String lowerQuery) {
        return USAGE_PATTERNS.stream()
            .anyMatch(lowerQuery::contains);
    }

    /**
     * Checks if query is a simple acknowledgment.
     */
    private boolean isAcknowledgment(String lowerQuery) {
        // Very short responses are likely acknowledgments
        if (lowerQuery.length() <= 15) {
            return ACKNOWLEDGMENT_PATTERNS.stream()
                .anyMatch(pattern -> lowerQuery.equals(pattern)
                    || lowerQuery.matches("^" + Pattern.quote(pattern) + "[!?.,\\s]*$"));
        }
        return false;
    }

    /**
     * Checks if query is a meta/platform question.
     */
    private boolean isMetaQuestion(String lowerQuery) {
        return META_PATTERNS.stream()
            .anyMatch(lowerQuery::contains);
    }

    // isBasicLegalConcept method removed - legal concepts now use KB for accurate definitions

    /**
     * Checks if query is about legal system overview.
     */
    private boolean isLegalSystemOverview(String lowerQuery) {
        return LEGAL_SYSTEM_OVERVIEW.stream()
            .anyMatch(lowerQuery::contains);
    }

    /**
     * Checks if query is non-legal (should be redirected).
     */
    private boolean isNonLegalQuestion(String lowerQuery) {
        // Check for obvious non-legal questions
        if (lowerQuery.matches(".*\\d+\\s*[+\\-*/]\\s*\\d+.*")) {
            return true; // Math question
        }
        
        return NON_LEGAL_INDICATORS.stream()
            .anyMatch(lowerQuery::contains);
    }

    /**
     * Checks if query is a short conversational response (likely follow-up in CPA).
     */
    private boolean isShortConversationalResponse(String lowerQuery) {
        // Very short responses in conversation (CPA mode) likely don't need KB
        if (lowerQuery.length() <= 50) {
            // Common short responses in CPA conversations
            return lowerQuery.matches(".*(yes|no|i have|i don't have|yesterday|last week|last month|not sure|i think|maybe|probably).*");
        }
        return false;
    }

    /**
     * Gets a classification reason for logging purposes.
     */
    public String getClassificationReason(String query, String mode, boolean isReport) {
        if (query == null || query.trim().isEmpty()) {
            return "Empty query";
        }

        String lowerQuery = query.toLowerCase().trim();

        if ("B".equals(mode) && isReport) {
            return "CPA report generation - KB required";
        }

        if (requiresKnowledgeBase(lowerQuery)) {
            return "Requires specific legal provisions - KB required";
        }

        if (isGreeting(lowerQuery)) return "Greeting";
        if (isFarewell(lowerQuery)) return "Farewell/Thank you";
        if (isIdentityQuestion(lowerQuery)) return "Identity/Capability question";
        if (isUsageQuestion(lowerQuery)) return "Usage instruction question";
        if (isAcknowledgment(lowerQuery)) return "Simple acknowledgment";
        if (isMetaQuestion(lowerQuery)) return "Meta/Platform question";
        if (isLegalSystemOverview(lowerQuery)) return "Legal system overview (general)";
        if (isNonLegalQuestion(lowerQuery)) return "Non-legal question (redirect)";
        if (isShortConversationalResponse(lowerQuery)) return "Short conversational response";

        return "Standard query - KB recommended";
    }
}

