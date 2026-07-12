<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Registration Rejected</title>
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
            color: #f87171;
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
        <h2>Registration Status Update</h2>
        <p>Hello <span class="highlight">{{ $name }}</span>,</p>
        <p>Thank you for your interest in joining the <strong>Cyberlogic Club</strong>.</p>
        <p>After reviewing your application details, we regret to inform you that your registration request has been rejected and could not be approved at this time.</p>
        <p>This is usually due to mismatching student details or registration criteria. If you believe this was an error, please reach out to one of the club officers or moderators to clarify your information, or apply again with the correct credentials.</p>
        
        <div class="footer">
            This is an automated notification. Please do not reply directly to this email.<br>
            &copy; {{ date('Y') }} Cyberlogic Club. All rights reserved.
        </div>
    </div>
</body>
</html>
