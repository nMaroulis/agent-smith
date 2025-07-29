import re

def sanitize_to_func_name(name: str) -> str:
    """
    Convert an arbitrary string into a valid Python function name.
    
    - Converts to lowercase
    - Replaces invalid characters with underscores
    - Strips leading/trailing underscores
    - Prefixes with 'fn_' if the name starts with a digit

    Args:
        name (str): The input string (e.g., from UI or user input)
    
    Returns:
        str: A sanitized, snake_case-compatible Python function name
    """
    # Lowercase
    name = name.lower()

    # Replace invalid characters with _
    name = re.sub(r"[^a-z0-9_]", "_", name)

    # Collapse multiple _ into one
    name = re.sub(r"_+", "_", name)

    # Strip leading/trailing _
    name = name.strip("_")

    # Ensure it doesn't start with a number
    if name and name[0].isdigit():
        name = f"fn_{name}"

    return name
