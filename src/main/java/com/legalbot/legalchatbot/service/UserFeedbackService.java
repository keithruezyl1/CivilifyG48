package com.legalbot.legalchatbot.service;

import com.legalbot.legalchatbot.entity.UserFeedback;

public interface UserFeedbackService {
    UserFeedback saveFeedback(UserFeedback feedback);
}
