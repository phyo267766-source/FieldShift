"""
Chatbot API routes.
Endpoint for the FieldShift agricultural assistant.
Supports both rule-based and AI-powered responses.
"""
import logging
from flask import Blueprint, request, jsonify
from services.chatbot_service import get_chat_response
from services.ai_service import is_ai_available, get_ai_response, get_ai_status, build_farm_context_text
from services.climate_service import get_climate_for_farm
from database.db import query_db

logger = logging.getLogger(__name__)

chat_bp = Blueprint('chat', __name__)

# Limits
MAX_MESSAGE_LENGTH = 2000
MAX_HISTORY_LENGTH = 20


@chat_bp.route('/api/chat', methods=['POST'])
def chat():
    """
    Send a message to the FieldShift farming assistant.

    Body JSON:
      message: string — the user's question (required, max 2000 chars)
      context: optional dict — farm context (current_crop, soil_type, etc.)
      history: optional list — conversation history [{role, content}, ...]
      language: optional string — 'en' or 'mm'
      farm_id: optional int — farm ID to fetch real data from backend

    Returns:
      response: string — the assistant's reply (supports markdown)
      suggestions: list of string — suggested follow-up questions
      ai_used: bool — whether AI was used for the response
      mode: string — 'ai', 'knowledge_base', or 'offline'
    """
    data = request.get_json()

    if not data or not data.get('message'):
        return jsonify({
            'response': "Please send a message to get started!",
            'suggestions': ['Hello', 'Tell me about rice', 'What is crop rotation?'],
            'ai_used': False,
            'mode': 'knowledge_base',
        }), 200

    message = str(data['message']).strip()
    if not message:
        return jsonify({
            'response': "Please type a question and I'll do my best to help!",
            'suggestions': ['Tell me about rice', 'What is crop rotation?', 'Best soil for groundnut'],
            'ai_used': False,
            'mode': 'knowledge_base',
        }), 200

    # Enforce message length limit
    if len(message) > MAX_MESSAGE_LENGTH:
        return jsonify({
            'error': f'Message exceeds maximum length of {MAX_MESSAGE_LENGTH} characters.',
        }), 400

    # Parse optional fields
    context = data.get('context') if isinstance(data.get('context'), dict) else None
    history = data.get('history') if isinstance(data.get('history'), list) else None
    language = data.get('language', 'en')
    if language not in ('en', 'mm'):
        language = 'en'
    farm_id = data.get('farm_id')

    # Validate and limit history
    if history:
        history = [
            {'role': h.get('role', 'user'), 'content': str(h.get('content', ''))[:2000]}
            for h in history[:MAX_HISTORY_LENGTH]
            if isinstance(h, dict) and h.get('content')
        ]

    # Fetch farm data from backend if farm_id provided
    farm_data = None
    climate_data = None
    if farm_id is not None:
        try:
            fid = int(farm_id)
            farm_row = query_db('SELECT * FROM farms WHERE id = ?', (fid,), one=True)
            if farm_row:
                farm_data = dict(farm_row)
                # Try to get recent climate data (cached)
                try:
                    climate_result = get_climate_for_farm(fid)
                    if climate_result.get('success'):
                        climate_data = climate_result
                except Exception as e:
                    logger.debug(f"Could not fetch climate data for chat: {e}")
        except (TypeError, ValueError):
            pass

    # Merge client-supplied context with backend farm data
    if context and farm_data:
        # Backend data takes precedence for secure fields
        for key in ('current_crop', 'soil_type', 'region', 'district', 'township',
                    'previous_crop', 'irrigation_method', 'planting_season',
                    'area', 'area_unit', 'latitude', 'longitude'):
            if farm_data.get(key):
                context[key] = farm_data[key]
    elif farm_data:
        context = farm_data
    elif not context:
        context = None

    # Try AI first if available
    if is_ai_available():
        ai_result = get_ai_response(
            message=message,
            conversation_history=history,
            farm_data=context,
            climate_data=climate_data,
            language=language,
        )
        if ai_result and ai_result.get('response'):
            return jsonify({
                'response': ai_result['response'],
                'suggestions': ai_result.get('suggestions', []),
                'ai_used': ai_result.get('ai_used', True),
                'mode': 'ai' if ai_result.get('ai_used', True) else 'knowledge_base',
            }), 200

    # Fall back to rule-based engine
    result = get_chat_response(message=message, context=context)
    result['ai_used'] = False
    result['mode'] = 'knowledge_base'

    return jsonify(result), 200


@chat_bp.route('/api/chat/status', methods=['GET'])
def chat_status():
    """
    Check the status of the chat assistant.
    Returns whether AI is enabled and the current mode.
    """
    status = get_ai_status()
    return jsonify({
        'online': True,
        'ai_enabled': status['ai_enabled'],
        'model': status.get('model'),
        'provider': status.get('provider'),
        'mode': 'ai' if status['ai_enabled'] else 'knowledge_base',
    }), 200
