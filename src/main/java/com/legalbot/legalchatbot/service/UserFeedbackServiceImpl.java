package com.legalbot.legalchatbot.service;

import com.legalbot.legalchatbot.entity.UserFeedback;
import com.legalbot.legalchatbot.repository.UserFeedbackRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserFeedbackServiceImpl implements UserFeedbackService {
    @Autowired
    private UserFeedbackRepository repository;

    @Override
    public UserFeedback saveFeedback(UserFeedback feedback) {
        return repository.save(feedback);
    }
}
