package com.legalbot.legalchatbot.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.sql.Timestamp;

@Entity
@Table(name = "user_feedback")

public class UserFeedback {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "qa_id", nullable = false)
    private KnowledgeBaseEntry knowledgeBaseEntry;

    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false)
    private String feedback;  // "helpful" or "not helpful"

    @Column(columnDefinition = "TEXT")
    private String comment;

    @CreationTimestamp
    @Column(name = "timestamp", updatable = false)
    private Timestamp timestamp;
    
}
