import os

def send_email(email_to: str, subject: str, body: str):
    """
    Simula o envio de um e-mail.
    Em um ambiente de produção, isso seria substituído por um
    serviço de e-mail real (ex: SendGrid, Amazon SES, etc.).
    """
    print("--- SIMULANDO ENVIO DE EMAIL ---")
    print(f"Para: {email_to}")
    print(f"Assunto: {subject}")
    print("Corpo:")
    print(body)
    print("---------------------------------")
    # Exemplo de como seria com uma API real:
    # try:
    #     import requests
    #     requests.post(
    #         "https://api.mailgun.net/v3/your-domain.com/messages",
    #         auth=("api", "YOUR_API_KEY"),
    #         data={"from": "Hortifruti PDV <mailgun@your-domain.com>",
    #               "to": [email_to],
    #               "subject": subject,
    #               "text": body})
    # except Exception as e:
    #     print(f"Erro ao enviar email (simulado): {e}") 