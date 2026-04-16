import json
import os
import re

issue_body = os.getenv('ISSUE_BODY', '')

def get_field(field_name):
    match = re.search(f"{field_name}:\\s*(.*)", issue_body)
    return match.group(1).strip() if match else None

if "ADD_GAME" in issue_body or "ADD_APP" in issue_body:
    file_target = 'games.json' if "ADD_GAME" in issue_body else 'apps.json'
    
    new_entry = {
        "name": get_field("NAME"),
        "src": get_field("SRC"),
        "image": get_field("IMAGE"),
        "description": get_field("DESC")
    }

    with open(file_target, 'r') as f:
        data = json.load(f)
    data.append(new_entry)
    with open(file_target, 'w') as f:
        json.dump(data, f, indent=2)

elif "ADD_QUOTE" in issue_body:
    new_quote = get_field("QUOTE")
    with open('quotes.json', 'r') as f:
        data = json.load(f)
    data.append(new_quote)
    with open('quotes.json', 'w') as f:
        json.dump(data, f, indent=2)
