import logger from '../config/logger';

interface SecurityAlert {
  type: 'BRUTE_FORCE' | 'SUSPICIOUS_ACTIVITY' | 'DATA_BREACH' | 'UNAUTHORIZED_ACCESS' | 'RATE_LIMIT_EXCEEDED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source: string;
  description: string;
  metadata: any;
  timestamp: Date;
  ip?: string;
  userId?: string;
  userAgent?: string;
}

export class SecurityMonitoringService {
  private static alertCounts: Map<string, number> = new Map();
  private static readonly ALERT_THRESHOLDS = {
    BRUTE_FORCE: 5,
    SUSPICIOUS_ACTIVITY: 3,
    RATE_LIMIT_EXCEEDED: 10
  };

  /**
   * Send security alert to monitoring systems
   */
  static async sendAlert(alert: SecurityAlert): Promise<void> {
    try {
      // Log the alert
      logger.error('Security Alert', {
        type: alert.type,
        severity: alert.severity,
        source: alert.source,
        description: alert.description,
        metadata: alert.metadata,
        timestamp: alert.timestamp,
        ip: alert.ip,
        userId: alert.userId,
        userAgent: alert.userAgent
      });

      // In production, you would integrate with external monitoring services
      await this.sendToExternalServices(alert);
      
      // Check if we need to trigger additional actions
      await this.handleSecurityAlert(alert);
      
    } catch (error) {
      logger.error('Failed to send security alert:', error);
    }
  }

  /**
   * Send to external monitoring services (Sentry, Datadog, etc.)
   */
  private static async sendToExternalServices(alert: SecurityAlert): Promise<void> {
    // Sentry integration (if configured)
    if (process.env.SENTRY_DSN) {
      // This would typically use @sentry/node
      console.log('Would send to Sentry:', alert);
    }

    // Datadog integration (if configured)
    if (process.env.DATADOG_API_KEY) {
      // This would typically use datadog-metrics
      console.log('Would send to Datadog:', alert);
    }

    // Slack webhook (if configured)
    if (process.env.SLACK_WEBHOOK_URL && alert.severity === 'CRITICAL') {
      await this.sendSlackAlert(alert);
    }

    // Email notifications (if configured)
    if (process.env.ALERT_EMAIL && (alert.severity === 'HIGH' || alert.severity === 'CRITICAL')) {
      await this.sendEmailAlert(alert);
    }
  }

  /**
   * Handle security alerts and trigger appropriate responses
   */
  private static async handleSecurityAlert(alert: SecurityAlert): Promise<void> {
    const alertKey = `${alert.type}_${alert.ip || alert.userId || 'unknown'}`;
    const currentCount = this.alertCounts.get(alertKey) || 0;
    this.alertCounts.set(alertKey, currentCount + 1);

    // Auto-block IPs with excessive alerts
    if (alert.ip && currentCount >= (this.ALERT_THRESHOLDS[alert.type] || 5)) {
      await this.blockIP(alert.ip, alert.type);
    }

    // Disable user accounts with suspicious activity
    if (alert.userId && alert.type === 'SUSPICIOUS_ACTIVITY' && currentCount >= 3) {
      await this.flagUserAccount(alert.userId, alert.type);
    }

    // Clear old counts every hour
    setTimeout(() => {
      this.alertCounts.delete(alertKey);
    }, 3600000); // 1 hour
  }

  /**
   * Block IP address (implement based on your infrastructure)
   */
  private static async blockIP(ip: string, reason: string): Promise<void> {
    logger.warn(`Auto-blocking IP ${ip} due to ${reason}`);
    
    // In production, you would:
    // 1. Add IP to firewall rules
    // 2. Add to rate limiting blacklist
    // 3. Update load balancer rules
    // 4. Notify security team
    
    // For demonstration, we'll just log it
    console.log(`IP ${ip} would be blocked for ${reason}`);
  }

  /**
   * Flag user account for review
   */
  private static async flagUserAccount(userId: string, reason: string): Promise<void> {
    logger.warn(`Flagging user account ${userId} due to ${reason}`);
    
    // In production, you would:
    // 1. Set account status to 'under_review'
    // 2. Require additional verification
    // 3. Notify security team
    // 4. Log all future activities
    
    console.log(`User ${userId} would be flagged for ${reason}`);
  }

  /**
   * Send Slack alert for critical issues
   */
  private static async sendSlackAlert(alert: SecurityAlert): Promise<void> {
    try {
      const webhookUrl = process.env.SLACK_WEBHOOK_URL;
      if (!webhookUrl) return;

      const payload = {
        text: `🚨 Security Alert: ${alert.type}`,
        attachments: [{
          color: alert.severity === 'CRITICAL' ? 'danger' : 'warning',
          fields: [
            { title: 'Severity', value: alert.severity, short: true },
            { title: 'Source', value: alert.source, short: true },
            { title: 'Description', value: alert.description, short: false },
            { title: 'IP', value: alert.ip || 'Unknown', short: true },
            { title: 'Timestamp', value: alert.timestamp.toISOString(), short: true }
          ]
        }]
      };

      // In production, you would use a proper HTTP client
      console.log('Would send to Slack:', payload);
    } catch (error) {
      logger.error('Failed to send Slack alert:', error);
    }
  }

  /**
   * Send email alert for high/critical issues
   */
  private static async sendEmailAlert(alert: SecurityAlert): Promise<void> {
    try {
      const alertEmail = process.env.ALERT_EMAIL;
      if (!alertEmail) return;

      const subject = `Security Alert: ${alert.type} - ${alert.severity}`;
      const body = `
Security Alert Details:

Type: ${alert.type}
Severity: ${alert.severity}
Source: ${alert.source}
Description: ${alert.description}
IP Address: ${alert.ip || 'Unknown'}
User ID: ${alert.userId || 'Unknown'}
Timestamp: ${alert.timestamp.toISOString()}

Metadata:
${JSON.stringify(alert.metadata, null, 2)}
      `;

      // In production, you would use a proper email service
      console.log('Would send email alert:', { to: alertEmail, subject, body });
    } catch (error) {
      logger.error('Failed to send email alert:', error);
    }
  }

  /**
   * Report brute force attack
   */
  static reportBruteForce(ip: string, endpoint: string, attempts: number): void {
    this.sendAlert({
      type: 'BRUTE_FORCE',
      severity: attempts > 10 ? 'HIGH' : 'MEDIUM',
      source: 'AUTH_SYSTEM',
      description: `Brute force attack detected on ${endpoint}`,
      metadata: { endpoint, attempts },
      timestamp: new Date(),
      ip
    });
  }

  /**
   * Report suspicious activity
   */
  static reportSuspiciousActivity(
    ip: string, 
    userId: string | undefined, 
    activity: string, 
    metadata: any
  ): void {
    this.sendAlert({
      type: 'SUSPICIOUS_ACTIVITY',
      severity: 'MEDIUM',
      source: 'BEHAVIOR_ANALYSIS',
      description: activity,
      metadata,
      timestamp: new Date(),
      ip,
      userId
    });
  }

  /**
   * Report unauthorized access attempt
   */
  static reportUnauthorizedAccess(
    ip: string, 
    userId: string | undefined, 
    resource: string,
    userAgent?: string
  ): void {
    this.sendAlert({
      type: 'UNAUTHORIZED_ACCESS',
      severity: 'HIGH',
      source: 'ACCESS_CONTROL',
      description: `Unauthorized access attempt to ${resource}`,
      metadata: { resource },
      timestamp: new Date(),
      ip,
      userId,
      userAgent
    });
  }

  /**
   * Get security metrics for monitoring dashboards
   */
  static getSecurityMetrics(): any {
    return {
      activeAlerts: this.alertCounts.size,
      alertTypes: Array.from(this.alertCounts.keys()).reduce((acc, key) => {
        const type = key.split('_')[0];
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as any),
      timestamp: new Date()
    };
  }
}

export default SecurityMonitoringService;