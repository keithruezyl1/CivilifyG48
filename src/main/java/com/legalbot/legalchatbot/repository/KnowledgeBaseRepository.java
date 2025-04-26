package com.legalbot.legalchatbot.repository;

import com.legalbot.legalchatbot.entity.KnowledgeBaseEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface KnowledgeBaseRepository extends JpaRepository<KnowledgeBaseEntry, Long> {
    @Query("SELECT k FROM KnowledgeBaseEntry k WHERE LOWER(k.question) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<KnowledgeBaseEntry> searchByKeyword(String keyword);
    
    List<KnowledgeBaseEntry> findByCategory(String category);
}