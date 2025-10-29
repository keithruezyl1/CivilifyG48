package com.capstone.civilify;

import com.capstone.civilify.service.OpenAIService;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.*;

public class OpenAIServiceTests {

    @Test
    public void testComputeCompletenessScore_EmptyFacts() {
        OpenAIService svc = new OpenAIService();
        double score = svc.computeCompletenessScore(new HashMap<>());
        Assertions.assertEquals(0.0, score);
    }

    @Test
    public void testComputeCompletenessScore_Partial() {
        OpenAIService svc = new OpenAIService();
        Map<String, Object> facts = new HashMap<>();
        facts.put("parties", List.of(Map.of("name", "User", "role", "complainant")));
        facts.put("incident", Map.of("type", "theft"));
        facts.put("goal", "file a case");
        double score = svc.computeCompletenessScore(facts);
        // 3 out of 7 slots -> ~42.857 -> 43 after Math.round
        Assertions.assertEquals(43.0, score);
    }

    @Test
    public void testComputeMissingSlots() {
        OpenAIService svc = new OpenAIService();
        Map<String, Object> facts = new HashMap<>();
        facts.put("parties", List.of(Map.of("name", "User", "role", "complainant")));
        List<String> missing = svc.computeMissingSlots(facts);
        Assertions.assertTrue(missing.contains("Incident details"));
        Assertions.assertTrue(missing.contains("User's goal"));
    }
}


