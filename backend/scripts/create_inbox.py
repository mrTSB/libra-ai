from agentmail import AgentMail
from dotenv import load_dotenv
import os

load_dotenv()

client = AgentMail(
    api_key=os.getenv("AGENT_MAIL_API_KEY"),
)
client.inboxes.create(
    username="expert1",
    display_name="Expert 1",
)

client.inboxes.create(
    username="expert2",
    display_name="Expert 2",
)

client.inboxes.create(
    username="expert3",
    display_name="Expert 3",
)