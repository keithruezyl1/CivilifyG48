package com.capstone.civilify.config;

import com.capstone.civilify.service.KnowledgeBaseService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduled task to keep the knowledge base API alive.
 * This prevents the KB service from going to sleep on Render deployments.
 * Runs every 4 minutes to ensure the service stays awake.
 */
@Component
public class KnowledgeBaseKeepAliveTask {
    
    private static final Logger logger = LoggerFactory.getLogger(KnowledgeBaseKeepAliveTask.class);
    
    @Autowired
    private KnowledgeBaseService knowledgeBaseService;
    
    @Value("${knowledge.base.keepalive.enabled:true}")
    private boolean keepAliveEnabled;
    
    /**
     * Periodic keep-alive task that wakes up the KB service.
     * Runs every 4 minutes (240,000 milliseconds).
     * This interval is chosen to be less than typical Render sleep timeout (usually 5-15 minutes).
     * Can be disabled by setting knowledge.base.keepalive.enabled=false
     */
    @Scheduled(fixedRate = 240_000) // 4 minutes
    public void keepKnowledgeBaseAlive() {
        if (!keepAliveEnabled) {
            return; // Keep-alive is disabled
        }
        
        try {
            logger.debug("Running scheduled KB keep-alive task");
            boolean success = knowledgeBaseService.wakeUpKnowledgeBase(false);
            if (success) {
                logger.debug("KB keep-alive successful");
            } else {
                logger.debug("KB keep-alive failed (service may be sleeping)");
            }
        } catch (Exception e) {
            logger.debug("KB keep-alive task error (non-critical): {}", e.getMessage());
        }
    }
}

