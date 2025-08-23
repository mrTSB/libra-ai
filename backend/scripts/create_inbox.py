from agentmail import AgentMail
from dotenv import load_dotenv
import os

load_dotenv()

client = AgentMail(
    api_key=os.getenv("AGENT_MAIL_API_KEY"),
)
client.inboxes.create(
    username="donnerAgent",
    display_name="Donna",
)