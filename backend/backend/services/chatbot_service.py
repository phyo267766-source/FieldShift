"""
FieldShift Agricultural Chatbot Engine

Rule-based chatbot with a Myanmar agriculture knowledge base.
Answers questions about crops, soil, weather, pests, irrigation,
rotation, and general farming practices relevant to Myanmar.

No external API required — all knowledge is built in.
"""
import re
import random
from datetime import datetime


# ── Knowledge Base ──────────────────────────────────────────────────────────

CROP_INFO = {
    'rice': {
        'name': 'Rice (ဆန်)',
        'seasons': 'Monsoon (May–Oct) is the main season. Summer rice (Jan–Apr) is grown in irrigated areas.',
        'water': 'High water demand — needs 1,200–2,000 mm. Paddy fields require standing water during most of the growing period.',
        'soil': 'Best in clay loam, clay, or silt loam soils that retain water well.',
        'temp': 'Optimal temperature: 25–32°C. Growth slows below 20°C.',
        'pests': 'Common pests: stem borer, brown planthopper, rice bug. Watch for yellow stem borer during tillering stage.',
        'diseases': 'Common diseases: blast (pyricularia), bacterial leaf blight, sheath blight. Use resistant varieties when possible.',
        'tips': 'Rotate with legumes (mung bean, chickpea) after rice to restore soil nitrogen. Avoid continuous rice-rice cropping for more than 2 seasons.',
        'yield': 'Average yield in Myanmar: 2.5–4.0 tonnes/hectare depending on variety and management.',
    },
    'wheat': {
        'name': 'Wheat (ဂျုံ)',
        'seasons': 'Winter season (Nov–Feb). Plant in November for best results in Myanmar.',
        'water': 'Moderate water demand — needs 450–650 mm. Critical irrigation at crown root, flowering, and grain filling stages.',
        'soil': 'Grows well in loam, clay loam, and silt loam. Needs good drainage.',
        'temp': 'Optimal temperature: 15–25°C. Heat stress above 30°C reduces yield significantly.',
        'pests': 'Common pests: aphids, armyworm. Monitor weekly during heading stage.',
        'diseases': 'Rust (yellow and brown) and powdery mildew are major threats. Plant resistant varieties.',
        'tips': 'Good rotation after rice. Apply nitrogen fertilizer in split doses — at sowing, tillering, and heading.',
        'yield': 'Average yield: 1.5–2.5 tonnes/hectare in Myanmar conditions.',
    },
    'maize': {
        'name': 'Maize / Corn (ပြောင်း)',
        'seasons': 'Can be grown in Monsoon (May–Oct) and Summer (Mar–May). Monsoon maize is more common.',
        'water': 'Moderate water demand — needs 500–800 mm. Very sensitive to drought at tasseling and silking stages.',
        'soil': 'Adaptable. Best in loam, sandy loam, or clay loam with good drainage.',
        'temp': 'Optimal temperature: 24–33°C. Can tolerate heat better than wheat.',
        'pests': 'Fall armyworm is the biggest threat — inspect leaves regularly. Also: corn earworm, stem borer.',
        'diseases': 'Northern leaf blight and stalk rot. Ensure good plant spacing for air circulation.',
        'tips': 'Excellent rotation with legumes. Deep plowing helps root development. Plant in rows for easier management.',
        'yield': 'Average yield: 3.0–5.0 tonnes/hectare with good management.',
    },
    'mung bean': {
        'name': 'Mung Bean (မတ်ပဲ)',
        'seasons': 'Winter (Nov–Feb) and Summer (Mar–May). Short growing period of 60–75 days.',
        'water': 'Low water demand — needs 300–500 mm. Drought tolerant but needs moisture at flowering.',
        'soil': 'Grows well in sandy loam and loam. Tolerates poor soils better than most crops.',
        'temp': 'Optimal temperature: 25–35°C. Tolerates high temperatures well.',
        'pests': 'Pod borer and whitefly are main threats. Use neem-based sprays for organic control.',
        'diseases': 'Yellow mosaic virus (spread by whitefly) and powdery mildew. Use resistant varieties.',
        'tips': 'Excellent rotation crop after rice — fixes nitrogen in soil (30–50 kg N/ha). Short season allows double cropping.',
        'yield': 'Average yield: 0.8–1.2 tonnes/hectare. Myanmar is a major exporter of mung beans.',
    },
    'soybean': {
        'name': 'Soybean (ပဲပုပ်)',
        'seasons': 'Monsoon (Jun–Sep) and Summer (Feb–May). Takes 90–120 days to mature.',
        'water': 'Moderate water demand — needs 450–700 mm. Sensitive to waterlogging.',
        'soil': 'Best in loam, clay loam, or silt loam with pH 6.0–6.8.',
        'temp': 'Optimal temperature: 25–30°C. Growth stops below 10°C.',
        'pests': 'Pod borer and leaf roller. Monitor during pod-filling stage.',
        'diseases': 'Rust and root rot are major concerns. Avoid planting in waterlogged fields.',
        'tips': 'Fixes nitrogen — great rotation partner for cereals. Inoculate seeds with rhizobium for first-time fields.',
        'yield': 'Average yield: 1.0–2.0 tonnes/hectare.',
    },
    'sesame': {
        'name': 'Sesame (နှမ်း)',
        'seasons': 'Summer (Mar–May) and Winter (Oct–Dec). Myanmar is one of the world\'s largest sesame producers.',
        'water': 'Low water demand — needs 300–500 mm. Drought tolerant once established.',
        'soil': 'Grows in sandy loam and loam. Needs well-drained soil — cannot tolerate waterlogging.',
        'temp': 'Optimal temperature: 27–35°C. Loves heat.',
        'pests': 'Sesame webworm and aphids. Hand-picking webworm is effective for small fields.',
        'diseases': 'Phyllody (spread by leafhoppers) and charcoal rot. Rotate crops to reduce soil-borne diseases.',
        'tips': 'Good cash crop with relatively low input costs. Plant on raised beds in heavy soils.',
        'yield': 'Average yield: 0.3–0.6 tonnes/hectare.',
    },
    'groundnut': {
        'name': 'Groundnut / Peanut (မြေပဲ)',
        'seasons': 'Monsoon (May–Sep) and Winter (Nov–Mar). Takes 100–130 days.',
        'water': 'Moderate water demand — needs 500–700 mm. Critical at pegging and pod development.',
        'soil': 'Sandy loam is ideal — pods need loose soil to develop. Avoid heavy clay.',
        'temp': 'Optimal temperature: 25–33°C.',
        'pests': 'Leaf miner, aphids, and white grub (soil pest). White grub damages pods underground.',
        'diseases': 'Leaf spot (tikka disease), rust, and collar rot. Treat seeds with fungicide before planting.',
        'tips': 'Fixes nitrogen as a legume. Apply gypsum at flowering for better pod development. Rotate with cereals.',
        'yield': 'Average yield: 1.0–1.5 tonnes/hectare (pods).',
    },
    'sunflower': {
        'name': 'Sunflower (နေကြာ)',
        'seasons': 'Winter (Nov–Feb) and Summer. Takes 90–100 days.',
        'water': 'Moderate water demand — needs 500–650 mm. Deep roots access subsoil moisture.',
        'soil': 'Grows in loam, clay loam, and sandy loam. Tolerates various soils.',
        'temp': 'Optimal temperature: 22–30°C.',
        'pests': 'Head borer and aphids. Bird damage can be significant at maturity.',
        'diseases': 'Downy mildew and Sclerotinia (white mold). Ensure good drainage.',
        'tips': 'Deep taproot improves soil structure for the next crop. Good bee forage — helps pollination of other crops nearby.',
        'yield': 'Average yield: 1.0–1.5 tonnes/hectare.',
    },
    'cotton': {
        'name': 'Cotton (ဝါ)',
        'seasons': 'Monsoon season (May–Nov). Long growing period of 150–180 days.',
        'water': 'High water demand — needs 700–1,300 mm. Critical during boll development.',
        'soil': 'Deep clay loam, clay, or alluvial soils. Needs fertile, well-drained soil.',
        'temp': 'Optimal temperature: 25–35°C. Sensitive to frost.',
        'pests': 'Bollworm is the most damaging pest. Also: whitefly, jassid, and pink bollworm. Integrated Pest Management (IPM) is essential.',
        'diseases': 'Wilt and root rot. Avoid planting in fields with wilt history.',
        'tips': 'Rotate with legumes or cereals to break pest cycles. Pick cotton in multiple harvests as bolls open.',
        'yield': 'Average yield: 1.0–1.5 tonnes/hectare (seed cotton).',
    },
    'chickpea': {
        'name': 'Chickpea (ကုလားပဲ)',
        'seasons': 'Winter (Oct–Feb). Planted on residual moisture after rice harvest.',
        'water': 'Low water demand — needs 250–350 mm. Very drought tolerant.',
        'soil': 'Loam, sandy loam, or clay loam. Good drainage essential — sensitive to waterlogging.',
        'temp': 'Optimal temperature: 15–25°C. Cool season crop.',
        'pests': 'Pod borer (Helicoverpa) is the major pest. Cutworm at seedling stage.',
        'diseases': 'Fusarium wilt and Ascochyta blight. Use resistant varieties and treat seeds.',
        'tips': 'Excellent after rice — fixes nitrogen and needs little water. Grows well on residual soil moisture.',
        'yield': 'Average yield: 0.8–1.2 tonnes/hectare.',
    },
}

SOIL_INFO = {
    'clay loam': {
        'description': 'A balanced soil with good water retention and moderate drainage. One of the best soils for Myanmar agriculture.',
        'good_for': 'Rice, wheat, maize, cotton, sunflower',
        'challenges': 'Can become compacted. Add organic matter regularly.',
        'tips': 'Plow when moisture is right — not too wet, not too dry. Green manuring improves structure.',
    },
    'sandy loam': {
        'description': 'Well-drained soil that warms up quickly. Easy to work with but dries out fast.',
        'good_for': 'Groundnut, sesame, mung bean, vegetables',
        'challenges': 'Low water retention and nutrients leach easily. Needs frequent irrigation.',
        'tips': 'Add compost or farmyard manure to improve water holding. Mulching reduces evaporation.',
    },
    'clay': {
        'description': 'Heavy soil with excellent water retention but poor drainage. Can become waterlogged.',
        'good_for': 'Rice (paddy), cotton',
        'challenges': 'Hard to plow, cracks when dry, sticky when wet. Poor aeration.',
        'tips': 'Add sand and organic matter to improve structure. Raised beds help drainage for non-rice crops.',
    },
    'silt loam': {
        'description': 'Fertile soil with good moisture retention. Found along river valleys in Myanmar.',
        'good_for': 'Rice, wheat, most vegetables, soybean',
        'challenges': 'Can crust on surface after rain. Erodes easily on slopes.',
        'tips': 'Maintain crop residue cover. Avoid leaving bare during monsoon rains.',
    },
    'loam': {
        'description': 'The ideal balanced soil — good drainage, water retention, and nutrient holding. Every farmer wants this!',
        'good_for': 'Almost all crops — rice, maize, wheat, legumes, oilseeds',
        'challenges': 'Few challenges. Maintain organic matter to keep it healthy.',
        'tips': 'Rotate crops and add compost to maintain this excellent soil structure.',
    },
    'sandy': {
        'description': 'Very well-drained soil that dries out quickly. Low in nutrients.',
        'good_for': 'Groundnut, sesame, watermelon',
        'challenges': 'Very low water and nutrient retention. Needs frequent watering and fertilizing.',
        'tips': 'Heavy mulching and regular organic matter additions are essential. Consider drip irrigation.',
    },
    'alluvial': {
        'description': 'Fertile soil deposited by rivers. Common in Myanmar\'s central plains and delta regions.',
        'good_for': 'Rice, cotton, sugarcane, vegetables',
        'challenges': 'Varies in texture. May flood in monsoon season.',
        'tips': 'Test pH regularly. Alluvial soils in Myanmar are often slightly alkaline.',
    },
    'laterite': {
        'description': 'Reddish soil common in Myanmar\'s hilly areas. Rich in iron but low in nutrients.',
        'good_for': 'Cashew, tea, rubber. With amendments: groundnut, sesame',
        'challenges': 'Low in nitrogen, phosphorus, and organic matter. Acidic (pH 4.5–6.0).',
        'tips': 'Apply lime to correct acidity. Add farmyard manure generously. Green manuring with dhaincha or sun hemp helps.',
    },
}

GENERAL_TOPICS = {
    'rotation': {
        'keywords': ['rotation', 'rotate', 'crop rotation', 'next crop', 'after rice', 'after wheat', 'what to plant next', 'sequence'],
        'response': (
            "Crop rotation is one of the most important practices for sustainable farming! Here are the key principles:\n\n"
            "🔄 **Basic rules:**\n"
            "• Alternate between cereals (rice, wheat, maize) and legumes (mung bean, chickpea, soybean)\n"
            "• Legumes fix nitrogen in soil — plant them before nitrogen-hungry crops like rice or maize\n"
            "• Don't grow the same crop family in the same field for more than 2 seasons\n\n"
            "🌾 **Popular Myanmar rotations:**\n"
            "• Rice → Mung Bean → Rice (most common)\n"
            "• Rice → Chickpea → Sesame\n"
            "• Maize → Soybean → Rice\n"
            "• Cotton → Wheat → Mung Bean\n\n"
            "Use the **Crop Rotation** page in FieldShift to generate a personalized rotation plan based on your soil and conditions!"
        ),
    },
    'fertilizer': {
        'keywords': ['fertilizer', 'fertiliser', 'npk', 'nitrogen', 'phosphorus', 'potassium', 'urea', 'manure', 'compost', 'organic fertilizer'],
        'response': (
            "Fertilizer management is key to good yields. Here's a general guide for Myanmar:\n\n"
            "📊 **Main nutrients:**\n"
            "• **Nitrogen (N)** — for leaf growth. Apply urea in split doses, not all at once\n"
            "• **Phosphorus (P)** — for roots and flowers. Apply at planting time\n"
            "• **Potassium (K)** — for overall plant health and disease resistance\n\n"
            "🌿 **Organic options:**\n"
            "• Farmyard manure: 5–10 tonnes/hectare before planting\n"
            "• Compost: excellent for improving soil structure\n"
            "• Green manuring: grow dhaincha or sun hemp and plow in before planting\n"
            "• Legume residues: leave mung bean/chickpea residues to decompose\n\n"
            "⚠️ **Tips:**\n"
            "• Always do a soil test before applying chemical fertilizers\n"
            "• Over-fertilizing wastes money and harms the environment\n"
            "• Combine organic and chemical fertilizers for best results"
        ),
    },
    'irrigation': {
        'keywords': ['irrigation', 'water', 'watering', 'drought', 'rain-fed', 'drip', 'canal', 'tube well', 'water management', 'flood irrigation'],
        'response': (
            "Water management is crucial, especially with changing rainfall patterns:\n\n"
            "💧 **Irrigation methods:**\n"
            "• **Rain-fed** — depends on monsoon. Plant drought-tolerant crops (sesame, mung bean) in dry seasons\n"
            "• **Canal irrigation** — common in central Myanmar. Schedule watering at critical crop stages\n"
            "• **Tube well** — reliable but costly. Use for high-value crops\n"
            "• **Drip irrigation** — most water-efficient (saves 30–50%). Good for vegetables and orchards\n\n"
            "🌾 **Water-saving tips:**\n"
            "• Alternate Wetting and Drying (AWD) for rice saves 20–30% water\n"
            "• Mulching reduces evaporation by 25–30%\n"
            "• Plant water-efficient crops in dry seasons: sesame, chickpea, mung bean\n"
            "• Harvest rainwater during monsoon for dry season use"
        ),
    },
    'pest': {
        'keywords': ['pest', 'insect', 'bug', 'worm', 'armyworm', 'borer', 'aphid', 'whitefly', 'bollworm', 'planthopper', 'pest control', 'pesticide'],
        'response': (
            "Integrated Pest Management (IPM) is the best approach:\n\n"
            "🔍 **Prevention first:**\n"
            "• Crop rotation breaks pest life cycles\n"
            "• Use resistant varieties when available\n"
            "• Maintain field hygiene — remove crop residues that harbor pests\n"
            "• Plant at recommended times to avoid peak pest seasons\n\n"
            "🌿 **Biological control:**\n"
            "• Encourage natural predators — birds, ladybugs, spiders\n"
            "• Use neem oil or neem seed extract for soft-bodied insects\n"
            "• Trichogramma wasps for stem borer and pod borer eggs\n\n"
            "⚠️ **Chemical control (last resort):**\n"
            "• Identify the pest correctly before spraying\n"
            "• Follow dosage instructions exactly\n"
            "• Spray in early morning or late evening\n"
            "• Observe the waiting period before harvest\n\n"
            "Ask me about a specific crop to learn about its common pests!"
        ),
    },
    'disease': {
        'keywords': ['disease', 'blight', 'rust', 'wilt', 'fungus', 'mildew', 'rot', 'virus', 'mosaic', 'leaf spot', 'blast'],
        'response': (
            "Plant diseases can severely reduce yield. Prevention is better than cure:\n\n"
            "🛡️ **Prevention:**\n"
            "• Use certified disease-free seeds\n"
            "• Treat seeds with fungicide before sowing\n"
            "• Rotate crops — most pathogens are crop-specific\n"
            "• Avoid excessive nitrogen which makes plants susceptible\n"
            "• Ensure proper spacing for air circulation\n\n"
            "🔬 **Common disease types:**\n"
            "• **Fungal** (blast, rust, blight) — worse in humid conditions. Use fungicides\n"
            "• **Bacterial** (bacterial leaf blight) — spread by water. Improve drainage\n"
            "• **Viral** (yellow mosaic) — spread by insects. Control the vector insects\n\n"
            "If you see unusual symptoms on your crops, take photos and consult your local agricultural extension officer."
        ),
    },
    'weather': {
        'keywords': ['weather', 'climate', 'rain', 'rainfall', 'monsoon', 'temperature', 'forecast', 'climate change', 'el nino', 'la nina'],
        'response': (
            "Myanmar's agriculture is closely tied to weather patterns:\n\n"
            "🌦️ **Myanmar seasons:**\n"
            "• **Monsoon (May–Oct)** — 80% of annual rainfall. Main crop season\n"
            "• **Winter (Nov–Feb)** — cool and dry. Good for wheat, chickpea, vegetables\n"
            "• **Summer (Mar–May)** — hot and dry. Irrigated crops only\n\n"
            "📈 **Climate change impacts in Myanmar:**\n"
            "• Monsoon is becoming more unpredictable — heavier rains in shorter periods\n"
            "• Dry zone expanding in central Myanmar\n"
            "• Higher temperatures reducing wheat and rice yields\n\n"
            "💡 **Adaptation tips:**\n"
            "• Diversify crops — don't depend on one crop alone\n"
            "• Use drought-tolerant varieties for dry areas\n"
            "• Check the **Dashboard** and **Climate Insights** pages for NASA weather data specific to your farm!"
        ),
    },
    'organic': {
        'keywords': ['organic', 'organic farming', 'natural farming', 'no chemical', 'chemical free', 'bio'],
        'response': (
            "Organic farming is growing in Myanmar and can command premium prices:\n\n"
            "🌱 **Getting started:**\n"
            "• Start by reducing chemical inputs gradually\n"
            "• Build soil health with compost, green manure, and farmyard manure\n"
            "• Use crop rotation and intercropping for pest management\n"
            "• Neem-based products for pest control\n\n"
            "✅ **Benefits:**\n"
            "• Lower input costs over time\n"
            "• Better soil health and water retention\n"
            "• Premium prices (20–50% more) for certified organic produce\n"
            "• Export opportunities — Myanmar organic sesame and pulses are in demand\n\n"
            "⚠️ **Challenges:**\n"
            "• Transition period of 2–3 years with potentially lower yields\n"
            "• Need more labor for weed and pest management\n"
            "• Certification costs"
        ),
    },
    'harvest': {
        'keywords': ['harvest', 'harvesting', 'post harvest', 'storage', 'drying', 'threshing', 'yield'],
        'response': (
            "Proper harvesting and storage can save 15–30% of your crop from losses:\n\n"
            "🌾 **Harvesting tips:**\n"
            "• Harvest at the right moisture content — rice at 20–22%, wheat at 12–14%\n"
            "• Don't delay harvest — shattering and pest losses increase daily\n"
            "• Harvest early morning or late afternoon to reduce grain cracking\n\n"
            "📦 **Post-harvest handling:**\n"
            "• Dry grains to safe moisture (14% for rice, 12% for pulses) within 24 hours\n"
            "• Use tarpaulins or drying floors — avoid drying directly on soil\n"
            "• Clean and sort grains before storage\n\n"
            "🏪 **Storage:**\n"
            "• Use airtight containers or hermetic bags (PICS bags) for small quantities\n"
            "• Keep storage area clean, dry, and well-ventilated\n"
            "• Check stored grains regularly for insects and moisture"
        ),
    },
    'market': {
        'keywords': ['market', 'price', 'sell', 'selling', 'export', 'income', 'profit', 'money', 'cost'],
        'response': (
            "Making the most of your harvest:\n\n"
            "💰 **Marketing tips:**\n"
            "• Don't sell everything at harvest when prices are lowest\n"
            "• Store properly and sell when prices are higher (usually 2–3 months after harvest)\n"
            "• Form or join farmer groups to negotiate better prices\n"
            "• Explore contract farming opportunities\n\n"
            "📊 **Myanmar's strong export crops:**\n"
            "• Pulses (mung bean, chickpea) — India is a major buyer\n"
            "• Sesame — high international demand\n"
            "• Rice — quality varieties fetch premium prices\n\n"
            "🔍 **Know your costs:**\n"
            "• Track all inputs (seeds, fertilizer, labor, irrigation)\n"
            "• Calculate your break-even price per acre\n"
            "• This helps you decide when selling is profitable"
        ),
    },
}

GREETINGS_IN = ['hello', 'hi', 'hey', 'mingalaba', 'mingalabar', 'good morning', 'good afternoon', 'good evening', 'help', 'start']
GREETINGS_OUT = [
    "Mingalaba! 🙏 I'm the FieldShift farming assistant. I can help you with:\n\n"
    "🌾 **Crop information** — ask about any crop (rice, mung bean, sesame, etc.)\n"
    "🌍 **Soil advice** — ask about your soil type\n"
    "🔄 **Crop rotation** — what to plant next\n"
    "🐛 **Pest & disease** management\n"
    "💧 **Irrigation** and water management\n"
    "🌿 **Organic farming** practices\n"
    "📦 **Harvest & storage** tips\n"
    "🌦️ **Weather & climate** information\n\n"
    "Just type your question! For example: *\"Tell me about growing mung bean\"* or *\"What soil is best for groundnut?\"*",
]

FALLBACK_RESPONSES = [
    "I'm not sure about that, but I can help with crops, soil, weather, pests, irrigation, and rotation for Myanmar farming. Could you rephrase your question?",
    "That's outside my area of expertise. Try asking about specific crops, soil types, pest management, or farming practices in Myanmar!",
    "I don't have information on that topic yet. I'm best at answering questions about Myanmar agriculture — crops, soil, rotation, weather, pests, and irrigation.",
]

THANKS_IN = ['thanks', 'thank you', 'kyay zu', 'ကျေးဇူး', 'great', 'awesome', 'helpful', 'good']
THANKS_OUT = [
    "You're welcome! 🙏 Happy farming! Ask me anything else about your crops.",
    "Glad I could help! Feel free to ask more questions about farming.",
    "Kyay zu ba deh! 🙏 I'm always here to help with your farming questions.",
]


# ── Chat Engine ─────────────────────────────────────────────────────────────

def get_chat_response(message, context=None):
    """
    Process a user message and return a chatbot response.

    Args:
        message: User's message text
        context: Optional dict with farm context (current_crop, soil_type, etc.)

    Returns:
        dict with 'response' text and optional 'suggestions' list
    """
    if not message or not message.strip():
        return {
            'response': "Please type a question and I'll do my best to help!",
            'suggestions': ['Tell me about rice', 'What is crop rotation?', 'Best soil for groundnut'],
        }

    text = message.strip().lower()

    # Check greetings
    if any(g in text for g in GREETINGS_IN) and len(text.split()) <= 5:
        return {
            'response': random.choice(GREETINGS_OUT),
            'suggestions': ['Tell me about rice', 'What is crop rotation?', 'How to manage pests?'],
        }

    # Check thanks
    if any(t in text for t in THANKS_IN) and len(text.split()) <= 6:
        return {
            'response': random.choice(THANKS_OUT),
            'suggestions': ['Ask about another crop', 'Soil management tips', 'Weather and climate'],
        }

    # Check for specific crop questions
    crop_match = _match_crop(text)
    if crop_match:
        return _build_crop_response(crop_match, text)

    # Check for soil questions
    soil_match = _match_soil(text)
    if soil_match:
        return _build_soil_response(soil_match)

    # Check for general topics
    topic_match = _match_topic(text)
    if topic_match:
        suggestions = _get_topic_suggestions(topic_match)
        return {
            'response': GENERAL_TOPICS[topic_match]['response'],
            'suggestions': suggestions,
        }

    # Check for comparison/vs questions
    compare_match = _match_comparison(text)
    if compare_match:
        return _build_comparison_response(compare_match[0], compare_match[1])

    # Fallback
    return {
        'response': random.choice(FALLBACK_RESPONSES),
        'suggestions': ['Tell me about rice', 'What is crop rotation?', 'Soil types for my farm', 'Pest management tips'],
    }


def _match_crop(text):
    """Find a crop mentioned in the text."""
    # Check exact and partial matches
    for key in CROP_INFO:
        # Handle multi-word crop names
        if key in text:
            return key
    # Check alternate names
    alternates = {
        'paddy': 'rice', 'corn': 'maize', 'peanut': 'groundnut',
        'pulse': 'mung bean', 'lentil': 'chickpea', 'gram': 'chickpea',
        'bean': 'mung bean', 'soya': 'soybean', 'soy': 'soybean',
        'til': 'sesame', 'gingelly': 'sesame',
    }
    for alt, crop in alternates.items():
        if alt in text:
            return crop
    return None


def _match_soil(text):
    """Find a soil type mentioned in the text."""
    for key in SOIL_INFO:
        if key in text:
            return key
    # Check for generic soil question
    if 'soil' in text and ('type' in text or 'best' in text or 'which' in text or 'what' in text or 'good' in text):
        return '_general'
    return None


def _match_topic(text):
    """Find a general topic match."""
    best_match = None
    best_count = 0
    for topic, info in GENERAL_TOPICS.items():
        count = sum(1 for kw in info['keywords'] if kw in text)
        if count > best_count:
            best_count = count
            best_match = topic
    return best_match if best_count > 0 else None


def _match_comparison(text):
    """Check if user is comparing two crops."""
    vs_patterns = [r'(\w[\w ]*?)\s+(?:vs|versus|or|compared to)\s+(\w[\w ]*?)(?:\?|$|\.)',]
    for pattern in vs_patterns:
        m = re.search(pattern, text)
        if m:
            crop1 = _match_crop(m.group(1).strip())
            crop2 = _match_crop(m.group(2).strip())
            if crop1 and crop2 and crop1 != crop2:
                return (crop1, crop2)
    return None


def _build_crop_response(crop_key, text):
    """Build a detailed response about a specific crop."""
    info = CROP_INFO[crop_key]
    response_parts = [f"### {info['name']}\n"]

    # Determine what aspect the user is asking about
    if any(w in text for w in ['pest', 'insect', 'bug', 'worm']):
        response_parts.append(f"🐛 **Pests:** {info['pests']}\n")
        response_parts.append(f"💡 **Tip:** {info['tips']}")
    elif any(w in text for w in ['disease', 'blight', 'rust', 'wilt', 'fungus']):
        response_parts.append(f"🔬 **Diseases:** {info['diseases']}\n")
        response_parts.append(f"💡 **Tip:** {info['tips']}")
    elif any(w in text for w in ['water', 'irrigation', 'rain', 'drought']):
        response_parts.append(f"💧 **Water needs:** {info['water']}\n")
        response_parts.append(f"🌡️ **Temperature:** {info['temp']}")
    elif any(w in text for w in ['soil', 'land', 'ground']):
        response_parts.append(f"🌍 **Soil:** {info['soil']}\n")
        response_parts.append(f"💧 **Water:** {info['water']}")
    elif any(w in text for w in ['when', 'season', 'plant', 'sow', 'time', 'month']):
        response_parts.append(f"📅 **Seasons:** {info['seasons']}\n")
        response_parts.append(f"🌡️ **Temperature:** {info['temp']}\n")
        response_parts.append(f"📊 **Yield:** {info['yield']}")
    elif any(w in text for w in ['yield', 'production', 'harvest', 'how much']):
        response_parts.append(f"📊 **Yield:** {info['yield']}\n")
        response_parts.append(f"📅 **Seasons:** {info['seasons']}\n")
        response_parts.append(f"💡 **Tip:** {info['tips']}")
    else:
        # General overview
        response_parts.append(f"📅 **Seasons:** {info['seasons']}\n")
        response_parts.append(f"💧 **Water:** {info['water']}\n")
        response_parts.append(f"🌍 **Soil:** {info['soil']}\n")
        response_parts.append(f"🌡️ **Temperature:** {info['temp']}\n")
        response_parts.append(f"📊 **Yield:** {info['yield']}\n")
        response_parts.append(f"💡 **Tip:** {info['tips']}")

    suggestions = [
        f'Pests of {crop_key}' if 'pest' not in text else f'Diseases of {crop_key}',
        f'Best soil for {crop_key}',
        f'What to plant after {crop_key}',
    ]

    return {'response': '\n'.join(response_parts), 'suggestions': suggestions}


def _build_soil_response(soil_key):
    """Build a response about a soil type."""
    if soil_key == '_general':
        lines = ["Here's a quick guide to soil types in Myanmar:\n"]
        for key, info in SOIL_INFO.items():
            lines.append(f"**{key.title()}** — {info['description'][:80]}...")
        lines.append("\nAsk me about a specific soil type for more details!")
        return {
            'response': '\n'.join(lines),
            'suggestions': ['Clay loam soil', 'Sandy loam soil', 'Alluvial soil'],
        }

    info = SOIL_INFO[soil_key]
    response = (
        f"### {soil_key.title()} Soil\n\n"
        f"📝 **Description:** {info['description']}\n\n"
        f"🌾 **Good for:** {info['good_for']}\n\n"
        f"⚠️ **Challenges:** {info['challenges']}\n\n"
        f"💡 **Tips:** {info['tips']}"
    )
    return {
        'response': response,
        'suggestions': ['What crops grow in this soil?', 'How to improve soil health', 'Crop rotation for my soil'],
    }


def _build_comparison_response(crop1, crop2):
    """Build a comparison between two crops."""
    info1 = CROP_INFO[crop1]
    info2 = CROP_INFO[crop2]
    response = (
        f"### {info1['name']} vs {info2['name']}\n\n"
        f"| | **{crop1.title()}** | **{crop2.title()}** |\n"
        f"|---|---|---|\n"
        f"| Water need | {info1['water'].split('—')[0].strip()} | {info2['water'].split('—')[0].strip()} |\n"
        f"| Best season | {info1['seasons'].split('.')[0]} | {info2['seasons'].split('.')[0]} |\n"
        f"| Best soil | {info1['soil'].split('.')[0]} | {info2['soil'].split('.')[0]} |\n"
        f"| Yield | {info1['yield'].split('.')[0]} | {info2['yield'].split('.')[0]} |\n\n"
        f"💡 **Rotation tip:** These two crops can work well in rotation — "
        f"check the Crop Rotation page for a detailed plan!"
    )
    return {
        'response': response,
        'suggestions': [f'More about {crop1}', f'More about {crop2}', 'Crop rotation advice'],
    }


def _get_topic_suggestions(topic):
    """Get follow-up suggestions for a topic."""
    suggestion_map = {
        'rotation': ['Rice rotation plan', 'Benefits of legumes', 'Compare crop plans'],
        'fertilizer': ['Organic fertilizer', 'Soil testing', 'Rice fertilizer schedule'],
        'irrigation': ['Drip irrigation', 'Rice water management', 'Drought-tolerant crops'],
        'pest': ['Rice pests', 'Fall armyworm', 'Organic pest control'],
        'disease': ['Rice blast disease', 'Seed treatment', 'Fungicide use'],
        'weather': ['Monsoon forecast', 'Drought management', 'Climate-smart farming'],
        'organic': ['Organic certification', 'Composting', 'Natural pest control'],
        'harvest': ['Rice harvesting', 'Grain storage', 'Post-harvest losses'],
        'market': ['Pulse export', 'Contract farming', 'Farmer cooperatives'],
    }
    return suggestion_map.get(topic, ['Tell me about rice', 'Crop rotation', 'Pest management'])
