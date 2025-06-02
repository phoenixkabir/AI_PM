from dotenv import load_dotenv

from livekit import agents
from livekit.agents import AgentSession, Agent, RoomInputOptions, ConversationItemAddedEvent, UserInputTranscribedEvent, StopResponse
from livekit.plugins import (
    google,
    noise_cancellation,
)
from livekit.agents.llm import AudioContent, ChatContext, ChatMessage

import requests

load_dotenv()

class Assistant(Agent):
    def __init__(self, instructions: str) -> None:
        super().__init__(
            instructions=instructions,
            llm=google.beta.realtime.RealtimeModel(
                model="gemini-2.0-flash-exp",
                voice="Aoede",
                temperature=0.8,
                ),
        )
    
    async def on_enter(self):
        self.session.generate_reply(
            instructions="Greet the user and tell them the reason of the call."
        )


async def entrypoint(ctx: agents.JobContext):
    await ctx.connect()
    
    session = AgentSession()
    data = requests.get(f"https://pratikriya.cream11.live/api/product-conversations/{ctx.room.name}")
    instructions = data.json()["data"]["systemPrompt"]
    await session.start(
        room=ctx.room,
        agent=Assistant(instructions=instructions),
        room_input_options=RoomInputOptions(
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )

    @session.on("conversation_item_added")
    def on_conversation_item_added(event: ConversationItemAddedEvent):
        print(f"Conversation item added from {event.item.role}: {event.item.text_content}. interrupted: {event.item.interrupted}")
        for content in event.item.content:
            if isinstance(content, AudioContent):
                print(f" - audio: {content.frame}, transcript: {content.transcript}")

if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))