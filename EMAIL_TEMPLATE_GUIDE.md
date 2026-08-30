# ✉️ EmailJS Setup & "Thank You" Email Template Guide
### Rajlux Digital Solutions Pvt Ltd

This guide walks you through setting up **EmailJS** to send automated, professional **"Thank You" confirmation emails** to everyone who submits the contact form on your website.

---

## ⚡ Quick 3-Minute Setup

### Step 1: Create a Free Account
1. Visit [https://www.emailjs.com/](https://www.emailjs.com/) and click **Sign Up Free**.
2. Free tier gives you **200 free emails every month**.

---

### Step 2: Add an Email Service
1. In your EmailJS Dashboard, click **Email Services** → **Add New Service**.
2. Select **Gmail** (or your preferred email provider like Outlook, Zoho, etc.).
3. Connect your official email (e.g. `rajlux7733@gmail.com`).
4. Copy your **Service ID** (e.g. `service_rajlux`).

---

### Step 3: Create the Auto-Reply "Thank You" Template
1. In your EmailJS Dashboard, click **Email Templates** → **Create New Template**.
2. Fill in the template fields:
   - **Template Name**: `Thank You Confirmation`
   - **Subject**: `Thank you for contacting Rajlux Digital Solutions, {{to_name}}! 👑`
   - **To Email**: `{{to_email}}`
   - **From Name**: `Rajlux Digital Solutions`
   - **Reply To**: `rajlux7733@gmail.com`
3. Click on the **Content** tab → switch to **HTML mode** (or Code view) and paste the complete template below:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You for Contacting Rajlux Digital Solutions</title>
</head>
<body style="margin:0; padding:0; background-color:#0b0d14; font-family:'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0b0d14; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Container Card -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px; width:100%; background: linear-gradient(135deg, #131722 0%, #0d1017 100%); border: 1px solid rgba(212,175,55,0.3); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
          
          <!-- Top Gold Accent Bar -->
          <tr>
            <td height="4" style="background: linear-gradient(90deg, #d4af37, #f7d070, #d4af37);"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 35px 35px 20px 35px; text-align: center;">
              <div style="display: inline-block; width: 50px; height: 50px; line-height: 50px; border-radius: 12px; background: linear-gradient(135deg, #d4af37, #997a15); color: #000; font-size: 24px; font-weight: bold; margin-bottom: 12px;">👑</div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 1px; color: #f7d070; text-transform: uppercase;">RAJLUX DIGITAL SOLUTIONS</h1>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #a0a5b5; letter-spacing: 0.5px;">Pvt Ltd · Premium Digital & Software Excellence</p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 35px;">
              <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.08); margin: 0;">
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 30px 35px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #ffffff;">Hello <span style="color: #f7d070;">{{to_name}}</span>,</h2>
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #c9cedd;">
                Thank you for reaching out to <strong>Rajlux Digital Solutions</strong>! We have received your inquiry regarding <strong>{{service_name}}</strong> and our team is already reviewing your details.
              </p>

              <!-- Inquire Summary Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(212,175,55,0.2); border-radius: 10px; margin: 20px 0; padding: 18px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; color: #f7d070; text-transform: uppercase; letter-spacing: 0.5px;">📋 Your Inquiry Summary</p>
                    <p style="margin: 4px 0; font-size: 14px; color: #e2e5ec;"><strong>Service:</strong> {{service_name}}</p>
                    <p style="margin: 4px 0; font-size: 14px; color: #e2e5ec;"><strong>Your Message:</strong></p>
                    <p style="margin: 4px 0 0 0; font-size: 14px; font-style: italic; color: #a0a5b5; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px; border-left: 3px solid #d4af37;">
                      "{{message_text}}"
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Promises / Next Steps -->
              <h3 style="margin: 25px 0 12px 0; font-size: 16px; font-weight: 700; color: #ffffff;">⚡ What Happens Next?</h3>
              <ul style="margin: 0 0 25px 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: #c9cedd;">
                <li><strong style="color: #f7d070;">Quick Response:</strong> One of our technical specialists will reach out within <strong>1 hour</strong>.</li>
                <li><strong style="color: #f7d070;">Free Consultation:</strong> We'll discuss your requirements, timeline, and the most effective digital strategy for your business.</li>
                <li><strong style="color: #f7d070;">Lifetime Partnership:</strong> Complete transparency and 24/7 dedicated support.</li>
              </ul>

              <!-- Direct Contact Buttons -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 10px;">
                <tr>
                  <td align="center">
                    <a href="https://wa.me/918148753891?text=Hi%20Rajlux%20Team%2C%20I%20just%20submitted%20an%20inquiry%20regarding%20{{service_name}}" style="display: inline-block; background: linear-gradient(135deg, #25D366, #128C7E); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: bold; padding: 12px 24px; border-radius: 50px; margin-right: 10px; box-shadow: 0 4px 15px rgba(37,211,102,0.3);">
                      💬 WhatsApp Instant Chat
                    </a>
                    <a href="tel:+916369589185" style="display: inline-block; background: rgba(255,255,255,0.08); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: bold; padding: 12px 24px; border-radius: 50px; border: 1px solid rgba(255,255,255,0.2);">
                      📞 Call Us Directly
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: rgba(0,0,0,0.4); padding: 25px 35px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05);">
              <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #f7d070;">Rajlux Digital Solutions Pvt Ltd</p>
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #8a90a2;">
                📧 <a href="mailto:rajlux7733@gmail.com" style="color: #a0a5b5; text-decoration: none;">rajlux7733@gmail.com</a> | 📞 +91 63695 89185
              </p>
              <p style="margin: 0; font-size: 11px; color: #5a6072;">
                © 2026 Rajlux Digital Solutions. All rights reserved. | Lifetime Support &amp; Excellence
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

4. Click **Save** and copy the **Template ID** (e.g. `template_thankyou`).

---

### Step 4: Get Your Public Key
1. Go to **Account** (in the bottom left) → **API Keys**.
2. Copy your **Public Key** (e.g. `user_abc123xyz`).

---

### Step 5: Save Keys in Your Admin Portal
1. Open your website's **Admin Portal** ([admin.html](file:///c:/Users/matha/OneDrive/Desktop/an/admin.html)).
2. Log in (default password: `admin123`).
3. Click on the **⚙️ Settings & Security** tab.
4. Scroll down to **✉️ Email Auto-Reply Settings (EmailJS)**.
5. Paste your:
   - **Public Key**
   - **Service ID**
   - **Thank-You Auto-Reply Template ID**
6. Click **💾 Save Email Settings**.
7. Click **🧪 Send Test Auto-Reply** to send a test email to your inbox!

---

## 🎯 Template Parameters Reference

When an inquiry is submitted, the website automatically supplies these variables to your EmailJS template:

| Parameter Variable | Description | Example Value |
|---|---|---|
| `{{to_name}}` | Contact's full name | `John Doe` |
| `{{to_email}}` | Contact's email address | `john@example.com` |
| `{{user_phone}}` | Contact's phone number | `9876543210` |
| `{{service_name}}` | Selected service | `Web Development` |
| `{{message_text}}` | The message they wrote | `Need e-commerce store` |
| `{{company_name}}` | Company name | `Rajlux Digital Solutions Pvt Ltd` |
| `{{company_email}}` | Company email | `rajlux7733@gmail.com` |
| `{{company_phone}}` | Company phone | `+91 63695 89185` |
| `{{response_time}}` | Response promise | `1 Hour` |
| `{{company_website}}` | Website URL | `https://rajlux-digital-solutions.vercel.app` |
