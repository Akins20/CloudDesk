/**
 * Admin Auth Controller
 * Login, logout, and authentication handling
 */

import { Request, Response } from 'express';
import { User } from '../../models/User';
import { logger } from '../../utils/logger';
import { renderPage } from '../templates';
import {
  createSession,
  deleteSession,
  setSessionCookie,
  clearSessionCookie,
} from '../middleware';

/**
 * Render login page
 */
export const loginPage = (req: Request, res: Response): void => {
  const error = req.query.error as string;

  const errorMessages: Record<string, string> = {
    invalid: 'Invalid email or password',
    admin: 'Admin access required',
    server: 'An error occurred. Please try again.',
  };

  const content = `
    <div class="flex items-center justify-center min-h-screen">
      <div class="glass-card rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <!-- Logo/Header -->
        <div class="text-center mb-8">
          <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/10 flex items-center justify-center">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-white">Admin Portal</h1>
          <p class="text-muted-foreground text-sm mt-2">Sign in to access the dashboard</p>
        </div>

        ${error ? `
        <div class="mb-6 p-4 rounded-lg bg-status-error/10 border border-status-error/20">
          <p class="text-status-error text-sm text-center flex items-center justify-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            ${errorMessages[error] || 'An error occurred'}
          </p>
        </div>
        ` : ''}

        <form action="/admin/login" method="POST" class="space-y-5">
          <div>
            <label for="email" class="block text-sm font-medium text-muted-foreground mb-2">Email Address</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg class="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path>
                </svg>
              </div>
              <input type="email" id="email" name="email" required autocomplete="email"
                class="w-full pl-12 pr-4 py-3 bg-muted border border-border rounded-xl text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all"
                placeholder="admin@example.com">
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-muted-foreground mb-2">Password</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg class="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
              <input type="password" id="password" name="password" required autocomplete="current-password"
                class="w-full pl-12 pr-12 py-3 bg-muted border border-border rounded-xl text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all"
                placeholder="Enter your password">
              <button type="button" id="togglePassword" class="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-white transition-colors">
                <svg id="eyeIcon" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
                <svg id="eyeOffIcon" class="w-5 h-5 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                </svg>
              </button>
            </div>
          </div>

          <button type="submit"
            class="w-full py-3.5 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 active:scale-[0.98] transition-all shadow-lg shadow-white/10">
            Sign In
          </button>
        </form>

        <div class="mt-6 pt-6 border-t border-border">
          <p class="text-center text-muted-foreground text-xs flex items-center justify-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
            Secure admin access only
          </p>
        </div>
      </div>
    </div>
  `;

  const scripts = `
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        var toggleBtn = document.getElementById('togglePassword');
        var passwordInput = document.getElementById('password');
        var eyeIcon = document.getElementById('eyeIcon');
        var eyeOffIcon = document.getElementById('eyeOffIcon');

        if (toggleBtn && passwordInput && eyeIcon && eyeOffIcon) {
          toggleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (passwordInput.type === 'password') {
              passwordInput.type = 'text';
              eyeIcon.classList.add('hidden');
              eyeOffIcon.classList.remove('hidden');
            } else {
              passwordInput.type = 'password';
              eyeIcon.classList.remove('hidden');
              eyeOffIcon.classList.add('hidden');
            }
          });
        }
      });
    </script>
  `;

  res.send(renderPage('Login', content, { scripts }));
};

/**
 * Handle login form submission
 */
export const handleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.redirect('/admin/login?error=invalid');
      return;
    }

    const user = await User.findByEmail(email);
    if (!user) {
      logger.warn('Admin login attempt - user not found', { email });
      res.redirect('/admin/login?error=invalid');
      return;
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      logger.warn('Admin login attempt - invalid password', { email });
      res.redirect('/admin/login?error=invalid');
      return;
    }

    if (user.role !== 'admin') {
      logger.warn('Admin login attempt - not an admin', { email, role: user.role });
      res.redirect('/admin/login?error=admin');
      return;
    }

    // Create session and set cookie
    const token = createSession(user._id.toString(), user.email);
    setSessionCookie(res, token);

    logger.info('Admin login successful', { email: user.email });
    res.redirect('/admin');
  } catch (error) {
    logger.error('Admin login error:', error);
    res.redirect('/admin/login?error=server');
  }
};

/**
 * Handle logout
 */
export const logout = (req: Request, res: Response): void => {
  const token = req.cookies?.admin_session;

  if (token) {
    deleteSession(token);
  }

  clearSessionCookie(res);
  res.redirect('/admin/login');
};

export default {
  loginPage,
  handleLogin,
  logout,
};
