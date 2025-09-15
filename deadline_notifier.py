from dotenv import load_dotenv
import os
load_dotenv()
smtp_config = {
    'smtp_server': os.getenv('SMTP_SERVER', 'smtp.gmail.com'),
    'smtp_port': int(os.getenv('SMTP_PORT', 587)),
    'sender_email': os.getenv('SENDER_EMAIL'),
    'sender_password': os.getenv('SENDER_PASSWORD')
}
import pandas as pd
import smtplib
import schedule
import time
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from typing import Dict
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('deadline_notifications.log'),
        logging.StreamHandler()
    ]
)

class DeadlineNotifier:
    def __init__(self, excel_file_path: str, smtp_config: Dict):
        self.excel_file_path = excel_file_path
        self.smtp_config = smtp_config
        
    def read_tasks_from_excel(self) -> pd.DataFrame:
        try:
            df = pd.read_excel(self.excel_file_path, sheet_name=0)
            required_columns = ['Task', 'Assignee', 'Email', 'Deadline']
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                logging.warning(f"Missing columns: {missing_columns}")
                logging.info(f"Available columns: {list(df.columns)}")
            df['Deadline'] = pd.to_datetime(df['Deadline'])
            df = df.dropna(subset=['Email', 'Deadline'])
            logging.info(f"Loaded {len(df)} tasks from Excel file")
            return df
        except Exception as e:
            logging.error(f"Error reading Excel file: {e}")
            return pd.DataFrame()
    
    def get_tasks_for_notification(self, df: pd.DataFrame, days_before: int) -> pd.DataFrame:
        today = datetime.now().date()
        target_date = today + timedelta(days=days_before)
        return df[df['Deadline'].dt.date == target_date]
    
    def create_email_content(self, task_info: Dict, notification_type: str) -> tuple:
        task_name = task_info['Task']
        assignee = task_info['Assignee']
        deadline = task_info['Deadline'].strftime('%Y-%m-%d')
        
        if notification_type == "3_days":
            subject = f"⚠ Task Reminder: {task_name} - Due in 3 Days"
            body = f"""Hi {assignee},

This is a friendly reminder that your task is due in 3 days.

📋 Task: {task_name}
📅 Deadline: {deadline}

Best regards,
abhrxdi4p
"""
        elif notification_type == "1_day":
            subject = f"🚨 URGENT: Task Due Tomorrow - {task_name}"
            body = f"""Hi {assignee},

URGENT REMINDER: Your task is due TOMORROW.

📋 Task: {task_name}
📅 Deadline: {deadline}

Best regards,
Project Management System
"""
        else:
            subject = f"🔴 DEADLINE TODAY: {task_name}"
            body = f"""Hemlo hardworking labours, {assignee},

This is a critical reminder that your task deadline is TODAY.
📋 Task: {task_name}
📅 Deadline: {deadline}
Best regards,
abhrxdi4p
"""
        return subject, body
    
    def send_email(self, to_email: str, subject: str, body: str) -> bool:
        try:
            msg = MIMEMultipart()
            msg['From'] = self.smtp_config['sender_email']
            msg['To'] = to_email
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'plain'))
            server = smtplib.SMTP(self.smtp_config['smtp_server'], self.smtp_config['smtp_port'])
            server.starttls()
            server.login(self.smtp_config['sender_email'], self.smtp_config['sender_password'])
            server.sendmail(self.smtp_config['sender_email'], to_email, msg.as_string())
            server.quit()
            logging.info(f"Email sent successfully to {to_email}")
            return True
        except Exception as e:
            logging.error(f"Failed to send email to {to_email}: {e}")
            return False
    
    def process_notifications(self):
        logging.info("Starting notification process...")
        df = self.read_tasks_from_excel()
        if df.empty:
            logging.warning("No tasks found in Excel file")
            return
        notification_types = [(3, "3_days"), (1, "1_day"), (0, "deadline")]
        total_sent = 0
        for days_before, notification_type in notification_types:
            tasks_to_notify = self.get_tasks_for_notification(df, days_before)
            if not tasks_to_notify.empty:
                for _, task in tasks_to_notify.iterrows():
                    subject, body = self.create_email_content(task, notification_type)
                    if self.send_email(task['Email'], subject, body):
                        total_sent += 1
                        logging.info(f"Sent {notification_type}notification for task:{task['Task']}")
                    time.sleep(1)
        logging.info(f"Notification process completed.Total emails sent:{total_sent}")

def main():
    excel_file_path = "tasks_deadlines.xlsx"
    notifier = DeadlineNotifier(excel_file_path, smtp_config)
    print("Scheduling daily deadline notifications at 09:00...")
    schedule.every().day.at("09:00").do(notifier.process_notifications)

    while True:
        schedule.run_pending()
        time.sleep(60)
if __name__ == "__main__":
    main()
