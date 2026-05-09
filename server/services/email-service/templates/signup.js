// {{product_name}}
// {{primary_color}}
// {{text_color}}
// {{background_color}}
// {{border_color}}
// {{page_background_color}}
// {{otp_code}}
// {{otp_expiry_minutes}}
// {{product_url}}
// {{user_uuid}}

export const subject = '{{product_name}}: Verify your email address';

export const body = `<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background:{{page_background_color}}; font-family:Arial, sans-serif; color:{{text_color}};">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:{{page_background_color}}; padding:32px 16px;">
      <tr>
        <td align="center">
          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            style="
              max-width:560px;
              background:{{background_color}};
              border:1px solid {{border_color}};
              border-radius:12px;
              padding:32px;
            "
          >
            <tr>
              <td>
                <h1
                  style="
                    margin:0 0 16px;
                    font-size:24px;
                    line-height:32px;
                    color:{{text_color}};
                  "
                >
                  Verify your email
                </h1>

                <p
                  style="
                    margin:0 0 16px;
                    font-size:15px;
                    line-height:24px;
                    color:{{text_color}};
                  "
                >
                  Use the verification code below to confirm your email address and continue setting up your {{product_name}} account.
                </p>

                <!-- OTP -->
                <div style="margin:32px 0; text-align:center;">
                  <div
                    style="
                      display:inline-block;
                      padding:16px 24px;
                      border:1px solid {{border_color}};
                      border-radius:10px;
                      font-size:32px;
                      letter-spacing:8px;
                      font-weight:700;
                      color:{{text_color}};
                    "
                  >
                    {{otp_code}}
                  </div>
                </div>

                <p
                  style="
                    margin:0 0 20px;
                    font-size:14px;
                    line-height:22px;
                    color:{{text_color}};
                  "
                >
                  This code will expire in {{otp_expiry_minutes}} minutes.
                </p>

                <p
                  style="
                    margin:0 0 20px;
                    font-size:15px;
                    line-height:24px;
                    color:{{text_color}};
                  "
                >
                  You can also verify your email instantly using the button below.
                </p>

                <a
                  href="{{product_url}}/user-verification?token={{token}}&otp={{otp_code}}"
                  style="
                    display:inline-block;
                    background:{{primary_color}};
                    color:#ffffff;
                    text-decoration:none;
                    padding:12px 20px;
                    border-radius:8px;
                    font-size:15px;
                    font-weight:600;
                  "
                >
                  Verify email
                </a>

                <p
                  style="
                    margin:24px 0 0;
                    font-size:13px;
                    line-height:20px;
                    color:{{text_color}};
                  "
                >
                  If the button does not work, copy and paste this link into your browser:
                  <br />
                  <a
                    href="{{product_url}}/user-verification?token={{token}}&otp={{otp_code}}"
                    style="color:{{primary_color}};"
                  >
                    {{product_url}}/user-verification?token={{token}}&otp={{otp_code}}
                  </a>
                </p>

                <hr
                  style="
                    border:none;
                    border-top:1px solid {{border_color}};
                    margin:28px 0;
                  "
                />

                <p
                  style="
                    margin:0;
                    font-size:12px;
                    line-height:18px;
                    color:{{text_color}};
                  "
                >
                  If you did not create a {{product_name}} account, you can safely ignore this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
