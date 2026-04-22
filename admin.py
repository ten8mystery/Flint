import json
import os

payload_str = os.getenv('PAYLOAD', '{}')
payload = json.loads(payload_str)

action_type = payload.get('type')

if action_type in ['GAME', 'APP']:
    file_path = f'data/{"games.json" if action_type == "GAME" else "apps.json"}'
    
    new_entry = {
        "name": payload.get('name'),
        "src": payload.get('src'),
        "image": payload.get('image'),
        "description": payload.get('desc')
    }

    with open(file_path, 'r') as f:
        data = json.load(f)
    data.append(new_entry)
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)

elif action_type == 'QUOTE':
    file_path = 'data/quotes.json'
    new_quote = payload.get('quote')
    
    with open(file_path, 'r') as f:
        data = json.load(f)
    data.append(new_quote)
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)
