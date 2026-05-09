// {{product_name}}
// {{primary_color}}
// {{text_color}}
// {{background_color}}
// {{border_color}}
// {{page_background_color}}
// {{reset_password_url}}
// {{reset_link_expiry_minutes}}

export const subject = '{{product_name}}: Reset your password';

export const body = `<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background:{{page_background_color}}; font-family:Arial, sans-serif; color:{{text_color}};">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:{{page_background_color}}; padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background:{{background_color}}; border:1px solid {{border_color}}; border-radius:12px; padding:32px;">
            <tr>
              <td>
                <h1 style="margin:0 0 16px; font-size:24px; line-height:32px; color:{{text_color}};">
                  Reset your password
                </h1>

                <p style="margin:0 0 16px; font-size:15px; line-height:24px; color:{{text_color}};">
                  We received a request to reset the password for your {{product_name}} account.
                </p>

                <p style="margin:0 0 24px; font-size:15px; line-height:24px; color:{{text_color}};">
                  Click the button below to create a new password.
                </p>

                <a href="{{product_url}}/reset-password?token={{token}}" style="display:inline-block; background:{{primary_color}}; color:#ffffff; text-decoration:none; padding:12px 20px; border-radius:8px; font-size:15px; font-weight:600;">
                  Reset password
                </a>

                <p style="margin:24px 0 0; font-size:13px; line-height:20px; color:{{text_color}};">
                  This link will expire in {{reset_link_expiry_minutes}} minutes.
                </p>

                <p style="margin:16px 0 0; font-size:13px; line-height:20px; color:{{text_color}};">
                  If the button does not work, copy and paste this link into your browser:
                  <br />
                  <a href="{{product_url}}/reset-password?token={{token}}" style="color:{{primary_color}};">
                    {{product_url}}/reset-password?token={{token}}
                  </a>
                </p>

                <hr style="border:none; border-top:1px solid {{border_color}}; margin:28px 0;" />

                <p style="margin:0; font-size:12px; line-height:18px; color:{{text_color}};">
                  If you did not request a password reset, you can safely ignore this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
