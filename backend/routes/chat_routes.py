"""
Chatbot API routes.
Endpoint for the FieldShift agricultural assistant.
"""
from flask import Blueprint, request, jsonify
from services.chatbot_service import get_chat_response

chat_bp = Blueprint('chat', __name__)


@chat_bp.route('/api/chat', methods=['POST'])
def chat():
    """
    Send a message to the FieldShift farming assistant.

    Body JSON:
      message: string — the user's question
      context: optional dict — farm context (current_crop, soil_type, etc.)

    Returns:
      response: string — the assistant's reply (supports markdown)
      suggestions: list of string — suggested follow-up questions
    """
    data = request.get_json()

    if not data or not data.get('message'):
        return jsonify({
            'response': "Please send a message to get started!",
            'suggestions': ['Hello', 'Tell me about rice', 'What is crop rotation?'],
        }), 200

    result = get_chat_response(
        message=data['message'],
        context=data.get('context'),
    )

    return jsonify(result), 200
