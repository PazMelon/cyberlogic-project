<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Password Reset Request</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #0b0f19;
            color: #cdd6f4;
            margin: 0;
            padding: 40px 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #111827;
            border: 1px solid #1f2937;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        h2 {
            color: #818cf8;
            margin-top: 0;
            font-size: 24px;
            border-bottom: 1px solid #1f2937;
            padding-bottom: 10px;
        }
        p {
            line-height: 1.6;
            font-size: 16px;
            color: #9ca3af;
        }
        .highlight {
            color: #f3f4f6;
            font-weight: bold;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #818cf8, #a78bfa);
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 8px;
            font-weight: 600;
            margin-top: 20px;
            text-align: center;
        }
        .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px solid #1f2937;
            padding-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Password Reset Request</h2>
        <p>Hello <span class="highlight">{{ $name }}</span>,</p>
        <p>We received a request to reset the password for your account in the <strong>Cyberlogic Club</strong> member portal.</p>
        <p>Please click the button below to choose a new password. This reset link is valid for 60 minutes.</p>
        
        <p style="text-align: center;">
            <a href="{{ $resetUrl }}" class="button">Reset Password</a>
        </p>

        <p>If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
        
        <div class="footer">
            This is an automated notification. Please do not reply directly to this email.<br>
            &copy; {{ date('Y') }} Cyberlogic Club. All rights reserved.
        </div>
    </div>
</body>
</html>
