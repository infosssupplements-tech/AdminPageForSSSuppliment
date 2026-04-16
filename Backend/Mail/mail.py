from django.core.mail import send_mail



def MailFunction(settings, email, otp_code) :
    try:
        send_mail(
            'Password Reset OTP',
            f'Your OTP: {otp_code}\n\nValid for 10 minutes.',
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
        print("EMAIL SENT!")
    except Exception as e:
        print(f"EMAIL ERROR: {e}")
        pass