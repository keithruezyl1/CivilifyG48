package com.capstone.civilify.DTO;

import java.util.List;

/**
 * Data Transfer Object for knowledge base entries.
 * Represents a single entry from the knowledge base system.
 */
public class KnowledgeBaseEntry {
    
    private String entryId;
    private String type;
    private String title;
    private String canonicalCitation;
    private String summary;
    private String text;
    private List<String> tags;
    private Double similarity;
    private String ruleNo;
    private String sectionNo;
    private String rightsScope;
    private List<String> sourceUrls;
    
    // Constructors
    public KnowledgeBaseEntry() {}
    
    public KnowledgeBaseEntry(String entryId, String type, String title) {
        this.entryId = entryId;
        this.type = type;
        this.title = title;
    }
    
    // Getters and Setters
    public String getEntryId() {
        return entryId;
    }
    
    public void setEntryId(String entryId) {
        this.entryId = entryId;
    }
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getCanonicalCitation() {
        return canonicalCitation;
    }
    
    public void setCanonicalCitation(String canonicalCitation) {
        this.canonicalCitation = canonicalCitation;
    }
    
    public String getSummary() {
        return summary;
    }
    
    public void setSummary(String summary) {
        this.summary = summary;
    }
    
    public String getText() {
        return text;
    }
    
    public void setText(String text) {
        this.text = text;
    }
    
    public List<String> getTags() {
        return tags;
    }
    
    public void setTags(List<String> tags) {
        this.tags = tags;
    }
    
    public Double getSimilarity() {
        return similarity;
    }
    
    public void setSimilarity(Double similarity) {
        this.similarity = similarity;
    }
    
    public String getRuleNo() {
        return ruleNo;
    }
    
    public void setRuleNo(String ruleNo) {
        this.ruleNo = ruleNo;
    }
    
    public String getSectionNo() {
        return sectionNo;
    }
    
    public void setSectionNo(String sectionNo) {
        this.sectionNo = sectionNo;
    }
    
    public String getRightsScope() {
        return rightsScope;
    }
    
    public void setRightsScope(String rightsScope) {
        this.rightsScope = rightsScope;
    }
    
    public List<String> getSourceUrls() {
        return sourceUrls;
    }
    
    public void setSourceUrls(List<String> sourceUrls) {
        this.sourceUrls = sourceUrls;
    }
    
    @Override
    public String toString() {
        return "KnowledgeBaseEntry{" +
                "entryId='" + entryId + '\'' +
                ", type='" + type + '\'' +
                ", title='" + title + '\'' +
                ", canonicalCitation='" + canonicalCitation + '\'' +
                ", similarity=" + similarity +
                '}';
    }
}

