import encryptionService from './encryption';

class SecurityApiService {
  constructor() {
    this.baseUrl = 'http://localhost:5000/api/security';
    this.authToken = null;
    this.refreshToken = null;
  }

  // Authentication methods
  async login(username, password) {
    try {
      const hashedPassword = encryptionService.hashData(password).hash;
      
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password: hashedPassword,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const data = await response.json();
      this.authToken = data.token;
      this.refreshToken = data.refreshToken;
      
      // Store tokens securely
      encryptionService.setSecureSession('authToken', this.authToken);
      encryptionService.setSecureSession('refreshToken', this.refreshToken);
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      if (this.authToken) {
        await fetch(`${this.baseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.authToken = null;
      this.refreshToken = null;
      encryptionService.clearSecureSession('authToken');
      encryptionService.clearSecureSession('refreshToken');
    }
  }

  async refreshAuthToken() {
    try {
      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this.refreshToken
        })
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      this.authToken = data.token;
      encryptionService.setSecureSession('authToken', this.authToken);
      
      return data;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  // Security monitoring methods
  async getSecurityMetrics() {
    try {
      const response = await this.authenticatedRequest('/metrics');
      return response;
    } catch (error) {
      console.error('Failed to get security metrics:', error);
      throw error;
    }
  }

  async getSecurityEvents(limit = 50) {
    try {
      const response = await this.authenticatedRequest(`/events?limit=${limit}`);
      return response;
    } catch (error) {
      console.error('Failed to get security events:', error);
      throw error;
    }
  }

  async getThreatAlerts() {
    try {
      const response = await this.authenticatedRequest('/threats');
      return response;
    } catch (error) {
      console.error('Failed to get threat alerts:', error);
      throw error;
    }
  }

  // Encryption management methods
  async encryptData(data, algorithm = 'AES-256-GCM') {
    try {
      const encryptedData = await encryptionService.encryptData(data);
      
      const response = await this.authenticatedRequest('/encrypt', {
        method: 'POST',
        body: JSON.stringify({
          data: encryptedData,
          algorithm,
          timestamp: new Date().toISOString()
        })
      });
      
      return response;
    } catch (error) {
      console.error('Encryption error:', error);
      throw error;
    }
  }

  async decryptData(encryptedData) {
    try {
      const response = await this.authenticatedRequest('/decrypt', {
        method: 'POST',
        body: JSON.stringify({
          encryptedData,
          timestamp: new Date().toISOString()
        })
      });
      
      return response;
    } catch (error) {
      console.error('Decryption error:', error);
      throw error;
    }
  }

  // Data protection methods
  async maskSensitiveData(data, fields) {
    try {
      const response = await this.authenticatedRequest('/mask-data', {
        method: 'POST',
        body: JSON.stringify({
          data,
          fields,
          timestamp: new Date().toISOString()
        })
      });
      
      return response;
    } catch (error) {
      console.error('Data masking error:', error);
      throw error;
    }
  }

  async validateDataIntegrity(data, checksum) {
    try {
      const response = await this.authenticatedRequest('/validate-integrity', {
        method: 'POST',
        body: JSON.stringify({
          data,
          checksum,
          timestamp: new Date().toISOString()
        })
      });
      
      return response;
    } catch (error) {
      console.error('Data integrity validation error:', error);
      throw error;
    }
  }

  // Compliance methods
  async getComplianceStatus() {
    try {
      const response = await this.authenticatedRequest('/compliance');
      return response;
    } catch (error) {
      console.error('Failed to get compliance status:', error);
      throw error;
    }
  }

  async runComplianceCheck(standard) {
    try {
      const response = await this.authenticatedRequest('/compliance/check', {
        method: 'POST',
        body: JSON.stringify({
          standard,
          timestamp: new Date().toISOString()
        })
      });
      
      return response;
    } catch (error) {
      console.error('Compliance check error:', error);
      throw error;
    }
  }

  // Access control methods
  async getUserPermissions(userId) {
    try {
      const response = await this.authenticatedRequest(`/users/${userId}/permissions`);
      return response;
    } catch (error) {
      console.error('Failed to get user permissions:', error);
      throw error;
    }
  }

  async updateUserPermissions(userId, permissions) {
    try {
      const response = await this.authenticatedRequest(`/users/${userId}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({
          permissions,
          timestamp: new Date().toISOString()
        })
      });
      
      return response;
    } catch (error) {
      console.error('Failed to update user permissions:', error);
      throw error;
    }
  }

  // Audit logging methods
  async logSecurityEvent(event) {
    try {
      const response = await this.authenticatedRequest('/audit/log', {
        method: 'POST',
        body: JSON.stringify({
          ...event,
          timestamp: new Date().toISOString()
        })
      });
      
      return response;
    } catch (error) {
      console.error('Failed to log security event:', error);
      throw error;
    }
  }

  async getAuditLogs(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await this.authenticatedRequest(`/audit/logs?${queryParams}`);
      return response;
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      throw error;
    }
  }

  // System security methods
  async getSystemSecurityStatus() {
    try {
      const response = await this.authenticatedRequest('/system/status');
      return response;
    } catch (error) {
      console.error('Failed to get system security status:', error);
      throw error;
    }
  }

  async runSecurityScan(scanType = 'full') {
    try {
      const response = await this.authenticatedRequest('/system/scan', {
        method: 'POST',
        body: JSON.stringify({
          scanType,
          timestamp: new Date().toISOString()
        })
      });
      
      return response;
    } catch (error) {
      console.error('Security scan error:', error);
      throw error;
    }
  }

  async updateSecuritySettings(settings) {
    try {
      const response = await this.authenticatedRequest('/system/settings', {
        method: 'PUT',
        body: JSON.stringify({
          settings,
          timestamp: new Date().toISOString()
        })
      });
      
      return response;
    } catch (error) {
      console.error('Failed to update security settings:', error);
      throw error;
    }
  }

  // Helper method for authenticated requests
  async authenticatedRequest(endpoint, options = {}) {
    try {
      // Get stored token if not available
      if (!this.authToken) {
        this.authToken = encryptionService.getSecureSession('authToken');
        this.refreshToken = encryptionService.getSecureSession('refreshToken');
      }

      const url = `${this.baseUrl}${endpoint}`;
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` }),
          ...options.headers
        },
        ...options
      };

      let response = await fetch(url, config);

      // Handle token expiration
      if (response.status === 401 && this.refreshToken) {
        try {
          await this.refreshAuthToken();
          config.headers['Authorization'] = `Bearer ${this.authToken}`;
          response = await fetch(url, config);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          await this.logout();
          throw new Error('Authentication expired');
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Authenticated request error:', error);
      throw error;
    }
  }

  // Utility methods
  isAuthenticated() {
    return !!this.authToken || !!encryptionService.getSecureSession('authToken');
  }

  getAuthToken() {
    return this.authToken || encryptionService.getSecureSession('authToken');
  }

  // Initialize security service
  async initialize() {
    try {
      // Restore tokens from secure storage
      this.authToken = encryptionService.getSecureSession('authToken');
      this.refreshToken = encryptionService.getSecureSession('refreshToken');
      
      // Validate token if available
      if (this.authToken) {
        try {
          await this.authenticatedRequest('/auth/validate');
        } catch (error) {
          // Token invalid, clear it
          await this.logout();
        }
      }
    } catch (error) {
      console.error('Security service initialization error:', error);
    }
  }
}

// Create singleton instance
const securityApi = new SecurityApiService();

export default securityApi; 