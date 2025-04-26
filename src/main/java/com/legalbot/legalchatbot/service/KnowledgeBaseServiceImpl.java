package com.legalbot.legalchatbot.service;

import com.legalbot.legalchatbot.entity.KnowledgeBaseEntry;
import com.legalbot.legalchatbot.repository.KnowledgeBaseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class KnowledgeBaseServiceImpl implements KnowledgeBaseService {
    @Autowired
    private KnowledgeBaseRepository repository;

    @Override
    public Optional<KnowledgeBaseEntry> findSimilarQuestion(String question) {
        List<KnowledgeBaseEntry> results = repository.searchByKeyword(question);
        return results.stream().findFirst();
    }

    @Override
    public KnowledgeBaseEntry saveKnowledgeBaseEntry(KnowledgeBaseEntry entry) {
        return repository.save(entry);
    }

    @Override
    public void incrementHelpfulCount(Long id) {
        KnowledgeBaseEntry entry = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Entry not found"));
        entry.setHelpfulCount(entry.getHelpfulCount() + 1);
        repository.save(entry);
    }

    @Override
    public List<KnowledgeBaseEntry> searchByKeyword(String keyword) {
        return repository.searchByKeyword(keyword);
    }
}
