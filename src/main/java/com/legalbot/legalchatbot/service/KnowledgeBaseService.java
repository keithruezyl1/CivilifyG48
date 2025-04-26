package com.legalbot.legalchatbot.service;

import com.legalbot.legalchatbot.entity.KnowledgeBaseEntry;
import java.util.List;
import java.util.Optional;

public interface KnowledgeBaseService {
    Optional<KnowledgeBaseEntry> findSimilarQuestion(String question);
    KnowledgeBaseEntry saveKnowledgeBaseEntry(KnowledgeBaseEntry entry);
    void incrementHelpfulCount(Long id);
    List<KnowledgeBaseEntry> searchByKeyword(String keyword);
}
