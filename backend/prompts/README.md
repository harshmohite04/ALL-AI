# Role-Based System Prompts

This folder contains individual system prompt files for each role in the ALL-AI application. This modular structure improves maintainability and makes it easier to update specific role prompts.

## Structure

```
prompts/
├── __init__.py              # Package initialization and exports
├── README.md               # This documentation file
├── general.py              # General purpose AI assistant
├── finance.py              # Financial advisor and analyst
├── coding.py               # Expert software engineer
├── coder.py                # Practical programmer
├── legal.py                # Legal research assistant
├── doctor.py               # Medical information assistant
├── learning.py             # Educational facilitator
├── marketing.py            # Strategic marketing expert
├── image_generation.py     # Creative visual artist
└── video_generation.py     # Video production expert
```

## Usage

The prompts are imported and used by `role_prompts.py` in the parent directory. Each file exports a constant with the role's system prompt.

## Adding New Roles

To add a new role:

1. Create a new `.py` file in this folder (e.g., `new_role.py`)
2. Define the prompt constant (e.g., `NEW_ROLE_PROMPT = "..."`)
3. Add the import to `__init__.py`
4. Add the role to `ROLE_PROMPTS` dictionary in `../role_prompts.py`
5. Update the frontend role list in `Sidebar.tsx`

## Best Practices

- Keep prompts focused and specific to the role
- Include relevant disclaimers for professional domains
- Use clear, actionable language
- Test prompts with different AI models for consistency
- Document any special requirements or limitations
