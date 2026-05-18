import { addNewUser } from '../../controller/users/signup';

import {
  userLogin,
  userMagicLinkLogin,
  verifyUserByUuid,
  resendUserActivationLink,
} from '../../controller/users/login';

import {
  forgotPassword,
  resetPassword,
  updatePassword,
  updateUserInfo,
} from '../../controller/users/password';

import { getUserProfileSignedUrl } from '../../controller/users/getUserProfileSignedUrl';
import { updateTriggerProductTour } from '../../controller/users/updateTriggerProductTour';
import { refreshUserToken } from '../../controller/users/refreshUserToken';
import { logoutUser } from '../../controller/users/logoutUser';
// google auth login
import { signinWithGoogle } from '../../controller/users/google/signinWithGoogle';
import { handleGoogleOAuthCallback } from '../../controller/users/google/handleGoogleOAuthCallback';
// microsoft auth login
import { signinWithMicrosoft } from '../../controller/users/microsoft/signinWithMicrosoft';
import { handleMicrosoftOAuthCallback } from '../../controller/users/microsoft/handleMicrosoftOAuthCallback';


export default async function authRoutes(fastify) {

  // Signup route
  fastify.post(
    '/signup',
    {
      schema: {
        tags: ['Users'], // Group under "Product" tag
        summary: 'User signup',
        description: 'API endpoint to create a new user',
        operationId: 'userSignup',
        hide: true,
        body: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              minLength: 5,
              maxLength: 100,
            },
            name: { type: 'string', maxLength: 100 },
            password: { type: 'string', maxLength: 30 },
            token: { type: 'string' } // user invitation acceptance token
          },
        },
        response: {
          201: {
            description: 'User created',
            type: 'object',
            properties: {
              message: { type: 'string' },
              otp_validation_required: { type: 'boolean' },
              otp_token: { type: 'string' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  uuid: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string' },
                  status: { type: 'string' },
                  profile_url: { type: 'string' },
                  timezone: { type: 'string' },
                  invited_accepted: { type: 'boolean' },
                  invited_workspace_id: { type: 'number' },
                  invited_workspace_role: { type: 'string' },
                  invited_workspace_join_error: { type: 'string' },
                },
              },
              token: {
                type: 'object',
                properties: {
                  access_token: { type: 'string' },
                  access_token_expiries_at: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
          403: {
            description: 'User already exists, please login.',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    addNewUser
  );

  // Login route
  fastify.post(
    '/login',
    {
      schema: {
        tags: ['Users'], // Group under "Product" tag
        summary: 'User login',
        description: 'API endpoint to login a user',
        operationId: 'userLogin',
        hide: true,
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              minLength: 5,
              maxLength: 100,
            },
            password: { type: 'string', maxLength: 30 },
            workspace_id: { type: 'integer' }
          },
        },
        response: {
          200: {
            description: 'Login successful',
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  uuid: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string' },
                  status: { type: 'string' },
                  profile_url: { type: 'string' },
                  timezone: { type: 'string' },
                  is_client: { type: 'boolean' }
                },
              },
              token: {
                type: 'object',
                properties: {
                  access_token: { type: 'string' },
                  access_token_expiries_at: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
          404: {
            description: 'User not found',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          406: {
            description: 'User email not verified',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          401: {
            description: 'Invalid credentials',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    userLogin
  );
  // route to signin google user with redirect to authorized url
  fastify.get(
    '/auth/google/signin',
    {
      schema: {
        tags: ['Users'], // Group under "Product" tag
        summary: 'Signin with Google',
        description: 'API endpoint to signin with Google',
        operationId: 'signinWithGoogle',
        hide: true,
        querystring: {
          type: 'object',
          properties: {
            token: { type: 'string', description: 'User invitation token for joining workspace after social login/signup' }
          },
        },
        response: {
          // redirect response will not be handled by fastify, but we can document the expected response for better API documentation
          302: {
            description: 'Redirect to Google for authentication',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          400: {
            description: 'Bad request',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          500: {
            description: 'Server error',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    }, signinWithGoogle
  );

  // route to handle google oauth callback
  fastify.get(
    '/auth/google/callback',
    {
      schema: {
        tags: ['Users'], // Group under "Product" tag
        summary: 'Google OAuth callback',
        description: 'API endpoint to handle Google OAuth callback',
        operationId: 'handleGoogleOAuthCallback',
        hide: true,
        querystring: {
          type: 'object',
          required: ['code', 'state'],
          properties: {
            code: { type: 'string' },
            state: { type: 'string' },
          },
        },
        response: {
          302: {
            description: 'Redirect to frontend with user data and token',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          400: {
            description: 'Bad request',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          500: {
            description: 'Server error',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    }, handleGoogleOAuthCallback
  );

  // route to signin microsoft user with redirect to authorized url
  fastify.get(
    '/auth/microsoft/signin',
    {
      schema: {
        tags: ['Users'], // Group under "Product" tag
        summary: 'Signin with Microsoft',
        description: 'API endpoint to signin with Microsoft',
        operationId: 'signinWithMicrosoft',
        hide: true,
        querystring: {
          type: 'object',
          properties: {
            token: { type: 'string', description: 'User invitation token for joining workspace after social login/signup' }
          },
        },
        response: {
          302: {
            description: 'Redirect to Microsoft for authentication',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          400: {
            description: 'Bad request',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          500: {
            description: 'Server error',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    }, signinWithMicrosoft
  );

  // route to handle microsoft oauth callback
  fastify.get(
    '/auth/microsoft/callback',
    {
      schema: {
        tags: ['Users'], // Group under "Product" tag
        summary: 'Microsoft OAuth callback',
        description: 'API endpoint to handle Microsoft OAuth callback',
        operationId: 'handleMicrosoftOAuthCallback',
        hide: true,
        querystring: {
          type: 'object',
          required: ['code', 'state'],
          properties: {
            code: { type: 'string' },
            state: { type: 'string' },
          }
        },
        response: {
          302: {
            description: 'Redirect to frontend with user data and token',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          400: {
            description: 'Bad request',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          500: {
            description: 'Server error',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    }, handleMicrosoftOAuthCallback
  );

  // refresh user refresh token route
  fastify.post(
    '/refresh-token',
    {
      schema: {
        tags: ['Users'],
        summary: 'Refresh User Token',
        description: 'API endpoint for users to refresh their authentication token',
        operationId: 'refreshUserToken',
        hide: true,
        response: {
          200: {
            description: 'Token refreshed successfully',
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  uuid: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string' },
                  status: { type: 'string' },
                  profile_url: { type: 'string' },
                  timezone: { type: 'string' },
                },
              },
              token: {
                type: 'object',
                properties: {
                  access_token: { type: 'string' },
                  access_token_expiries_at: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
          401: {
            description: 'Invalid refresh token',
            type: 'object',
            properties: {
              message: { type: 'string' },
            }
          }
        }
      }
    },
    refreshUserToken
  );

  // logout user session by revoking the refresh token
  fastify.post(
    '/logout',
    {
      schema: {
        tags: ['Users'],
        summary: 'Logout User',
        description: 'API endpoint for users to logout and revoke their session',
        operationId: 'logoutUser',
        hide: true,
      }
    },
    logoutUser
  );

  // magic link login via user uuid
  fastify.get(
    '/magic-link-login',
    {
      schema: {
        tags: ['Users'], // Group under "Product" tag
        summary: 'Magic link login',
        description: 'API endpoint to login a user via magic link',
        operationId: 'magicLinkLogin',
        hide: true,
        querystring: {
          type: 'object',
          required: ['token'],
          properties: {
            token: { type: 'string' },
          },
        },
        response: {
          200: {
            description: 'Login successful',
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  uuid: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string' },
                  status: { type: 'string' },
                  profile_url: { type: 'string' },
                  timezone: { type: 'string' },
                },
              },
              token: {
                type: 'object',
                properties: {
                  access_token: { type: 'string' },
                  access_token_expiries_at: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
          404: {
            description: 'User not found',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        }
      }
    }, userMagicLinkLogin);

  // verify user
  fastify.post(
    '/verify-user',
    {
      schema: {
        tags: ['Users'], // Group under "Product" tag
        summary: 'Verify user',
        description: 'API endpoint to verify a user',
        operationId: 'verifyUser',
        hide: true,
        querystring: {
          type: 'object',
          required: ['token', 'otp'],
          properties: {
            token: { type: 'string' },
            otp: { type: 'string', minLength: 6, maxLength: 9 },
          },
        },
        response: {
          200: {
            description: 'User verified successfully',
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  uuid: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string' },
                  status: { type: 'string' },
                  profile_url: { type: 'string' },
                  timezone: { type: 'string' },
                },
              },
              token: {
                type: 'object',
                properties: {
                  access_token: { type: 'string' },
                  access_token_expiries_at: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
          404: {
            description: 'Invalid link!',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    verifyUserByUuid
  );

  // resend verify link
  fastify.post(
    '/resend-verify-link',
    {
      schema: {
        tags: ['Users'], // Group under "Product" tag
        summary: 'Resend verify link',
        description: 'API endpoint to resend a verification link',
        operationId: 'resendVerifyLink',
        hide: true,
        body: {
          type: 'object',
          required: ['email'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              minLength: 5,
              maxLength: 100,
            },
          },
        },
        response: {
          200: {
            description: 'User verfication email sent successfully',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          404: {
            description: 'Invalid email address!',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    resendUserActivationLink
  );

  // forget password
  fastify.post(
    '/forget-password',
    {
      schema: {
        tags: ['Users'], // Group under "Product" tag
        summary: 'Forget password',
        description: 'API endpoint to send a password reset link',
        operationId: 'forgetPassword',
        hide: true,
        body: {
          type: 'object',
          required: ['email'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              minLength: 5,
              maxLength: 100,
            },
          },
        },
        response: {
          200: {
            description: 'User verfication email sent successfully',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          404: {
            description: 'User not found',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    forgotPassword
  );

  // reset password
  fastify.post(
    '/reset-password',
    {
      schema: {
        tags: ['Users'], // Group under "Product" tag
        summary: 'Reset password',
        description: 'API endpoint to reset password',
        operationId: 'resetPassword',
        hide: true,
        body: {
          type: 'object',
          required: ['token', 'new_password'],
          properties: {
            token: { type: 'string' },
            new_password: { type: 'string', maxLength: 30 },
          },
        },
        response: {
          200: {
            description: 'Password reset successful.',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          404: {
            description: 'Password link expired or Invalid link',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    resetPassword
  );

  // update password
  fastify.post(
    '/update-password',
    {
      schema: {
        tags: ['Auth'], // Group under "Product" tag
        summary: 'Update password',
        description: 'API endpoint to update password',
        operationId: 'updatePassword',
        hide: true,
        body: {
          type: 'object',
          required: ['password', 'new_password'],
          properties: {
            password: { type: 'string', maxLength: 30 }, // Assuming UUID is 36 characters
            new_password: { type: 'string', maxLength: 30 }, // Assuming UUID is 36 characters
          },
        },
        response: {
          200: {
            description: 'Password updated successfully.',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          401: {
            description: 'Old password is invalid',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          404: {
            description: 'User not found',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    updatePassword
  );

  // Route to get signed URL for uploading user profile
  fastify.post(
    '/get-profile-signed-url',
    {
      schema: {
        tags: ['Users'],
        summary: 'Get signed URL for uploading user profile',
        description: 'Returns a pre-signed S3 URL for uploading user profile image',
        operationId: 'getSignedUrlForUserProfile',
        hide: true,
        headers: {
          type: 'object',
          properties: {
            authorization: { type: 'string', description: 'Bearer token for authentication' }
          },
          required: [],
        },
        body: {
          type: 'object',
          required: ['filename', 'content_type'],
          properties: {
            filename: { type: 'string', description: 'File name of the profile image' },
            content_type: { type: 'string', description: 'Content type of the profile image' },
          },
        },
        response: {
          200: {
            description: 'Signed URL generated successfully',
            type: 'object',
            properties: {
              request_url: { type: 'string' },
              file_url: { type: 'string' },
              filename: { type: 'string' },
            },
          },
          404: {
            description: 'User not found',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          500: {
            description: 'Server error',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    getUserProfileSignedUrl
  );

  // Signup route
  fastify.post(
    '/update-user-details',
    {
      schema: {
        tags: ['Auth'], // Group under "Product" tag
        summary: 'Update user details',
        description: 'API endpoint to update user details',
        operationId: 'updateUserInfo',
        hide: true,
        body: {
          type: 'object',
          properties: {
            name: { type: 'string', maxLength: 100 },
            profile_url: { type: 'string' },
            timezone: { type: 'string' },
          },
        },
        response: {
          200: {
            description: 'Profile updated successfully',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          404: {
            description: 'User not found',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    updateUserInfo
  );


  // update trigger_product_tour flag
  fastify.post(
    '/update-trigger-product-tour',
    {
      schema: {
        tags: ['Auth'], // Group under "Auth" tag
        summary: 'Update trigger product tour',
        description: 'API endpoint to update trigger product tour flag',
        operationId: 'updateTriggerProductTour',
        hide: true,
        response: {
          200: {
            description: 'Product tour flag updated successfully',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          406: {
            description: 'Invalid request! User not found!',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    updateTriggerProductTour
  );
}
