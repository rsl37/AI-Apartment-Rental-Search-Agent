import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import { config } from '../config/env';
import { generateToken } from './authMiddleware';
import { AuditLogger } from './auditMiddleware';

// OAuth 2.0 provider configuration (simplified)
const OAUTH_CONFIG = {
  authorizationURL: process.env.OAUTH_AUTHORIZATION_URL || 'https://example.com/oauth/authorize',
  tokenURL: process.env.OAUTH_TOKEN_URL || 'https://example.com/oauth/token',
  clientID: process.env.OAUTH_CLIENT_ID || '',
  clientSecret: process.env.OAUTH_CLIENT_SECRET || '',
  callbackURL: process.env.OAUTH_CALLBACK_URL || '/api/auth/oauth/callback'
};

// Configure OAuth 2.0 strategy
passport.use('oauth2', new OAuth2Strategy({
  authorizationURL: OAUTH_CONFIG.authorizationURL,
  tokenURL: OAUTH_CONFIG.tokenURL,
  clientID: OAUTH_CONFIG.clientID,
  clientSecret: OAUTH_CONFIG.clientSecret,
  callbackURL: OAUTH_CONFIG.callbackURL,
}, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
  try {
    // Here you would typically:
    // 1. Use the access token to fetch user info from the OAuth provider
    // 2. Check if user exists in your database
    // 3. Create or update user record
    // 4. Return user object
    
    // For demonstration, we'll create a mock user
    const user = {
      id: profile.id || 'oauth_user_' + Date.now(),
      email: profile.email || 'oauth@example.com',
      name: profile.name || 'OAuth User',
      provider: 'oauth2',
      oauthAccessToken: accessToken,
      oauthRefreshToken: refreshToken
    };
    
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    // In a real application, you would fetch the user from the database
    // For demonstration purposes, we'll return a mock user
    const user = { id, email: 'oauth@example.com', name: 'OAuth User' };
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

/**
 * Initiate OAuth 2.0 authentication
 */
export const initiateOAuth = (req: Request, res: Response, next: NextFunction) => {
  AuditLogger.logSecurityEvent({
    action: 'OAUTH_INITIATE',
    ip: req.ip || 'unknown',
    userAgent: req.get('User-Agent') || 'unknown',
    timestamp: new Date(),
    success: true
  });
  
  passport.authenticate('oauth2', {
    scope: ['read', 'profile', 'email']
  })(req, res, next);
};

/**
 * Handle OAuth 2.0 callback
 */
export const handleOAuthCallback = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('oauth2', { 
    failureRedirect: '/login?error=oauth_failed' 
  }, (err: any, user: any) => {
    if (err) {
      AuditLogger.logAuthAttempt(req, false, { 
        provider: 'oauth2', 
        error: err.message 
      });
      return res.redirect('/login?error=oauth_error');
    }
    
    if (!user) {
      AuditLogger.logAuthAttempt(req, false, { 
        provider: 'oauth2', 
        reason: 'No user returned' 
      });
      return res.redirect('/login?error=oauth_denied');
    }
    
    try {
      // Generate JWT token for the authenticated user
      const token = generateToken({
        id: user.id,
        email: user.email,
        name: user.name,
        provider: user.provider
      });
      
      AuditLogger.logAuthAttempt(req, true, { 
        provider: 'oauth2', 
        userId: user.id 
      });
      
      // Redirect to frontend with token
      res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}`);
    } catch (error) {
      AuditLogger.logAuthAttempt(req, false, { 
        provider: 'oauth2', 
        error: 'Token generation failed' 
      });
      res.redirect('/login?error=token_error');
    }
  })(req, res, next);
};

/**
 * OpenID Connect configuration endpoint
 */
export const getOpenIDConfiguration = (req: Request, res: Response) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  
  res.json({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/api/auth/oauth/authorize`,
    token_endpoint: `${baseUrl}/api/auth/oauth/token`,
    userinfo_endpoint: `${baseUrl}/api/auth/oauth/userinfo`,
    jwks_uri: `${baseUrl}/api/auth/oauth/jwks`,
    scopes_supported: ['openid', 'profile', 'email'],
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    token_endpoint_auth_methods_supported: ['client_secret_basic']
  });
};

/**
 * Check if OAuth 2.0 is configured
 */
export const isOAuthConfigured = (): boolean => {
  return !!(OAUTH_CONFIG.clientID && 
           OAUTH_CONFIG.clientSecret && 
           OAUTH_CONFIG.authorizationURL && 
           OAUTH_CONFIG.tokenURL);
};

export default {
  passport,
  initiateOAuth,
  handleOAuthCallback,
  getOpenIDConfiguration,
  isOAuthConfigured
};