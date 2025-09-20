import axios from 'axios';
import { getAuthToken } from '../utils/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

/**
 * Service for interacting with the knowledge base system.
 * Provides methods for RAG functionality and knowledge base management.
 */
class KnowledgeBaseService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/api/knowledge-base`,
      timeout: 30000,
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          console.error('Unauthorized access to knowledge base');
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Chat with the knowledge base using RAG (Retrieval-Augmented Generation).
   * @param {string} question - The user's question
   * @param {string} mode - Chat mode (GLI or CPA)
   * @returns {Promise<Object>} Response with answer and sources
   */
  async chatWithKnowledgeBase(question, mode = 'GLI') {
    try {
      const response = await this.api.post('/chat', {
        question,
        mode
      });
      return response.data;
    } catch (error) {
      console.error('Error chatting with knowledge base:', error);
      throw error;
    }
  }

  /**
   * Search the knowledge base for relevant entries.
   * @param {string} query - Search query
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Object>} Search results
   */
  async searchKnowledgeBase(query, limit = 10) {
    try {
      const response = await this.api.post('/search', {
        query,
        limit
      });
      return response.data;
    } catch (error) {
      console.error('Error searching knowledge base:', error);
      throw error;
    }
  }

  /**
   * Get a specific knowledge base entry by ID.
   * @param {string} entryId - Entry ID
   * @returns {Promise<Object>} Entry details
   */
  async getKnowledgeBaseEntry(entryId) {
    try {
      const response = await this.api.get(`/entry/${entryId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting knowledge base entry:', error);
      throw error;
    }
  }

  /**
   * Check the health status of the knowledge base service.
   * @returns {Promise<Object>} Health status
   */
  async checkHealth() {
    try {
      const response = await this.api.get('/health');
      return response.data;
    } catch (error) {
      console.error('Error checking knowledge base health:', error);
      throw error;
    }
  }

  /**
   * Get knowledge base statistics (admin only).
   * @returns {Promise<Object>} Statistics data
   */
  async getStatistics() {
    try {
      const response = await this.api.get('/statistics');
      return response.data;
    } catch (error) {
      console.error('Error getting knowledge base statistics:', error);
      throw error;
    }
  }

  /**
   * Test the RAG system with a sample query.
   * @param {string} testQuery - Test query
   * @returns {Promise<Object>} Test results
   */
  async testRAGSystem(testQuery = 'What is Rule 114 Section 20?') {
    try {
      const response = await this.api.post('/test', {
        query: testQuery
      });
      return response.data;
    } catch (error) {
      console.error('Error testing RAG system:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const knowledgeBaseService = new KnowledgeBaseService();
export default knowledgeBaseService;
