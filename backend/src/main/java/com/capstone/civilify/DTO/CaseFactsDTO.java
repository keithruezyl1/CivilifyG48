package com.capstone.civilify.DTO;

import java.util.List;
import java.util.Map;

public class CaseFactsDTO {
    private List<Map<String, Object>> parties; // name, role
    private Map<String, Object> incident; // type, date (ISO), location {city, province, country}, description
    private List<String> harms;
    private List<String> documents;
    private List<String> witnesses;
    private String jurisdiction;
    private List<String> legalIssues;
    private String goal;
    private Double confidence; // 0..1
    private String provenanceMessageId;

    public List<Map<String, Object>> getParties() { return parties; }
    public void setParties(List<Map<String, Object>> parties) { this.parties = parties; }

    public Map<String, Object> getIncident() { return incident; }
    public void setIncident(Map<String, Object> incident) { this.incident = incident; }

    public List<String> getHarms() { return harms; }
    public void setHarms(List<String> harms) { this.harms = harms; }

    public List<String> getDocuments() { return documents; }
    public void setDocuments(List<String> documents) { this.documents = documents; }

    public List<String> getWitnesses() { return witnesses; }
    public void setWitnesses(List<String> witnesses) { this.witnesses = witnesses; }

    public String getJurisdiction() { return jurisdiction; }
    public void setJurisdiction(String jurisdiction) { this.jurisdiction = jurisdiction; }

    public List<String> getLegalIssues() { return legalIssues; }
    public void setLegalIssues(List<String> legalIssues) { this.legalIssues = legalIssues; }

    public String getGoal() { return goal; }
    public void setGoal(String goal) { this.goal = goal; }

    public Double getConfidence() { return confidence; }
    public void setConfidence(Double confidence) { this.confidence = confidence; }

    public String getProvenanceMessageId() { return provenanceMessageId; }
    public void setProvenanceMessageId(String provenanceMessageId) { this.provenanceMessageId = provenanceMessageId; }
}


